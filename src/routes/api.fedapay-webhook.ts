import { createFileRoute } from "@tanstack/react-router";
import { verifyFedaPaySignature, processWebhookPayment } from "@/lib/payment-webhooks";

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

        if (!verifyFedaPaySignature(secret, signatureHeader, rawBody)) {
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
            const isRejected = event === "transaction.declined" || event === "transaction.canceled";

            if (isApproved || isRejected) {
              const nextStatus = isApproved ? "paid" : "failed";

              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

              const { data: payment } = await supabaseAdmin
                .from("payments")
                .select("status, amount, reference, source")
                // provider_tx_id : colonne ajoutée par la migration
                // 20260810000000, absente des types générés (cast volontaire).
                .eq("provider_tx_id" as never, providerTxId)
                .maybeSingle();

              const outcome = await processWebhookPayment(
                supabaseAdmin,
                payment,
                nextStatus,
                providerTxId,
                isApproved ? (data?.amount ?? null) : null,
              );

              if (outcome === "amount_mismatch") {
                console.warn(
                  `[webhook] montant incohérent pour ${payment?.reference}: attendu ${payment?.amount}, reçu ${data?.amount} — paiement rejeté`,
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
                console.warn(
                  `[webhook] FedaPay transaction ${providerTxId} (${event}) sans ligne payments`,
                );
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
