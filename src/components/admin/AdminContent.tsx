import { Route } from "@/routes/_authenticated/admin";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Stars } from "@/components/site/Blocks";
import {
  deleteBlogPost,
  deleteReview,
  getAdminBlogPost,
  getAdminBlogPosts,
  getAdminLowStock,
  getAdminReviews,
  upsertBlogPost,
  upsertReview,
  type BlogPost,
} from "@/lib/content.functions";
import { logAudit } from "@/lib/audit";
import { StockAdmin } from "@/components/admin/AdminStock";
import { useI18n } from "@/lib/i18n/context";
import { field } from "@/components/admin/primitives/AdminField";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

type ContentTab = "blog" | "avis" | "stock";

export function ContentSection() {
  const { t } = useI18n();
  const [sub, setSub] = useState<ContentTab>("blog");
  const getLowStockFn = useServerFn(getAdminLowStock);
  const lowStockQuery = useQuery({
    queryKey: ["admin-low-stock"],
    queryFn: () => getLowStockFn({ data: undefined }),
    refetchInterval: 5 * 60 * 1000,
  });
  const lowStockCount = lowStockQuery.data?.length ?? 0;
  const contentTabs = [
    { id: "blog" as ContentTab, label: t("admin.content.tab.blog") },
    { id: "avis" as ContentTab, label: t("admin.content.tab.reviews") },
    { id: "stock" as ContentTab, label: t("admin.content.tab.stock") },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="at-eyebrow">{t("admin.content.eyebrow")}</p>
          <h2 className="mt-1 text-xl font-semibold">{t("admin.content.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.content.description")}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {contentTabs.map((tab) => (
          <Button
            key={tab.id}
            variant={sub === tab.id ? "technical" : "outline"}
            size="sm"
            onClick={() => setSub(tab.id)}
          >
            {tab.label}
            {tab.id === "stock" && lowStockCount > 0 && (
              <span className="ml-2 bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">
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
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [locale, setLocale] = useState<string>("fr");
  const getBlogPostsFn = useServerFn(getAdminBlogPosts);
  const getBlogPostFn = useServerFn(getAdminBlogPost);
  const postsQuery = useQuery({
    queryKey: ["admin-blog", locale],
    queryFn: () => getBlogPostsFn({ data: { locale } }),
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
      bodyText: paragraphsToHtml(p.body),
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

  const duplicateFromLocale = async (slug: string, fromLocale: string) => {
    const data = await getBlogPostFn({ data: { slug, locale: fromLocale } });
    if (!data) {
      toast.error(t("admin.content.blog.toast.notFound"));
      return;
    }
    setForm({
      slug: data.slug,
      locale,
      title: data.title,
      excerpt: data.excerpt,
      date: data.date,
      category: data.category,
      readingTime: data.reading_time,
      bodyText: paragraphsToHtml(parsePostBody(data.body)),
    });
    setEditing(null);
    setError(null);
    toast.success(t("admin.content.blog.toast.duplicated", [fromLocale.toUpperCase()]));
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
          body: htmlToParagraphs(form.bodyText),
        },
      });
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      toast.success(t("admin.content.blog.toast.saved"));
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.content.blog.error.save"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (slug: string) => {
    try {
      await deleteFn({ data: { slug, locale } });
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      toast.success(t("admin.content.blog.toast.deleted"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.content.blog.error.delete"));
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="w-full" onClick={startNew}>
            <Plus className="mr-2 size-4" />
            {t("admin.content.blog.button.new")}
          </Button>
          <label className="sr-only" htmlFor="blog-locale">
            {t("admin.content.blog.form.language")}
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
          <p className="text-sm text-muted-foreground">{t("admin.content.loading")}</p>
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
                  <Pencil className="size-3.5" /> {t("admin.content.button.edit")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => remove(p.slug)}
                  className="text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </Button>
                {p.locale !== locale && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => duplicateFromLocale(p.slug, p.locale ?? "fr")}
                    title={t("admin.content.blog.button.duplicate", [
                      p.locale?.toUpperCase() ?? "FR",
                    ])}
                  >
                    <Copy className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {(editing || form.slug) && (
        <form onSubmit={save} className="space-y-4 border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              {editing ? t("admin.content.blog.form.editing") : t("admin.content.blog.form.new")}
            </p>
            <span className="rounded-full border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("admin.content.blog.form.language")} :{" "}
              {form.locale === "en" ? "English" : "Français"}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="at-eyebrow mb-2 block">{t("admin.content.blog.form.title")}</span>
              <input
                className={field}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </label>
            <label className="block">
              <span className="at-eyebrow mb-2 block">{t("admin.content.blog.form.slug")}</span>
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
            <span className="at-eyebrow mb-2 block">{t("admin.content.blog.form.excerpt")}</span>
            <textarea
              className={`${field} h-20`}
              value={form.excerpt}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              required
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="at-eyebrow mb-2 block">{t("admin.content.blog.form.date")}</span>
              <input
                type="date"
                className={field}
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                required
              />
            </label>
            <label className="block">
              <span className="at-eyebrow mb-2 block">{t("admin.content.blog.form.category")}</span>
              <input
                className={field}
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                required
              />
            </label>
            <label className="block">
              <span className="at-eyebrow mb-2 block">
                {t("admin.content.blog.form.reading_time")}
              </span>
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
            <span className="at-eyebrow mb-2 block">{t("admin.content.blog.form.body_hint")}</span>
            <RichTextEditor
              value={form.bodyText}
              onChange={(html) => setForm((f) => ({ ...f, bodyText: html }))}
              placeholder={t("admin.content.blog.form.body_hint")}
            />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="technical" disabled={saving}>
              {saving
                ? t("admin.content.button.saving")
                : editing
                  ? t("admin.content.blog.button.save_edits")
                  : t("admin.content.blog.button.publish")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(null)}
              disabled={saving}
            >
              {t("admin.webhooks.form.cancel")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function parsePostBody(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((p): p is string => typeof p === "string");
  } catch {
    /* ignore */
  }
  return [];
}

function htmlToParagraphs(html: string): string[] {
  if (!html) return [];
  const div = document.createElement("div");
  div.innerHTML = html;
  const blocks: string[] = [];
  for (const child of div.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent?.trim();
      if (text) blocks.push(text);
    } else if (child instanceof HTMLElement) {
      const text = child.textContent?.trim();
      if (text) blocks.push(text);
    }
  }
  return blocks;
}

function paragraphsToHtml(paragraphs: string[]): string {
  return paragraphs.map((p) => `<p>${p}</p>`).join("");
}

function ReviewsAdmin() {
  const { t } = useI18n();
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const getReviewsFn = useServerFn(getAdminReviews);
  const reviewsQuery = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: () => getReviewsFn({ data: undefined }),
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
      toast.success(
        form.id ? t("admin.content.review.toast.updated") : t("admin.content.review.toast.added"),
      );
      void logAudit(supabase as never, {
        user_id: user.id,
        action: form.status === "published" ? "review.published" : "review.hidden",
        entity: "review",
        entity_id: form.id || null,
        details: { status: form.status, customer_name: form.customer_name },
      });
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.content.review.error.save"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteFn({ data: { id } });
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success(t("admin.content.review.toast.deleted"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.content.review.error.delete"));
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
                      comment: r.comment ?? "",
                      status: r.status ?? "published",
                    })
                  }
                >
                  <Pencil className="size-3.5" /> {t("admin.content.button.edit")}
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

      <form onSubmit={save} className="space-y-4 border border-border bg-card p-5 h-fit">
        <h3 className="text-sm font-semibold">
          {form.id ? t("admin.content.review.form.editing") : t("admin.content.review.form.new")}
        </h3>
        <label className="block">
          <span className="at-eyebrow mb-2 block">{t("admin.content.review.form.name")}</span>
          <input
            className={field}
            value={form.customer_name}
            onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
            required
          />
        </label>
        <label className="block">
          <span className="at-eyebrow mb-2 block">{t("admin.content.review.form.phone")}</span>
          <input
            className={field}
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            required
          />
        </label>
        <label className="block">
          <span className="at-eyebrow mb-2 block">{t("admin.content.review.form.email")}</span>
          <input
            className={field}
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="at-eyebrow mb-2 block">
            {t("admin.content.review.form.rating", [form.rating])}
          </span>
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
          <span className="at-eyebrow mb-2 block">{t("admin.content.review.form.comment")}</span>
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
            {saving
              ? t("admin.content.button.saving")
              : form.id
                ? t("admin.webhooks.form.save")
                : t("admin.content.review.form.new")}
          </Button>
          {form.id && (
            <Button type="button" variant="outline" onClick={reset} disabled={saving}>
              {t("admin.webhooks.form.cancel")}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
