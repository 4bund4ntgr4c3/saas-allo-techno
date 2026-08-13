import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createSupabaseFetch } from "@/integrations/supabase/helpers";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAdmin } from "@/lib/rbac";
import type { AppRole } from "@/lib/rbac";

export interface UserRole {
  user_id: string;
  role: AppRole;
  email?: string;
  created_at: string;
}

export const getUserRoles = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin(supabaseAdmin);
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as UserRole[];
});

/**
 * Client Supabase construit avec le JWT de l'appelant : nécessaire car le RPC
 * `set_user_role` vérifie `auth.uid() = admin` côté base (le service-role n'a
 * pas d'uid et échouerait toujours).
 */
function adminUserClient() {
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

export const setUserRole = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { user_id, role } = data as { user_id: string; role: AppRole };
    if (!user_id || !role) throw new Error("user_id et role requis");
    return { user_id, role };
  })
  .handler(async ({ data }) => {
    await requireAdmin(supabaseAdmin);
    const { error } = await adminUserClient().rpc("set_user_role", {
      _user_id: data.user_id,
      _role: data.role,
    });
    if (error) throw new Error(error.message);
    return { set: true };
  });
