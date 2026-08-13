import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "node:crypto";

/**
 * Webhook KKiaPay — notification de transaction de paiement (Mobile Money).
 * Vérifie l'entête `x-kkiapay-secret` puis marque le devis approuvé de la
 * réservation comme payé / en échec.
 * Route API brute (pas une serverFn) : non bloquée par le CSRF middleware.
 */
export const Route = createFileRoute("/api/kkiapay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["KKIAPAY_WEBHOOK_SECRET"];
        if (!secret) {
          console.error("[webhook] KKIAPAY_WEBHOOK_SECRET absent");
          return new Response("Not configured", { status: 500 });
        }

        const received = request.headers.get("x-kkiapay-secret") ?? "";
        const bufReceived = Buffer.from(received, "utf8");
        const bufSecret = Buffer.from(secret, "utf8");
        const isSecretValid =
          bufReceived.length > 0 &&
          bufReceived.length === bufSecret.length &&
          timingSafeEqual(bufReceived, bufSecret);

        if (!isSecretValid) {
          console.warn("[webhook] x-kkiapay-secret invalide");
          return new Response("Unauthorized", { status: 401 });
        }

        let payload: {
          transactionId?: string;
          transaction_id?: string;
          isPaymentSucces?: boolean;
          amount?: number;
          method?: string;
          account?: string;
          failureCode?: string;
          event?: string;
        };
        try {
          payload = await request.json();
        } catch {
          return new Response("Bad JSON", { status: 400 });
        }

        const providerTxId = payload.transactionId ?? payload.transaction_id;

        try {
          if (!providerTxId) {
            console.log("[webhook] événement KKiaPay sans transactionId ignoré");
          } else {
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
              console.warn(`[webhook] KKiaPay transaction ${providerTxId} sans ligne payments`);
            } else if (payment.status === "paid") {
              // Idempotence : la réservation est déjà marquée payée.
              console.log(
                `[webhook] réservation ${payment.reference} déjà payée (${providerTxId})`,
              );
            } else {
              const nextStatus = payload.isPaymentSucces === true ? "paid" : "failed";

              if (
                nextStatus === "paid" &&
                payment.amount !== null &&
                payload.amount != null &&
                payment.amount !== payload.amount
              ) {
                console.warn(
                  `[webhook] montant incohérent pour ${payment.reference}: attendu ${payment.amount}, reçu ${payload.amount} — paiement rejeté`,
                );
                return new Response(JSON.stringify({ status: "amount_mismatch" }), {
                  status: 200,
                  headers: { "content-type": "application/json" },
                });
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

              console.log(
                `[webhook] réservation ${payment.reference} ${nextStatus} (${providerTxId})`,
              );
            }
          }
        } catch (err) {
          console.error("[webhook] handler error", err);
          return new Response("Server error", { status: 500 });
        }

        // KKiaPay attend un 200/2xx rapide même quand l'événement est ignoré.
        return new Response(JSON.stringify({ status: "ok" }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
