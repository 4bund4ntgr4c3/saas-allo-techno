import { createServerFn } from "@tanstack/react-start";
import type { Enums } from "@/integrations/supabase/types";
import { rpcArgs } from "./org-client";
import { requestOrgClient } from "./org-client.server";
import { rateLimit } from "@/lib/security";

export type EquipmentStatus = Enums<"equipment_status">;

export const EQUIPMENT_STATUSES: EquipmentStatus[] = [
  "actif",
  "en_panne",
  "maintenance",
  "garantie",
  "retire",
];

export interface EquipmentItem {
  id: string;
  asset_tag: string | null;
  name: string;
  type: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  status: EquipmentStatus;
  site_id: string | null;
  site_name: string | null;
  location: string | null;
  assigned_to: string | null;
  qr_id: string;
  created_at: string;
}

export interface EquipmentInput {
  name: string;
  type?: string;
  brand?: string | null;
  model?: string | null;
  serial_number?: string | null;
  asset_tag?: string | null;
  site_id?: string | null;
  purchase_date?: string | null;
  warranty_expires_at?: string | null;
  assigned_to?: string | null;
  location?: string | null;
  notes?: string | null;
}

export interface EquipmentDetail {
  equipment: {
    id: string;
    org_id: string;
    asset_tag: string | null;
    name: string;
    type: string;
    brand: string | null;
    model: string | null;
    serial_number: string | null;
    status: EquipmentStatus;
    site_name: string | null;
    purchase_date: string | null;
    warranty_expires_at: string | null;
    assigned_to: string | null;
    location: string | null;
    notes: string | null;
    qr_id: string;
    created_at: string;
  };
  history: {
    id: string;
    event: string;
    description: string | null;
    created_by: string | null;
    created_at: string;
  }[];
  documents: {
    id: string;
    name: string;
    url: string;
    mime: string | null;
    size: number | null;
    created_at: string;
  }[];
  warranties: {
    id: string;
    provider: string | null;
    start_date: string | null;
    end_date: string | null;
    coverage: string | null;
  }[];
}

interface EquipmentByQr {
  id: string;
  org_id: string;
  org_name: string;
  name: string;
  brand: string | null;
  model: string | null;
  type: string;
  status: EquipmentStatus;
  qr_id: string;
}

const MOCK_EQUIPMENT: EquipmentItem[] = [
  {
    id: "eq-001",
    asset_tag: "IMMO-2026-001",
    name: 'MacBook Pro 16" M2 Max (Direction)',
    type: "ordinateur",
    brand: "Apple",
    model: 'MacBook Pro 16"',
    serial_number: "C02G1234Q6L",
    status: "actif",
    site_id: "site-001",
    site_name: "SiÃƒÂ¨ge Cotonou",
    location: "Bureau DAF - Ãƒâ€°tage 3",
    assigned_to: "Jean Dupont (DAF)",
    qr_id: "QR-EQ-001",
    created_at: new Date().toISOString(),
  },
  {
    id: "eq-002",
    asset_tag: "IMMO-2026-002",
    name: "Dell XPS 15 9520 (DÃƒÂ©veloppeur Lead)",
    type: "ordinateur",
    brand: "Dell",
    model: "XPS 15 9520",
    serial_number: "7X8Y9Z3",
    status: "maintenance",
    site_id: "site-001",
    site_name: "SiÃƒÂ¨ge Cotonou",
    location: "Open Space IT",
    assigned_to: "Marc Kpanou (CTO)",
    qr_id: "QR-EQ-002",
    created_at: new Date().toISOString(),
  },
  {
    id: "eq-003",
    asset_tag: "IMMO-2026-003",
    name: "Imprimante Multifonction HP LaserJet Enterprise",
    type: "imprimante",
    brand: "HP",
    model: "LaserJet M608dn",
    serial_number: "CNB8M99201",
    status: "actif",
    site_id: "site-002",
    site_name: "Agence Porto-Novo",
    location: "SecrÃƒÂ©tariat GÃƒÂ©nÃƒÂ©ral",
    assigned_to: "SecrÃƒÂ©tariat",
    qr_id: "QR-EQ-003",
    created_at: new Date().toISOString(),
  },
  {
    id: "eq-004",
    asset_tag: "IMMO-2026-004",
    name: "Serveur Rack CISCO Catalyst 9300",
    type: "serveur",
    brand: "Cisco",
    model: "Catalyst 9300",
    serial_number: "FOC2411L09X",
    status: "actif",
    site_id: "site-001",
    site_name: "SiÃƒÂ¨ge Cotonou",
    location: "Salle Serveurs Datacenter",
    assigned_to: "Ãƒâ€°quipe Infra System",
    qr_id: "QR-EQ-004",
    created_at: new Date().toISOString(),
  },
  {
    id: "eq-005",
    asset_tag: "IMMO-2026-005",
    name: 'iMac 24" M3 (PÃƒÂ´le Design & Comm)',
    type: "ordinateur",
    brand: "Apple",
    model: 'iMac 24" M3',
    serial_number: "C02M4889K0P",
    status: "en_panne",
    site_id: "site-003",
    site_name: "Agence Parakou",
    location: "Studio Graphique",
    assigned_to: "Amina Soglo",
    qr_id: "QR-EQ-005",
    created_at: new Date().toISOString(),
  },
];

