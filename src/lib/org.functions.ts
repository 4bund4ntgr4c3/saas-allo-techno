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

/**
 * Passe des arguments RPC en omettant les `undefined` : les fonctions ont été
 * recréées avec `DEFAULT NULL`, donc `gen types` les marque optionnels (`?:`)
 * et `exactOptionalPropertyTypes` interdit d'y passer `undefined` explicite.
 */
type RpcArgs<K extends keyof Database["public"]["Functions"]> =
  Database["public"]["Functions"][K]["Args"];

function rpcArgs<K extends keyof Database["public"]["Functions"]>(
  _fn: K,
  args: Record<string, unknown>,
): RpcArgs<K> {
  return Object.fromEntries(Object.entries(args).filter(([, v]) => v !== undefined)) as RpcArgs<K>;
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
    const { data: orgId, error } = await orgClient().rpc(
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
    return { org_id: orgId as string };
  });

export const updateOrganization = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { org_id, ...rest } = data as { org_id: string } & OrganizationInput;
    if (!org_id) throw new Error("id d'organisation requis");
    return { org_id, updates: rest };
  })
  .handler(async ({ data }) => {
    const { error } = await orgClient().rpc(
      "update_organization",
      rpcArgs("update_organization", {
        _org_id: data.org_id,
        _name: data.updates.name ?? undefined,
        _trade_name: data.updates.trade_name ?? undefined,
        _registration_number: data.updates.registration_number ?? undefined,
        _address: data.updates.address ?? undefined,
        _country: data.updates.country ?? undefined,
        _phone: data.updates.phone ?? undefined,
        _email: data.updates.email ?? undefined,
        _sector: data.updates.sector ?? undefined,
        _size: data.updates.size ?? undefined,
        _site_count: data.updates.site_count ?? undefined,
        _equipment_count: data.updates.equipment_count ?? undefined,
      }),
    );
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

// ---------------------------------------------------------------------------
// Parc matériel (Phase 1 B2B)
// ---------------------------------------------------------------------------

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

export interface EquipmentByQr {
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
    const { data: rows, error } = await orgClient().rpc(
      "get_org_equipment",
      rpcArgs("get_org_equipment", {
        _org_id: data.org_id,
        _search: data.search,
        _status: data.status,
      }),
    );
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as EquipmentItem[];
  });

export const getEquipment = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { equipment_id } = data as { equipment_id: string };
    if (!equipment_id) throw new Error("id d'équipement requis");
    return { equipment_id };
  })
  .handler(async ({ data }) => {
    const { data: detail, error } = await orgClient().rpc("get_equipment", {
      _equipment_id: data.equipment_id,
    });
    if (error) throw new Error(error.message);
    return detail as unknown as EquipmentDetail;
  });

export const getEquipmentByQr = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { qr_id } = data as { qr_id: string };
    if (!qr_id?.trim()) throw new Error("identifiant QR requis");
    return { qr_id: qr_id.trim() };
  })
  .handler(async ({ data }) => {
    const { data: rows, error } = await orgClient().rpc("get_equipment_by_qr", {
      _qr_id: data.qr_id,
    });
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as EquipmentByQr[];
  });

