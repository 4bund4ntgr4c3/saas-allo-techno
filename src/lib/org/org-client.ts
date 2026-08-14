import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createSupabaseFetch } from "@/integrations/supabase/helpers";

/**
 * Client Supabase contextuel pour le portail B2B (/app).
 * Reconstruit à chaque requête avec le JWT de l'utilisateur courant
 * pour que les politiques RLS et RPCs vérifient auth.uid().
 */
export async function orgClient() {
  const { getRequestHeader } = await import("@tanstack/react-start/server");
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Configuration Supabase manquante");

  const authHeader = getRequestHeader("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) throw new Error("Non authentifié");

  return createClient<Database>(url, key, {
    global: {
      fetch: createSupabaseFetch(key),
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Passe des arguments RPC en omettant les `undefined` : les fonctions ont été
 * créées avec `DEFAULT NULL`, donc `exactOptionalPropertyTypes` interdit d'y passer `undefined` explicite.
 */
export type RpcArgs<K extends keyof Database["public"]["Functions"]> =
  Database["public"]["Functions"][K]["Args"];

export function rpcArgs<K extends keyof Database["public"]["Functions"]>(
  _fn: K,
  args: Record<string, unknown>,
): RpcArgs<K> {
  return Object.fromEntries(Object.entries(args).filter(([, v]) => v !== undefined)) as RpcArgs<K>;
}

/**
 * Vérifie que l'utilisateur appelant a accès à l'organisation cible
 * (admin_org, manager, responsable_maintenance ou membre).
 */
export async function assertOrgAccess(orgId: string): Promise<void> {
  const client = await orgClient();
  const { data, error } = await client
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .maybeSingle();
  if (error || !data) {
    throw new Error("Accès refusé à cette organisation");
  }
}

/**
 * Vérifie que l'utilisateur a accès au ticket (via son organisation).
 */
export async function assertTicketAccess(ticketId: string): Promise<void> {
  const client = await orgClient();
  const { data, error } = await client
    .from("reservations")
    .select("org_id")
    .eq("id", ticketId)
    .maybeSingle();
  if (error || !data?.org_id) throw new Error("Ticket introuvable");
  await assertOrgAccess(data.org_id);
}
