import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { rateLimit, verifyTrackingCode } from "@/lib/security";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

const MAX_BYTES = 5 * 1024 * 1024;

const photoUploadSchema = z.object({
  reference: z.string().trim().min(1, "Référence requise").max(20),
  code: z.string().trim().min(1, "Code de suivi requis").max(20),
  fileName: z.string().trim().min(1).max(200),
  contentType: z.string().trim().min(1).max(80),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(MAX_BYTES + 1),
});

/**
 * Prépare l'upload d'une photo d'appareil : vérifie le code de suivi (preuve de
 * propriété du dossier), le type MIME et la taille, puis renvoie une URL de
 * téléversement signée (bucket privé) + le chemin stocké.
 * Le client PUT la photo directement sur l'URL signée.
 */
export const getDevicePhotoUpload = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => photoUploadSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!rateLimit("photo-upload", 10)) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    if (!ALLOWED_MIME.has(data.contentType)) {
      throw new Error("Format de photo non accepté (JPG, PNG, WebP, HEIC).");
    }
    if (data.fileSize > MAX_BYTES) {
      throw new Error("Photo trop lourde (5 Mo maximum).");
    }

    const { data: row } = await supabaseAdmin
      .from("reservations")
      .select("tracking_code_hash")
      .eq("reference", data.reference)
      .maybeSingle();

    if (!row || !(await verifyTrackingCode(data.code, row.tracking_code_hash))) {
      throw new Error("Code de suivi invalide. Vérifiez le code reçu à la réservation.");
    }

    const ext = data.fileName.split(".").pop()?.toLowerCase() ?? "jpg";
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
