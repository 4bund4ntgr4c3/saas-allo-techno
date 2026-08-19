import { createFileRoute } from "@tanstack/react-router";
import { verifyKkiapaySecret, processWebhookPayment } from "@/lib/payment-webhooks";

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

        const received = request.headers.get("x-kkiapay-secret");
        if (!verifyKkiapaySecret(secret, received)) {
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
              .maybeSingle();

            const nextStatus = payload.isPaymentSucces === true ? "paid" : "failed";

            const outcome = await processWebhookPayment(
              supabaseAdmin,
              payment,
              nextStatus,
              providerTxId,
              nextStatus === "paid" ? (payload.amount ?? null) : null,
            );

            if (outcome === "amount_mismatch") {
              console.warn(
                `[webhook] montant incohérent pour ${payment?.reference}: attendu ${payment?.amount}, reçu ${payload.amount} — paiement rejeté`,
              );
              return new Response(JSON.stringify({ status: "amount_mismatch" }), {
                status: 200,
                headers: { "content-type": "application/json" },
              });
            }
            if (outcome === "db_error") {
              return new Response("DB error", { status: 500 });
            }
            if (outcome === "unknown") {
              // Transaction inconnue : on accuse réception.
              console.warn(`[webhook] KKiaPay transaction ${providerTxId} sans ligne payments`);
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
