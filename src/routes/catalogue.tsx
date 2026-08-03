import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { Search, X } from "lucide-react";
import { CtaBand, SectionHeader } from "@/components/site/Blocks";
import { BRANDS, CATEGORIES, DEVICES, brandName, formatFcfa } from "@/data/catalog";
import { searchDevices } from "@/lib/catalog-search";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/catalogue")({
  validateSearch: (
    s: Record<string, unknown>,
  ): { q?: string; marque?: string; categorie?: string; serie?: string } => {
    const result: { q?: string; marque?: string; categorie?: string; serie?: string } = {};
    if (typeof s["q"] === "string" && s["q"].trim()) result.q = s["q"];
    if (typeof s["marque"] === "string") result.marque = s["marque"];
    if (typeof s["categorie"] === "string") result.categorie = s["categorie"];
    if (typeof s["serie"] === "string") result.serie = s["serie"];
    return result;
  },
  head: () => ({
    meta: [
      { title: `Catalogue complet — ${DEVICES.length} appareils référencés | Allô Techno` },
      {
        name: "description",
        content: `Catalogue des ${DEVICES.length} appareils réparés par Allô Techno à Abomey-Calavi : smartphones, tablettes, ordinateurs, consoles, montres. Recherche et filtres par marque, type et série.`,
      },
      { property: "og:title", content: "Catalogue des appareils — Allô Techno" },
      {
        property: "og:description",
        content: "Tous les modèles référencés, avec tarifs de réparation.",
      },
      { property: "og:url", content: "/catalogue" },
    ],
    links: [{ rel: "canonical", href: "/catalogue" }],
  }),
  component: Catalogue,
});

const chip = (active: boolean) =>
  `border px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-card text-muted-foreground hover:bg-foreground hover:text-background"
  }`;

function Catalogue() {
  const { q, marque, categorie, serie } = Route.useSearch();
  const navigate = useNavigate();

  const set = (patch: {
    q?: string;
    marque?: string | null;
    categorie?: string | null;
    serie?: string | null;
  }) => {
    const next: { q?: string; marque?: string; categorie?: string; serie?: string } = {};
    if (patch.q !== undefined) next.q = patch.q;
    if (patch.marque !== undefined && patch.marque) next.marque = patch.marque;
    if (patch.categorie !== undefined && patch.categorie) next.categorie = patch.categorie;
    if (patch.serie !== undefined && patch.serie) next.serie = patch.serie;
    navigate({ to: "/catalogue", search: next, replace: true });
  };

  const results = useMemo(() => {
    let list = q ? searchDevices(q).map((m) => m.device) : [...DEVICES];
    if (marque) list = list.filter((d) => d.brand === marque);
    if (categorie) list = list.filter((d) => d.category === categorie);
    if (serie) list = list.filter((d) => d.series === serie);
    return list;
  }, [q, marque, categorie, serie]);

  const seriesOptions = useMemo(() => {
    const base = DEVICES.filter(
      (d) => (!marque || d.brand === marque) && (!categorie || d.category === categorie),
    );
    return [...new Set(base.map((d) => d.series))].sort((a, b) => a.localeCompare(b));
  }, [marque, categorie]);

  const activeFilters = (marque ? 1 : 0) + (categorie ? 1 : 0) + (serie ? 1 : 0);

  return (
    <>
      <section className="border-b border-border py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">Catalogue · {DEVICES.length} appareils</span>
          <h1 className="at-display text-4xl md:text-5xl">
            Tous les appareils, une seule grille de tarifs.
          </h1>
          <p className="mt-6 max-w-xl text-muted-foreground">
            Recherchez un modèle, filtrez par marque, type d'appareil ou génération. Chaque fiche
            affiche les pannes prises en charge, le tarif ferme et le délai de réparation.
          </p>
        </div>
      </section>

      <section className="bg-surface py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 border border-border bg-background p-4 md:flex-row md:items-center">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q ?? ""}
                onChange={(e) => set({ q: e.target.value })}
                placeholder="Rechercher : « iPhone 17 », « ecran », « galaxy s25 »…"
                className="h-11 w-full border border-border bg-background pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                aria-label="Rechercher un appareil"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={marque ?? ""} onValueChange={(v) => set({ marque: v || null })}>
                <SelectTrigger className="h-11 w-full border-border bg-background font-mono text-[10px] font-bold uppercase tracking-wider md:w-48">
                  <SelectValue placeholder="Toutes les marques" />
                </SelectTrigger>
                <SelectContent>
                  {BRANDS.map((b) => (
                    <SelectItem key={b.slug} value={b.slug}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(q || activeFilters > 0) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-11 font-mono text-[10px] font-bold uppercase tracking-wider"
                  onClick={() => set({ q: "", marque: null, categorie: null, serie: null })}
                >
                  <X className="size-3.5" />
                  Réinitialiser
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="at-eyebrow mr-2">Type</span>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                className={chip(categorie === c)}
                onClick={() => set({ categorie: categorie === c ? null : c })}
              >
                {c}
              </button>
            ))}
          </div>

          {seriesOptions.length > 1 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="at-eyebrow mr-2">Génération</span>
              {seriesOptions.map((s) => (
                <button
                  key={s}
                  className={chip(serie === s)}
                  onClick={() => set({ serie: serie === s ? null : s })}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex items-baseline justify-between gap-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {results.length} / {DEVICES.length} appareil{results.length > 1 ? "s" : ""}
            </p>
            {q && <p className="text-xs text-muted-foreground">Recherche : « {q} »</p>}
          </div>

          {results.length > 0 ? (
            <div className="grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
              {results.map((d) => (
                <Link
                  key={d.slug}
                  to="/appareil/$slug"
                  params={{ slug: d.slug }}
                  className="group bg-card p-6 transition-colors hover:bg-surface"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="text-base font-bold tracking-tight group-hover:text-primary">
                      {d.name}
                    </h2>
                    <span className="font-mono text-[10px] uppercase text-muted-foreground">
                      {d.category} · {d.year}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {brandName(d.brand)} · {d.series}
                  </p>
                  <ul className="mt-4 space-y-1">
                    {d.faults.slice(0, 3).map((f) => (
                      <li key={f.slug} className="flex justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">{f.label}</span>
                        <span className="font-mono text-xs text-primary">
                          {formatFcfa(f.price)}
                        </span>
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
            <div className="border border-border bg-card p-12 text-center">
              <SectionHeader eyebrow="Aucun résultat" title="Aucun appareil ne correspond" />
              <p className="-mt-6 text-sm text-muted-foreground">
                Essayez un autre terme, ou réinitialisez les filtres pour voir l'ensemble du
                catalogue.
              </p>
              <Button
                variant="technical"
                className="mt-8"
                onClick={() => set({ q: "", marque: null, categorie: null, serie: null })}
              >
                Voir tout le catalogue
              </Button>
            </div>
          )}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
