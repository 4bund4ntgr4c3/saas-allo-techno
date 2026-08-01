import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CtaBand, SectionHeader } from "@/components/site/Blocks";
import { BRANDS, brandBySlug, devicesOfBrand, formatFcfa } from "@/data/catalog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reparations/$brand")({
  loader: ({ params }) => {
    const brand = brandBySlug(params.brand);
    if (!brand) throw notFound();
    return { brand, devices: devicesOfBrand(brand.slug) };
  },
  head: ({ params, loaderData }) => {
    const name = loaderData?.brand.name ?? "Marque";
    if (!loaderData) {
      return { meta: [{ title: "Marque introuvable — Allô Techno" }, { name: "robots", content: "noindex" }] };
    }
    return {
      meta: [
        { title: `Réparation ${name} à Abomey-Calavi — Allô Techno` },
        {
          name: "description",
          content: `Réparation ${name} : écran, batterie, connecteur de charge, caméra, désoxydation. Tarifs, délais et garanties à Abomey-Calavi.`,
        },
        { property: "og:title", content: `Réparation ${name} — Allô Techno` },
        {
          property: "og:description",
          content: `Modèles ${name} pris en charge, pièces certifiées et garantie jusqu'à 12 mois.`,
        },
        { property: "og:url", content: `/reparations/${params.brand}` },
      ],
      links: [{ rel: "canonical", href: `/reparations/${params.brand}` }],
    };
  },
  component: BrandPage,
});

function BrandPage() {
  const { brand, devices } = Route.useLoaderData();

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <nav className="mb-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <Link to="/reparations" className="hover:text-primary">
              Réparations
            </Link>{" "}
            / {brand.name}
          </nav>
          <h1 className="at-display text-4xl md:text-6xl">Réparation {brand.name}</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">
            {brand.tag}. Diagnostic gratuit, pièces sélectionnées selon le modèle et garantie
            détaillée sur chaque intervention.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow="Modèles référencés"
            title={`Modèles ${brand.name}`}
            text={
              devices.length
                ? "Sélectionnez votre modèle pour voir les pannes, tarifs, délais et pièces utilisées."
                : "Ce modèle n'est pas encore dans notre grille publique — demandez un devis, nous répondons en 15 minutes."
            }
          />

          {devices.length > 0 ? (
            <div className="grid gap-px border border-border bg-border md:grid-cols-2">
              {devices.map((d) => (
                <Link
                  key={d.slug}
                  to="/appareil/$slug"
                  params={{ slug: d.slug }}
                  className="bg-card p-8 transition-colors hover:bg-surface"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-lg font-bold tracking-tight">{d.name}</h3>
                    <span className="font-mono text-[10px] uppercase text-muted-foreground">
                      {d.category} · {d.year}
                    </span>
                  </div>
                  <ul className="mt-4 space-y-1">
                    {d.faults.slice(0, 3).map((f) => (
                      <li key={f.slug} className="flex justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">{f.label}</span>
                        <span className="font-mono text-xs text-primary">{formatFcfa(f.price)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 font-mono text-[10px] uppercase text-primary">
                    {d.faults.length} pannes prises en charge →
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="border border-border bg-card p-10">
              <p className="text-sm text-muted-foreground">
                Nous réparons les modèles {brand.name} sur devis : {brand.devices.join(", ")}.
              </p>
              <Button asChild variant="technical" className="mt-6">
                <Link to="/devis">Demander un devis</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-border bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader eyebrow="Autres marques" title="Continuer la navigation" />
          <div className="flex flex-wrap gap-2">
            {BRANDS.filter((b) => b.slug !== brand.slug).map((b) => (
              <Link
                key={b.slug}
                to="/reparations/$brand"
                params={{ brand: b.slug }}
                className="border border-border bg-card px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors hover:bg-foreground hover:text-background"
              >
                {b.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
