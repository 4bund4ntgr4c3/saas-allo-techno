import { createFileRoute } from "@tanstack/react-router";
import { safeEqual } from "@/lib/security";

/**
 * Webhook Flutterwave — notifications de transaction (charge.completed…).
 * Vérifie l'entête `verif-hash` puis marque la commande (boutique) ou la
 * réservation (devis approuvé) comme payée / en échec.
 * Route API brute (pas une serverFn) : non bloquée par le CSRF middleware.
 */
export const Route = createFileRoute("/api/flutterwave-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const secret = process.env["FLUTTERWAVE_WEBHOOK_SECRET_HASH"];
        if (!secret) {
          console.error("[webhook] FLUTTERWAVE_WEBHOOK_SECRET_HASH absent");
          return new Response("Not configured", { status: 500 });
        }

        const hash = request.headers.get("verif-hash");
        if (!hash || !safeEqual(hash, secret)) {
          console.warn("[webhook] verif-hash invalide");
          return new Response("Unauthorized", { status: 401 });
        }

        let payload: {
          event?: string;
          data?: {
            tx_ref?: string;
            id?: string | number;
            amount?: number;
            currency?: string;
            status?: string;
          };
        };
        try {
          payload = await request.json();
        } catch {
          return new Response("Bad JSON", { status: 400 });
        }

        const { event, data } = payload;
        const txRef = data?.tx_ref;
        const txId = data?.id != null ? String(data.id) : null;

        try {
          if (
            event === "charge.completed" &&
            (data?.status === "successful" || data?.status === "failed") &&
            txRef
          ) {
            const reference = txRef.startsWith("AT-") ? txRef.slice(3) : txRef;
            const nextStatus = data.status === "successful" ? "paid" : "failed";

            const { data: payment } = await supabaseAdmin
              .from("payments")
              .select("status, amount, reference, source")
              .eq("tx_ref", txRef)
              .maybeSingle();

            if (payment && payment.status !== "paid") {
              if (data.status === "successful" && payment.amount !== data.amount) {
                console.warn(
                  `[webhook] montant incohérent pour ${reference}: attendu ${payment.amount}, reçu ${data.amount} — paiement rejeté`,
                );
                return new Response(JSON.stringify({ status: "amount_mismatch" }), {
                  status: 200,
                  headers: { "content-type": "application/json" },
                });
              }

              if (payment.source === "reservation") {
                const { error } = await supabaseAdmin.rpc("update_reservation_payment", {
                  _reference: payment.reference,
                  _status: nextStatus,
                  _tx_id: txId ?? "",
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
                      quote_amount: payment.amount ?? reservation.quote_amount ?? 0,
                    });
                  }
                }

                console.log(`[webhook] réservation ${payment.reference} ${nextStatus} (${txId})`);
              } else {
                const { error } = await supabaseAdmin.rpc("update_payment_status", {
                  _reference: payment.reference,
                  _status: nextStatus,
                  _tx_id: txId ?? "",
                });
                if (error) {
                  console.error("[webhook] update_payment_status failed", error);
                  return new Response("DB error", { status: 500 });
                }

                if (nextStatus === "paid") {
                  const { data: lead } = await supabaseAdmin
                    .from("leads")
                    .select("message")
                    .eq("reference", payment.reference)
                    .eq("source", "boutique")
                    .maybeSingle();
                  if (lead?.message && !lead.message.includes("Paiement : Payé")) {
                    await supabaseAdmin
                      .from("leads")
                      .update({ message: `${lead.message}\nPaiement : Payé (en ligne)` })
                      .eq("reference", payment.reference);
                  }
                }

                console.log(`[webhook] commande ${payment.reference} ${nextStatus} (${txId})`);
              }
            }
          } else {
            console.log(`[webhook] événement ignoré: ${event ?? "inconnu"}`);
          }
        } catch (err) {
          console.error("[webhook] handler error", err);
          return new Response("Server error", { status: 500 });
        }

        // Flutterwave attend un 200/2xx rapide même quand l'événement est ignoré.
        return new Response(JSON.stringify({ status: "ok" }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