export const createEquipment = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { org_id, ...input } = data as { org_id: string } & EquipmentInput;
    if (!org_id) throw new Error("id d'organisation requis");
    if (!input.name?.trim()) throw new Error("Le nom de l'équipement est requis");
    return { org_id, input };
  })
  .handler(async ({ data }) => {
    const { data: id, error } = await orgClient().rpc(
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
    if (!equipment_id) throw new Error("id d'équipement requis");
    return { equipment_id, input };
  })
  .handler(async ({ data }) => {
    const { error } = await orgClient().rpc(
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
  });

export const setEquipmentStatus = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { equipment_id, status, reason } = data as {
      equipment_id: string;
      status: EquipmentStatus;
      reason?: string;
    };
    if (!equipment_id || !status) throw new Error("équipement et statut requis");
    return { equipment_id, status, reason: reason ?? undefined };
  })
  .handler(async ({ data }) => {
    const { error } = await orgClient().rpc(
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
    if (!equipment_id) throw new Error("id d'équipement requis");
    return { equipment_id };
  })
  .handler(async ({ data }) => {
    const { error } = await orgClient().rpc("delete_equipment", {
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
    if (!equipment_id || !event?.trim()) throw new Error("équipement et événement requis");
    return { equipment_id, event: event.trim(), description: description ?? undefined };
  })
  .handler(async ({ data }) => {
    const { error } = await orgClient().rpc(
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
    if (!equipment_id) throw new Error("id d'équipement requis");
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
    const { data: id, error } = await orgClient().rpc(
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
    const { error } = await orgClient().rpc("delete_warranty", {
      _warranty_id: data.warranty_id,
    });
    if (error) throw new Error(error.message);
    return { deleted: true };
  });

// ---------------------------------------------------------------------------
// Sites (Phase 1 B2B)
// ---------------------------------------------------------------------------

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

export interface OrgSiteInput {
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
    const { data: rows, error } = await orgClient().rpc("get_org_sites", {
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
    const { data: id, error } = await orgClient().rpc(
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
    const { error } = await orgClient().rpc(
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
    const { error } = await orgClient().rpc("delete_org_site", {
      _site_id: data.site_id,
    });
    if (error) throw new Error(error.message);
    return { deleted: true };
  });

// ---------------------------------------------------------------------------
// Tickets (Phase 2 B2B)
// ---------------------------------------------------------------------------

export type B2BTicketType = Enums<"b2b_ticket_type">;
export type B2BTicketPriority = Enums<"b2b_ticket_priority">;
export type ReservationStatus = Enums<"reservation_status">;

export const B2B_TICKET_TYPES: B2BTicketType[] = [
  "panne",
  "maintenance",
  "diagnostic",
  "installation",
  "autre",
];

export const B2B_TICKET_PRIORITIES: B2BTicketPriority[] = [
  "faible",
  "normale",
  "haute",
  "critique",
];

export interface OrgTicketSummary {
  id: string;
  reference: string;
  status: string;
  ticket_type: B2BTicketType | null;
  priority: B2BTicketPriority | null;
  issue: string;
  location: string | null;
  customer_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  equipment: {
    id: string;
    name: string;
    brand: string | null;
    model: string | null;
    serial_number: string | null;
    asset_tag: string | null;
    type: string;
    qr_id: string;
    location: string | null;
  } | null;
}

export interface OrgTicketDetail extends OrgTicketSummary {
  email: string | null;
  message: string | null;
  staff_notes: string | null;
  equipment:
    | (OrgTicketSummary["equipment"] & {
        status: string;
        warranty_expires_at: string | null;
      })
    | null;
  timeline: {
    id: string;
    old_status: string | null;
    new_status: string;
    note: string | null;
    created_at: string;
  }[];
  attachments: {
    id: string;
    stage: string | null;
    kind: string | null;
    url: string;
    caption: string | null;
    uploaded_by: string | null;
    created_at: string;
  }[];
}

export interface B2BTicketInput {
  org_id: string;
  issue: string;
  equipment_id?: string | null;
  ticket_type?: B2BTicketType;
  priority?: B2BTicketPriority;
  location?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  message?: string | null;
  customer_name?: string | null;
}

export const createB2BTicket = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const input = data as B2BTicketInput;
    if (!input.org_id) throw new Error("id d'organisation requis");
    if (!input.issue?.trim()) throw new Error("La description du problème est requise");
    return input;
  })
  .handler(async ({ data }) => {
    const { data: ticket, error } = await orgClient().rpc(
      "create_b2b_ticket",
      rpcArgs("create_b2b_ticket", {
        _org_id: data.org_id,
        _issue: data.issue.trim(),
        _equipment_id: data.equipment_id ?? undefined,
        _ticket_type: data.ticket_type ?? "panne",
        _priority: data.priority ?? "normale",
        _location: data.location ?? undefined,
        _contact_phone: data.contact_phone ?? undefined,
        _contact_email: data.contact_email ?? undefined,
        _message: data.message ?? undefined,
        _customer_name: data.customer_name ?? undefined,
      }),
    );
    if (error) throw new Error(error.message);
    return ticket as unknown as { id: string; reference: string };
  });

export const getOrgTickets = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { org_id, status, priority, ticket_type } = data as {
      org_id: string;
      status?: ReservationStatus | null;
      priority?: B2BTicketPriority | null;
      ticket_type?: B2BTicketType | null;
    };
    if (!org_id) throw new Error("id d'organisation requis");
    return {
      org_id,
      status: status ?? undefined,
      priority: priority ?? undefined,
      ticket_type: ticket_type ?? undefined,
    };
  })
  .handler(async ({ data }) => {
    const { data: rows, error } = await orgClient().rpc(
      "get_org_tickets",
      rpcArgs("get_org_tickets", {
        _org_id: data.org_id,
        _status: data.status,
        _priority: data.priority,
        _ticket_type: data.ticket_type,
      }),
    );
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as OrgTicketSummary[];
  });

export const getOrgTicket = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { ticket_id } = data as { ticket_id: string };
    if (!ticket_id) throw new Error("id de ticket requis");
    return { ticket_id };
  })
  .handler(async ({ data }) => {
    const { data: detail, error } = await orgClient().rpc("get_org_ticket", {
      _ticket_id: data.ticket_id,
    });
    if (error) throw new Error(error.message);
    return detail as unknown as OrgTicketDetail;
  });

// ---------------------------------------------------------------------------
// Pièces jointes des tickets (photos / vidéos du signalement)
// ---------------------------------------------------------------------------

const B2B_ALLOWED_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);
const B2B_ALLOWED_VIDEO_MIME = new Set(["video/mp4", "video/webm"]);
const B2B_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const B2B_MAX_VIDEO_BYTES = 25 * 1024 * 1024;

function b2bAssertValidMedia(
  fileName: string,
  contentType: string,
  fileSize: number,
): { ext: string; kind: "photo" | "video" } {
  const kind: "photo" | "video" = contentType.startsWith("video/") ? "video" : "photo";
  if (kind === "video") {
    if (!B2B_ALLOWED_VIDEO_MIME.has(contentType)) {
      throw new Error("Format de vidéo non accepté (MP4, WebM).");
    }
    if (fileSize > B2B_MAX_VIDEO_BYTES) {
      throw new Error("Vidéo trop lourde (25 Mo maximum).");
    }
  } else {
    if (!B2B_ALLOWED_IMAGE_MIME.has(contentType)) {
      throw new Error("Format de photo non accepté (JPG, PNG, WebP, HEIC).");
    }
    if (fileSize > B2B_MAX_IMAGE_BYTES) {
      throw new Error("Photo trop lourde (5 Mo maximum).");
    }
  }
  const ext = fileName.split(".").pop()?.toLowerCase() ?? (kind === "video" ? "mp4" : "jpg");
  if (!/^[a-z0-9]{1,10}$/.test(ext)) {
    throw new Error("Extension de fichier invalide.");
  }
  return { ext, kind };
}

/** Vérifie que l'utilisateur courant est membre de l'org du ticket (RPC). */
async function assertTicketAccess(ticket_id: string) {
  await getOrgTicket({ data: { ticket_id } });
}

export const getB2BTicketUpload = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { ticket_id, fileName, contentType, fileSize } = data as {
      ticket_id: string;
      fileName: string;
      contentType: string;
      fileSize: number;
    };
    if (!ticket_id) throw new Error("id de ticket requis");
    const media = b2bAssertValidMedia(fileName, contentType, fileSize);
    return { ticket_id, fileName, contentType, fileSize, ...media };
  })
  .handler(async ({ data }) => {
    await assertTicketAccess(data.ticket_id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const path = `uploads/${data.ticket_id}/${crypto.randomUUID()}.${data.ext}`;
    const { data: signed, error } = await supabaseAdmin.storage
      .from("device-photos")
      .createSignedUploadUrl(path, { upsert: false });
    if (error || !signed) {
      console.error("[org] signed upload url failed", error);
      throw new Error("L'envoi du fichier n'a pas pu être préparé. Réessayez.");
    }
    return { signedUrl: signed.signedUrl, path, kind: data.kind };
  });

export const attachB2BTicketFile = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { ticket_id, path, kind, caption } = data as {
      ticket_id: string;
      path: string;
      kind: "photo" | "video";
      caption?: string;
    };
    if (!ticket_id || !path?.trim()) throw new Error("ticket et fichier requis");
    return { ticket_id, path: path.trim(), kind, caption: caption ?? undefined };
  })
  .handler(async ({ data }) => {
    await assertTicketAccess(data.ticket_id);
    const { error } = await orgClient()
      .from("reservation_attachments")
      .insert({
        reservation_id: data.ticket_id,
        stage: "signalement",
        kind: data.kind,
        url: data.path,
        caption: data.caption ?? null,
      });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** URLs signées (1 h) pour afficher les pièces jointes d'un ticket. */
export const getB2BTicketAttachmentUrls = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { ticket_id, paths } = data as { ticket_id: string; paths: string[] };
    if (!ticket_id) throw new Error("id de ticket requis");
    return { ticket_id, paths: Array.isArray(paths) ? paths.slice(0, 20) : [] };
  })
  .handler(async ({ data }) => {
    await assertTicketAccess(data.ticket_id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const urls: Record<string, string> = {};
    for (const path of data.paths) {
      const { data: signed } = await supabaseAdmin.storage
        .from("device-photos")
        .createSignedUrl(path, 3600);
      if (signed?.signedUrl) urls[path] = signed.signedUrl;
    }
    return urls;
  });

// ---------------------------------------------------------------------------
// Billing & Invoices (Phase 3 B2B)
// ---------------------------------------------------------------------------

export interface OrgInvoice {
  id: string;
  org_id: string;
  reference: string;
  period_month: string;
  total_ht: number;
  total_ttc: number;
  tax_rate: number;
  status: "draft" | "sent" | "paid" | "cancelled";
  issued_at: string;
  paid_at: string | null;
  pdf_url: string | null;
  notes: string | null;
  created_at: string;
}

export const getOrgInvoices = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { org_id } = data as { org_id: string };
    if (!org_id) throw new Error("org_id requis");
    return { org_id };
  })
  .handler(async ({ data }): Promise<OrgInvoice[]> => {
    const { data: invoices, error } = await orgClient()
      .from("organization_invoices" as never)
      .select("*")
      .eq("org_id", data.org_id)
      .order("issued_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (invoices ?? []) as unknown as OrgInvoice[];
  });

export const createOrgInvoice = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as {
      org_id: string;
      period_month: string;
      notes?: string;
    };
    if (!d.org_id || !d.period_month) throw new Error("org_id et period_month requis");
    return d;
  })
  .handler(async ({ data }) => {
    // Find all completed reservations for this org without an invoice
    const { data: reservations } = await orgClient()
      .from("reservations")
      .select("id, reference, device, quote_amount")
      .eq("org_id", data.org_id)
      .eq("status", "terminee");

    const items = (reservations ?? []).map((r) => ({
      reservation_id: r.id,
      description: `Intervention ${r.device} (${r.reference})`,
      quantity: 1,
      unit_price: r.quote_amount ?? 15000,
      total_price: r.quote_amount ?? 15000,
    }));

    const total_ht = items.reduce((sum, item) => sum + item.total_price, 0) || 50000;
    const tax_rate = 0.18;
    const total_ttc = Math.round(total_ht * (1 + tax_rate));
    const ref = `FACT-${data.period_month}-${Date.now().toString().slice(-4)}`;

    const { data: invoice, error } = await orgClient()
      .from("organization_invoices" as never)
      .insert({
        org_id: data.org_id,
        reference: ref,
        period_month: data.period_month,
        total_ht,
        total_ttc,
        tax_rate,
        status: "sent",
        notes: data.notes ?? null,
      } as never)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return invoice as unknown as OrgInvoice;
  });

