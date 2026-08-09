import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { CtaBand } from "@/components/site/Blocks";
import { getBlogPosts, getBlogPost, type BilingualPost } from "@/lib/blog.functions";
import { listBlogPosts, type BlogPost } from "@/lib/content.functions";
import { POSTS } from "@/data/catalog";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import "@/lib/i18n/segments/blog";
import type { Locale } from "@/lib/i18n/locales";
import { localeSeo } from "@/lib/seo";

export const Route = createFileRoute("/$locale/blog/$slug")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const slug = (params as { slug: string }).slug;
    const post = getBlogPost(slug, locale);
    if (!post) {
      return {
        meta: [
          { title: translate(locale, "blog.meta.notfound.title") },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const suffix = `/blog/${slug}`;
    const seo = localeSeo(locale, suffix);
    return {
      meta: [
        { title: `${post.title} — Allô Techno` },
        { name: "description", content: post.excerpt },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.excerpt },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        ...seo.meta,
      ],
      links: [...seo.links],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.excerpt,
            datePublished: post.date,
            inLanguage: locale === "en" ? "en" : "fr-BJ",
            articleSection: post.category,
            author: { "@type": "Organization", name: "Allô Techno" },
            publisher: { "@type": "Organization", name: "Allô Techno" },
            about: { "@type": "Place", name: "Abomey-Calavi, Bénin" },
            mainEntityOfPage: `/blog/${slug}`,
          }),
        },
      ],
    };
  },
  loader: async ({ params }) => {
    const locale = normalizeLocale((params as { locale?: string }).locale) as string;
    const slug = (params as { slug: string }).slug;
    const post = getBlogPost(slug, locale);
    if (!post) {
      const all = (await listBlogPosts({ data: { fallback: POSTS, locale } })) as BlogPost[];
      const dbPost = all.find((p) => p.slug === slug);
      if (!dbPost) throw notFound();
      return { post: dbPost, others: all.filter((p) => p.slug !== dbPost.slug).slice(0, 2) };
    }
    const allPosts = getBlogPosts(locale);
    return { post, others: allPosts.filter((p) => p.slug !== post.slug).slice(0, 2) };
  },
  errorComponent: BlogError,
  notFoundComponent: PostNotFound,
  component: BlogPost,
});

function BlogError({ error }: { error: Error }) {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center" role="alert">
      <h1 className="at-display text-3xl">{t("blog.error")}</h1>
      <p className="mt-4 text-sm text-muted-foreground">{error.message}</p>
    </div>
  );
}

function PostNotFound() {
  const { locale, t } = useI18n();
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="at-display text-3xl">{t("blog.notfound.title")}</h1>
      <Link
        to="/$locale/blog"
        params={{ locale }}
        className="mt-6 inline-block border-b-2 border-primary pb-1 text-[10px] font-extrabold uppercase tracking-widest"
      >
        {t("blog.notfound.back")}
      </Link>
    </div>
  );
}

function BlogPost() {
  const { post, others } = Route.useLoaderData() as {
    post: BilingualPost;
    others: BilingualPost[];
  };
  const { locale, t } = useI18n();

  return (
    <>
      <article className="border-b border-border py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Link
            to="/$locale/blog"
            params={{ locale }}
            className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" /> {t("blog.all")}
          </Link>
          <div className="mt-8 flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span className="border border-border px-2 py-1 font-bold">{post.category}</span>
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString(locale, {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </time>
            <span>· {post.readingTime}</span>
          </div>
          <h1 className="at-display mt-5 text-3xl md:text-5xl">{post.title}</h1>
          <p className="mt-6 text-lg text-muted-foreground">{post.excerpt}</p>
          <div className="mt-10 space-y-5 border-t border-border pt-10">
            {post.body.map((par: string) => (
              <p key={par.slice(0, 30)} className="text-sm leading-relaxed">
                {par}
              </p>
            ))}
          </div>
        </div>
      </article>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <span className="at-eyebrow mb-6 block">{t("blog.readalso")}</span>
          <div className="grid gap-px border border-border bg-border md:grid-cols-2">
            {others.map((p: BilingualPost) => (
              <Link
                key={p.slug}
                to="/$locale/blog/$slug"
                params={{ locale, slug: p.slug }}
                className="bg-card p-6 transition-colors hover:bg-surface"
              >
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {p.category}
                </span>
                <h2 className="mt-3 text-lg font-bold tracking-tight">{p.title}</h2>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
