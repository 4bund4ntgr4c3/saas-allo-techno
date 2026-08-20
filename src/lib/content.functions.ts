import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { isStaff } from "@/lib/rbac";
import { rateLimit } from "@/lib/security";

// ---------------------------------------------------------------------------
// Modèles
// ---------------------------------------------------------------------------

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readingTime: string;
  body: string[];
  locale?: string;
};

export type ReviewInput = {
  name: string;
  city: string;
  rating: number;
  text: string;
  device: string;
};

// ---------------------------------------------------------------------------
// Schémas de validation
// ---------------------------------------------------------------------------

const postSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Slug requis")
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Slug invalide (minuscules, chiffres, tirets)"),
  title: z.string().trim().min(3, "Titre trop court").max(200),
  excerpt: z.string().trim().min(3, "Résumé trop court").max(500),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide"),
  category: z.string().trim().min(2).max(80),
  readingTime: z.string().trim().min(2).max(20),
  locale: z.string().trim().max(5).optional().or(z.literal("")).default("fr"),
  body: z.array(z.string().trim().min(1)).min(1, "Ajoutez au moins un paragraphe"),
});

const reviewSchema = z.object({
  id: z.string().uuid().optional(),
  customer_name: z.string().trim().min(2, "Nom requis").max(80),
  phone: z.string().trim().min(6, "Téléphone requis").max(30),
  email: z.string().email().optional().or(z.literal("")),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(3, "Avis trop court").max(2000),
  status: z.enum(["pending", "published", "hidden"]).optional(),
  verified: z.boolean().optional(),
});

const inventorySchema = z.object({
  slug: z.string().trim().min(1),
  quantity: z.number().int().min(0),
});

/**
 * Nettoie un paragraphe de blog : supprime les balises/attributs dangereux,
 * échappe tout le reste, puis restaure uniquement une liste blanche de balises
 * sûres. S'exécute côté serveur pour neutraliser d'éventuels contenus
 * historiques non filtrés.
 */
/**
 * Nettoie un paragraphe de blog de manière sécurisée en appliquant
 * une liste blanche stricte de balises autorisées et en désactivant tout vecteur XSS.
 */
const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "h2",
  "h3",
  "h4",
  "blockquote",
  "code",
  "pre",
  "hr",
  "a",
]);

function sanitizeBlogParagraph(par: string): string {
  if (!par || typeof par !== "string") return "";

  // 1. Supprimer complètement les balises actives et dangereuses
  let sanitized = par
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/<link\b[^>]*>/gi, "")
    .replace(/<meta\b[^>]*>/gi, "");

  // 2. Nettoyer les balises HTML et filtrer les attributs
  sanitized = sanitized.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (match, tagRaw, attrsRaw) => {
    const tag = tagRaw.toLowerCase();
    const isClosing = match.startsWith("</");

    if (!ALLOWED_TAGS.has(tag)) {
      return ""; // Balise non autorisée -> supprimée
    }

    if (isClosing) {
      return `</${tag}>`;
    }

    // Pour les balises orphelines / d'ouverture
    if (tag === "br" || tag === "hr") {
      return `<${tag} />`;
    }

    // Gestion spécifique des liens <a>
    if (tag === "a") {
      const hrefMatch = attrsRaw.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const rawUrl = hrefMatch ? hrefMatch[1] || hrefMatch[2] || hrefMatch[3] || "" : "";

      // Valider que l'URL commence par http://, https:// ou mailto:
      if (/^(?:https?:\/\/|mailto:)/i.test(rawUrl.trim())) {
        const safeUrl = rawUrl.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
        return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">`;
      }
      return `<a>`;
    }

    return `<${tag}>`;
  });

  return sanitized;
}

function rowToPost(row: {
  body: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  reading_time: string;
}): BlogPost {
  let body: string[] = [];
  try {
    const parsed: unknown = JSON.parse(row.body);
    if (Array.isArray(parsed)) {
      body = parsed.filter((p): p is string => typeof p === "string").map(sanitizeBlogParagraph);
    }
  } catch {
    body = [];
  }
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    date: row.date,
    category: row.category,
    readingTime: row.reading_time,
    body,
  };
}