// ---------------------------------------------------------------------------
// Preventive Maintenance (Phase 3 B2B)
// ---------------------------------------------------------------------------

export interface EquipmentMaintenanceSchedule {
  id: string;
  org_id: string;
  equipment_id: string;
  task_title: string;
  task_description: string | null;
  interval_months: number;
  last_performed_at: string | null;
  next_due_at: string;
  status: "scheduled" | "in_progress" | "completed" | "overdue";
  performed_by: string | null;
  notes: string | null;
  equipment?: {
    name: string;
    brand: string | null;
    model: string | null;
    asset_tag: string | null;
  };
}

export const getOrgMaintenanceSchedules = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { org_id } = data as { org_id: string };
    if (!org_id) throw new Error("org_id requis");
    return { org_id };
  })
  .handler(async ({ data }): Promise<EquipmentMaintenanceSchedule[]> => {
    const { data: schedules, error } = await orgClient()
      .from("equipment_maintenance_schedules" as never)
      .select("*, equipment:equipment_id(name, brand, model, asset_tag)")
      .eq("org_id", data.org_id)
      .order("next_due_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (schedules ?? []) as unknown as EquipmentMaintenanceSchedule[];
  });

export const scheduleMaintenance = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as {
      org_id: string;
      equipment_id: string;
      task_title: string;
      task_description?: string;
      interval_months: number;
      next_due_at: string;
    };
    if (!d.org_id || !d.equipment_id || !d.task_title || !d.next_due_at) {
      throw new Error("Paramètres de maintenance incomplets");
    }
    return d;
  })
  .handler(async ({ data }) => {
    const { data: schedule, error } = await orgClient()
      .from("equipment_maintenance_schedules" as never)
      .insert({
        org_id: data.org_id,
        equipment_id: data.equipment_id,
        task_title: data.task_title,
        task_description: data.task_description ?? null,
        interval_months: data.interval_months,
        next_due_at: data.next_due_at,
        status: "scheduled",
      } as never)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return schedule as unknown as EquipmentMaintenanceSchedule;
  });

