import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { AppRole } from "@/lib/rbac";

export interface UserRole {
  user_id: string;
  role: AppRole;
  email?: string;
  created_at: string;
}

export const getUserRoles = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as UserRole[];
});

export const setUserRole = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { user_id, role } = data as { user_id: string; role: AppRole };
    if (!user_id || !role) throw new Error("user_id et role requis");
    return { user_id, role };
  })
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.rpc("set_user_role", {
      _user_id: data.user_id,
      _role: data.role,
    });
    if (error) throw new Error(error.message);
    return { set: true };
  });
