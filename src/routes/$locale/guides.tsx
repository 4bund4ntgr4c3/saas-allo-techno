import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, BookOpen, ScrollText, type LucideIcon } from "lucide-react";
import { CtaBand } from "@/components/site/Blocks";
import { POSTS } from "@/data/catalog";
import { listBlogPosts, type BlogPost } from "@/lib/content.functions";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";
import "@/lib/i18n/segments/guides";
import { PageBreadcrumb } from "@/components/site/PageBreadcrumb";
import { localeSeo } from "@/lib/seo";

export const Route = createFileRoute("/$locale/guides")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const suffix = "/guides";
    const seo = localeSeo(locale, suffix);
    return {
      meta: [
        { title: translate(locale, "guides.meta.title") },
        { name: "description", content: translate(locale, "guides.meta.description") },
        { property: "og:title", content: translate(locale, "guides.meta.og.title") },
        { property: "og:description", content: translate(locale, "guides.meta.og.description") },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...seo.meta,
      ],
      links: [...seo.links],
    };
  },
  loader: async ({ params }): Promise<{ guides: BlogPost[] }> => {
    const locale = normalizeLocale(params.locale) as Locale;
    try {
      const posts = await listBlogPosts({ data: { fallback: POSTS, locale } });
      return {
        guides: (posts as BlogPost[]).filter(
          (p) =>
            Boolean(p) && typeof p.category === "string" && p.category.toLowerCase() === "guides",
        ),
      };
    } catch {
      return {
        guides: POSTS.filter(
          (p) =>
            Boolean(p) && typeof p.category === "string" && p.category.toLowerCase() === "guides",
        ) as BlogPost[],
      };
    }
  },
  component: Guides,
});

const GUIDE_ICONS: LucideIcon[] = [BookOpen, ScrollText, BadgeCheck];

function Guides() {
  const { guides } = Route.useLoaderData() as { guides: BlogPost[] };
  const { locale, t } = useI18n();

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <PageBreadcrumb items={[{ label: t("nav.guides") }]} />
          <span className="at-eyebrow mb-4 block">{t("guides.eyebrow")}</span>
          <h1 className="at-display text-4xl md:text-6xl">{t("guides.title")}</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">{t("guides.hero")}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {guides.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("guides.empty")}</p>
          ) : (
            <div className="grid gap-px border border-border bg-border md:grid-cols-2">
              {guides.map((p, i) => {
                const Icon = GUIDE_ICONS[i % GUIDE_ICONS.length] ?? ScrollText;
                return (
                  <article key={p.slug} className="flex flex-col bg-card p-8">
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex size-10 items-center justify-center border border-primary/40 bg-surface">
                        <Icon
                          className="size-5 text-primary"
                          strokeWidth={1.5}
                          aria-hidden="true"
                        />
                      </span>
                      <span className="border border-primary px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                        {t("guides.chip")}
                      </span>
                    </div>
                    <div className="mt-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      <span className="border border-border px-2 py-1 font-bold">{p.category}</span>
                      <time dateTime={p.date}>
                        {new Date(p.date).toLocaleDateString(locale, {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </time>
                      <span>· {p.readingTime}</span>
                    </div>
                    <h2 className="at-display mt-5 text-2xl">
                      <Link
                        to="/$locale/blog/$slug"
                        params={{ locale, slug: p.slug }}
                        className="transition-colors hover:text-primary"
                      >
                        {p.title}
                      </Link>
                    </h2>
                    <p className="mt-3 text-sm text-muted-foreground">{p.excerpt}</p>
                    <div className="mt-auto pt-6">
                      <Link
                        to="/$locale/blog/$slug"
                        params={{ locale, slug: p.slug }}
                        className="inline-block border-b-2 border-primary pb-1 text-[10px] font-extrabold uppercase tracking-widest"
                      >
                        {t("guides.read")}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
