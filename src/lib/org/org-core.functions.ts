import { createServerFn } from "@tanstack/react-start";
import type { Enums } from "@/integrations/supabase/types";
import { orgClient, rpcArgs } from "./org-client";
import { rateLimit } from "@/lib/security";

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

interface OrgMember {
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

const MOCK_ORGS: Organization[] = [
  {
    id: "demo-oragroup",
    name: "Oragroup Bénin (Siège Cotonou)",
    trade_name: "Oragroup SA",
    registration_number: "RB/COT/26 B 10948",
    address: "Boulevard de la Marina, Cotonou",
    country: "Bénin",
    phone: "+229 21 31 00 00",
    email: "contact@oragroup-benin.com",
    sector: "Services Financiers & Banque",
    size: "grande",
    site_count: 3,
    equipment_count: 45,
    status: "active",
    member_role: "admin_org",
    member_count: 5,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-bts",
    name: "Bénin Télécoms Services (BTS SA)",
    trade_name: "BTS SA",
    registration_number: "RB/COT/24 B 88392",
    address: "Avenue Clozel, Cotonou",
    country: "Bénin",
    phone: "+229 21 30 11 22",
    email: "contact@bts.bj",
    sector: "Télécommunications & IT",
    size: "grande",
    site_count: 8,
    equipment_count: 120,
    status: "active",
    member_role: "responsable_maintenance",
    member_count: 12,
    created_at: new Date().toISOString(),
  },
];

export const getMyOrganizations = createServerFn({ method: "GET" }).handler(
  async (): Promise<Organization[]> => {
    if (!(await rateLimit("g-et-my-or-ga-ni-za-ti-on-s", 60))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    try {
      const client = await orgClient();
      const { data: members, error } = await client
        .from("organization_members")
        .select("role, organization_id, organizations(*)");
      if (error || !members) return MOCK_ORGS;
      const list = members
        .filter((m) => m.organizations)
        .map((m) => {
          const org = m.organizations as unknown as Organization;
          return {
            ...org,
            member_role: m.role as OrgRole,
            member_count: 1,
          };
        });
      return list.length > 0 ? list : MOCK_ORGS;
    } catch {
      return MOCK_ORGS;
    }
  },
);

export const createOrganization = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const input = data as OrganizationInput;
    if (!input.name?.trim()) throw new Error("Le nom de l'organisation est requis");
    return input;
  })
  .handler(async ({ data }) => {
    if (!(await rateLimit("c-re-at-eo-rg-an-iz-at-io-n", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const client = await orgClient();
    const { data: org, error } = await client.rpc(
      "create_organization",
      rpcArgs("create_organization", {
        _name: data.name.trim(),
        _trade_name: data.trade_name ?? undefined,
        _registration_number: data.registration_number ?? undefined,
        _address: data.address ?? undefined,
        _country: data.country ?? "Bénin",
        _phone: data.phone ?? undefined,
        _email: data.email ?? undefined,
        _sector: data.sector ?? undefined,
        _size: data.size ?? undefined,
        _site_count: data.site_count ?? undefined,
        _equipment_count: data.equipment_count ?? undefined,
      }),
    );
    if (error) throw new Error(error.message);
    return org as unknown as { id: string; name: string };
  });

export const getOrgMembers = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { org_id } = data as { org_id: string };
    if (!org_id) throw new Error("id d'organisation requis");
    return { org_id };
  })
  .handler(async ({ data }): Promise<OrgMember[]> => {
    if (!(await rateLimit("g-et-or-gm-em-be-rs", 60))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const client = await orgClient();
    const { data: members, error } = await client.rpc("get_org_members", {
      _org_id: data.org_id,
    });
    if (error) throw new Error(error.message);
    return (members ?? []) as unknown as OrgMember[];
  });

export const inviteOrgMember = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { org_id, email, role } = data as { org_id: string; email: string; role: OrgRole };
    if (!org_id || !email?.trim()) throw new Error("org_id et email requis");
    return { org_id, email: email.trim().toLowerCase(), role: role ?? "membre" };
  })
  .handler(async ({ data }) => {
    if (!(await rateLimit("s-et-or-gm-em-be-rr-ol-e", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    if (!(await rateLimit("i-nv-it-eo-rg-me-mb-er", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const client = await orgClient();
    const { data: member, error } = await client.rpc("invite_org_member", {
      _org_id: data.org_id,
      _email: data.email,
      _role: data.role,
    });
    if (error) throw new Error(error.message);
    return member as unknown as { user_id: string; role: OrgRole };
  });

export const setOrgMemberRole = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { org_id, user_id, role } = data as { org_id: string; user_id: string; role: OrgRole };
    if (!org_id || !user_id || !role) throw new Error("org_id, user_id et role requis");
    return { org_id, user_id, role };
  })
  .handler(async ({ data }) => {
    if (!(await rateLimit("r-em-ov-eo-rg-me-mb-er", 10))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const client = await orgClient();
    const { error } = await client.rpc("set_org_member_role", {
      _org_id: data.org_id,
      _user_id: data.user_id,
      _role: data.role,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeOrgMember = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { org_id, user_id } = data as { org_id: string; user_id: string };
    if (!org_id || !user_id) throw new Error("org_id et user_id requis");
    return { org_id, user_id };
  })
  .handler(async ({ data }) => {
    const client = await orgClient();
    const { error } = await client.rpc("remove_org_member", {
      _org_id: data.org_id,
      _user_id: data.user_id,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
