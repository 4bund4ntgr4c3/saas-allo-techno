import { createHmac, timingSafeEqual } from "node:crypto";
import { safeEqual } from "@/lib/security";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// ---------------------------------------------------------------------------
// Vérification des signatures des webhooks de paiement (FedaPay / KKiaPay /
// Flutterwave). Logique extraite des routes API pour être testable : les
// tests exercent exactement le code de production, plus de ré-implémentation.
// ---------------------------------------------------------------------------

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const FEDAPAY_SIGNATURE_RE = /^t=(\d+),s=([0-9a-fA-F]{64})$/;

export type WebhookPaymentRow = {
  status: string;
  amount: number | null;
  reference: string;
  source: string;
};

/**
 * Signature FedaPay : `t=<unix_ts>,s=<hmac-sha256 hex du corps brut>`.
 * Rejette les timestamps hors fenêtre de 5 minutes et les signatures
 * mal formées (timingSafeEqual sur le digest reçu).
 */
export function verifyFedaPaySignature(
  secret: string,
  signatureHeader: string | null,
  rawBody: string,
): boolean {
  const match = FEDAPAY_SIGNATURE_RE.exec(signatureHeader ?? "");
  const timestamp = match?.[1] ? Number(match[1]) : null;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const received = match?.[2] ?? "";
  return (
    timestamp !== null &&
    !Number.isNaN(timestamp) &&
    Math.abs(Date.now() - timestamp * 1000) <= FIVE_MINUTES_MS &&
    received.length > 0 &&
    timingSafeEqual(Buffer.from(received, "hex"), Buffer.from(expected, "hex"))
  );
}

/** Secret KKiaPay (`x-kkiapay-secret`) : comparaison à temps constant. */
export function verifyKkiapaySecret(secret: string, received: string | null): boolean {
  if (!received || received.length === 0 || received.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(received, "utf8"), Buffer.from(secret, "utf8"));
}

/** Hash Flutterwave (`verif-hash`) : comparaison à temps constant. */
export function verifyFlutterwaveHash(secret: string, hash: string | null): boolean {
  return Boolean(hash) && safeEqual(hash ?? "", secret);
}

// ---------------------------------------------------------------------------
// Application de la confirmation / de l'échec d'un paiement, par source :
//  - "sla"          → la ligne payments est marquée (contrats B2B) ;
//  - "reservation"  → RPC update_reservation_payment + notification client ;
//  - "boutique"     → RPC update_payment_status + mise à jour du lead.
// Toutes les sources déclenchent l'événement de webhook sortant
// (payment.received / payment.failed) si un abonnement existe.
// ---------------------------------------------------------------------------

export type WebhookOutcome = "ok" | "db_error" | "amount_mismatch" | "unknown";

export async function processWebhookPayment(
  supabaseAdmin: SupabaseClient<Database>,
  payment: WebhookPaymentRow | null,
  nextStatus: "paid" | "failed",
  providerTxId: string,
  providerAmount: number | null,
  opts: { notify?: boolean } = {},
): Promise<WebhookOutcome> {
  if (!payment) return "unknown";

  if (payment.status === "paid") {
    // Idempotence : le paiement est déjà marqué payé (retry provider).
    return "ok";
  }

  if (nextStatus === "paid" && payment.amount !== null && providerAmount != null) {
    if (payment.amount !== providerAmount) return "amount_mismatch";
  }

  if (payment.source === "sla") {
    // Paiement de contrat B2B : on marque la ligne payments, sans toucher
    // aux réservations.
    const { error: slaError } = await supabaseAdmin
      .from("payments")
      .update({ status: nextStatus, tx_id: providerTxId })
      .eq("provider_tx_id" as never, providerTxId);
    if (slaError) {
      console.error("[webhook] update paiement SLA failed", slaError);
      return "db_error";
    }
    console.log(`[webhook] paiement SLA ${payment.reference} ${nextStatus} (${providerTxId})`);
  } else if (payment.source === "reservation") {
    const { error } = await supabaseAdmin.rpc("update_reservation_payment", {
      _reference: payment.reference,
      _status: nextStatus,
      _tx_id: providerTxId,
    });
    if (error) {
      console.error("[webhook] update_reservation_payment failed", error);
      return "db_error";
    }

    if (nextStatus === "paid" && opts.notify !== false) {
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
    console.log(`[webhook] réservation ${payment.reference} ${nextStatus} (${providerTxId})`);
  } else {
    // Boutique (Flutterwave)
    const { error } = await supabaseAdmin.rpc("update_payment_status", {
      _reference: payment.reference,
      _status: nextStatus,
      _tx_id: providerTxId,
    });
    if (error) {
      console.error("[webhook] update_payment_status failed", error);
      return "db_error";
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
    console.log(`[webhook] commande ${payment.reference} ${nextStatus} (${providerTxId})`);
  }

  const { triggerWebhooks } = await import("@/lib/webhooks.functions");
  void triggerWebhooks(nextStatus === "paid" ? "payment.received" : "payment.failed", {
    reference: payment.reference,
    source: payment.source,
    amount: payment.amount ?? 0,
    txId: providerTxId,
  });

  return "ok";
}
