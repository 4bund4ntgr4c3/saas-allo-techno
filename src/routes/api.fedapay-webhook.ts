import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Webhook FedaPay — notifications de transaction (transaction.approved,
 * transaction.declined, transaction.canceled…). Vérifie la signature
 * `X-FEDAPAY-SIGNATURE` (t=<unix_ts>,s=<hex hmac-sha256 du corps brut>) puis
 * marque le devis approuvé de la réservation comme payé / en échec.
 * Route API brute (pas une serverFn) : non bloquée par le CSRF middleware.
 */
export const Route = createFileRoute("/api/fedapay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["FEDAPAY_WEBHOOK_SECRET"];
        if (!secret) {
          console.error("[webhook] FEDAPAY_WEBHOOK_SECRET absent");
          return new Response("Not configured", { status: 500 });
        }

        // FedaPay signe le corps brut : t = timestamp UNIX, s = hmac-sha256 hex.
        const signatureHeader = request.headers.get("x-fedapay-signature");
        const rawBody = await request.text();

        const match = /^t=(\d+),s=([0-9a-fA-F]{64})$/.exec(signatureHeader ?? "");
        const timestamp = match?.[1] ? Number(match[1]) : null;
        const expected = createHmac("sha256", secret)
          .update(rawBody, "utf8")
          .digest("hex");
        const received = match?.[2] ?? "";
        const sigOk =
          timestamp !== null &&
          !Number.isNaN(timestamp) &&
          Math.abs(Date.now() / 1000 - timestamp) <= 5 * 60 &&
          received.length > 0 &&
          timingSafeEqual(Buffer.from(received, "hex"), Buffer.from(expected, "hex"));

        if (!sigOk) {
          console.warn("[webhook] signature FedaPay invalide ou expirée");
          return new Response("Unauthorized", { status: 401 });
        }

        let payload: {
          event?: string;
          data?: {
            id?: string | number;
            status?: string;
            amount?: number;
            reference?: string;
          };
        };
        try {
          payload = JSON.parse(rawBody);
        } catch {
          return new Response("Bad JSON", { status: 400 });
        }

        const { event, data } = payload;
        const providerTxId = data?.id != null ? String(data.id) : null;

        try {
          if (!providerTxId) {
            console.log("[webhook] événement FedaPay sans id ignoré");
          } else {
            const isApproved = event === "transaction.approved";
            const isRejected =
              event === "transaction.declined" || event === "transaction.canceled";

            if (isApproved || isRejected) {
              const nextStatus = isApproved ? "paid" : "failed";

              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

              const { data: payment } = await supabaseAdmin
                .from("payments")
                .select("status, amount, reference, source")
                // provider_tx_id : colonne ajoutée par la migration
                // 20260810000000, absente des types générés (cast volontaire).
                .eq("provider_tx_id" as never, providerTxId)
                .eq("source", "reservation")
                .maybeSingle();

              if (!payment) {
                // Transaction inconnue (boutique non couvert ici, ou webhook
                // d'une transaction jamais enregistrée) : on accuse réception.
                console.warn(
                  `[webhook] FedaPay transaction ${providerTxId} (${event}) sans ligne payments`,
                );
              } else if (payment.status === "paid") {
                // Idempotence : la réservation est déjà marquée payée.
                console.log(`[webhook] réservation ${payment.reference} déjà payée (${providerTxId})`);
              } else {
                if (isApproved && payment.amount !== null && data?.amount != null && payment.amount !== data.amount) {
                  console.warn(
                    `[webhook] montant incohérent pour ${payment.reference}: attendu ${payment.amount}, reçu ${data.amount}`,
                  );
                }

                const { error } = await supabaseAdmin.rpc("update_reservation_payment", {
                  _reference: payment.reference,
                  _status: nextStatus,
                  _tx_id: providerTxId,
                });
                if (error) {
                  console.error("[webhook] update_reservation_payment failed", error);
                  return new Response("DB error", { status: 500 });
                }

                if (nextStatus === "paid") {
                  const { data: reservation } = await supabaseAdmin
                    .from("reservations")
                    .select(
                      "reference, customer_name, email, phone, device, issue, mode, payment, slot_date, slot_period, slot_hour, status, quote_amount",
                    )
                    .eq("reference", payment.reference)
                    .maybeSingle();

                  if (reservation) {
                    const { notifyReservationPaid } = await import("@/lib/notifications");
                    void notifyReservationPaid({
                      reference: reservation.reference,
                      tracking_code: null,
                      customer_name: reservation.customer_name,
                      email: reservation.email,
                      phone: reservation.phone,
                      device: reservation.device,
                      quote_amount: reservation.quote_amount ?? 0,
                    });
                  }
                }

                console.log(`[webhook] réservation ${payment.reference} ${nextStatus} (${providerTxId})`);
              }
            } else {
              console.log(`[webhook] événement FedaPay ignoré: ${event ?? "inconnu"}`);
            }
          }
        } catch (err) {
          console.error("[webhook] handler error", err);
          return new Response("Server error", { status: 500 });
        }

        // FedaPay attend un 200/2xx rapide même quand l'événement est ignoré.
        return new Response(JSON.stringify({ status: "ok" }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});