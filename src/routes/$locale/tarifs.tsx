import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CtaBand, MobileMoneyBar, SectionHeader } from "@/components/site/Blocks";
import { BRANDS, CATEGORIES, DEVICES, brandName, formatFcfa } from "@/data/catalog";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";
import { localeSeo } from "@/lib/seo";
import "@/lib/i18n/segments/info";

export const Route = createFileRoute("/$locale/tarifs")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const seo = localeSeo(locale, "/tarifs");
    return {
      meta: [
        { title: translate(locale, "tarifs.meta.title") },
        { name: "description", content: translate(locale, "tarifs.meta.description") },
        { property: "og:title", content: translate(locale, "tarifs.og.title") },
        { property: "og:description", content: translate(locale, "tarifs.og.description") },
        ...seo.meta,
      ],
      links: seo.links,
    };
  },
  component: Tarifs,
});

function Tarifs() {
  const [brand, setBrand] = useState("tous");
  const [category, setCategory] = useState("toutes");
  const [q, setQ] = useState("");
  const { locale, t } = useI18n();

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
          <span className="at-eyebrow mb-4 block">{t("tarifs.eyebrow")}</span>
          <h1 className="at-display text-4xl md:text-6xl">{t("tarifs.title")}</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">{t("tarifs.intro")}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Filtres */}
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="t-q" className="at-eyebrow mb-2 block">
                {t("tarifs.search")}
              </label>
              <input
                id="t-q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("tarifs.searchPlaceholder")}
                className="h-11 w-full rounded-sm border border-border bg-card px-4 font-mono text-sm focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="t-brand" className="at-eyebrow mb-2 block">
                {t("tarifs.brand")}
              </label>
              <select
                id="t-brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="h-11 w-full rounded-sm border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none"
              >
                <option value="tous">{t("tarifs.brandAll")}</option>
                {BRANDS.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="t-cat" className="at-eyebrow mb-2 block">
                {t("tarifs.category")}
              </label>
              <select
                id="t-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-11 w-full rounded-sm border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none"
              >
                <option value="toutes">{t("tarifs.categoryAll")}</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(c)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="at-eyebrow mb-4">{t("tarifs.count", [rows.length])}</p>

          <div className="overflow-hidden border border-border">
            <div className="hidden grid-cols-12 gap-4 border-b border-border bg-surface p-4 md:grid">
              <span className="at-eyebrow col-span-4">{t("tarifs.col.device")}</span>
              <span className="at-eyebrow col-span-4">{t("tarifs.col.fault")}</span>
              <span className="at-eyebrow col-span-2">{t("tarifs.col.delay")}</span>
              <span className="at-eyebrow col-span-2 text-right">{t("tarifs.col.price")}</span>
            </div>
            {rows.map(({ d, f }) => (
              <Link
                key={d.slug + f.slug}
                to="/$locale/appareil/$slug"
                params={{ locale, slug: d.slug }}
                className="grid gap-1 border-b border-border p-5 transition-colors last:border-0 hover:bg-surface md:grid-cols-12 md:gap-4"
              >
                <span className="font-bold md:col-span-4">
                  {d.name}
                  <span className="ml-2 font-mono text-[10px] font-normal uppercase text-muted-foreground">
                    {brandName(d.brand)}
                  </span>
                </span>
                <span className="text-sm text-muted-foreground md:col-span-4">{t(f.label)}</span>
                <span className="font-mono text-[10px] uppercase text-muted-foreground md:col-span-2">
                  {t(f.duration)} · {t(f.warranty)}
                </span>
                <span className="font-mono text-sm font-medium text-primary md:col-span-2 md:text-right">
                  {formatFcfa(f.price)}
                </span>
              </Link>
            ))}
            {rows.length === 0 && (
              <p className="p-8 text-sm text-muted-foreground">
                {t("tarifs.empty")}{" "}
                <Link to="/$locale/devis" params={{ locale }} className="text-primary underline">
                  {t("tarifs.emptyQuote")}
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
            eyebrow={t("tarifs.know.eyebrow")}
            title={t("tarifs.know.title")}
            text={t("tarifs.know.text")}
          />
          <div className="grid gap-px border border-border bg-border md:grid-cols-3">
            {[
              { t: t("tarifs.know.diag.t"), d: t("tarifs.know.diag.d") },
              {
                t: t("tarifs.know.part.t"),
                d: t("tarifs.know.part.d"),
              },
              { t: t("tarifs.know.warranty.t"), d: t("tarifs.know.warranty.d") },
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
