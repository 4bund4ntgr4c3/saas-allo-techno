import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { CtaBand } from "@/components/site/Blocks";
import { POSTS } from "@/data/catalog";

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => {
    const post = POSTS.find((p) => p.slug === params.slug);
    if (!post) {
      return {
        meta: [{ title: "Article introuvable — Allô Techno" }, { name: "robots", content: "noindex" }],
      };
    }
    return {
      meta: [
        { title: `${post.title} — Allô Techno` },
        { name: "description", content: post.excerpt },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.excerpt },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  loader: ({ params }) => {
    const post = POSTS.find((p) => p.slug === params.slug);
    if (!post) throw notFound();
    return { post };
  },
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center" role="alert">
      <h1 className="at-display text-3xl">Une erreur est survenue</h1>
      <p className="mt-4 text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="at-display text-3xl">Article introuvable</h1>
      <Link
        to="/blog"
        className="mt-6 inline-block border-b-2 border-primary pb-1 text-[10px] font-extrabold uppercase tracking-widest"
      >
        Retour au blog
      </Link>
    </div>
  ),
  component: BlogPost,
});

function BlogPost() {
  const { slug } = Route.useParams();
  const post = POSTS.find((p) => p.slug === slug)!;
  const others = POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);


  return (
    <>
      <article className="border-b border-border py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" /> Tous les articles
          </Link>
          <div className="mt-8 flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span className="border border-border px-2 py-1 font-bold">{post.category}</span>
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString("fr-FR", {
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
            {post.body.map((par) => (
              <p key={par.slice(0, 30)} className="text-sm leading-relaxed">
                {par}
              </p>
            ))}
          </div>
        </div>
      </article>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <span className="at-eyebrow mb-6 block">À lire aussi</span>
          <div className="grid gap-px border border-border bg-border md:grid-cols-2">
            {others.map((p) => (
              <Link
                key={p.slug}
                to="/blog/$slug"
                params={{ slug: p.slug }}
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
