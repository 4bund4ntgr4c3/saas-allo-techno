import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftRight, Cpu, RotateCcw, Save, ShieldCheck, SprayCan } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CtaBand, MobileMoneyBar } from "@/components/site/Blocks";
import { Button } from "@/components/ui/button";
import { SERVICES } from "@/data/services";
import { COMPANY, formatFcfa } from "@/data/catalog/company";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";
import { PageBreadcrumb } from "@/components/site/PageBreadcrumb";
import { localeSeo } from "@/lib/seo";

export const Route = createFileRoute("/$locale/services")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const suffix = "/services";
    const seo = localeSeo(locale, suffix);
    return {
      meta: [
        { title: translate(locale, "services.meta.title") },
        { name: "description", content: translate(locale, "services.meta.description") },
        { property: "og:title", content: translate(locale, "services.meta.og.title") },
        { property: "og:description", content: translate(locale, "services.meta.og.description") },
        ...seo.meta,
      ],
      links: [...seo.links],
    };
  },
  component: Services,
});

const SERVICE_ICONS: Record<string, LucideIcon> = {
  spray: SprayCan,
  transfer: ArrowLeftRight,
  backup: Save,
  reset: RotateCcw,
  cpu: Cpu,
  shield: ShieldCheck,
};

function Services() {
  const { locale, t } = useI18n();

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="at-eyebrow">{t("services.eyebrow")}</span>
            <PageBreadcrumb items={[{ label: t("nav.services") }]} />
          </div>
          <h1 className="at-display text-4xl md:text-6xl">{t("services.title")}</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">{t("services.hero")}</p>
          <div className="mt-8">
            <MobileMoneyBar />
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => {
              const Icon = SERVICE_ICONS[s.icon] ?? SprayCan;
              const prefix = `services.${s.i18nKey}`;
              return (
                <article key={s.slug} className="flex flex-col bg-card p-6">
                  <div className="flex items-center justify-between">
                    <Icon className="size-6 text-primary" strokeWidth={1.5} />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t("services.duration")} {s.duration}
                    </span>
                  </div>
                  <h2 className="mt-4 text-base font-bold tracking-tight">
                    {t(`${prefix}.label`)}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t(`${prefix}.short`)}
                  </p>
                  <ul className="mt-4 space-y-1">
                    {[1, 2, 3].map((i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span className="text-primary">+</span>
                        <span>{t(`${prefix}.bullet.${i}`)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 font-mono text-xl font-medium text-primary">
                    {formatFcfa(s.price)}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {t("services.reservation")}
                  </p>
                  <Button asChild variant="technical" size="sm" className="mt-6">
                    <Link
                      to="/$locale/reparations"
                      params={{ locale }}
                      search={{ device: "phone", panne: s.slug }}
                    >
                      {t("services.cta")}
                    </Link>
                  </Button>
                </article>
              );
            })}
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            {t("services.contact", [COMPANY.phone, COMPANY.city])}
          </p>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
