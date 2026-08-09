import { Route } from "@/routes/_authenticated/admin";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Stars } from "@/components/site/Blocks";
import {
  deleteBlogPost,
  deleteReview,
  upsertBlogPost,
  upsertReview,
  type BlogPost,
} from "@/lib/content.functions";
import { logAudit } from "@/lib/audit";
import { StockAdmin } from "@/components/admin/AdminStock";

const field =
  "h-11 w-full rounded-sm border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const contentTabs = [
  { id: "blog", label: "Articles" },
  { id: "avis", label: "Avis clients" },
  { id: "stock", label: "Stock boutique" },
] as const;

type ContentTab = (typeof contentTabs)[number]["id"];

export function ContentSection() {
  const [sub, setSub] = useState<ContentTab>("blog");
  const lowStockQuery = useQuery({
    queryKey: ["admin-low-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("slug, quantity, low_stock_threshold");
      if (error) return [];
      return (data ?? []).filter((row) => row.quantity <= row.low_stock_threshold);
    },
    refetchInterval: 5 * 60 * 1000,
  });
  const lowStockCount = lowStockQuery.data?.length ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {contentTabs.map((t) => (
          <Button
            key={t.id}
            variant={sub === t.id ? "technical" : "outline"}
            size="sm"
            onClick={() => setSub(t.id)}
          >
            {t.label}
            {t.id === "stock" && lowStockCount > 0 && (
              <span className="ml-2 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">
                {lowStockCount}
              </span>
            )}
          </Button>
        ))}
      </div>
      {sub === "blog" && <BlogAdmin />}
      {sub === "avis" && <ReviewsAdmin />}
      {sub === "stock" && <StockAdmin />}
    </div>
  );
}

