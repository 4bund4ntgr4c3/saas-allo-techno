import { getRequestHeader } from "@tanstack/react-start/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

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

/** Vrai si l'utilisateur courant appartient au personnel (admin/staff). */
export async function isStaff(supabaseAdmin: SupabaseClient<Database>): Promise<boolean> {
  const userId = await currentUserId(supabaseAdmin);
  if (!userId) return false;
  const { data } = await supabaseAdmin.rpc("is_staff", { _user_id: userId });
  return Boolean(data);
}
