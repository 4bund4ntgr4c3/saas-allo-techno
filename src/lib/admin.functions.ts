import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import type { Enums } from "@/integrations/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { rateLimit } from "@/lib/security";

const setStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    "en_attente",
    "confirmee",
    "pieces",
    "en_cours",
    "pret",
    "livre",
    "terminee",
    "annulee",
  ]),
  note: z.string().trim().max(500).optional(),
});

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

/**
 * Vérifie la double authentification serveur : si l'utilisateur a activé un
 * TOTP, il doit l'avoir confirmé il y a moins de 24 h. Empêche un JWT volé de
 * contourner la 2FA côté client.
 */
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

/**
 * Changement de statut d'un dossier par le personnel : délègue au RPC
 * PostgreSQL (historique + contrôles), puis notifie le client (e-mail +
 * WhatsApp). L'appelant doit être membre du staff — vérifié côté serveur.
 */
export const setReservationStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => setStatusSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!rateLimit("admin-status", 30)) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const userId = await currentUserId(supabaseAdmin);
    await requireFreshOtp(supabaseAdmin, userId);

    const { data: staff, error: staffError } = await supabaseAdmin.rpc("is_staff", {
      _user_id: userId,
    });
    if (staffError || !staff) {
      const { data: isTech, error: techError } = await supabaseAdmin.rpc("has_role", {
        _user_id: userId,
        _role: "technicien",
      });
      if (techError || !isTech) throw new Error("Action non autorisée sur ce dossier");
      const { error: techRpcError } = await supabaseAdmin.rpc("technician_set_reservation_status", {
        _reservation_id: data.id,
        _status: data.status,
        ...(data.note ? { _note: data.note } : {}),
      });
      if (techRpcError) {
        console.error("[admin] technician set status failed", techRpcError);
        throw new Error(techRpcError.message);
      }
    } else {
      const { error } = await supabaseAdmin.rpc("staff_set_reservation_status", {
        _reservation_id: data.id,
        _status: data.status,
        ...(data.note ? { _note: data.note } : {}),
      });
      if (error) {
        console.error("[admin] set status failed", error);
        throw new Error(error.message);
      }
    }

    const { data: row } = await supabaseAdmin
      .from("reservations")
      .select(
        "reference, user_id, customer_name, email, phone, device, issue, mode, payment, slot_date, slot_period, slot_hour, status",
      )
      .eq("id", data.id)
      .maybeSingle();

    if (row) {
      const { notifyReservationStatusChanged } = await import("@/lib/notifications");
      void notifyReservationStatusChanged(row);
    }

    if (data.status === "terminee" && row?.user_id) {
      try {
        await supabaseAdmin.rpc("add_loyalty_points", {
          _user_id: row.user_id,
          _delta: 100,
          _reason: "repair_completed",
          _reference: row.reference,
        });
      } catch (err) {
        console.error("[loyalty] crédit réparation terminée échoué", err);
      }

      try {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("referred_by")
          .eq("id", row.user_id)
          .maybeSingle();
        if (profile?.referred_by && profile.referred_by !== row.user_id) {
          await supabaseAdmin.rpc("add_loyalty_points", {
            _user_id: profile.referred_by,
            _delta: 100,
            _reason: "referral",
            _reference: row.reference,
          });
        }
      } catch (err) {
        console.error("[loyalty] crédit parrain échoué", err);
      }
    }

    return true;
  });

export type SetStatusInput = z.infer<typeof setStatusSchema>;
export type SetStatusResult = boolean;
export type Status = Enums<"reservation_status">;

const getReservationQuoteSchema = z.object({
  reservationId: z.string().uuid(),
});

export type ReservationQuote = {
  reference: string;
  quote_amount: number | null;
  quote_status: string;
  quote_decided_at: string | null;
  warranty_months: number;
};

/**
 * Lecture du devis d'un dossier par le personnel (montant, statut, garantie).
 * Permet au panneau devis de l'admin d'afficher et de rafraîchir l'état.
 */
export const getReservationQuote = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => getReservationQuoteSchema.parse(data))
  .handler(async ({ data }): Promise<ReservationQuote | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!rateLimit("admin-quote", 30)) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const userId = await currentUserId(supabaseAdmin);
    const { data: staff, error: staffError } = await supabaseAdmin.rpc("is_staff", {
      _user_id: userId,
    });
    if (staffError || !staff) throw new Error("Action non autorisée sur ce dossier");

    const { data: row, error } = await supabaseAdmin
      .from("reservations")
      .select("reference, quote_amount, quote_status, quote_decided_at, warranty_months")
      .eq("id", data.reservationId)
      .maybeSingle();

    if (error) {
      console.error("[admin] get reservation quote failed", error);
      throw new Error("Impossible de lire le devis de ce dossier.");
    }
    if (!row) return null;

    return row;
  });
