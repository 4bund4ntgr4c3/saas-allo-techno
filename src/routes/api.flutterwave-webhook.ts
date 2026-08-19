import { createFileRoute } from "@tanstack/react-router";
import { verifyFlutterwaveHash, processWebhookPayment } from "@/lib/payment-webhooks";

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
        if (!verifyFlutterwaveHash(secret, hash)) {
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

            const outcome = await processWebhookPayment(
              supabaseAdmin,
              payment,
              nextStatus,
              txId ?? "",
              nextStatus === "paid" ? (data?.amount ?? null) : null,
            );

            if (outcome === "amount_mismatch") {
              console.warn(
                `[webhook] montant incohérent pour ${reference}: attendu ${payment?.amount}, reçu ${data?.amount} — paiement rejeté`,
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
                `[webhook] Flutterwave transaction ${txId} (${event}) sans ligne payments`,
              );
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
