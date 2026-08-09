import { getRequestHeader } from "@tanstack/react-start/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = "admin" | "staff" | "technicien" | "user";

/** UUID utilisateur courant depuis le jeton Bearer, ou null si non authentifié. */
export async function currentUserId(
  supabaseAdmin: SupabaseClient<Database>,
): Promise<string | null> {
  const authHeader = getRequestHeader("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  const { data: claimsData } = await supabaseAdmin.auth.getClaims(token);
  const sub = claimsData?.claims?.sub;
  return typeof sub === "string" ? sub : null;
}

/** Vrai si l'utilisateur courant possède le rôle demandé. */
export async function hasRole(
  supabaseAdmin: SupabaseClient<Database>,
  role: AppRole,
): Promise<boolean> {
  const userId = await currentUserId(supabaseAdmin);
  if (!userId) return false;
  const { data } = await supabaseAdmin.rpc("has_role", {
    _user_id: userId,
    _role: role,
  });
  return Boolean(data);
}

/** Vrai si l'utilisateur courant appartient au personnel (admin/staff). */
export async function isStaff(supabaseAdmin: SupabaseClient<Database>): Promise<boolean> {
  const userId = await currentUserId(supabaseAdmin);
  if (!userId) return false;
  const { data } = await supabaseAdmin.rpc("is_staff", { _user_id: userId });
  return Boolean(data);
}

/** Vrai si l'utilisateur courant est admin. */
export async function isAdmin(supabaseAdmin: SupabaseClient<Database>): Promise<boolean> {
  return hasRole(supabaseAdmin, "admin");
}

/** Lance une erreur si l'utilisateur n'a pas le rôle requis. */
export async function requireRole(supabaseAdmin: SupabaseClient<Database>, ...roles: AppRole[]) {
  const userId = await currentUserId(supabaseAdmin);
  if (!userId) throw new Error("Non authentifié");
  for (const role of roles) {
    if (await hasRole(supabaseAdmin, role)) return;
  }
  throw new Error("Action non autorisée — rôle requis : " + roles.join(" ou "));
}
