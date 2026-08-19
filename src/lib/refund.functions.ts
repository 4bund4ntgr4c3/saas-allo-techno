import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { rateLimit } from "@/lib/security";
import { createLogger } from "@/lib/logger";
import { logAudit } from "@/lib/audit";
import { requireStaff } from "@/lib/rbac";
import { requireStaffWithOtp } from "@/lib/otp-guard.server";

const logger = createLogger("refund");

const initiateRefundSchema = z.object({
  paymentId: z.string().uuid(),
  reason: z.string().trim().min(1, "Le motif du remboursement est requis.").max(500),
  // Confirmation du staff pour les prestataires sans API de remboursement
  // (FedaPay, KKiaPay) : le remboursement s'effectue depuis leur dashboard.
  manual: z.boolean().optional(),
});

const listRefundableSchema = z.object({});

export type RefundablePayment = {
  id: string;
  reference: string;
  amount: number;
  method: string;
  source: string;
  created_at: string;
  customer_name: string | null;
  phone: string | null;
};

export const listRefundablePayments = createServerFn({ method: "POST" })
  .validator((data: unknown) => listRefundableSchema.parse(data))
  .handler(async (): Promise<RefundablePayment[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("refund-list", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    await requireStaff(supabaseAdmin);

    const { data: payments, error } = await supabaseAdmin
      .from("payments")
      .select("id, reference, amount, method, source, created_at")
      .eq("status", "paid")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      logger.error("list refundable failed", error as Error);
      throw new Error("Impossible de charger les paiements remboursables.");
    }

    const rows = payments ?? [];
    if (rows.length === 0) return [];

    const references = [...new Set(rows.map((p) => p.reference).filter(Boolean))];
    const reservationsByRef = new Map<
      string,
      { customer_name: string | null; phone: string | null }
    >();

    if (references.length > 0) {
      const { data: reservations } = await supabaseAdmin
        .from("reservations")
        .select("reference, customer_name, phone")
        .in("reference", references as string[]);

      for (const r of reservations ?? []) {
        reservationsByRef.set(r.reference, {
          customer_name: r.customer_name,
          phone: r.phone,
        });
      }
    }

    const leadsByRef = new Map<string, { customer_name: string | null; phone: string | null }>();
    if (references.length > 0) {
      const { data: leads } = await supabaseAdmin
        .from("leads")
        .select("reference, name, phone")
        .in("reference", references as string[])
        .eq("source", "boutique");

      for (const l of leads ?? []) {
        if (l.reference && !reservationsByRef.has(l.reference)) {
          leadsByRef.set(l.reference, { customer_name: l.name ?? "", phone: l.phone ?? "" });
        }
      }
    }

    return rows.map((p) => {
      const info = reservationsByRef.get(p.reference) ?? leadsByRef.get(p.reference) ?? null;
      return {
        id: p.id,
        reference: p.reference,
        amount: p.amount,
        method: p.method,
        source: p.source,
        created_at: p.created_at,
        customer_name: info?.customer_name ?? null,
        phone: info?.phone ?? null,
      };
    });
  });

