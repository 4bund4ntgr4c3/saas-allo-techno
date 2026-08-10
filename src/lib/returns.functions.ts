// Retours commandes boutique gérés par le personnel.
// Table public.returns fermée au client (RLS staff) : les écritures passent
// par les server functions (service_role) et le RPC return_set_status.

import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { rateLimit } from "@/lib/security";

const RETURN_STATUSES = ["nouveau", "en_cours", "accepte", "refuse", "cloture"] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];

export type ReturnRow = {
  id: string;
  reference: string;
  customer_name: string;
  phone: string;
  email: string | null;
  order_reference: string | null;
  item: string | null;
  reason: string;
  status: string;
  note: string | null;
  created_at: string;
  updated_at: string;
};

type ReturnInsert = {
  reference: string;
  customer_name: string;
  phone: string;
  email: string | null;
  order_reference: string | null;
  item: string | null;
  reason: string;
};

/** Client Supabase typé localement pour la table `returns` (non générée). */
type ReturnsDatabase = {
  public: {
    Tables: {
      returns: {
        Row: ReturnRow;
        Insert: ReturnInsert;
        Update: Partial<ReturnRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

const OTP_WINDOW_MS = 24 * 3600 * 1000;

async function currentUserId(supabaseAdmin: SupabaseClient<Database>): Promise<string> {
  const authHeader = getRequestHeader("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  let userId: string | null = null;
  if (token) {
    const { data: claimsData } = await supabaseAdmin.auth.getClaims(token);
    const sub = claimsData?.claims?.sub;
    userId = typeof sub === "string" ? sub : null;
  }
  if (!userId) throw new Error("Non authentifié");
  return userId;
}

/** Exige une double authentification fraîche (< 24 h) pour les opérations staff. */
async function requireFreshOtp(supabaseAdmin: SupabaseClient<Database>, userId: string) {
  const { data: otp } = await supabaseAdmin
    .from("admin_otp")
    .select("enabled, verified_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (!otp?.enabled) return;
  const verifiedAt = otp.verified_at ? new Date(otp.verified_at).getTime() : 0;
  if (Date.now() - verifiedAt > OTP_WINDOW_MS) {
    throw new Error("Sécurité : confirmez votre code d'authentification pour continuer.");
  }
}

/** Vérifie que l'appelant est membre du personnel. */
async function requireStaff(supabaseAdmin: SupabaseClient<Database>): Promise<void> {
  const userId = await currentUserId(supabaseAdmin);
  const { data: staff, error } = await supabaseAdmin.rpc("is_staff", { _user_id: userId });
  if (error || !staff) throw new Error("Action non autorisée");
}

/** Vérifie que l'appelant est membre du personnel avec une 2FA fraîche. */
async function requireStaffWithOtp(supabaseAdmin: SupabaseClient<Database>): Promise<void> {
  const userId = await currentUserId(supabaseAdmin);
  await requireFreshOtp(supabaseAdmin, userId);
  const { data: staff, error } = await supabaseAdmin.rpc("is_staff", { _user_id: userId });
  if (error || !staff) throw new Error("Action non autorisée");
}

/** Appelle un RPC retours (non typé dans Database). */
function returnsRpc(
  supabaseAdmin: SupabaseClient<Database>,
  fn: string,
  args: Record<string, unknown>,
): Promise<{ data: unknown; error: { message: string } | null }> {
  return supabaseAdmin.rpc(fn as never, args as never) as unknown as Promise<{
    data: unknown;
    error: { message: string } | null;
  }>;
}

const RETURN_STATUS_LABEL: Record<string, string> = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  accepte: "Accepté",
  refuse: "Refusé",
  cloture: "Clôturé",
};

const createReturnSchema = z.object({
  customerName: z.string().trim().min(3, "Nom du client requis").max(120),
  phone: z.string().trim().min(8, "Numéro de téléphone invalide").max(25),
  email: z.string().trim().email("E-mail invalide").max(180).optional().or(z.literal("")),
  orderReference: z.string().trim().max(60).optional().or(z.literal("")),
  item: z.string().trim().max(200).optional().or(z.literal("")),
  reason: z.string().trim().min(5, "Décrivez le motif du retour").max(2000),
});

/**
 * Le personnel crée une demande de retour pour un client : génère la
 * référence RT-YYYY-NNNN et insère la ligne (service_role, RLS contournée).
 */
export const createReturn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createReturnSchema.parse(data))
  .handler(async ({ data }): Promise<{ reference: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("return-create", 10))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    await requireStaffWithOtp(supabaseAdmin);

    const { data: refData, error: refError } = await returnsRpc(
      supabaseAdmin,
      "next_return_reference",
      {},
    );
    if (refError || typeof refData !== "string") {
      console.error("[returns] next_return_reference failed", refError);
      throw new Error("Le retour n'a pas pu être enregistré. Réessayez.");
    }
    const reference = refData;

    const returnsClient = supabaseAdmin as unknown as SupabaseClient<ReturnsDatabase>;
    const { error } = await returnsClient.from("returns").insert({
      reference,
      customer_name: data.customerName,
      phone: data.phone,
      email: data.email || null,
      order_reference: data.orderReference || null,
      item: data.item || null,
      reason: data.reason,
    });

    if (error) {
      console.error("[returns] insert failed", error);
      throw new Error("Le retour n'a pas pu être enregistré. Réessayez.");
    }

    return { reference };
  });

const listSchema = z.object({});

/** Liste des retours (personnel uniquement), plus récents d'abord. */
export const listReturns = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => listSchema.parse(data))
  .handler(async (): Promise<ReturnRow[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("returns-read", 30))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    await requireStaff(supabaseAdmin);

    const returnsClient = supabaseAdmin as unknown as SupabaseClient<ReturnsDatabase>;
    const { data, error } = await returnsClient
      .from("returns")
      .select(
        "id, reference, customer_name, phone, email, order_reference, item, reason, status, note, created_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("[returns] list failed", error);
      throw new Error("Impossible de charger les retours.");
    }

    return data ?? [];
  });

const setStatusSchema = z.object({
  reference: z.string().trim().min(1, "Référence requise").max(60),
  status: z.enum(RETURN_STATUSES),
  note: z.string().trim().max(500).optional(),
});

/** Alerte client (best-effort) lors d'un changement de statut de retour. */
async function notifyReturnStatus(returnRow: {
  phone: string;
  email: string | null;
  reference: string;
  item: string | null;
  status: string;
}) {
  try {
    const { sendEmail, sendWhatsApp } = (await import("@/lib/notifications")) as unknown as {
      sendEmail: (to: string, subject: string, html: string) => Promise<void>;
      sendWhatsApp: (to: string, body: string) => Promise<void>;
    };
    const statusLabel = RETURN_STATUS_LABEL[returnRow.status] ?? returnRow.status;
    const item = returnRow.item ? ` (${returnRow.item})` : "";
    const waBody = [
      `Bonjour, votre demande de retour ${returnRow.reference}${item} est maintenant : ${statusLabel}.`,
      "L'atelier Allô Techno vous recontacte par WhatsApp pour la suite.",
    ].join("\n");
    await sendWhatsApp(returnRow.phone, waBody);
    if (returnRow.email) {
      await sendEmail(
        returnRow.email,
        `Retour ${returnRow.reference} — ${statusLabel}`,
        `<div style="font-family:system-ui,sans-serif;font-size:14px">
          <p>Bonjour,</p>
          <p>Votre demande de retour <strong>${returnRow.reference}</strong>${item} est maintenant : <strong>${statusLabel}</strong>.</p>
          <p>L'atelier Allô Techno vous recontacte pour la suite.</p>
        </div>`,
      );
    }
  } catch (err) {
    console.error("[returns] notification best-effort échouée", err);
  }
}

/**
 * Changement de statut d'un retour (et note interne) par le personnel :
 * délègue au RPC return_set_status puis prévient le client (WhatsApp /
 * e-mail, best-effort).
 */
export const setReturnStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => setStatusSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("return-update", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    await requireStaffWithOtp(supabaseAdmin);

    const { error } = await returnsRpc(supabaseAdmin, "return_set_status", {
      _reference: data.reference,
      _status: data.status,
      _note: data.note?.trim() || null,
    });
    if (error) {
      console.error("[returns] set status failed", error);
      throw new Error(error.message || "Mise à jour impossible.");
    }

    const returnsClient = supabaseAdmin as unknown as SupabaseClient<ReturnsDatabase>;
    const { data: row } = await returnsClient
      .from("returns")
      .select("phone, email, reference, item")
      .eq("reference", data.reference)
      .maybeSingle();

    if (row) {
      void notifyReturnStatus({ ...row, status: data.status });
    }

    return { ok: true };
  });
