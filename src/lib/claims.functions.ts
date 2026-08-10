// Réclamations de garantie en ligne.
// Le formulaire public écrit sous service_role ; la lecture / mise à jour par
// le personnel vérifie is_staff côté serveur (les tables restent fermées au client).

import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { rateLimit } from "@/lib/security";

const CLAIM_STATUSES = ["nouveau", "en_cours", "acceptee", "refuse", "cloturee"] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export type WarrantyClaimRow = {
  id: string;
  reference: string;
  reservation_reference: string | null;
  name: string;
  phone: string;
  email: string | null;
  device: string | null;
  message: string;
  status: string;
  staff_note: string | null;
  created_at: string;
  updated_at: string;
};

const submitSchema = z.object({
  name: z.string().trim().min(3, "Votre nom est requis").max(120),
  phone: z.string().trim().min(8, "Numéro de téléphone invalide").max(25),
  email: z.string().trim().email("E-mail invalide").max(180).optional().or(z.literal("")),
  reservation_reference: z.string().trim().max(60).optional().or(z.literal("")),
  device: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Décrivez le problème").max(2000),
});

const listSchema = z.object({});

const setStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(CLAIM_STATUSES),
  staffNote: z.string().trim().max(500).optional(),
});

/** Vérifie que l'appelant est membre du personnel (JWT Bearer + RPC is_staff). */
async function requireStaff(supabaseAdmin: SupabaseClient<Database>): Promise<void> {
  const authHeader = getRequestHeader("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  let userId: string | null = null;
  if (token) {
    const { data: claimsData } = await supabaseAdmin.auth.getClaims(token);
    const sub = claimsData?.claims?.sub;
    userId = typeof sub === "string" ? sub : null;
  }
  if (!userId) throw new Error("Non authentifié");
  const { data: staff, error } = await supabaseAdmin.rpc("is_staff", { _user_id: userId });
  if (error || !staff) throw new Error("Action non autorisée");
}

/**
 * Soumission publique d'une réclamation de garantie. Retourne la référence
 * CL-YYYY-NNNN générée ; l'équipe est alertée (best-effort) par e-mail/WhatsApp.
 */
export const submitWarrantyClaim = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submitSchema.parse(data))
  .handler(async ({ data }): Promise<{ reference: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("claim-submit", 5))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const { data: reference, error: refError } = await supabaseAdmin.rpc("next_claim_reference");
    if (refError || typeof reference !== "string") {
      console.error("[claims] next_claim_reference failed", refError);
      throw new Error("La réclamation n'a pas pu être enregistrée. Réessayez.");
    }

    const { error } = await supabaseAdmin.from("warranty_claims").insert({
      reference,
      reservation_reference: data.reservation_reference || null,
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      device: data.device || null,
      message: data.message,
      status: "nouveau",
    });

    if (error) {
      console.error("[claims] insert failed", error);
      throw new Error("La réclamation n'a pas pu être enregistrée. Réessayez.");
    }

    const { notifyClaimCreated } = await import("@/lib/notifications");
    void notifyClaimCreated({
      reference,
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      device: data.device || null,
      message: data.message,
    });

    return { reference };
  });

/** Liste des réclamations (personnel uniquement), plus récentes d'abord. */
export const listWarrantyClaims = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => listSchema.parse(data))
  .handler(async (): Promise<WarrantyClaimRow[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("claims-read", 30))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    await requireStaff(supabaseAdmin);

    const { data, error } = await supabaseAdmin
      .from("warranty_claims")
      .select(
        "id, reference, reservation_reference, name, phone, email, device, message, status, staff_note, created_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("[claims] list failed", error);
      throw new Error("Impossible de charger les réclamations.");
    }

    return data ?? [];
  });

/** Mise à jour du statut (et note interne) par le personnel, avec alerte client. */
export const setWarrantyClaimStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => setStatusSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("claim-update", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    await requireStaff(supabaseAdmin);

    const { error } = await supabaseAdmin
      .from("warranty_claims")
      .update({
        status: data.status,
        staff_note: data.staffNote?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);

    if (error) {
      console.error("[claims] update failed", error);
      throw new Error("Mise à jour impossible.");
    }

    const { data: row } = await supabaseAdmin
      .from("warranty_claims")
      .select("phone, reference")
      .eq("id", data.id)
      .maybeSingle();

    if (row?.phone) {
      const { notifyClaimStatus } = await import("@/lib/notifications");
      void notifyClaimStatus({ phone: row.phone, reference: row.reference, status: data.status });
    }

    return { ok: true };
  });