export const initiateRefund = createServerFn({ method: "POST" })
  .validator((data: unknown) => initiateRefundSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("refund-init", 5))) {
      throw new Error("Trop de demandes de remboursement. Réessayez dans une minute.");
    }

    const userId = await requireStaffWithOtp(supabaseAdmin);

    const { data: payment, error: fetchError } = await supabaseAdmin
      .from("payments")
      .select("id, reference, amount, status, source, method, tx_id, provider_tx_id")
      .eq("id", data.paymentId)
      .maybeSingle();

    if (fetchError || !payment) {
      logger.error("payment lookup failed", fetchError as Error);
      throw new Error("Paiement introuvable.");
    }

    if (payment.status !== "paid") {
      throw new Error(
        `Ce paiement ne peut pas être remboursé (statut actuel : ${payment.status}).`,
      );
    }

    // ── Remboursement réel auprès du prestataire ──────────────────────────
    // Flutterwave expose une API de remboursement ; FedaPay et KKiaPay non
    // (dashboard uniquement) ; les encaissements comptoir (espèces / Mobile
    // Money local) sont réglés sur place. Un paiement n'est marqué « refunded »
    // qu'après l'accord du prestataire ou la confirmation manuelle du staff.
    const isFlutterwaveBacked = ["MTN MoMo", "Moov Money", "Celtiis"].includes(
      payment.method ?? "",
    );

    if (isFlutterwaveBacked) {
      const txId = payment.tx_id;
      if (!txId) {
        throw new Error(
          "Impossible de rembourser automatiquement : aucune référence de transaction Flutterwave. Contactez le support.",
        );
      }
      await refundFlutterwaveTransaction(txId, payment.amount, data.reason);
    } else if (payment.method === "FedaPay" || payment.method === "KKiaPay") {
      if (data.manual !== true) {
        throw new Error(
          `Le remboursement ${payment.method} s'effectue depuis le dashboard ${payment.method} (aucune API de remboursement). Après l'avoir effectué, confirmez dans le formulaire.`,
        );
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from("payments")
      .update({ status: "refunded" })
      .eq("id", data.paymentId);

    if (updateError) {
      logger.error("payment refund update failed", updateError as Error);
      throw new Error("Impossible de marquer le paiement comme remboursé.");
    }

    // Reporte le statut sur la réservation liée (source='reservation').
    if (payment.source === "reservation") {
      const { error: rpcError } = await supabaseAdmin.rpc("update_reservation_payment", {
        _reference: payment.reference,
        _status: "refunded",
        _tx_id: "",
      });
      if (rpcError) {
        logger.error("reservation refund sync failed", rpcError as Error);
      }
    }

    try {
      await logAudit(supabaseAdmin, {
        user_id: userId,
        action: "payment.refunded",
        entity: "payment",
        entity_id: data.paymentId,
        details: {
          reference: payment.reference,
          amount: payment.amount,
          source: payment.source,
          method: payment.method,
          manual: payment.method === "FedaPay" || payment.method === "KKiaPay" || undefined,
          reason: data.reason,
        },
      });
    } catch (err) {
      logger.error("audit log failed", err as Error);
    }

    logger.info("payment refunded", {
      paymentId: data.paymentId,
      reference: payment.reference,
      amount: payment.amount,
      method: payment.method,
      reason: data.reason,
    });

    return { success: true } as const;
  });

/**
 * Demande un remboursement Flutterwave (v3). La transaction doit être
 * identifiée par son id technique (payments.tx_id, posé par le webhook).
 * Lance une erreur si le prestataire refuse — le statut n'est alors PAS
 * modifié.
 */
async function refundFlutterwaveTransaction(
  txId: string,
  amount: number,
  reason: string,
): Promise<void> {
  const secret = process.env["FLUTTERWAVE_SECRET_KEY"];
  if (!secret) {
    throw new Error("Remboursement en ligne indisponible : clé Flutterwave absente.");
  }
  try {
    const res = await fetch(
      `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(txId)}/refund`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          comment: reason.slice(0, 200),
        }),
      },
    );
    const body = (await res.json().catch(() => null)) as {
      status?: string;
      message?: string;
    } | null;
    if (!res.ok || body?.status !== "success") {
      logger.error("Flutterwave refund refused", new Error(`HTTP ${res.status}`), {
        status: res.status,
        message: body?.message ?? null,
      });
      throw new Error(
        `Le remboursement a été refusé par Flutterwave (${body?.message ?? `HTTP ${res.status}`}). Aucune modification n'a été enregistrée.`,
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Le remboursement a été refusé")) {
      throw err;
    }
    logger.error("Flutterwave refund network error", err as Error);
    throw new Error(
      "Impossible de joindre Flutterwave pour le remboursement. Aucune modification n'a été enregistrée.",
    );
  }
}
