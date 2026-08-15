// Gestion du catalogue par le personnel (marques, catégories, appareils,
// pannes, photos). Les tables catalog_* sont fermées en écriture au client
// (lecture publique uniquement) : toutes les écritures passent par les RPC
// SECURITY DEFINER catalog_* qui vérifient is_staff(auth.uid()).

import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { rateLimit } from "@/lib/security";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

const MAX_BYTES = 5 * 1024 * 1024;

const OTP_WINDOW_MS = 24 * 3600 * 1000;

export type CatalogBrand = {
  slug: string;
  name: string;
  tag: string;
  sort: number;
  active: boolean;
};

export type CatalogCategory = {
  slug: string;
  label: string;
  sort: number;
  active: boolean;
};

export type CatalogDevice = {
  slug: string;
  name: string;
  brand_slug: string;
  category_slug: string;
  series: string;
  year: number;
  sort: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type CatalogFault = {
  id: number;
  device_slug: string;
  slug: string;
  label: string;
  price: number;
  duration: string;
  warranty: string;
  part: string;
  sort: number;
};

export type CatalogPhoto = {
  id: number;
  device_slug: string;
  url: string;
  alt: string;
  sort: number;
};

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

/** Vérifie que l'appelant est membre du personnel (lecture). */
async function requireStaff(supabaseAdmin: SupabaseClient<Database>): Promise<void> {
  const userId = await currentUserId(supabaseAdmin);
  const { data: staff, error } = await supabaseAdmin.rpc("is_staff", { _user_id: userId });
  if (error || !staff) throw new Error("Action non autorisée");
}

/** Vérifie que l'appelant est membre du personnel avec une 2FA fraîche (écriture). */
async function requireStaffWithOtp(supabaseAdmin: SupabaseClient<Database>): Promise<void> {
  const userId = await currentUserId(supabaseAdmin);
  await requireFreshOtp(supabaseAdmin, userId);
  const { data: staff, error } = await supabaseAdmin.rpc("is_staff", { _user_id: userId });
  if (error || !staff) throw new Error("Action non autorisée");
}

/** Appelle un RPC catalogue (nouveaux RPC non typés dans Database). */
function catalogRpc(
  supabaseAdmin: SupabaseClient<Database>,
  fn: string,
  args: Record<string, unknown>,
): Promise<{ data: unknown; error: { message: string } | null }> {
  return supabaseAdmin.rpc(fn as never, args as never) as unknown as Promise<{
    data: unknown;
    error: { message: string } | null;
  }>;
}

const emptySchema = z.object({});

export type CatalogData = {
  categories: CatalogCategory[];
  brands: CatalogBrand[];
  devices: CatalogDevice[];
  faults: CatalogFault[];
  photos: CatalogPhoto[];
};

/**
 * Charge l'ensemble du catalogue pour l'admin (marques, catégories,
 * appareils, pannes, photos). Les photos du bucket « catalog-images » sont
 * renvoyées sous forme d'URLs signées courtes.
 */
export const listCatalog = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => emptySchema.parse(data))
  .handler(async (): Promise<CatalogData> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("catalog-read", 30))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    await requireStaff(supabaseAdmin);

    const { data: categories, error: cErr } = await supabaseAdmin
      .from("catalog_categories")
      .select("slug, label, sort, active")
      .order("sort", { ascending: true })
      .order("label", { ascending: true });
    const { data: brands, error: bErr } = await supabaseAdmin
      .from("catalog_brands")
      .select("slug, name, tag, sort, active")
      .order("sort", { ascending: true })
      .order("name", { ascending: true });
    const { data: devices, error: dErr } = await supabaseAdmin
      .from("catalog_devices")
      .select(
        "slug, name, brand_slug, category_slug, series, year, sort, active, created_at, updated_at",
      )
      .order("brand_slug", { ascending: true })
      .order("sort", { ascending: true });
    const { data: faults, error: fErr } = await supabaseAdmin
      .from("catalog_faults")
      .select("id, device_slug, slug, label, price, duration, warranty, part, sort")
      .order("device_slug", { ascending: true })
      .order("sort", { ascending: true });
    const { data: photos, error: pErr } = await supabaseAdmin
      .from("catalog_photos")
      .select("id, device_slug, url, alt, sort")
      .order("device_slug", { ascending: true })
      .order("sort", { ascending: true });

    if (cErr || bErr || dErr || fErr || pErr) {
      console.error("[catalog] list failed", { cErr, bErr, dErr, fErr, pErr });
      throw new Error("Impossible de charger le catalogue.");
    }

    const bucket = supabaseAdmin.storage.from("catalog-images");
    const signedPhotos = await Promise.all(
      (photos ?? []).map(async (photo): Promise<CatalogPhoto> => {
        if (photo.url.startsWith("http")) return photo;
        const { data: signed } = await bucket.createSignedUrl(photo.url, 7 * 24 * 3600, {
          transform: { width: 480 },
        });
        if (!signed?.signedUrl) return photo;
        return { ...photo, url: signed.signedUrl };
      }),
    );

    return {
      categories: categories ?? [],
      brands: brands ?? [],
      devices: devices ?? [],
      faults: faults ?? [],
      photos: signedPhotos,
    };
  });

