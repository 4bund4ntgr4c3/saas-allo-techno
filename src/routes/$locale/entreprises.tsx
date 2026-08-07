import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, FileText, Truck, Users } from "lucide-react";
import { CtaBand, SectionHeader, TrustStats } from "@/components/site/Blocks";
import { Button } from "@/components/ui/button";
import { COMPANY, formatFcfa } from "@/data/catalog";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import "@/lib/i18n/segments/entreprises";
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
  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">{t("entreprises.eyebrow")}</span>
          <h1 className="at-display text-4xl md:text-6xl">{t("entreprises.title")}</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">
            {t("entreprises.intro", [COMPANY.city])}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="technical" size="lg">
              <Link to="/$locale/contact" params={{ locale }}>
                {t("entreprises.cta.request")}
              </Link>
            </Button>
            <Button asChild variant="technicalOutline" size="lg">
              <Link to="/$locale/tarifs" params={{ locale }}>
                {t("entreprises.cta.pricing")}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow={t("entreprises.services.eyebrow")}
            title={t("entreprises.services.title")}
          />
          <div className="grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.t} className="bg-card p-8">
                  <Icon className="size-6 text-primary" />
                  <h3 className="mt-6 text-lg font-bold tracking-tight">{t(s.t)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{t(s.x)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow={t("entreprises.plans.eyebrow")}
            title={t("entreprises.plans.title")}
            text={t("entreprises.plans.text")}
          />
          <div className="grid gap-px border border-border bg-border md:grid-cols-3">
            {PLANS.map((p) => (
              <div key={p.name} className="bg-card p-8">
                <span className="at-eyebrow">{t(p.name)}</span>
                <div className="mt-4 font-mono text-3xl font-medium">
                  {p.price ? formatFcfa(p.price) : t("entreprises.onQuote")}
                  <span className="ml-1 text-sm text-muted-foreground">{t(p.unit)}</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm">
                  {p.items.map((i) => (
                    <li key={i} className="border-b border-border pb-3 text-muted-foreground">
                      {t(i)}
                    </li>
                  ))}
                </ul>
                <Button asChild variant="technicalOutline" className="mt-8 w-full">
                  <Link to="/$locale/contact" params={{ locale }}>
                    {t("entreprises.contact")}
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <TrustStats />
        </div>
      </section>

      <CtaBand />
    </>
  );
}
