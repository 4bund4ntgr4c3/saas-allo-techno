import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { COMPANY } from "@/data/catalog";
import { generateTotpSecret, otpauthUri, verifyTotp } from "@/lib/totp";
import { rateLimit } from "@/lib/security";

const codeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Code à 6 chiffres requis"),
});

async function currentUserId(supabaseAdmin: SupabaseClient<Database>): Promise<string> {
  const authHeader = getRequestHeader("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) throw new Error("Non authentifié");
  const { data: claimsData } = await supabaseAdmin.auth.getClaims(token);
  const sub = claimsData?.claims?.sub;
  if (typeof sub !== "string") throw new Error("Non authentifié");
  return sub;
}

async function adminOnly(supabaseAdmin: SupabaseClient<Database>): Promise<string> {
  const userId = await currentUserId(supabaseAdmin);

  const { data: staff } = await supabaseAdmin.rpc("is_staff", { _user_id: userId });
  const { data: admin } = await supabaseAdmin.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (!staff || !admin) throw new Error("Action réservée aux administrateurs");
  return userId;
}

/** Génère un secret TOTP pour l'administrateur (désactivé tant que non confirmé). */
export const enrollOtp = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const userId = await adminOnly(supabaseAdmin);

  const secret = generateTotpSecret();
  const { error } = await supabaseAdmin.from("admin_otp").upsert({
    user_id: userId,
    secret,
    enabled: false,
  });
  if (error) {
    console.error("[otp] enroll failed", error);
    throw new Error("Impossible de préparer la double authentification.");
  }

  return {
    secret,
    uri: otpauthUri(secret, `${COMPANY.name} — ${userId.slice(0, 8)}`, COMPANY.name),
  };
});

/** Confirme le premier code saisi et active la double authentification. */
export const confirmOtp = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => codeSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = await adminOnly(supabaseAdmin);

    const { data: row, error } = await supabaseAdmin
      .from("admin_otp")
      .select("secret")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error("Erreur de lecture de la configuration.");
    if (!row || !(await verifyTotp(row.secret, data.code))) {
      throw new Error("Code invalide ou expiré. Réessayez.");
    }

    const { error: updateError } = await supabaseAdmin
      .from("admin_otp")
      .update({ enabled: true, verified_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (updateError) throw new Error("Impossible d'activer la double authentification.");
    return true;
  });

/** Désactive la double authentification après vérification du code courant. */
export const disableOtp = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => codeSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = await adminOnly(supabaseAdmin);

    const { data: row } = await supabaseAdmin
      .from("admin_otp")
      .select("secret")
      .eq("user_id", userId)
      .maybeSingle();
    if (!row || !(await verifyTotp(row.secret, data.code))) {
      throw new Error("Code invalide ou expiré.");
    }

    const { error } = await supabaseAdmin
      .from("admin_otp")
      .update({ enabled: false })
      .eq("user_id", userId);
    if (error) throw new Error("Impossible de désactiver la double authentification.");
    return true;
  });

/** Vérifie le code saisi pour déverrouiller l'interface d'administration. */
export const verifyOtpLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => codeSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let userId: string | null = null;
    try {
      userId = await currentUserId(supabaseAdmin);
    } catch {
      return false;
    }

    if (!rateLimit("otp-verify", 10)) return false;

    const { data: row } = await supabaseAdmin
      .from("admin_otp")
      .select("secret, enabled")
      .eq("user_id", userId)
      .maybeSingle();
    if (!row?.enabled) return true;

    const ok = await verifyTotp(row.secret, data.code);
    if (ok) {
      await supabaseAdmin
        .from("admin_otp")
        .update({ verified_at: new Date().toISOString() })
        .eq("user_id", userId);
    }
    return ok;
  });
