import { createFileRoute, Link } from "@tanstack/react-router";
import { CtaBand } from "@/components/site/Blocks";
import { getBlogPosts } from "@/lib/blog.functions";
import { listBlogPosts, type BlogPost } from "@/lib/content.functions";
import { POSTS } from "@/data/catalog";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import "@/lib/i18n/segments/blog";
import type { Locale } from "@/lib/i18n/locales";
import { PageBreadcrumb } from "@/components/site/PageBreadcrumb";
import { localeSeo } from "@/lib/seo";

export const Route = createFileRoute("/$locale/blog/")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const suffix = "/blog";
    const seo = localeSeo(locale, suffix);
    return {
      meta: [
        { title: translate(locale, "blog.meta.title") },
        { name: "description", content: translate(locale, "blog.meta.description") },
        { property: "og:title", content: translate(locale, "blog.og.title") },
        { property: "og:description", content: translate(locale, "blog.og.description") },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...seo.meta,
      ],
      links: [...seo.links],
    };
  },
  loader: async ({ params }) => {
    const locale = normalizeLocale((params as { locale?: string }).locale) as string;
    let dbPosts: BlogPost[];
    try {
      dbPosts = (await listBlogPosts({ data: { fallback: POSTS, locale } })) as BlogPost[];
    } catch {
      dbPosts = [];
    }
    const staticPosts = getBlogPosts(locale);
    const merged =
      dbPosts.length > 0
        ? dbPosts.filter((p) => p && typeof p.date === "string")
        : staticPosts.filter((p) => p && typeof p.date === "string");
    return { posts: merged };
  },
  component: BlogIndex,
});

function BlogIndex() {
  const { posts } = Route.useLoaderData() as { posts: BlogPost[] };
  const { locale, t } = useI18n();

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="at-eyebrow">{t("blog.eyebrow")}</span>
            <PageBreadcrumb items={[{ label: t("nav.blog") }]} />
          </div>
          <h1 className="at-display text-4xl md:text-6xl">{t("blog.title")}</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">{t("blog.subtitle")}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-px border border-border bg-border md:grid-cols-2">
            {posts.map((p: BlogPost) => (
              <article key={p.slug} className="bg-card p-8">
                <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
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
                <Link
                  to="/$locale/blog/$slug"
                  params={{ locale, slug: p.slug }}
                  className="mt-6 inline-block border-b-2 border-primary pb-1 text-[10px] font-extrabold uppercase tracking-widest"
                >
                  {t("blog.read")}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
