import { createServerFn } from "@tanstack/react-start";
import { orgClient, rpcArgs } from "./org-client";
import { rateLimit } from "@/lib/security";

export interface OrgSite {
  id: string;
  name: string;
  address: string | null;
  city: string;
  phone: string;
  manager: string | null;
  departments: string[];
  active: boolean | null;
  equipment_count: number;
}

interface OrgSiteInput {
  name: string;
  address?: string | null;
  city?: string;
  phone?: string;
  email?: string | null;
  manager?: string | null;
  departments?: string[];
  active?: boolean;
}

export const getOrgSites = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { org_id } = data as { org_id: string };
    if (!org_id) throw new Error("id d'organisation requis");
    return { org_id };
  })
  .handler(async ({ data }) => {
    if (!(await rateLimit("g-et-or-gs-it-es", 60))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const client = await orgClient();
    const { data: rows, error } = await client.rpc("get_org_sites", {
      _org_id: data.org_id,
    });
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as OrgSite[];
  });

export const createOrgSite = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { org_id, ...input } = data as { org_id: string } & OrgSiteInput;
    if (!org_id) throw new Error("id d'organisation requis");
    if (!input.name?.trim()) throw new Error("Le nom du site est requis");
    return { org_id, input };
  })
  .handler(async ({ data }) => {
    if (!(await rateLimit("c-re-at-eo-rg-si-te", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const client = await orgClient();
    const { data: id, error } = await client.rpc(
      "create_org_site",
      rpcArgs("create_org_site", {
        _org_id: data.org_id,
        _name: data.input.name.trim(),
        _address: data.input.address ?? undefined,
        _city: data.input.city ?? "Cotonou",
        _phone: data.input.phone ?? "",
        _email: data.input.email ?? undefined,
        _manager: data.input.manager ?? undefined,
        _departments: data.input.departments ?? undefined,
      }),
    );
    if (error) throw new Error(error.message);
    return { site_id: id as string };
  });

export const updateOrgSite = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { site_id, ...input } = data as { site_id: string } & OrgSiteInput;
    if (!site_id) throw new Error("id de site requis");
    return { site_id, input };
  })
  .handler(async ({ data }) => {
    if (!(await rateLimit("u-pd-at-eo-rg-si-te", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const client = await orgClient();
    const { error } = await client.rpc(
      "update_org_site",
      rpcArgs("update_org_site", {
        _site_id: data.site_id,
        _name: data.input.name ?? undefined,
        _address: data.input.address ?? undefined,
        _city: data.input.city ?? undefined,
        _phone: data.input.phone ?? undefined,
        _email: data.input.email ?? undefined,
        _manager: data.input.manager ?? undefined,
        _departments: data.input.departments ?? undefined,
        _active: data.input.active ?? undefined,
      }),
    );
    if (error) throw new Error(error.message);
    return { updated: true };
  });

export const deleteOrgSite = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { site_id } = data as { site_id: string };
    if (!site_id) throw new Error("id de site requis");
    return { site_id };
  })
  .handler(async ({ data }) => {
    if (!(await rateLimit("d-el-et-eo-rg-si-te", 10))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const client = await orgClient();
    const { error } = await client.rpc("delete_org_site", {
      _site_id: data.site_id,
    });
    if (error) throw new Error(error.message);
    return { deleted: true };
  });
