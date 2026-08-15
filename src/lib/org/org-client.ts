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