function BlogAdmin() {
  const queryClient = useQueryClient();
  const [locale, setLocale] = useState<string>("fr");
  const postsQuery = useQuery({
    queryKey: ["admin-blog", locale],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("slug, title, excerpt, date, category, reading_time, body, locale")
        .eq("locale", locale)
        .order("date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const [editing, setEditing] = useState<Partial<BlogPost> | null>(null);
  const [form, setForm] = useState({
    slug: "",
    locale: "fr",
    title: "",
    excerpt: "",
    date: "",
    category: "Guides",
    readingTime: "5 min",
    bodyText: "",
  });

  const upsertFn = useServerFn(upsertBlogPost);
  const deleteFn = useServerFn(deleteBlogPost);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = (p: BlogPost) => {
    setForm({
      slug: p.slug,
      locale: p.locale ?? "fr",
      title: p.title,
      excerpt: p.excerpt,
      date: p.date,
      category: p.category,
      readingTime: p.readingTime,
      bodyText: p.body.join("\n"),
    });
    setEditing(p);
    setError(null);
  };

  const startNew = () => {
    setForm({
      slug: "",
      locale,
      title: "",
      excerpt: "",
      date: new Date().toISOString().slice(0, 10),
      category: "Guides",
      readingTime: "5 min",
      bodyText: "",
    });
    setEditing(null);
    setError(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await upsertFn({
        data: {
          slug: form.slug.trim(),
          locale: form.locale.trim(),
          title: form.title.trim(),
          excerpt: form.excerpt.trim(),
          date: form.date,
          category: form.category.trim(),
          readingTime: form.readingTime.trim(),
          body: form.bodyText
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        },
      });
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      toast.success("Article enregistré");
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (slug: string) => {
    try {
      await deleteFn({ data: { slug, locale } });
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      toast.success("Article supprimé");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Suppression impossible");
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="w-full" onClick={startNew}>
            <Plus className="mr-2 size-4" />
            Nouvel article
          </Button>
          <label className="sr-only" htmlFor="blog-locale">
            Langue
          </label>
          <select
            id="blog-locale"
            className={`${field} w-24 py-2`}
            value={locale}
            onChange={(e) => {
              setLocale(e.target.value);
              setEditing(null);
            }}
          >
            <option value="fr">FR</option>
            <option value="en">EN</option>
          </select>
        </div>
        {postsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (
          (postsQuery.data ?? []).map((p) => (
            <div key={p.slug} className="rounded-sm border border-border bg-card p-4">
              <p className="text-xs font-semibold">{p.title}</p>
              <p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">
                {p.category} · {p.date}
                {p.locale !== "fr" ? ` · ${p.locale.toUpperCase()}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="technicalOutline"
                  size="sm"
                  onClick={() =>
                    startEdit({
                      slug: p.slug,
                      locale: p.locale ?? locale,
                      title: p.title,
                      excerpt: p.excerpt,
                      date: p.date,
                      category: p.category,
                      readingTime: p.reading_time,
                      body: parsePostBody(p.body),
                    })
                  }
                >
                  <Pencil className="size-3.5" /> Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => remove(p.slug)}
                  className="text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {(editing || form.slug) && (
        <form onSubmit={save} className="space-y-4 rounded-sm border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              {editing ? "Modifier l'article" : "Nouvel article"}
            </p>
            <span className="rounded-full border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Langue : {form.locale === "en" ? "English" : "Français"}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="at-eyebrow mb-2 block">Titre</span>
              <input
                className={field}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </label>
            <label className="block">
              <span className="at-eyebrow mb-2 block">Slug</span>
              <input
                className={field}
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    slug: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]+/g, "-")
                      .replace(/^-+|-+$/g, ""),
                  }))
                }
                required
                disabled={!!editing}
              />
            </label>
          </div>
          <label className="block">
            <span className="at-eyebrow mb-2 block">Résumé</span>
            <textarea
              className={`${field} h-20`}
              value={form.excerpt}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              required
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="at-eyebrow mb-2 block">Date</span>
              <input
                type="date"
                className={field}
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                required
              />
            </label>
            <label className="block">
              <span className="at-eyebrow mb-2 block">Catégorie</span>
              <input
                className={field}
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                required
              />
            </label>
            <label className="block">
              <span className="at-eyebrow mb-2 block">Lecture</span>
              <input
                className={field}
                value={form.readingTime}
                onChange={(e) => setForm((f) => ({ ...f, readingTime: e.target.value }))}
                placeholder="5 min"
                required
              />
            </label>
          </div>
          <label className="block">
            <span className="at-eyebrow mb-2 block">Contenu (un paragraphe par ligne)</span>
            <textarea
              className={`${field} h-56`}
              value={form.bodyText}
              onChange={(e) => setForm((f) => ({ ...f, bodyText: e.target.value }))}
              required
            />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="technical" disabled={saving}>
              {saving ? "Enregistrement…" : editing ? "Enregistrer les modifications" : "Publier"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(null)}
              disabled={saving}
            >
              Annuler
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export function parsePostBody(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((p): p is string => typeof p === "string");
  } catch {
    /* ignore */
  }
  return [];
}

function ReviewsAdmin() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const reviewsQuery = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, customer_name, phone, email, rating, comment, status, verified, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const [form, setForm] = useState({
    id: "",
    customer_name: "",
    phone: "",
    email: "",
    rating: 5,
    comment: "",
    status: "published",
  });
  const upsertFn = useServerFn(upsertReview);
  const deleteFn = useServerFn(deleteReview);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () =>
    setForm({
      id: "",
      customer_name: "",
      phone: "",
      email: "",
      rating: 5,
      comment: "",
      status: "published",
    });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await upsertFn({
        data: {
          id: form.id || undefined,
          customer_name: form.customer_name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          rating: form.rating,
          comment: form.comment.trim(),
          status: form.status,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success(form.id ? "Avis mis à jour" : "Avis ajouté");
      void logAudit(supabase as never, {
        user_id: user.id,
        action: form.status === "published" ? "review.published" : "review.hidden",
        entity: "review",
        entity_id: form.id || null,
        details: { status: form.status, customer_name: form.customer_name },
      });
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteFn({ data: { id } });
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Avis supprimé");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Suppression impossible");
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-3">
        {(reviewsQuery.data ?? []).map((r) => (
          <div key={r.id} className="rounded-sm border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Stars n={r.rating} />
                <p className="text-sm font-semibold">
                  {r.customer_name} — {r.email || "—"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="technicalOutline"
                  size="sm"
                  onClick={() =>
                    setForm({
                      id: r.id,
                      customer_name: r.customer_name,
                      phone: r.phone ?? "",
                      email: r.email ?? "",
                      rating: r.rating,
                      comment: r.comment,
                      status: r.status ?? "published",
                    })
                  }
                >
                  <Pencil className="size-3.5" /> Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => remove(r.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">« {r.comment} »</p>
          </div>
        ))}
      </div>

      <form onSubmit={save} className="space-y-4 rounded-sm border border-border bg-card p-5 h-fit">
        <h3 className="text-sm font-semibold">{form.id ? "Modifier l'avis" : "Ajouter un avis"}</h3>
        <label className="block">
          <span className="at-eyebrow mb-2 block">Nom</span>
          <input
            className={field}
            value={form.customer_name}
            onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
            required
          />
        </label>
        <label className="block">
          <span className="at-eyebrow mb-2 block">Téléphone</span>
          <input
            className={field}
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            required
          />
        </label>
        <label className="block">
          <span className="at-eyebrow mb-2 block">Email</span>
          <input
            className={field}
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="at-eyebrow mb-2 block">Note ({form.rating}/5)</span>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            className="w-full"
            value={form.rating}
            onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))}
          />
        </label>
        <label className="block">
          <span className="at-eyebrow mb-2 block">Commentaire</span>
          <textarea
            className={`${field} h-24`}
            value={form.comment}
            onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
            required
          />
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="technical" disabled={saving}>
            {saving ? "Enregistrement…" : form.id ? "Enregistrer" : "Ajouter"}
          </Button>
          {form.id && (
            <Button type="button" variant="outline" onClick={reset} disabled={saving}>
              Annuler
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