// ---------------------------------------------------------------------------
// Lecture publique (retourne la table si remplie, sinon les données statiques).
// ---------------------------------------------------------------------------

type BlogPostRow = {
  body: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  reading_time: string;
  locale: string;
};

type ReviewRow = {
  id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  rating: number;
  comment: string;
  status: string;
  verified: boolean;
  created_at: string;
};

/** Renvoie les articles de blog d'une langue donnée : ceux de la table si présents,
 * sinon la liste statique fournie (repli sur le français). Si aucune langue n'est
 * fournie, on la détecte côté serveur depuis l'en-tête Accept-Language. */
export const listBlogPosts = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    z
      .object({
        fallback: z.array(z.any()).optional(),
        locale: z.string().trim().max(5).optional().or(z.literal("")),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    if (!(await rateLimit("list-blog-posts", 60))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    let locale = data.locale && data.locale !== "" ? data.locale : "fr";
    if (locale === "fr") {
      try {
        const header = getRequestHeader("accept-language");
        if (header && /(^|,)\s*en\b/i.test(header.replace(/q=[^,;]*/gi, ""))) locale = "en";
      } catch {
        /* contexte client */
      }
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("blog_posts")
      .select("body, slug, title, excerpt, date, category, reading_time, locale")
      .eq("locale", locale)
      .order("date", { ascending: false })
      .limit(100);
    if (error || !rows || rows.length === 0) return data.fallback ?? [];
    return (rows as BlogPostRow[]).map(rowToPost);
  });

/** Renvoie les avis : ceux de la table si présents, sinon ceux statiques fournis. */
export const listReviews = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ fallback: z.array(z.any()).optional() }).parse(data))
  .handler(async ({ data }) => {
    if (!(await rateLimit("list-reviews", 60))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("reviews")
      .select("id, customer_name, phone, email, rating, comment, status, verified, created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error || !rows || rows.length === 0) return data.fallback ?? [];
    return (rows as ReviewRow[]).map((r) => ({
      name: r.customer_name,
      city: "",
      rating: r.rating,
      text: r.comment,
      device: "",
    }));
  });

// ---------------------------------------------------------------------------
// Écriture — réservée au personnel, vérifiée côté serveur.
// ---------------------------------------------------------------------------

const adminBlogRowSchema = z.object({
  slug: z.string().trim().min(1),
  locale: z.string().trim().max(5).optional(),
});

export type AdminBlogRow = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  reading_time: string;
  body: string;
  locale: string;
};

export type AdminReviewRow = {
  id: string;
  customer_name: string;
  phone: string | null;
  email: string | null;
  rating: number;
  comment: string | null;
  status: string;
  verified: boolean;
  created_at: string;
};

/** Articles de blog pour l'admin (bruts, par langue) — lecture côté serveur. */
export const getAdminBlogPosts = createServerFn({ method: "POST" })
  .validator((data: unknown) => adminBlogRowSchema.partial().parse(data ?? {}))
  .handler(async ({ data }): Promise<AdminBlogRow[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await isStaff(supabaseAdmin))) throw new Error("Action non autorisée");
    if (!(await rateLimit("admin-content", 15)))
      throw new Error("Trop de demandes. Réessayez dans une minute.");

    let query = supabaseAdmin
      .from("blog_posts")
      .select("slug, title, excerpt, date, category, reading_time, body, locale");
    if (data.locale) query = query.eq("locale", data.locale);
    const { data: rows, error } = await query.order("date", { ascending: false });
    if (error) throw new Error("Impossible de charger les articles.");
    return (rows ?? []) as AdminBlogRow[];
  });

