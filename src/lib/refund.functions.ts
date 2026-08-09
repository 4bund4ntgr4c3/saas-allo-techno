import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { rateLimit } from "@/lib/security";
import { createLogger } from "@/lib/logger";
import { logAudit } from "@/lib/audit";

const logger = createLogger("refund");

const initiateRefundSchema = z.object({
  paymentId: z.string().uuid(),
  reason: z.string().trim().min(1, "Le motif du remboursement est requis.").max(500),
});

const listRefundableSchema = z.object({});

async function currentUserId(supabaseAdmin: SupabaseClient<Database>): Promise<string> {
  const authHeader = getRequestHeader("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) throw new Error("Non authentifié");
  const { data: claimsData } = await supabaseAdmin.auth.getClaims(token);
  const sub = claimsData?.claims?.sub;
  if (typeof sub !== "string") throw new Error("Non authentifié");
  return sub;
}

async function requireStaff(supabaseAdmin: SupabaseClient<Database>, userId: string) {
  const { data: staff, error } = await supabaseAdmin.rpc("is_staff", { _user_id: userId });
  if (error || !staff) throw new Error("Action non autorisée");
}

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
  .inputValidator((data: unknown) => listRefundableSchema.parse(data))
  .handler(async (): Promise<RefundablePayment[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!rateLimit("refund-list", 20)) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const userId = await currentUserId(supabaseAdmin);
    await requireStaff(supabaseAdmin, userId);

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
  .inputValidator((data: unknown) => initiateRefundSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!rateLimit("refund-init", 5)) {
      throw new Error("Trop de demandes de remboursement. Réessayez dans une minute.");
    }

    const userId = await currentUserId(supabaseAdmin);
    await requireStaff(supabaseAdmin, userId);

    const { data: payment, error: fetchError } = await supabaseAdmin
      .from("payments")
      .select("id, reference, amount, status, source")
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

    const { error: updateError } = await supabaseAdmin
      .from("payments")
      .update({ status: "refunded" })
      .eq("id", data.paymentId);

    if (updateError) {
      logger.error("payment refund update failed", updateError as Error);
      throw new Error("Impossible de marquer le paiement comme remboursé.");
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
      reason: data.reason,
    });

    return { success: true } as const;
  });
