import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CtaBand, MobileMoneyBar, SectionHeader } from "@/components/site/Blocks";
import { Button } from "@/components/ui/button";
import { BRANDS, DEVICES, devicesOfBrand, formatFcfa } from "@/data/catalog";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";

export const Route = createFileRoute("/$locale/reprise")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    return {
      meta: [
        { title: translate(locale, "reprise.meta.title") },
        { name: "description", content: translate(locale, "reprise.meta.description") },
        { property: "og:title", content: translate(locale, "reprise.og.title") },
        { property: "og:description", content: translate(locale, "reprise.og.description") },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: Reprise,
});

const CONDITIONS = [
  { key: "excellent", factor: 1 },
  { key: "bon", factor: 0.8 },
  { key: "usage", factor: 0.6 },
  { key: "hs", factor: 0.35 },
] as const;

function baseValue(year: number, faultsTotal: number) {
  const age = Math.max(0, 2026 - year);
  const depreciation = Math.max(0.15, 1 - age * 0.16);
  return Math.round((faultsTotal * 1.9 * depreciation) / 500) * 500;
}

function Reprise() {
  const [brand, setBrand] = useState("");
  const [deviceSlug, setDeviceSlug] = useState("");
  const [condition, setCondition] = useState<string>("bon");
  const { locale, t } = useI18n();

  const devices = useMemo(() => (brand ? devicesOfBrand(brand) : []), [brand]);
  const device = DEVICES.find((d) => d.slug === deviceSlug);
  const factor = CONDITIONS.find((c) => c.key === condition)?.factor ?? 0.8;
  const estimate = device
    ? Math.round(
        (baseValue(
          device.year,
          device.faults.reduce((s, f) => s + f.price, 0),
        ) *
          factor) /
          500,
      ) * 500
    : 0;

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">{t("reprise.eyebrow")}</span>
          <h1 className="at-display text-4xl md:text-6xl">{t("reprise.title")}</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">{t("reprise.intro")}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid gap-px border border-border bg-border md:grid-cols-3">
            <div className="bg-card p-6">
              <label htmlFor="r-brand" className="at-eyebrow mb-3 block">
                {t("reprise.brand")}
              </label>
              <select
                id="r-brand"
                value={brand}
                onChange={(e) => {
                  setBrand(e.target.value);
                  setDeviceSlug("");
                }}
                className="h-11 w-full border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">{t("reprise.select")}</option>
                {BRANDS.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-card p-6">
              <label htmlFor="r-device" className="at-eyebrow mb-3 block">
                {t("reprise.model")}
              </label>
              <select
                id="r-device"
                value={deviceSlug}
                disabled={!brand}
                onChange={(e) => setDeviceSlug(e.target.value)}
                className="h-11 w-full border border-border bg-background px-3 text-sm disabled:opacity-50 focus:border-primary focus:outline-none"
              >
                <option value="">{t("reprise.select")}</option>
                {devices.map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-card p-6">
              <label htmlFor="r-cond" className="at-eyebrow mb-3 block">
                {t("reprise.state")}
              </label>
              <select
                id="r-cond"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="h-11 w-full border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
              >
                {CONDITIONS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {t(`reprise.cond.${c.key}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-8 border border-border bg-card p-8">
            <span className="at-eyebrow">{t("reprise.offer")}</span>
            <div className="mt-3 font-mono text-4xl font-medium text-primary">
              {device ? formatFcfa(estimate) : "—"}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{t("reprise.estimateNote")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="technical">
                <Link to="/$locale/reservation" params={{ locale }}>
                  {t("reprise.drop")}
                </Link>
              </Button>
              <Button asChild variant="technicalOutline">
                <Link to="/$locale/contact" params={{ locale }}>
                  {t("reprise.question")}
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-8">
            <MobileMoneyBar />
          </div>
        </div>
      </section>

      <section className="border-t border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader eyebrow={t("reprise.cta.eyebrow")} title={t("reprise.cta.title")} />
          <div className="grid gap-px border border-border bg-border md:grid-cols-3">
            {[
              {
                t: t("reprise.step1.t"),
                x: t("reprise.step1.x"),
              },
              {
                t: t("reprise.step2.t"),
                x: t("reprise.step2.x"),
              },
              {
                t: t("reprise.step3.t"),
                x: t("reprise.step3.x"),
              },
            ].map((s, i) => (
              <div key={s.t} className="bg-card p-8">
                <span className="font-mono text-4xl font-medium text-primary">{i + 1}</span>
                <h3 className="mt-6 text-lg font-bold tracking-tight">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.x}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
