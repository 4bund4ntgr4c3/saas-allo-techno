import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock, ShieldCheck } from "lucide-react";
import { CtaBand, MobileMoneyBar, SectionHeader } from "@/components/site/Blocks";
import { LeadForm } from "@/components/site/LeadForm";
import { Button } from "@/components/ui/button";
import { BRANDS, DEVICES, devicesOfBrand, formatFcfa } from "@/data/catalog";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";
import "@/lib/i18n/segments/info";

export const Route = createFileRoute("/$locale/devis")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    return {
      meta: [
        { title: translate(locale, "devis.meta.title") },
        { name: "description", content: translate(locale, "devis.meta.description") },
        { property: "og:title", content: translate(locale, "devis.og.title") },
        { property: "og:description", content: translate(locale, "devis.og.description") },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: Devis,
});

function Devis() {
  const [brand, setBrand] = useState<string>("");
  const [deviceSlug, setDeviceSlug] = useState<string>("");
  const [faultSlug, setFaultSlug] = useState<string>("");
  const [sourceDetail, setSourceDetail] = useState<string | undefined>(undefined);
  const { locale, t } = useI18n();

  // Attribution : ?src= ou ?utm_source= (ex. "quartier-zogbadje") transmis au
  // formulaire pour tracer la provenance du lead. Lecture client uniquement.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const src = params.get("src") ?? params.get("utm_source");
    if (src) setSourceDetail(src.slice(0, 80));
  }, []);

  const devices = useMemo(() => (brand ? devicesOfBrand(brand) : []), [brand]);
  const device = useMemo(() => DEVICES.find((d) => d.slug === deviceSlug), [deviceSlug]);
  const fault = device?.faults.find((f) => f.slug === faultSlug);

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">{t("devis.eyebrow")}</span>
          <h1 className="at-display text-4xl md:text-6xl">{t("devis.title")}</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">{t("devis.intro")}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid gap-px border border-border bg-border md:grid-cols-3">
            <div className="bg-card p-6">
              <label htmlFor="brand" className="at-eyebrow mb-3 block">
                {t("devis.step1")}
              </label>
              <select
                id="brand"
                value={brand}
                onChange={(e) => {
                  setBrand(e.target.value);
                  setDeviceSlug("");
                  setFaultSlug("");
                }}
                className="h-11 w-full rounded-sm border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">{t("devis.select")}</option>
                {BRANDS.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-card p-6">
              <label htmlFor="device" className="at-eyebrow mb-3 block">
                {t("devis.step2")}
              </label>
              <select
                id="device"
                value={deviceSlug}
                disabled={!brand}
                onChange={(e) => {
                  setDeviceSlug(e.target.value);
                  setFaultSlug("");
                }}
                className="h-11 w-full rounded-sm border border-border bg-background px-3 text-sm disabled:opacity-50 focus:border-primary focus:outline-none"
              >
                <option value="">{t("devis.select")}</option>
                {devices.map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-card p-6">
              <label htmlFor="fault" className="at-eyebrow mb-3 block">
                {t("devis.step3")}
              </label>
              <select
                id="fault"
                value={faultSlug}
                disabled={!device}
                onChange={(e) => setFaultSlug(e.target.value)}
                className="h-11 w-full rounded-sm border border-border bg-background px-3 text-sm disabled:opacity-50 focus:border-primary focus:outline-none"
              >
                <option value="">{t("devis.select")}</option>
                {device?.faults.map((f) => (
                  <option key={f.slug} value={f.slug}>
                    {t(f.label)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {fault && device ? (
            <div className="mt-8 border border-border bg-card p-8">
              <span className="at-eyebrow">{t("devis.estimation")}</span>
              <h2 className="at-display mt-2 text-3xl">
                {device.name} — {t(fault.label)}
              </h2>
              <div className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-3">
                <div className="bg-card p-6">
                  <div className="font-mono text-3xl font-medium text-primary">
                    {formatFcfa(fault.price)}
                  </div>
                  <div className="at-eyebrow mt-2">{t("devis.priceAll")}</div>
                </div>
                <div className="bg-card p-6">
                  <div className="flex items-center gap-2 font-mono text-2xl font-medium">
                    <Clock className="size-5 text-muted-foreground" />
                    {t(fault.duration)}
                  </div>
                  <div className="at-eyebrow mt-2">{t("devis.delay")}</div>
                </div>
                <div className="bg-card p-6">
                  <div className="flex items-center gap-2 font-mono text-2xl font-medium">
                    <ShieldCheck className="size-5 text-muted-foreground" />
                    {t(fault.warranty)}
                  </div>
                  <div className="at-eyebrow mt-2">{t("devis.warranty")}</div>
                </div>
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                {t("devis.partNote", [t(fault.part)])}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild variant="technical" size="lg">
                  <Link to="/$locale/reservation" params={{ locale }}>
                    {t("devis.reserve")} <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button asChild variant="technicalOutline" size="lg">
                  <Link to="/$locale/appareil/$slug" params={{ locale, slug: device.slug }}>
                    {t("devis.allFaults")}
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-8 border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              {t("devis.emptyHint")}
            </p>
          )}

          <div className="mt-8">
            <MobileMoneyBar />
          </div>
        </div>
      </section>

      <section className="border-t border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow={t("devis.cta.eyebrow")}
            title={t("devis.cta.title")}
            text={t("devis.cta.text")}
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Button asChild variant="technical" className="self-start">
              <Link to="/$locale/reservation" params={{ locale }}>
                {t("devis.customQuote")}
              </Link>
            </Button>
            <LeadForm
              source="devis"
              {...(sourceDetail ? { sourceDetail } : {})}
              title={t("devis.form.title")}
              messageLabel={t("devis.form.messageLabel")}
              messagePlaceholder={t("devis.form.messagePlaceholder")}
              showReference={false}
              successText={t("devis.form.success")}
            />
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
