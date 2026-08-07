import { createFileRoute } from "@tanstack/react-router";

/**
 * Webhook Flutterwave — notifications de transaction (charge.completed…).
 * Vérifie l'entête `verif-hash` puis marque la commande comme payée.
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
        if (!hash || hash !== secret) {
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
          if (event === "charge.completed" && data?.status === "successful" && txRef) {
            const reference = txRef.startsWith("AT-") ? txRef.slice(3) : txRef;

            const { data: payment } = await supabaseAdmin
              .from("payments")
              .select("status, amount, reference")
              .eq("tx_ref", txRef)
              .maybeSingle();

            if (payment && payment.status !== "paid") {
              if (payment.amount !== data.amount) {
                console.warn(
                  `[webhook] montant incohérent pour ${reference}: attendu ${payment.amount}, reçu ${data.amount}`,
                );
              }

              const { error } = await supabaseAdmin.rpc("update_payment_status", {
                _reference: payment.reference,
                _status: "paid",
                _tx_id: txId ?? "",
              });
              if (error) {
                console.error("[webhook] update_payment_status failed", error);
                return new Response("DB error", { status: 500 });
              }

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

              console.log(`[webhook] commande ${payment.reference} payée (${txId})`);
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
