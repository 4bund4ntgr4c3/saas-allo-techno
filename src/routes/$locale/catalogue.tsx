import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { Search, X } from "lucide-react";
import { CtaBand, SectionHeader } from "@/components/site/Blocks";
import { PageBreadcrumb } from "@/components/site/PageBreadcrumb";
import { DEVICES } from "@/data/catalog/devices";
import { BRANDS, CATEGORIES, brandName } from "@/data/catalog";
import { formatFcfa } from "@/data/catalog/company";
import { searchDevices } from "@/lib/catalog-search";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import { faqSchema, localeSeo } from "@/lib/seo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/$locale/catalogue")({
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
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale);
    const suffix = "/catalogue";
    const seo = localeSeo(locale, suffix);
    const faq = faqSchema([
      { q: translate(locale, "faq.catalogue.q1"), a: translate(locale, "faq.catalogue.a1") },
      { q: translate(locale, "faq.catalogue.q2"), a: translate(locale, "faq.catalogue.a2") },
      { q: translate(locale, "faq.catalogue.q3"), a: translate(locale, "faq.catalogue.a3") },
    ]);
    const deviceCount = BRANDS.reduce((acc, b) => acc + b.devices.length, 0);
    return {
      meta: [
        { title: translate(locale, "catalogue.meta.title", [deviceCount]) },
        {
          name: "description",
          content: translate(locale, "catalogue.meta.description", [deviceCount]),
        },
        { property: "og:title", content: translate(locale, "catalogue.meta.ogTitle") },
        {
          property: "og:description",
          content: translate(locale, "catalogue.meta.ogDescription"),
        },
        ...seo.meta,
      ],
      links: [...seo.links],
      scripts: [{ type: "application/ld+json", children: JSON.stringify(faq) }],
    };
  },
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
  const { locale, t } = useI18n();

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
    navigate({ to: "/$locale/catalogue", params: { locale }, search: next, replace: true });
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
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="at-eyebrow">{t("catalogue.eyebrow", [DEVICES.length])}</span>
            <PageBreadcrumb items={[{ label: t("nav.catalogue") }]} />
          </div>
          <h1 className="at-display text-4xl md:text-5xl">{t("catalogue.title")}</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">{t("catalogue.intro")}</p>
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
                placeholder={t("catalogue.searchPlaceholder")}
                className="h-11 w-full border border-border bg-background pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                aria-label={t("catalogue.searchAria")}
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={marque ?? ""} onValueChange={(v) => set({ marque: v || null })}>
                <SelectTrigger className="h-11 w-full border-border bg-background font-mono text-[10px] font-bold uppercase tracking-wider md:w-48">
                  <SelectValue placeholder={t("catalogue.allBrands")} />
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
                  {t("catalogue.reset")}
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="at-eyebrow mr-2">{t("catalogue.type")}</span>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                className={chip(categorie === c)}
                onClick={() => set({ categorie: categorie === c ? null : c })}
              >
                {t(c)}
              </button>
            ))}
          </div>

          {seriesOptions.length > 1 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="at-eyebrow mr-2">{t("catalogue.generation")}</span>
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
              {results.length} / {DEVICES.length}{" "}
              {results.length > 1 ? t("catalogue.appareils") : t("catalogue.appareil")}
            </p>
            {q && <p className="text-xs text-muted-foreground">{t("catalogue.searchInfo", [q])}</p>}
          </div>

          {results.length > 0 ? (
            <div className="grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
              {results.map((d) => (
                <Link
                  key={d.slug}
                  to="/$locale/appareil/$slug"
                  params={{ locale, slug: d.slug }}
                  className="group bg-card p-6 transition-colors hover:bg-surface"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="text-base font-bold tracking-tight group-hover:text-primary">
                      {d.name}
                    </h2>
                    <span className="font-mono text-[10px] uppercase text-muted-foreground">
                      {t(d.category)} · {d.year}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {brandName(d.brand)} · {d.series}
                  </p>
                  <ul className="mt-4 space-y-1">
                    {d.faults.slice(0, 3).map((f) => (
                      <li key={f.slug} className="flex justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">{t(f.label)}</span>
                        <span className="font-mono text-xs text-primary">
                          {formatFcfa(f.price)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 font-mono text-[10px] uppercase text-primary">
                    {t("catalogue.pannes", [d.faults.length])}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="border border-border bg-card p-12 text-center">
              <SectionHeader
                eyebrow={t("catalogue.noResultEyebrow")}
                title={t("catalogue.noResultTitle")}
              />
              <p className="-mt-6 text-sm text-muted-foreground">{t("catalogue.noResultText")}</p>
              <Button
                variant="technical"
                className="mt-8"
                onClick={() => set({ q: "", marque: null, categorie: null, serie: null })}
              >
                {t("catalogue.noResultCta")}
              </Button>
            </div>
          )}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
