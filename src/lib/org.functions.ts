import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database, Enums } from "@/integrations/supabase/types";
import { createSupabaseFetch } from "@/integrations/supabase/helpers";

/**
 * Fonctions serveur du portail B2B (/app).
 *
 * Les RPC org (create_organization, invite_org_member…) vérifient auth.uid()
 * côté base : il faut donc appeler Supabase avec le JWT de l'utilisateur
 * courant (et non le client service-role). On reconstruit un client par
 * requête à partir de l'en-tête Authorization attaché par attachSupabaseAuth.
 */
function orgClient() {
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

export type OrgRole = Enums<"org_role">;

export interface Organization {
  id: string;
  name: string;
  trade_name: string | null;
  registration_number: string | null;
  address: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  sector: string | null;
  size: string | null;
  site_count: number | null;
  equipment_count: number | null;
  status: Enums<"org_status">;
  member_role: OrgRole;
  member_count: number;
  created_at: string;
}

export interface OrgMember {
  user_id: string;
  role: OrgRole;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

export interface OrganizationInput {
  name: string;
  trade_name?: string | null;
  registration_number?: string | null;
  address?: string | null;
  country?: string;
  phone?: string | null;
  email?: string | null;
  sector?: string | null;
  size?: string | null;
  site_count?: number | null;
  equipment_count?: number | null;
}

export const getMyOrganizations = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await orgClient().rpc("get_user_orgs");
  if (error) throw new Error(error.message);
  return (data ?? "[]") as unknown as Organization[];
});

export const createOrganization = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const input = data as OrganizationInput;
    if (!input.name || !input.name.trim()) throw new Error("Le nom de l'entreprise est requis");
    return input;
  })
  .handler(async ({ data }) => {
    const { data: orgId, error } = await orgClient().rpc("create_organization", {
      _name: data.name.trim(),
      _trade_name: data.trade_name ?? null,
      _registration_number: data.registration_number ?? null,
      _address: data.address ?? null,
      _country: data.country ?? "Bénin",
      _phone: data.phone ?? null,
      _email: data.email ?? null,
      _sector: data.sector ?? null,
      _size: data.size ?? null,
      _site_count: data.site_count ?? null,
      _equipment_count: data.equipment_count ?? null,
    });
    if (error) throw new Error(error.message);
    return { org_id: orgId as string };
  });

export const updateOrganization = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { org_id, ...rest } = data as { org_id: string } & OrganizationInput;
    if (!org_id) throw new Error("id d'organisation requis");
    return { org_id, updates: rest };
  })
  .handler(async ({ data }) => {
    const { error } = await orgClient().rpc("update_organization", {
      _org_id: data.org_id,
      _name: data.updates.name ?? null,
      _trade_name: data.updates.trade_name ?? null,
      _registration_number: data.updates.registration_number ?? null,
      _address: data.updates.address ?? null,
      _country: data.updates.country ?? null,
      _phone: data.updates.phone ?? null,
      _email: data.updates.email ?? null,
      _sector: data.updates.sector ?? null,
      _size: data.updates.size ?? null,
      _site_count: data.updates.site_count ?? null,
      _equipment_count: data.updates.equipment_count ?? null,
    });
    if (error) throw new Error(error.message);
    return { updated: true };
  });

export const getOrgMembers = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { org_id } = data as { org_id: string };
    if (!org_id) throw new Error("id d'organisation requis");
    return { org_id };
  })
  .handler(async ({ data }) => {
    const { data: members, error } = await orgClient().rpc("get_org_members", {
      _org_id: data.org_id,
    });
    if (error) throw new Error(error.message);
    return (members ?? "[]") as unknown as OrgMember[];
  });

export const inviteOrgMember = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { org_id, email, role } = data as { org_id: string; email: string; role: OrgRole };
    if (!org_id || !email || !email.trim()) throw new Error("organisation et email requis");
    return { org_id, email: email.trim(), role: role ?? "membre" };
  })
  .handler(async ({ data }) => {
    const { error } = await orgClient().rpc("invite_org_member", {
      _org_id: data.org_id,
      _email: data.email,
      _role: data.role,
    });
    if (error) throw new Error(error.message);
    return { invited: true };
  });

export const setOrgMemberRole = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { org_id, user_id, role } = data as { org_id: string; user_id: string; role: OrgRole };
    if (!org_id || !user_id || !role) throw new Error("organisation, utilisateur et rôle requis");
    return { org_id, user_id, role };
  })
  .handler(async ({ data }) => {
    const { error } = await orgClient().rpc("set_org_member_role", {
      _org_id: data.org_id,
      _user_id: data.user_id,
      _role: data.role,
    });
    if (error) throw new Error(error.message);
    return { updated: true };
  });

export const removeOrgMember = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { org_id, user_id } = data as { org_id: string; user_id: string };
    if (!org_id || !user_id) throw new Error("organisation et utilisateur requis");
    return { org_id, user_id };
  })
  .handler(async ({ data }) => {
    const { error } = await orgClient().rpc("remove_org_member", {
      _org_id: data.org_id,
      _user_id: data.user_id,
    });
    if (error) throw new Error(error.message);
    return { removed: true };
  });