const brandSchema = z.object({
  slug: z.string().trim().min(1, "Slug requis").max(80),
  name: z.string().trim().min(1, "Nom requis").max(120),
  tag: z.string().trim().max(60).optional().or(z.literal("")),
  sort: z.number().int().min(0).max(999).optional(),
  active: z.boolean().optional(),
});

/** Création ou mise à jour d'une marque (upsert sur le slug). */
export const upsertBrand = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => brandSchema.parse(data))
  .handler(async ({ data }): Promise<boolean> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("catalog-write", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    await requireStaffWithOtp(supabaseAdmin);

    const { error } = await catalogRpc(supabaseAdmin, "catalog_upsert_brand", {
      _slug: data.slug,
      _name: data.name,
      _tag: data.tag || "",
      _sort: data.sort ?? 0,
      _active: data.active ?? true,
    });
    if (error) {
      console.error("[catalog] upsert brand failed", error);
      throw new Error("Enregistrement de la marque impossible.");
    }
    return true;
  });

const categorySchema = z.object({
  slug: z.string().trim().min(1, "Slug requis").max(80),
  label: z.string().trim().min(1, "Libellé requis").max(120),
  sort: z.number().int().min(0).max(999).optional(),
  active: z.boolean().optional(),
});

/** Création ou mise à jour d'une catégorie d'appareils (upsert sur le slug). */
export const upsertCategory = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => categorySchema.parse(data))
  .handler(async ({ data }): Promise<boolean> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("catalog-write", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    await requireStaffWithOtp(supabaseAdmin);

    const { error } = await catalogRpc(supabaseAdmin, "catalog_upsert_category", {
      _slug: data.slug,
      _label: data.label,
      _sort: data.sort ?? 0,
      _active: data.active ?? true,
    });
    if (error) {
      console.error("[catalog] upsert category failed", error);
      throw new Error("Enregistrement de la catégorie impossible.");
    }
    return true;
  });

const deviceSchema = z.object({
  slug: z.string().trim().min(1, "Slug requis").max(80),
  name: z.string().trim().min(1, "Nom requis").max(160),
  brandSlug: z.string().trim().min(1, "Marque requise").max(80),
  categorySlug: z.string().trim().min(1, "Catégorie requise").max(80),
  series: z.string().trim().max(120).optional().or(z.literal("")),
  year: z.number().int().min(1990).max(2100).optional(),
  sort: z.number().int().min(0).max(999).optional(),
  active: z.boolean().optional(),
});

/** Création ou mise à jour d'un appareil (upsert sur le slug). */
export const upsertDevice = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => deviceSchema.parse(data))
  .handler(async ({ data }): Promise<boolean> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("catalog-write", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    await requireStaffWithOtp(supabaseAdmin);

    const { error } = await catalogRpc(supabaseAdmin, "catalog_upsert_device", {
      _slug: data.slug,
      _name: data.name,
      _brand_slug: data.brandSlug,
      _category_slug: data.categorySlug,
      _series: data.series || "",
      _year: data.year ?? 0,
      _sort: data.sort ?? 0,
      _active: data.active ?? true,
    });
    if (error) {
      console.error("[catalog] upsert device failed", error);
      throw new Error("Enregistrement de l'appareil impossible.");
    }
    return true;
  });

const faultSchema = z.object({
  id: z.number().int().positive().optional().nullable(),
  deviceSlug: z.string().trim().min(1, "Appareil requis").max(80),
  slug: z.string().trim().min(1, "Slug requis").max(80),
  label: z.string().trim().min(1, "Libellé requis").max(200),
  price: z.number().int().min(0).max(100_000_000).optional(),
  duration: z.string().trim().max(60).optional().or(z.literal("")),
  warranty: z.string().trim().max(120).optional().or(z.literal("")),
  part: z.string().trim().max(120).optional().or(z.literal("")),
  sort: z.number().int().min(0).max(999).optional(),
});

/** Création ou mise à jour d'une panne d'un appareil (id ou slug). */
export const upsertFault = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => faultSchema.parse(data))
  .handler(async ({ data }): Promise<boolean> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("catalog-write", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    await requireStaffWithOtp(supabaseAdmin);

    const { error } = await catalogRpc(supabaseAdmin, "catalog_upsert_fault", {
      _id: data.id ?? null,
      _device_slug: data.deviceSlug,
      _slug: data.slug,
      _label: data.label,
      _price: data.price ?? 0,
      _duration: data.duration || "",
      _warranty: data.warranty || "",
      _part: data.part || "",
      _sort: data.sort ?? 0,
    });
    if (error) {
      console.error("[catalog] upsert fault failed", error);
      throw new Error("Enregistrement de la panne impossible.");
    }
    return true;
  });

const slugSchema = z.object({
  slug: z.string().trim().min(1, "Slug requis").max(80),
});

