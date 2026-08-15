import { createServerFn } from "@tanstack/react-start";
import type { Enums } from "@/integrations/supabase/types";
import { orgClient, rpcArgs } from "./org-client";

export type B2BTicketType = Enums<"b2b_ticket_type">;
export type B2BTicketPriority = Enums<"b2b_ticket_priority">;
type ReservationStatus = Enums<"reservation_status">;

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
  ticket_type: B2BTicketType | null;
  priority: B2BTicketPriority | null;
  status: ReservationStatus;
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

interface B2BTicketInput {
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
    if (!input.issue?.trim()) throw new Error("La description du problÃƒÂ¨me est requise");
    return input;
  })
  .handler(async ({ data }) => {
    const client = await orgClient();
    const { data: ticket, error } = await client.rpc(
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
    const client = await orgClient();
    const { data: rows, error } = await client.rpc(
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
    const client = await orgClient();
    const { data: detail, error } = await client.rpc("get_org_ticket", {
      _ticket_id: data.ticket_id,
    });
    if (error || !detail) throw new Error(error?.message ?? "Ticket non trouvÃƒÂ©");
    return detail as unknown as OrgTicketDetail;
  });

// ---------------------------------------------------------------------------
// PiÃƒÂ¨ces jointes des tickets
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
      throw new Error("Format de vidÃƒÂ©o non acceptÃƒÂ© (MP4, WebM).");
    }
    if (fileSize > B2B_MAX_VIDEO_BYTES) {
      throw new Error("VidÃƒÂ©o trop lourde (25 Mo maximum).");
    }
  } else {
    if (!B2B_ALLOWED_IMAGE_MIME.has(contentType)) {
      throw new Error("Format de photo non acceptÃƒÂ© (JPG, PNG, WebP, HEIC).");
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
    if (!ticket_id || !fileName || !contentType || !fileSize) {
      throw new Error("ParamÃƒÂ¨tres de fichier incomplets");
    }
    const { ext, kind } = b2bAssertValidMedia(fileName, contentType, fileSize);
    return { ticket_id, ext, kind };
  })
  .handler(async ({ data }) => {
    await assertTicketAccess(data.ticket_id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = crypto.randomUUID();
    const path = `b2b-tickets/${data.ticket_id}/${id}.${data.ext}`;
    const { data: signed, error } = await supabaseAdmin.storage
      .from("device-photos")
      .createSignedUploadUrl(path, { upsert: false });
    if (error || !signed) {
      console.error("[org] signed upload url failed", error);
      throw new Error("L'envoi du fichier n'a pas pu ÃƒÂªtre prÃƒÂ©parÃƒÂ©. RÃƒÂ©essayez.");
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
    const client = await orgClient();
    const { error } = await client.from("reservation_attachments").insert({
      reservation_id: data.ticket_id,
      stage: "signalement",
      kind: data.kind,
      url: data.path,
      caption: data.caption ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

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
