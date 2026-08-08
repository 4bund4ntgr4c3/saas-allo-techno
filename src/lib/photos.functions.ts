import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { rateLimit, verifyTrackingCode } from "@/lib/security";

const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
const ALLOWED_VIDEO_MIME = new Set(["video/mp4", "video/webm"]);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

const STAGES = ["diagnostic", "pieces", "since", "live", "repair"] as const;
export type AttachmentStage = (typeof STAGES)[number];

const OTP_WINDOW_MS = 24 * 3600 * 1000;

async function currentUserId(supabaseAdmin: SupabaseClient<Database>): Promise<string> {
  const authHeader = getRequestHeader("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  let userId: string | null = null;
  if (token) {
    const { data: claimsData } = await supabaseAdmin.auth.getClaims(token);
    const sub = claimsData?.claims?.sub;
    userId = typeof sub === "string" ? sub : null;
  }
  if (!userId) throw new Error("Non authentifié");
  return userId;
}

/** Exige une double authentification fraîche (< 24 h) pour les opérations staff. */
async function requireFreshOtp(supabaseAdmin: SupabaseClient<Database>, userId: string) {
  const { data: otp } = await supabaseAdmin
    .from("admin_otp")
    .select("enabled, verified_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (!otp?.enabled) return;
  const verifiedAt = otp.verified_at ? new Date(otp.verified_at).getTime() : 0;
  if (Date.now() - verifiedAt > OTP_WINDOW_MS) {
    throw new Error("Sécurité : confirmez votre code d'authentification pour continuer.");
  }
}

async function requireStaffWithOtp(supabaseAdmin: SupabaseClient<Database>): Promise<string> {
  const userId = await currentUserId(supabaseAdmin);
  await requireFreshOtp(supabaseAdmin, userId);
  const { data: staff, error } = await supabaseAdmin.rpc("is_staff", { _user_id: userId });
  if (error || !staff) throw new Error("Action non autorisée");
  return userId;
}

function assertValidImage(fileName: string, contentType: string, fileSize: number) {
  if (!ALLOWED_IMAGE_MIME.has(contentType)) {
    throw new Error("Format de photo non accepté (JPG, PNG, WebP, HEIC).");
  }
  if (fileSize > MAX_IMAGE_BYTES) {
    throw new Error("Photo trop lourde (5 Mo maximum).");
  }
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "jpg";
  if (!/^[a-z0-9]{1,10}$/.test(ext)) {
    throw new Error("Extension de fichier invalide.");
  }
  return ext;
}

/** Valide une photo OU une vidéo ; renvoie le type de média déduit du MIME. */
function assertValidMedia(fileName: string, contentType: string, fileSize: number) {
  const kind: "photo" | "video" = contentType.startsWith("video/") ? "video" : "photo";
  if (kind === "video") {
    if (!ALLOWED_VIDEO_MIME.has(contentType)) {
      throw new Error("Format de vidéo non accepté (MP4, WebM).");
    }
    if (fileSize > MAX_VIDEO_BYTES) {
      throw new Error("Vidéo trop lourde (25 Mo maximum).");
    }
  } else {
    if (!ALLOWED_IMAGE_MIME.has(contentType)) {
      throw new Error("Format de photo non accepté (JPG, PNG, WebP, HEIC).");
    }
    if (fileSize > MAX_IMAGE_BYTES) {
      throw new Error("Photo trop lourde (5 Mo maximum).");
    }
  }
  const ext = fileName.split(".").pop()?.toLowerCase() ?? (kind === "video" ? "mp4" : "jpg");
  if (!/^[a-z0-9]{1,10}$/.test(ext)) {
    throw new Error("Extension de fichier invalide.");
  }
  return { ext, kind };
}

const photoUploadSchema = z.object({
  reference: z.string().trim().min(1, "Référence requise").max(20),
  code: z.string().trim().min(1, "Code de suivi requis").max(20),
  fileName: z.string().trim().min(1).max(200),
  contentType: z.string().trim().min(1).max(80),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(MAX_VIDEO_BYTES + 1),
  kind: z.enum(["photo", "video"]).optional(),
  stage: z.string().trim().max(60).optional(),
});

/**
 * Prépare l'upload d'une photo OU d'une vidéo d'appareil : vérifie le code de
 * suivi (preuve de propriété du dossier), le type MIME et la taille, puis
 * renvoie une URL de téléversement signée (bucket privé) + le chemin stocké.
 * Le client PUT le fichier directement sur l'URL signée.
 */
export const getDevicePhotoUpload = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => photoUploadSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!rateLimit("photo-upload", 10)) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const kind = data.kind ?? (data.contentType.startsWith("video/") ? "video" : "photo");
    assertValidMedia(data.fileName, data.contentType, data.fileSize);

    const { data: row } = await supabaseAdmin
      .from("reservations")
      .select("tracking_code_hash")
      .eq("reference", data.reference)
      .maybeSingle();

    if (!row || !(await verifyTrackingCode(data.code, row.tracking_code_hash))) {
      throw new Error("Code de suivi invalide. Vérifiez le code reçu à la réservation.");
    }

    const ext = data.fileName.split(".").pop()?.toLowerCase() ?? (kind === "video" ? "mp4" : "jpg");
    const path = `uploads/${data.reference}/${crypto.randomUUID()}.${ext}`;

    const { data: signed, error } = await supabaseAdmin.storage
      .from("device-photos")
      .createSignedUploadUrl(path, { upsert: false });

    if (error || !signed) {
      console.error("[photos] signed upload url failed", error);
      throw new Error("L'envoi de la photo n'a pas pu être préparé. Réessayez.");
    }

    return { signedUrl: signed.signedUrl, path, token: signed.token };
  });