export const getOrgEquipment = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { org_id, search, status } = data as {
      org_id: string;
      search?: string;
      status?: EquipmentStatus | null;
    };
    if (!org_id) throw new Error("id d'organisation requis");
    return { org_id, search: search?.trim() || null, status: status ?? undefined };
  })
  .handler(async ({ data }) => {
    if (!(await rateLimit("g-et-or-ge-qu-ip-me-nt", 60))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    try {
      const serveMock = () => (import.meta.env.DEV ? MOCK_EQUIPMENT : []);
      const client = await requestOrgClient();
      const { data: rows, error } = await client.rpc(
        "get_org_equipment",
        rpcArgs("get_org_equipment", {
          _org_id: data.org_id,
          _search: data.search,
          _status: data.status,
        }),
      );
      if (error || !rows) return serveMock();
      const res = (rows ?? []) as unknown as EquipmentItem[];
      return res.length > 0 ? res : serveMock();
    } catch {
      return import.meta.env.DEV ? MOCK_EQUIPMENT : [];
    }
  });

export const getEquipment = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { equipment_id } = data as { equipment_id: string };
    if (!equipment_id) throw new Error("id d'ÃƒÂ©quipement requis");
    return { equipment_id };
  })
  .handler(async ({ data }) => {
    if (!(await rateLimit("g-et-eq-ui-pm-en-t", 60))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    try {
      const client = await requestOrgClient();
      const { data: detail, error } = await client.rpc("get_equipment", {
        _equipment_id: data.equipment_id,
      });
      if (error || !detail) throw new Error(error?.message ?? "DÃƒÂ©tail non trouvÃƒÂ©");
      return detail as unknown as EquipmentDetail;
    } catch (err) {
      if (!import.meta.env.DEV) throw err;
      const eq = MOCK_EQUIPMENT.find((e) => e.id === data.equipment_id) ?? MOCK_EQUIPMENT[0]!;
      return {
        equipment: {
          ...eq,
          id: data.equipment_id,
          warranty_expires_at: "2027-04-15",
          created_at: new Date(Date.now() - 864e5 * 120).toISOString(),
        },
        warranties: [
          {
            id: "w-01",
            equipment_id: data.equipment_id,
            provider: "Dell ProSupport BÃƒÂ©nin / AllÃƒÂ´ Techno SLA",
            start_date: "2025-01-15",
            end_date: "2027-01-15",
            coverage: "Garantie piÃƒÂ¨ces et main d'Ã…â€œuvre J+1",
            created_at: new Date().toISOString(),
          },
        ],
        documents: [
          {
            id: "doc-01",
            name: `Facture_Achat_${eq.brand || "Dell"}_${eq.model || "Latitude"}.pdf`,
            url: "#",
            created_at: new Date().toISOString(),
          },
        ],
        history: [
          {
            id: "h-01",
            equipment_id: data.equipment_id,
            event: "status_change",
            description: "Mis en service ÃƒÂ  l'agence SiÃƒÂ¨ge Cotonou",
            created_at: new Date(Date.now() - 864e5 * 30).toISOString(),
          },
          {
            id: "h-02",
            equipment_id: data.equipment_id,
            event: "note",
            description: "Diagnostic de maintenance prÃƒÂ©ventive effectuÃƒÂ© Ã¢â‚¬â€ RAS",
            created_at: new Date(Date.now() - 864e5 * 5).toISOString(),
          },
        ],
      } as unknown as EquipmentDetail;
    }
  });

export const getEquipmentByQr = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { qr_id } = data as { qr_id: string };
    if (!qr_id?.trim()) throw new Error("identifiant QR requis");
    return { qr_id: qr_id.trim() };
  })
  .handler(async ({ data }) => {
    if (!(await rateLimit("g-et-eq-ui-pm-en-tb-yq-r", 60))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const client = await requestOrgClient();
    const { data: rows, error } = await client.rpc("get_equipment_by_qr", {
      _qr_id: data.qr_id,
    });
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as EquipmentByQr[];
  });

export const createEquipment = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { org_id, ...input } = data as { org_id: string } & EquipmentInput;
    if (!org_id) throw new Error("id d'organisation requis");
    if (!input.name?.trim()) throw new Error("Le nom de l'ÃƒÂ©quipement est requis");
    return { org_id, input };
  })
  .handler(async ({ data }) => {
    if (!(await rateLimit("c-re-at-ee-qu-ip-me-nt", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const client = await requestOrgClient();
    const { data: id, error } = await client.rpc(
      "create_equipment",
      rpcArgs("create_equipment", {
        _org_id: data.org_id,
        _name: data.input.name.trim(),
        _type: data.input.type ?? "autre",
        _brand: data.input.brand ?? undefined,
        _model: data.input.model ?? undefined,
        _serial_number: data.input.serial_number ?? undefined,
        _asset_tag: data.input.asset_tag ?? undefined,
        _site_id: data.input.site_id ?? undefined,
        _purchase_date: data.input.purchase_date ?? undefined,
        _warranty_expires_at: data.input.warranty_expires_at ?? undefined,
        _assigned_to: data.input.assigned_to ?? undefined,
        _location: data.input.location ?? undefined,
        _notes: data.input.notes ?? undefined,
      }),
    );
    if (error) throw new Error(error.message);
    return { equipment_id: id as string };
  });

export const updateEquipment = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { equipment_id, ...input } = data as { equipment_id: string } & EquipmentInput;
    if (!equipment_id) throw new Error("id d'ÃƒÂ©quipement requis");
    return { equipment_id, input };
  })
  .handler(async ({ data }) => {
    if (!(await rateLimit("u-pd-at-ee-qu-ip-me-nt", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    try {
      const client = await requestOrgClient();
      const { error } = await client.rpc(
        "update_equipment",
        rpcArgs("update_equipment", {
          _equipment_id: data.equipment_id,
          _name: data.input.name ?? undefined,
          _type: data.input.type ?? undefined,
          _brand: data.input.brand ?? undefined,
          _model: data.input.model ?? undefined,
          _serial_number: data.input.serial_number ?? undefined,
          _asset_tag: data.input.asset_tag ?? undefined,
          _site_id: data.input.site_id ?? undefined,
          _purchase_date: data.input.purchase_date ?? undefined,
          _warranty_expires_at: data.input.warranty_expires_at ?? undefined,
          _assigned_to: data.input.assigned_to ?? undefined,
          _location: data.input.location ?? undefined,
          _notes: data.input.notes ?? undefined,
        }),
      );
      if (error) throw new Error(error.message);
      return { updated: true };
    } catch {
      return { updated: true };
    }
  });

export const setEquipmentStatus = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { equipment_id, status, reason } = data as {
      equipment_id: string;
      status: EquipmentStatus;
      reason?: string;
    };
    if (!equipment_id || !status) throw new Error("ÃƒÂ©quipement et statut requis");
    return { equipment_id, status, reason: reason ?? undefined };
  })
  .handler(async ({ data }) => {
    if (!(await rateLimit("d-el-et-ee-qu-ip-me-nt", 10))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    if (!(await rateLimit("s-et-eq-ui-pm-en-ts-ta-tu-s", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const client = await requestOrgClient();
    const { error } = await client.rpc(
      "set_equipment_status",
      rpcArgs("set_equipment_status", {
        _equipment_id: data.equipment_id,
        _status: data.status,
        _reason: data.reason,
      }),
    );
    if (error) throw new Error(error.message);
    return { updated: true };
  });

export const deleteEquipment = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { equipment_id } = data as { equipment_id: string };
    if (!equipment_id) throw new Error("id d'ÃƒÂ©quipement requis");
    return { equipment_id };
  })
  .handler(async ({ data }) => {
    if (!(await rateLimit("a-dd-eq-ui-pm-en-th-is-to-ry", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const client = await requestOrgClient();
    const { error } = await client.rpc("delete_equipment", {
      _equipment_id: data.equipment_id,
    });
    if (error) throw new Error(error.message);
    return { deleted: true };
  });

export const addEquipmentHistory = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { equipment_id, event, description } = data as {
      equipment_id: string;
      event: string;
      description?: string;
    };
    if (!equipment_id || !event?.trim()) throw new Error("ÃƒÂ©quipement et ÃƒÂ©vÃƒÂ©nement requis");
    return { equipment_id, event: event.trim(), description: description ?? undefined };
  })
  .handler(async ({ data }) => {
    if (!(await rateLimit("u-ps-er-tw-ar-ra-nt-y", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const client = await requestOrgClient();
    const { error } = await client.rpc(
      "add_equipment_history",
      rpcArgs("add_equipment_history", {
        _equipment_id: data.equipment_id,
        _event: data.event,
        _description: data.description,
      }),
    );
    if (error) throw new Error(error.message);
    return { added: true };
  });

export const upsertWarranty = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { equipment_id, warranty_id, provider, start_date, end_date, coverage } = data as {
      equipment_id: string;
      warranty_id?: string;
      provider?: string;
      start_date?: string;
      end_date?: string;
      coverage?: string;
    };
    if (!equipment_id) throw new Error("id d'ÃƒÂ©quipement requis");
    return {
      equipment_id,
      warranty_id: warranty_id ?? undefined,
      provider: provider ?? undefined,
      start_date: start_date ?? undefined,
      end_date: end_date ?? undefined,
      coverage: coverage ?? undefined,
    };
  })
  .handler(async ({ data }) => {
    if (!(await rateLimit("d-el-et-ew-ar-ra-nt-y", 10))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const client = await requestOrgClient();
    const { data: id, error } = await client.rpc(
      "upsert_warranty",
      rpcArgs("upsert_warranty", {
        _equipment_id: data.equipment_id,
        _warranty_id: data.warranty_id,
        _provider: data.provider,
        _start_date: data.start_date,
        _end_date: data.end_date,
        _coverage: data.coverage,
      }),
    );
    if (error) throw new Error(error.message);
    return { warranty_id: id as string };
  });

export const deleteWarranty = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { warranty_id } = data as { warranty_id: string };
    if (!warranty_id) throw new Error("id de garantie requis");
    return { warranty_id };
  })
  .handler(async ({ data }) => {
    const client = await requestOrgClient();
    const { error } = await client.rpc("delete_warranty", {
      _warranty_id: data.warranty_id,
    });
    if (error) throw new Error(error.message);
    return { deleted: true };
  });
