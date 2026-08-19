import { getRequestHeader } from "@tanstack/react-start/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const OTP_WINDOW_MS = 24 * 3600 * 1000;

/** Identifie l'utilisateur courant via le JWT d'autorisation (côté serveur). */
export async function currentUserId(
  supabaseAdmin: SupabaseClient<Database>,
): Promise<string> {
  const authHeader = getRequestHeader("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) throw new Error("Non authentifié");
  const { data: claimsData } = await supabaseAdmin.auth.getClaims(token);
  const sub = claimsData?.claims?.sub;
  if (typeof sub !== "string") throw new Error("Non authentifié");
  return sub;
}

/**
 * Exige une double authentification fraîche (< 24 h) pour les opérations
 * sensibles : si l'utilisateur a activé un TOTP, il doit l'avoir confirmé
 * récemment. Empêche un JWT volé de contourner la 2FA côté client.
 */
export async function requireFreshOtp(
  supabaseAdmin: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
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

/** Vérifie que l'appelant est membre du personnel avec une 2FA fraîche. */
export async function requireStaffWithOtp(
  supabaseAdmin: SupabaseClient<Database>,
): Promise<string> {
  const userId = await currentUserId(supabaseAdmin);
  await requireFreshOtp(supabaseAdmin, userId);
  const { data: staff, error } = await supabaseAdmin.rpc("is_staff", { _user_id: userId });
  if (error || !staff) throw new Error("Action non autorisée");
  return userId;
}