const staffPhotoUploadSchema = z.object({
  reservationId: z.string().uuid(),
  stage: z.enum(STAGES),
  fileName: z.string().trim().min(1).max(200),
  contentType: z.string().trim().min(1).max(80),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(MAX_IMAGE_BYTES + 1),
});

/**
 * Prépare l'upload d'une photo de suivi par l'atelier, pour une étape donnée
 * (diagnostic, pièces, réparation). L'appelant doit être staff avec une double
 * authentification fraîche. Renvoie une URL signée + le chemin stocké.
 */
export const getStaffPhotoUpload = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => staffPhotoUploadSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!rateLimit("staff-photo-upload", 20)) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    await requireStaffWithOtp(supabaseAdmin);

    const ext = assertValidImage(data.fileName, data.contentType, data.fileSize);

    const path = `uploads/${data.reservationId}/${data.stage}/${crypto.randomUUID()}.${ext}`;

    const { data: signed, error } = await supabaseAdmin.storage
      .from("device-photos")
      .createSignedUploadUrl(path, { upsert: false });

    if (error || !signed) {
      console.error("[photos] staff signed upload url failed", error);
      throw new Error("L'envoi de la photo n'a pas pu être préparé. Réessayez.");
    }

    return { signedUrl: signed.signedUrl, path, token: signed.token };
  });

const addStagePhotoSchema = z.object({
  reservationId: z.string().uuid(),
  stage: z.enum(STAGES),
  url: z.string().trim().min(1).max(500),
  caption: z.string().trim().max(300).optional(),
});

/**
 * Enregistre une photo de suivi (une fois l'upload via l'URL signée terminé)
 * dans reservation_attachments, rattachée à l'étape correspondante.
 */
export const addStagePhoto = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => addStagePhotoSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!rateLimit("staff-add-photo", 20)) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const userId = await requireStaffWithOtp(supabaseAdmin);

    const { error } = await supabaseAdmin.from("reservation_attachments").insert({
      reservation_id: data.reservationId,
      stage: data.stage,
      kind: "photo",
      url: data.url,
      ...(data.caption ? { caption: data.caption } : {}),
      uploaded_by: userId,
    });
    if (error) {
      console.error("[photos] add stage photo failed", error);
      throw new Error("La photo n'a pas pu être rattachée au dossier.");
    }

    const { data: row } = await supabaseAdmin
      .from("reservations")
      .select("reference, customer_name, email, phone, device")
      .eq("id", data.reservationId)
      .maybeSingle();

    if (row) {
      const { notifyPhotoAdded } = await import("@/lib/notifications");
      void notifyPhotoAdded({ ...row, stage: data.stage });
    }

    return { ok: true };
  });