/** Article de blog unique (utilisé pour la duplication inter-langues). */
export const getAdminBlogPost = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ slug: z.string().trim().min(1), locale: z.string().trim().max(5) }).parse(data),
  )
  .handler(async ({ data }): Promise<AdminBlogRow | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await isStaff(supabaseAdmin))) throw new Error("Action non autorisée");
    if (!(await rateLimit("admin-content", 15)))
      throw new Error("Trop de demandes. Réessayez dans une minute.");

    const { data: row, error } = await supabaseAdmin
      .from("blog_posts")
      .select("slug, title, excerpt, date, category, reading_time, body, locale")
      .eq("slug", data.slug)
      .eq("locale", data.locale)
      .maybeSingle();
    if (error) throw new Error("Impossible de charger l'article.");
    return (row as AdminBlogRow | null) ?? null;
  });

/** Avis clients pour l'admin (PII phone/email lue côté serveur uniquement). */
export const getAdminReviews = createServerFn({ method: "POST" }).handler(
  async (): Promise<AdminReviewRow[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await isStaff(supabaseAdmin))) throw new Error("Action non autorisée");
    if (!(await rateLimit("admin-content", 15)))
      throw new Error("Trop de demandes. Réessayez dans une minute.");

    const { data, error } = await supabaseAdmin
      .from("reviews")
      .select("id, customer_name, phone, email, rating, comment, status, verified, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error("Impossible de charger les avis.");
    return (data ?? []) as AdminReviewRow[];
  },
);

export const upsertBlogPost = createServerFn({ method: "POST" })
  .validator((data: unknown) => postSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await isStaff(supabaseAdmin))) throw new Error("Action non autorisée");
    if (!(await rateLimit("content-write", 10)))
      throw new Error("Trop de demandes. Réessayez dans une minute.");

    const sanitizedBody = data.body.map(sanitizeBlogParagraph);
    const { error } = await supabaseAdmin.from("blog_posts").upsert(
      {
        slug: data.slug,
        locale: data.locale,
        title: data.title,
        excerpt: data.excerpt,
        date: data.date,
        category: data.category,
        reading_time: data.readingTime,
        body: JSON.stringify(sanitizedBody),
      },
      { onConflict: "slug,locale" },
    );
    if (error) throw new Error("Impossible d'enregistrer l'article.");
    return true;
  });

export const deleteBlogPost = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({ slug: z.string().trim().min(1), locale: z.string().trim().max(5).optional() })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await isStaff(supabaseAdmin))) throw new Error("Action non autorisée");
    if (!(await rateLimit("content-write", 10)))
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    let query = supabaseAdmin.from("blog_posts").delete().eq("slug", data.slug);
    if (data.locale) query = query.eq("locale", data.locale);
    const { error } = await query;
    if (error) throw new Error("Impossible de supprimer l'article.");
    return true;
  });

export const upsertReview = createServerFn({ method: "POST" })
  .validator((data: unknown) => reviewSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await isStaff(supabaseAdmin))) throw new Error("Action non autorisée");
    if (!(await rateLimit("content-write", 10)))
      throw new Error("Trop de demandes. Réessayez dans une minute.");

    const payload = {
      customer_name: data.customer_name,
      phone: data.phone,
      email: data.email || null,
      rating: data.rating,
      comment: data.comment,
      status: data.status ?? "published",
      verified: data.verified ?? true,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("reviews").update(payload).eq("id", data.id);
      if (error) throw new Error("Impossible d'enregistrer l'avis.");
    } else {
      const { error } = await supabaseAdmin.from("reviews").insert(payload);
      if (error) throw new Error("Impossible d'enregistrer l'avis.");
    }
    return true;
  });

export const deleteReview = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await isStaff(supabaseAdmin))) throw new Error("Action non autorisée");
    if (!(await rateLimit("content-write", 10)))
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    const { error } = await supabaseAdmin.from("reviews").delete().eq("id", data.id);
    if (error) throw new Error("Impossible de supprimer l'avis.");
    return true;
  });

// ---------------------------------------------------------------------------
// Inventaire
// ---------------------------------------------------------------------------

