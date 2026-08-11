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
    return { org_id, search: search?.trim() || null, status: status ?? null };
  })
  .handler(async ({ data }) => {
    const { data: rows, error } = await orgClient().rpc("get_org_equipment", {
      _org_id: data.org_id,
      _search: data.search,
      _status: data.status,
    });
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
    const { data: id, error } = await orgClient().rpc("create_equipment", {
      _org_id: data.org_id,
      _name: data.input.name.trim(),
      _type: data.input.type ?? "autre",
      _brand: data.input.brand ?? null,
      _model: data.input.model ?? null,
      _serial_number: data.input.serial_number ?? null,
      _asset_tag: data.input.asset_tag ?? null,
      _site_id: data.input.site_id ?? null,
      _purchase_date: data.input.purchase_date ?? null,
      _warranty_expires_at: data.input.warranty_expires_at ?? null,
      _assigned_to: data.input.assigned_to ?? null,
      _location: data.input.location ?? null,
      _notes: data.input.notes ?? null,
    });
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
    const { error } = await orgClient().rpc("update_equipment", {
      _equipment_id: data.equipment_id,
      _name: data.input.name ?? null,
      _type: data.input.type ?? null,
      _brand: data.input.brand ?? null,
      _model: data.input.model ?? null,
      _serial_number: data.input.serial_number ?? null,
      _asset_tag: data.input.asset_tag ?? null,
      _site_id: data.input.site_id ?? null,
      _purchase_date: data.input.purchase_date ?? null,
      _warranty_expires_at: data.input.warranty_expires_at ?? null,
      _assigned_to: data.input.assigned_to ?? null,
      _location: data.input.location ?? null,
      _notes: data.input.notes ?? null,
    });
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
    return { equipment_id, status, reason: reason ?? null };
  })
  .handler(async ({ data }) => {
    const { error } = await orgClient().rpc("set_equipment_status", {
      _equipment_id: data.equipment_id,
      _status: data.status,
      _reason: data.reason,
    });
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
    return { equipment_id, event: event.trim(), description: description ?? null };
  })
  .handler(async ({ data }) => {
    const { error } = await orgClient().rpc("add_equipment_history", {
      _equipment_id: data.equipment_id,
      _event: data.event,
      _description: data.description,
    });
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
      warranty_id: warranty_id ?? null,
      provider: provider ?? null,
      start_date: start_date ?? null,
      end_date: end_date ?? null,
      coverage: coverage ?? null,
    };
  })
  .handler(async ({ data }) => {
    const { data: id, error } = await orgClient().rpc("upsert_warranty", {
      _equipment_id: data.equipment_id,
      _warranty_id: data.warranty_id,
      _provider: data.provider,
      _start_date: data.start_date,
      _end_date: data.end_date,
      _coverage: data.coverage,
    });
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
    const { data: id, error } = await orgClient().rpc("create_org_site", {
      _org_id: data.org_id,
      _name: data.input.name.trim(),
      _address: data.input.address ?? null,
      _city: data.input.city ?? "Cotonou",
      _phone: data.input.phone ?? "",
      _email: data.input.email ?? null,
      _manager: data.input.manager ?? null,
      _departments: data.input.departments ?? null,
    });
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
    const { error } = await orgClient().rpc("update_org_site", {
      _site_id: data.site_id,
      _name: data.input.name ?? null,
      _address: data.input.address ?? null,
      _city: data.input.city ?? null,
      _phone: data.input.phone ?? null,
      _email: data.input.email ?? null,
      _manager: data.input.manager ?? null,
      _departments: data.input.departments ?? null,
      _active: data.input.active ?? null,
    });
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
  equipment: OrgTicketSummary["equipment"] & {
    status: string;
    warranty_expires_at: string | null;
  } | null;
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
    const { data: ticket, error } = await orgClient().rpc("create_b2b_ticket", {
      _org_id: data.org_id,
      _issue: data.issue.trim(),
      _equipment_id: data.equipment_id ?? null,
      _ticket_type: data.ticket_type ?? "panne",
      _priority: data.priority ?? "normale",
      _location: data.location ?? null,
      _contact_phone: data.contact_phone ?? null,
      _contact_email: data.contact_email ?? null,
      _message: data.message ?? null,
      _customer_name: data.customer_name ?? null,
    });
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
    return { org_id, status: status ?? null, priority: priority ?? null, ticket_type: ticket_type ?? null };
  })
  .handler(async ({ data }) => {
    const { data: rows, error } = await orgClient().rpc("get_org_tickets", {
      _org_id: data.org_id,
      _status: data.status,
      _priority: data.priority,
      _ticket_type: data.ticket_type,
    });
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