const registerAttachmentSchema = z.object({
  reference: z.string().trim().min(1, "Référence requise").max(20),
  code: z.string().trim().min(1, "Code de suivi requis").max(20),
  url: z.string().trim().min(1, "Chemin du fichier requis").max(500),
  kind: z.enum(["photo", "video"]).optional(),
  stage: z.string().trim().max(60).optional(),
  caption: z.string().trim().max(300).optional(),
});

/**
 * Rattache une pièce jointe (photo ou vidéo) au dossier, une fois l'upload via
 * l'URL signée terminé. Vérifie le code de suivi secret (preuve de propriété).
 */
export const registerDeviceAttachment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => registerAttachmentSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!rateLimit("register-attachment", 30)) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const { data: row, error } = await supabaseAdmin
      .from("reservations")
      .select("id, tracking_code_hash")
      .eq("reference", data.reference)
      .maybeSingle();

    if (error || !row || !(await verifyTrackingCode(data.code, row.tracking_code_hash))) {
      throw new Error("Code de suivi invalide. Vérifiez le code reçu à la réservation.");
    }

    const { error: insertError } = await supabaseAdmin.from("reservation_attachments").insert({
      reservation_id: row.id,
      stage: data.stage ?? "appareil",
      kind: data.kind ?? "photo",
      url: data.url,
      ...(data.caption ? { caption: data.caption } : {}),
    });
    if (insertError) {
      console.error("[photos] register attachment failed", insertError);
      throw new Error("La pièce jointe n'a pas pu être enregistrée. Réessayez.");
    }

    return { ok: true };
  });

const attachmentsLookupSchema = z.object({
  reference: z.string().trim().min(1, "Référence requise"),
  code: z.string().trim().min(1, "Code de suivi requis").max(20),
});

export type ReservationAttachment = {
  url: string;
  stage: string;
  kind: "photo" | "video";
  caption: string | null;
  created_at: string;
};

/**
 * Photos / vidéos de suivi du dossier (publiques) : vérifie le code de suivi
 * secret puis renvoie les pièces jointes de chaque étape sous forme d'URLs
 * publiques servables.
 */
export const getReservationAttachments = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => attachmentsLookupSchema.parse(data))
  .handler(
    async ({
      data,
    }): Promise<{ found: true; attachments: ReservationAttachment[] } | { found: false }> => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      if (!rateLimit("suivi-photos", 30)) {
        throw new Error("Trop de demandes. Réessayez dans une minute.");
      }

      const { data: row, error } = await supabaseAdmin
        .from("reservations")
        .select("id, tracking_code_hash")
        .eq("reference", data.reference)
        .maybeSingle();

      if (error) {
        console.error("[photos] reservations lookup failed", error);
        throw new Error("Impossible de vérifier ce dossier. Réessayez plus tard.");
      }
      if (!row || !(await verifyTrackingCode(data.code, row.tracking_code_hash))) {
        return { found: false };
      }

      const { data: attachments, error: attachError } = await supabaseAdmin
        .from("reservation_attachments")
        .select("url, stage, kind, caption, created_at")
        .eq("reservation_id", row.id)
        .order("created_at", { ascending: true });

      if (attachError) {
        console.error("[photos] attachments fetch failed", attachError);
        return { found: false };
      }

      const bucket = supabaseAdmin.storage.from("device-photos");
      const photoList: ReservationAttachment[] = [];
      for (const a of attachments ?? []) {
        const { data: signed, error: signError } = await bucket.createSignedUrl(
          a.url,
          30 * 24 * 3600,
        );
        if (signError || !signed?.signedUrl) continue;
        photoList.push({
          url: signed.signedUrl,
          stage: a.stage,
          kind: a.kind === "video" ? "video" : "photo",
          caption: a.caption,
          created_at: a.created_at,
        });
      }

      return { found: true, attachments: photoList };
    },
  );