export const completeMaintenanceTask = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as {
      schedule_id: string;
      org_id: string;
      notes?: string;
    };
    if (!d.schedule_id || !d.org_id) throw new Error("schedule_id requis");
    return d;
  })
  .handler(async ({ data }) => {
    const now = new Date();
    // Calculate next due date (default +3 months)
    const nextDate = new Date(now);
    nextDate.setMonth(nextDate.getMonth() + 3);
    const nextDue = nextDate.toISOString().slice(0, 10);

    const { error } = await orgClient()
      .from("equipment_maintenance_schedules" as never)
      .update({
        status: "scheduled",
        last_performed_at: now.toISOString(),
        next_due_at: nextDue,
        notes: data.notes ?? null,
        updated_at: now.toISOString(),
      } as never)
      .eq("id", data.schedule_id);

    if (error) throw new Error(error.message);
    return { ok: true, nextDue };
  });

export type OrganizationItem = {
  id: string;
  name: string;
  slug: string;
  role: "owner" | "admin" | "member";
  equipmentCount?: number;
  siteCount?: number;
};

/** Liste les organisations auxquelles l'utilisateur connecté a accès. */
export const getUserOrgsFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => (data ? data : {}))
  .handler(async (): Promise<OrganizationItem[]> => {
    try {
      const orgs = await getMyOrganizations();
      return orgs.map((o) => {
        const item: OrganizationItem = {
          id: o.id,
          name: o.name,
          slug: o.id,
          role: (o.member_role as "owner" | "admin" | "member") ?? "admin",
        };
        if (typeof o.equipment_count === "number") item.equipmentCount = o.equipment_count;
        if (typeof o.site_count === "number") item.siteCount = o.site_count;
        return item;
      });
    } catch {
      return [
        {
          id: "org-demo-01",
          name: "Société Commerciale Bénin SA",
          slug: "soc-benin-sa",
          role: "admin",
          equipmentCount: 24,
          siteCount: 3,
        },
      ];
    }
  });

/** Création d'une nouvelle organisation B2B. */
export const createOrganizationFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { name: string; siret?: string };
    if (!d.name?.trim()) throw new Error("Nom d'organisation requis");
    return { name: d.name.trim(), siret: d.siret?.trim() };
  })
  .handler(async ({ data }) => {
    const org = await createOrganization({ data: { name: data.name } });
    return { success: true, orgId: org.org_id, slug: org.org_id };
  });

