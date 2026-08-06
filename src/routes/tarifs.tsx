import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CtaBand, MobileMoneyBar, SectionHeader } from "@/components/site/Blocks";
import { BRANDS, CATEGORIES, DEVICES, absoluteUrl, brandName, formatFcfa } from "@/data/catalog";

export const Route = createFileRoute("/tarifs")({
  head: () => ({
    meta: [
      { title: "Tarifs de réparation 2026 — Allô Techno Abomey-Calavi" },
      {
        name: "description",
        content:
          "Grille tarifaire complète : écrans, batteries, connecteurs de charge, cartes mères, consoles. Prix en FCFA, délais et garanties pour chaque intervention.",
      },
      { property: "og:title", content: "Grille tarifaire — Allô Techno" },
      {
        property: "og:description",
        content: "Prix transparents en FCFA, main-d'œuvre et pièce incluses.",
      },
      { property: "og:url", content: "/tarifs" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/tarifs") }],
  }),
  component: Tarifs,
});

function Tarifs() {
  const [brand, setBrand] = useState("tous");
  const [category, setCategory] = useState("toutes");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const list = DEVICES.filter(
      (d) =>
        (brand === "tous" || d.brand === brand) &&
        (category === "toutes" || d.category === category),
    ).flatMap((d) => d.faults.map((f) => ({ d, f })));
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      ({ d, f }) => d.name.toLowerCase().includes(term) || f.label.toLowerCase().includes(term),
    );
  }, [brand, category, q]);

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">Grille 2026</span>
          <h1 className="at-display text-4xl md:text-6xl">Tarifs transparents</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">
            Aucun frais caché : chaque prix inclut la pièce et la main-d'œuvre. Le devis final est
            confirmé après le diagnostic gratuit.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Filtres */}
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="t-q" className="at-eyebrow mb-2 block">
                Recherche
              </label>
              <input
                id="t-q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Écran, batterie, iPhone…"
                className="h-11 w-full rounded-sm border border-border bg-card px-4 font-mono text-sm focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="t-brand" className="at-eyebrow mb-2 block">
                Marque
              </label>
              <select
                id="t-brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="h-11 w-full rounded-sm border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none"
              >
                <option value="tous">Toutes les marques</option>
                {BRANDS.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="t-cat" className="at-eyebrow mb-2 block">
                Type d'appareil
              </label>
              <select
                id="t-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-11 w-full rounded-sm border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none"
              >
                <option value="toutes">Tous les types</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="at-eyebrow mb-4">{rows.length} interventions listées</p>

          <div className="overflow-hidden border border-border">
            <div className="hidden grid-cols-12 gap-4 border-b border-border bg-surface p-4 md:grid">
              <span className="at-eyebrow col-span-4">Appareil</span>
              <span className="at-eyebrow col-span-4">Intervention</span>
              <span className="at-eyebrow col-span-2">Délai / Garantie</span>
              <span className="at-eyebrow col-span-2 text-right">Prix</span>
            </div>
            {rows.map(({ d, f }) => (
              <Link
                key={d.slug + f.slug}
                to="/appareil/$slug"
                params={{ slug: d.slug }}
                className="grid gap-1 border-b border-border p-5 transition-colors last:border-0 hover:bg-surface md:grid-cols-12 md:gap-4"
              >
                <span className="font-bold md:col-span-4">
                  {d.name}
                  <span className="ml-2 font-mono text-[10px] font-normal uppercase text-muted-foreground">
                    {brandName(d.brand)}
                  </span>
                </span>
                <span className="text-sm text-muted-foreground md:col-span-4">{f.label}</span>
                <span className="font-mono text-[10px] uppercase text-muted-foreground md:col-span-2">
                  {f.duration} · {f.warranty}
                </span>
                <span className="font-mono text-sm font-medium text-primary md:col-span-2 md:text-right">
                  {formatFcfa(f.price)}
                </span>
              </Link>
            ))}
            {rows.length === 0 && (
              <p className="p-8 text-sm text-muted-foreground">
                Aucun résultat. Essayez une autre recherche ou{" "}
                <Link to="/devis" className="text-primary underline">
                  demandez un devis
                </Link>
                .
              </p>
            )}
          </div>

          <div className="mt-10">
            <MobileMoneyBar />
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow="Bon à savoir"
            title="Ce que le prix comprend"
            text="Chaque intervention est facturée une seule fois, pièce et main-d'œuvre incluses."
          />
          <div className="grid gap-px border border-border bg-border md:grid-cols-3">
            {[
              { t: "Diagnostic", d: "Toujours gratuit, y compris si vous refusez le devis." },
              {
                t: "Pièce & pose",
                d: "La pièce indiquée sur le devis, posée et testée en atelier.",
              },
              { t: "Garantie", d: "3 à 12 mois selon la pièce, mentionnée sur la facture." },
            ].map((i) => (
              <div key={i.t} className="bg-card p-8">
                <h3 className="text-sm font-extrabold uppercase tracking-wide">{i.t}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{i.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
