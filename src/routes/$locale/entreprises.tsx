import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, FileText, Truck, Users, ShieldCheck } from "lucide-react";
import { CtaBand, SectionHeader, TrustStats } from "@/components/site/Blocks";
import { Button } from "@/components/ui/button";
import { PageBreadcrumb } from "@/components/site/PageBreadcrumb";
import { B2BRequestForm } from "@/components/site/B2BRequestForm";
import type { SlaFormulaType } from "@/components/site/B2BRequestForm";
import { CoverageZoneEstimator } from "@/components/site/CoverageZoneEstimator";
import { RoiCalculatorModal } from "@/components/b2b/RoiCalculatorModal";
import { COMPANY, formatFcfa } from "@/data/catalog";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";

export const Route = createFileRoute("/$locale/entreprises")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    return {
      meta: [
        { title: translate(locale, "entreprises.meta.title") },
        { name: "description", content: translate(locale, "entreprises.meta.description") },
        { property: "og:title", content: translate(locale, "entreprises.meta.og.title") },
        {
          property: "og:description",
          content: translate(locale, "entreprises.meta.og.description"),
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: Entreprises,
});

const SERVICES = [
  {
    icon: Building2,
    t: "entreprises.service.parc.t",
    x: "entreprises.service.parc.x",
  },
  {
    icon: Truck,
    t: "entreprises.service.enlevement.t",
    x: "entreprises.service.enlevement.x",
  },
  {
    icon: Users,
    t: "entreprises.service.pret.t",
    x: "entreprises.service.pret.x",
  },
  {
    icon: FileText,
    t: "entreprises.service.facturation.t",
    x: "entreprises.service.facturation.x",
  },
];

const PLANS = [
  {
    name: "entreprises.plan.essentiel.name",
    price: 75000,
    unit: "entreprises.plan.month",
    items: [
      "entreprises.plan.essentiel.1",
      "entreprises.plan.essentiel.2",
      "entreprises.plan.essentiel.3",
      "entreprises.plan.essentiel.4",
    ],
  },
  {
    name: "entreprises.plan.business.name",
    price: 180000,
    unit: "entreprises.plan.month",
    items: [
      "entreprises.plan.business.1",
      "entreprises.plan.business.2",
      "entreprises.plan.business.3",
      "entreprises.plan.business.4",
    ],
  },
  {
    name: "entreprises.plan.custom.name",
    price: 0,
    unit: "",
    items: [
      "entreprises.plan.custom.1",
      "entreprises.plan.custom.2",
      "entreprises.plan.custom.3",
      "entreprises.plan.custom.4",
    ],
  },
];

function Entreprises() {
  const { locale, t } = useI18n();
  const [selectedFormula, setSelectedFormula] = useState<SlaFormulaType | undefined>(undefined);
  return (
    <div className="w-full max-w-full overflow-x-clip">
      {/* ─── Hero Header ─── */}
      <section className="border-b border-border py-10 bg-surface/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="at-eyebrow text-primary font-bold">
                Support Informatique Dédié aux Entreprises
              </span>
            </div>
            <PageBreadcrumb items={[{ label: "Offres B2B & SLA" }]} />
          </div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="max-w-2xl">
              <h1 className="at-display text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">
                {t("entreprises.title")}
              </h1>
              <p className="mt-2.5 text-sm sm:text-base text-muted-foreground">
                {t("entreprises.intro", [COMPANY.city])}
              </p>
            </div>
            <div className="flex items-center gap-3 bg-card border border-border px-4 py-2.5 shrink-0 self-start md:self-auto">
              <ShieldCheck className="size-5 text-emerald-600" />
              <div className="text-xs">
                <span className="font-bold block text-foreground">SLA Garanti &lt; 2h</span>
                <span className="text-muted-foreground text-[11px]">Prêt de Matériel Inclus</span>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button
              variant="technical"
              size="lg"
              className="w-full sm:w-auto text-center font-bold uppercase tracking-wider text-xs"
              onClick={() => {
                document.getElementById("b2b-form")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {t("entreprises.cta.request")} &rarr;
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-center font-bold uppercase tracking-wider text-xs"
            >
              <Link to="/$locale/tarifs" params={{ locale }}>
                {t("entreprises.cta.pricing")}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Embedded Interactive B2B Form Section */}
      <section className="border-b border-border bg-muted/20 py-8 sm:py-12 overflow-hidden">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 w-full">
          <B2BRequestForm key={selectedFormula || "default"} initialFormula={selectedFormula} />
        </div>
      </section>

      <section className="py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow={t("entreprises.services.eyebrow")}
            title={t("entreprises.services.title")}
          />
          <div className="grid gap-px border border-border bg-border grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.t} className="bg-card p-5 sm:p-6 md:p-8 min-w-0">
                  <Icon className="size-6 text-primary shrink-0" />
                  <h3 className="mt-4 sm:mt-6 text-base sm:text-lg font-bold tracking-tight break-words">
                    {t(s.t)}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground break-words">
                    {t(s.x)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-border py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow={t("entreprises.plans.eyebrow")}
            title={t("entreprises.plans.title")}
            text={t("entreprises.plans.text")}
          />
          <div className="grid gap-px border border-border bg-border grid-cols-1 md:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className="bg-card p-5 sm:p-6 md:p-8 flex flex-col justify-between min-w-0"
              >
                <div>
                  <span className="at-eyebrow">{t(p.name)}</span>
                  <div className="mt-3 sm:mt-4 font-mono text-2xl sm:text-3xl font-bold break-words">
                    {p.price ? formatFcfa(p.price) : t("entreprises.onQuote")}
                    <span className="ml-1 text-xs sm:text-sm text-muted-foreground font-normal">
                      {t(p.unit)}
                    </span>
                  </div>
                  <ul className="mt-4 sm:mt-6 space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
                    {p.items.map((i) => (
                      <li
                        key={i}
                        className="border-b border-border pb-2.5 sm:pb-3 text-muted-foreground break-words"
                      >
                        {t(i)}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button
                  variant="technical"
                  className="mt-6 sm:mt-8 w-full truncate"
                  onClick={() => {
                    const formulaKey: "essentiel" | "business" | "custom" = p.name.includes(
                      "essentiel",
                    )
                      ? "essentiel"
                      : p.name.includes("business")
                        ? "business"
                        : "custom";
                    setSelectedFormula(formulaKey);
                    document.getElementById("b2b-form")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Souscrire cette formule &rarr;
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Fleet ROI & Financial Depreciation Calculator ─── */}
      <section className="border-t border-border py-10 sm:py-16 bg-surface/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <RoiCalculatorModal />
        </div>
      </section>

      {/* ─── Coverage & Fast Courier Arrival Estimator ─── */}
      <section className="border-t border-border py-10 sm:py-14 bg-surface/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <CoverageZoneEstimator />
        </div>
      </section>

      <section className="border-t border-border py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <TrustStats />
        </div>
      </section>

      <CtaBand />
    </div>
  );
}
