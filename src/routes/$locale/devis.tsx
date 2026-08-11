import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock, Download, Loader2, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { CtaBand, MobileMoneyBar, SectionHeader } from "@/components/site/Blocks";
import { LeadForm } from "@/components/site/LeadForm";
import { Button } from "@/components/ui/button";

const DevisComparison = lazy(() =>
  import("@/components/DevisComparison").then((m) => ({ default: m.DevisComparison })),
);
import { BRANDS, DEVICES, devicesOfBrand, formatFcfa } from "@/data/catalog";
import { useI18n } from "@/lib/i18n/context";
import { trackPlausibleEvent } from "@/lib/analytics";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";
import { submitLead } from "@/lib/leads.functions";

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
  const [leadSent, setLeadSent] = useState(false);
  const [compareItems, setCompareItems] = useState<
    { id: string; device: string; fault: string; price: number; duration: string; warranty: string; parts: string[] }[]
  >([]);
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

  const submitLeadFn = useServerFn(submitLead);

  const handleDemandeDevis = async () => {
    if (!device || !fault) return;
    try {
      await submitLeadFn({
        data: {
          source: "devis",
          sourceDetail: sourceDetail ?? `estimation-${device.slug}-${fault.slug}`,
          name: "",
          phone: "",
          email: "",
          reference: "",
          message: `${device.name} — ${t(fault.label)}\n${t("devis.estimateLabel")} ${formatFcfa(fault.price)}`,
          website: "",
        },
      });
      setLeadSent(true);
      toast.success(t("devis.lead.success"));
      trackPlausibleEvent("devis_submitted", { device: device.name, fault: t(fault.label) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("devis.lead.error"));
    }
  };

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
                  setLeadSent(false);
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
                  setLeadSent(false);
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
                onChange={(e) => {
                  setFaultSlug(e.target.value);
                  setLeadSent(false);
                }}
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
                {!leadSent ? (
                  <Button variant="secondary" size="lg" onClick={handleDemandeDevis}>
                    <Download className="mr-2 size-4" />
                    {t("devis.request")}
                  </Button>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-sm border border-success/40 bg-success/10 px-4 py-2 text-sm font-medium text-success">
                    {t("devis.lead.sent")}
                  </span>
                )}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    const id = `${device.slug}||${fault.slug}`;
                    if (compareItems.some((c) => c.id === id)) {
                      toast.info(t("devis.compare.added"));
                      return;
                    }
                    setCompareItems((prev) => [
                      ...prev,
                      {
                        id,
                        device: device.name,
                        fault: t(fault.label),
                        price: fault.price,
                        duration: t(fault.duration),
                        warranty: t(fault.warranty),
                        parts: [],
                      },
                    ]);
                    toast.success(t("devis.compare.added"));
                  }}
                >
                  <Plus className="mr-1 size-4" />
                  {t("devis.compare.addTo")}
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-8 border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              {t("devis.emptyHint")}
            </p>
          )}

          {compareItems.length >= 2 && (
            <div className="mt-8">
              <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>}>
                <DevisComparison
                  devis={compareItems}
                  onRemove={(id) => setCompareItems((prev) => prev.filter((c) => c.id !== id))}
                />
              </Suspense>
            </div>
          )}
          {compareItems.length === 1 && (
            <div className="mt-8 rounded-sm border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              {t("devis.compare.empty")}
            </div>
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