/** Renvoie le stock réel pour tous les accessoires suivis. Map slug -> quantité. */
export const listInventory = createServerFn({ method: "GET" }).handler(async () => {
  if (!(await rateLimit("list-inventory", 60))) {
    throw new Error("Trop de demandes. Réessayez dans une minute.");
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("inventory").select("slug, quantity");
  if (error || !data) return {};
  const map: Record<string, number> = {};
  for (const row of data) map[row.slug] = row.quantity;
  return map;
});

/** Stock bas pour l'admin (produits sous le seuil) — lecture côté serveur. */
export const getAdminLowStock = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ slug: string; quantity: number; low_stock_threshold: number }[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await isStaff(supabaseAdmin))) throw new Error("Action non autorisée");
    if (!(await rateLimit("admin-stock", 15)))
      throw new Error("Trop de demandes. Réessayez dans une minute.");

    const { data, error } = await supabaseAdmin
      .from("inventory")
      .select("slug, quantity, low_stock_threshold");
    if (error) throw new Error("Impossible de charger le stock.");
    return (data ?? []).filter((row) => row.quantity <= row.low_stock_threshold);
  },
);

/** Stock complet pour l'admin (liste de gestion) — lecture côté serveur. */
export const getAdminStock = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ slug: string; quantity: number; updated_at: string | null }[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await isStaff(supabaseAdmin))) throw new Error("Action non autorisée");
    if (!(await rateLimit("admin-stock", 15)))
      throw new Error("Trop de demandes. Réessayez dans une minute.");

    const { data, error } = await supabaseAdmin
      .from("inventory")
      .select("slug, quantity, updated_at")
      .order("slug", { ascending: true });
    if (error) throw new Error("Impossible de charger le stock.");
    return (data ?? []) as { slug: string; quantity: number; updated_at: string | null }[];
  },
);

/** Renvoie le stock réel (quantité) pour un slug donné, ou null si non en base. */
export const getInventory = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ slug: z.string().trim().min(1) }).parse(data))
  .handler(async ({ data }) => {
    if (!(await rateLimit("get-inventory", 60))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await isStaff(supabaseAdmin))) throw new Error("Action non autorisée");
    const { data: row } = await supabaseAdmin
      .from("inventory")
      .select("quantity")
      .eq("slug", data.slug)
      .maybeSingle();
    return row?.quantity ?? null;
  });

/** Mets à jour le stock d'un accessoire (backoffice). Réservé au personnel. */
export const setInventory = createServerFn({ method: "POST" })
  .validator((data: unknown) => inventorySchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await isStaff(supabaseAdmin))) throw new Error("Action non autorisée");
    if (!(await rateLimit("inventory-write", 20)))
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    const { error } = await supabaseAdmin
      .from("inventory")
      .upsert({ slug: data.slug, quantity: data.quantity }, { onConflict: "slug" });
    if (error) throw new Error("Impossible de mettre à jour le stock.");
    return true;
  });

/** Décrémente atomiquement le stock (réservation à la commande). service_role uniquement. */
export async function reserveInventory(
  supabaseAdmin: SupabaseClient<Database>,
  slug: string,
  qty: number,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc("decrement_inventory", {
    _slug: slug,
    _qty: qty,
  });
  if (error) {
    console.error("[inventory] decrement failed", error);
    return false;
  }
  return Boolean(data);
}

/** Ré-incrémente atomiquement le stock (annulation / échec de commande). service_role uniquement. */
export async function restoreInventory(
  supabaseAdmin: SupabaseClient<Database>,
  slug: string,
  qty: number,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc("increment_inventory", {
    _slug: slug,
    _qty: qty,
  });
  if (error) {
    console.error("[inventory] increment failed", error);
    return false;
  }
  return Boolean(data);
}

// ---------------------------------------------------------------------------
// Alertes stock bas
// ---------------------------------------------------------------------------

/** Renvoie la liste des accessoires dont le stock est inférieur ou égal au seuil. */
export async function checkLowStock(): Promise<
  { slug: string; quantity: number; low_stock_threshold: number }[]
> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("inventory")
    .select("slug, quantity, low_stock_threshold");
  if (error || !data) return [];

  return data.filter((row) => row.quantity <= row.low_stock_threshold);
}
