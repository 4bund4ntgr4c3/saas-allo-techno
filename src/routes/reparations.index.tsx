import { createFileRoute, Link } from "@tanstack/react-router";
import { SectionHeader, CtaBand } from "@/components/site/Blocks";
import { BRANDS, CATEGORIES, DEVICES, devicesOfBrand } from "@/data/catalog";

export const Route = createFileRoute("/reparations/")({
  head: () => ({
    meta: [
      { title: "Réparations par marque & appareil — Allô Techno" },
      {
        name: "description",
        content:
          "Apple, Samsung, Xiaomi, Tecno, Infinix, Huawei, Pixel, Sony… Choisissez votre marque et découvrez les pannes prises en charge, tarifs et délais.",
      },
      { property: "og:title", content: "Réparations par marque — Allô Techno" },
      {
        property: "og:description",
        content: "Toutes les marques et tous les types d'appareils réparés à Abomey-Calavi.",
      },
      { property: "og:url", content: "/reparations" },
    ],
    links: [{ rel: "canonical", href: "/reparations" }],
  }),
  component: Reparations,
});

function Reparations() {
  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">Catalogue de réparation</span>
          <h1 className="at-display max-w-3xl text-4xl md:text-6xl">
            Choisissez votre marque, nous connaissons la panne.
          </h1>
          <p className="mt-6 max-w-xl text-muted-foreground">
            {DEVICES.length} modèles référencés, {BRANDS.length} marques prises en charge et des
            centaines de références de pièces disponibles en stock à Abomey-Calavi.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader eyebrow="Marques" title="Toutes les marques" />
          <div className="grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
            {BRANDS.map((b) => (
              <Link
                key={b.slug}
                to="/reparations/$brand"
                params={{ brand: b.slug }}
                className="group bg-card p-8 transition-colors hover:bg-surface"
              >
                <h2 className="text-xl font-extrabold uppercase tracking-tight">{b.name}</h2>
                <p className="mt-2 font-mono text-[10px] uppercase text-muted-foreground">{b.tag}</p>
                <p className="mt-6 font-mono text-xs text-primary">
                  {devicesOfBrand(b.slug).length} modèle(s) référencé(s) →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow="Familles d'appareils"
            title="Par type d'appareil"
            text="Du smartphone d'entrée de gamme à l'iMac, en passant par les consoles et les montres connectées."
          />
          <div className="grid gap-px border border-border bg-border md:grid-cols-3">
            {CATEGORIES.map((c) => {
              const list = DEVICES.filter((d) => d.category === c);
              return (
                <div key={c} className="bg-card p-8">
                  <h3 className="text-sm font-extrabold uppercase tracking-wide">{c}</h3>
                  <ul className="mt-4 space-y-2">
                    {list.map((d) => (
                      <li key={d.slug}>
                        <Link
                          to="/appareil/$slug"
                          params={{ slug: d.slug }}
                          className="text-sm text-muted-foreground hover:text-primary"
                        >
                          {d.name}
                        </Link>
                      </li>
                    ))}
                    {list.length === 0 && (
                      <li className="text-sm text-muted-foreground">Sur devis</li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
