import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireStaff } from "@/lib/rbac";

export interface KBArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  author: string;
  views: number;
  helpful: number;
  created_at: string;
  updated_at: string;
}

export const getKBArticles = createServerFn({ method: "GET" }).handler(async () => {
  await requireStaff(supabaseAdmin);
  const { data, error } = await supabaseAdmin
    .from("kb_articles" as never)
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as KBArticle[];
});

export const getKBArticle = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { id } = data as { id: string };
    return { id };
  })
  .handler(async ({ data }) => {
    await requireStaff(supabaseAdmin);
    const { data: article, error } = await supabaseAdmin
      .from("kb_articles" as never)
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("kb_articles" as never)
      .update({ views: ((article as KBArticle).views ?? 0) + 1 } as never)
      .eq("id", data.id);

    return article as unknown as KBArticle;
  });

export const createKBArticle = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const a = data as Omit<KBArticle, "id" | "views" | "helpful" | "created_at" | "updated_at">;
    if (!a.title || !a.content) throw new Error("title et content requis");
    return a;
  })
  .handler(async ({ data }) => {
    await requireStaff(supabaseAdmin);
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from("kb_articles" as never)
      .insert({ ...data, views: 0, helpful: 0, created_at: now, updated_at: now } as never);
    if (error) throw new Error(error.message);
    return { created: true };
  });

export const updateKBArticle = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { id, ...updates } = data as { id: string } & Partial<KBArticle>;
    if (!id) throw new Error("id requis");
    return { id, updates: { ...updates, updated_at: new Date().toISOString() } };
  })
  .handler(async ({ data }) => {
    await requireStaff(supabaseAdmin);
    const { error } = await supabaseAdmin
      .from("kb_articles" as never)
      .update(data.updates as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { updated: true };
  });

export const deleteKBArticle = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { id } = data as { id: string };
    return { id };
  })
  .handler(async ({ data }) => {
    await requireStaff(supabaseAdmin);
    const { error } = await supabaseAdmin
      .from("kb_articles" as never)
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { deleted: true };
  });

export const markHelpful = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { id } = data as { id: string };
    return { id };
  })
  .handler(async ({ data }) => {
    await requireStaff(supabaseAdmin);
    const { error } = await supabaseAdmin
      .from("kb_articles" as never)
      .update({ helpful: 1 } as never)
      .eq("id", data.id);
    if (error) console.warn(error);
    return { marked: true };
  });

export const searchKB = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { query } = data as { query: string };
    return { query: query.toLowerCase() };
  })
  .handler(async ({ data }) => {
    await requireStaff(supabaseAdmin);
    const escaped = data.query.replace(/[%_\\]/g, "\\$&");
    const { data: articles, error } = await supabaseAdmin
      .from("kb_articles" as never)
      .select("*")
      .or(`title.ilike.%${escaped}%,content.ilike.%${escaped}%,tags.cs.{${data.query}}`)
      .limit(50);
    if (error) throw new Error(error.message);
    return (articles ?? []) as unknown as KBArticle[];
  });

export const KB_CATEGORIES = [
  "Diagnostic",
  "Procédure",
  "Pièce",
  "Outil",
  "Sécurité",
  "Client",
  "Paiement",
  "Autre",
] as const;