/** Suppression d'un appareil (cascade pannes + photos). */
export const deleteDevice = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => slugSchema.parse(data))
  .handler(async ({ data }): Promise<boolean> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("catalog-write", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    await requireStaffWithOtp(supabaseAdmin);

    const { error } = await catalogRpc(supabaseAdmin, "catalog_delete_device", {
      _slug: data.slug,
    });
    if (error) {
      console.error("[catalog] delete device failed", error);
      throw new Error("Suppression de l'appareil impossible.");
    }
    return true;
  });

/** Suppression d'une marque (cascade appareils + pannes + photos). */
export const deleteBrand = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => slugSchema.parse(data))
  .handler(async ({ data }): Promise<boolean> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("catalog-write", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    await requireStaffWithOtp(supabaseAdmin);

    const { error } = await catalogRpc(supabaseAdmin, "catalog_delete_brand", {
      _slug: data.slug,
    });
    if (error) {
      console.error("[catalog] delete brand failed", error);
      throw new Error("Suppression de la marque impossible.");
    }
    return true;
  });

/** Suppression d'une catégorie (cascade appareils + pannes + photos). */
export const deleteCategory = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => slugSchema.parse(data))
  .handler(async ({ data }): Promise<boolean> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("catalog-write", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    await requireStaffWithOtp(supabaseAdmin);

    const { error } = await catalogRpc(supabaseAdmin, "catalog_delete_category", {
      _slug: data.slug,
    });
    if (error) {
      console.error("[catalog] delete category failed", error);
      throw new Error("Suppression de la catégorie impossible.");
    }
    return true;
  });

const faultIdSchema = z.object({
  id: z.number().int().positive(),
});

/** Suppression d'une panne. */
export const deleteFault = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => faultIdSchema.parse(data))
  .handler(async ({ data }): Promise<boolean> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("catalog-write", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    await requireStaffWithOtp(supabaseAdmin);

    const { error } = await catalogRpc(supabaseAdmin, "catalog_delete_fault", {
      _id: data.id,
    });
    if (error) {
      console.error("[catalog] delete fault failed", error);
      throw new Error("Suppression de la panne impossible.");
    }
    return true;
  });

const photoSchema = z.object({
  deviceSlug: z.string().trim().min(1, "Appareil requis").max(80),
  url: z.string().trim().min(1, "URL requise").max(500),
  alt: z.string().trim().max(200).optional().or(z.literal("")),
  sort: z.number().int().min(0).max(999).optional(),
});

/** Ajoute une photo (URL) au catalogue d'un appareil. */
export const addCatalogPhoto = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => photoSchema.parse(data))
  .handler(async ({ data }): Promise<boolean> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("catalog-write", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    await requireStaffWithOtp(supabaseAdmin);

    const { error } = await catalogRpc(supabaseAdmin, "catalog_add_photo", {
      _device_slug: data.deviceSlug,
      _url: data.url,
      _alt: data.alt || "",
      _sort: data.sort ?? 0,
    });
    if (error) {
      console.error("[catalog] add photo failed", error);
      throw new Error("Ajout de la photo impossible.");
    }
    return true;
  });

const photoIdSchema = z.object({
  id: z.number().int().positive(),
});

/** Supprime une photo du catalogue d'un appareil. */
export const deleteCatalogPhoto = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => photoIdSchema.parse(data))
  .handler(async ({ data }): Promise<boolean> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("catalog-write", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    await requireStaffWithOtp(supabaseAdmin);

    const { error } = await catalogRpc(supabaseAdmin, "catalog_delete_photo", {
      _id: data.id,
    });
    if (error) {
      console.error("[catalog] delete photo failed", error);
      throw new Error("Suppression de la photo impossible.");
    }
    return true;
  });

const uploadSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  contentType: z.string().trim().min(1).max(80),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(MAX_BYTES + 1),
});

/**
 * Prépare l'upload d'une photo d'appareil par l'atelier : vérifie la 2FA,
 * le type MIME et la taille, puis renvoie une URL de téléversement signée
 * (bucket privé « catalog-images ») + le chemin stocké à rattacher ensuite
 * via addCatalogPhoto.
 */
export const getCatalogUpload = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => uploadSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("catalog-upload", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    await requireStaffWithOtp(supabaseAdmin);

    if (!ALLOWED_MIME.has(data.contentType)) {
      throw new Error("Format de photo non accepté (JPG, PNG, WebP, HEIC).");
    }
    if (data.fileSize > MAX_BYTES) {
      throw new Error("Photo trop lourde (5 Mo maximum).");
    }
    const ext = data.fileName.split(".").pop()?.toLowerCase() ?? "jpg";
    if (!/^[a-z0-9]{1,10}$/.test(ext)) {
      throw new Error("Extension de fichier invalide.");
    }

    const path = `catalog-images/${crypto.randomUUID()}.${ext}`;

    const { data: signed, error } = await supabaseAdmin.storage
      .from("catalog-images")
      .createSignedUploadUrl(path, { upsert: false });

    if (error || !signed) {
      console.error("[catalog] signed upload url failed", error);
      throw new Error("L'envoi de la photo n'a pas pu être préparé. Réessayez.");
    }

    return { signedUrl: signed.signedUrl, path, token: signed.token };
  });
