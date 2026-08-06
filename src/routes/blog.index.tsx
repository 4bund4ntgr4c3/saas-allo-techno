import { createFileRoute, Link } from "@tanstack/react-router";
import { CtaBand } from "@/components/site/Blocks";
import { POSTS, absoluteUrl } from "@/data/catalog";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Blog & guides réparation — Allô Techno Bénin" },
      {
        name: "description",
        content:
          "Conseils d'atelier sur la batterie, l'écran cassé, les pièces détachées et l'entretien des consoles, adaptés au climat et au réseau béninois.",
      },
      { property: "og:title", content: "Blog & guides — Allô Techno" },
      {
        property: "og:description",
        content: "Nos techniciens partagent leurs guides d'entretien et de dépannage.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/blog" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/blog") }],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const posts = [...POSTS].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">Journal d'atelier</span>
          <h1 className="at-display text-4xl md:text-6xl">Blog & guides</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">
            Ce que nos techniciens voient tous les jours, transformé en conseils pratiques.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-px border border-border bg-border md:grid-cols-2">
            {posts.map((p) => (
              <article key={p.slug} className="bg-card p-8">
                <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span className="border border-border px-2 py-1 font-bold">{p.category}</span>
                  <time dateTime={p.date}>
                    {new Date(p.date).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </time>
                  <span>· {p.readingTime}</span>
                </div>
                <h2 className="at-display mt-5 text-2xl">
                  <Link
                    to="/blog/$slug"
                    params={{ slug: p.slug }}
                    className="transition-colors hover:text-primary"
                  >
                    {p.title}
                  </Link>
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">{p.excerpt}</p>
                <Link
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className="mt-6 inline-block border-b-2 border-primary pb-1 text-[10px] font-extrabold uppercase tracking-widest"
                >
                  Lire l'article
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
