import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgePercent, GraduationCap, School, ShoppingBag, Wrench } from "lucide-react";
import { CtaBand, MobileMoneyBar } from "@/components/site/Blocks";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";
import { localeSeo } from "@/lib/seo";

export const Route = createFileRoute("/$locale/promotions")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const suffix = "/promotions";
    const seo = localeSeo(locale, suffix);
    return {
      meta: [
        { title: translate(locale, "promotions.meta.title") },
        { name: "description", content: translate(locale, "promotions.meta.description") },
        { property: "og:title", content: translate(locale, "promotions.meta.og.title") },
        {
          property: "og:description",
          content: translate(locale, "promotions.meta.og.description"),
        },
        ...seo.meta,
      ],
      links: [...seo.links],
    };
  },
  component: Promotions,
});

function Promotions() {
  const { locale, t } = useI18n();

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">{t("promotions.eyebrow")}</span>
          <h1 className="at-display text-4xl md:text-6xl">{t("promotions.title")}</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">{t("promotions.hero")}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 border border-border bg-card px-4 py-2 text-sm font-bold">
              <GraduationCap className="size-4 text-primary" />
              {t("promotions.who")}
            </span>
          </div>
          <div className="mt-8">
            <MobileMoneyBar />
          </div>
        </div>
      </section>

      <section className="bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-center gap-6 border border-border bg-card p-10 text-center md:flex-row">
            <BadgePercent className="size-10 text-primary" strokeWidth={1.5} />
            <div>
              <h2 className="at-eyebrow">{t("promotions.code.title")}</h2>
              <div className="mt-2 flex items-center justify-center gap-3">
                <span className="border-2 border-dashed border-primary px-6 py-2 font-mono text-2xl font-bold tracking-widest text-primary">
                  SCHOOL10
                </span>
              </div>
              <p className="mt-3 max-w-md text-sm text-muted-foreground">
                {t("promotions.code.hint")}
              </p>
            </div>
          </div>

          <div className="mt-12 grid gap-px border border-border bg-border md:grid-cols-2">
            <div className="bg-card p-8">
              <School className="size-6 text-primary" strokeWidth={1.5} />
              <h3 className="mt-4 text-lg font-bold tracking-tight">
                {t("promotions.boutique.title")}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{t("promotions.boutique.text")}</p>
              <Button asChild variant="technical" className="mt-6">
                <Link to="/$locale/boutique" params={{ locale }}>
                  <ShoppingBag className="size-4" /> {t("promotions.boutique.cta")}
                </Link>
              </Button>
            </div>
            <div className="bg-card p-8">
              <Wrench className="size-6 text-primary" strokeWidth={1.5} />
              <h3 className="mt-4 text-lg font-bold tracking-tight">
                {t("promotions.reservation.title")}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("promotions.reservation.text")}
              </p>
              <Button asChild variant="technical" className="mt-6">
                <Link to="/$locale/reparations" params={{ locale }}>
                  {t("promotions.reservation.cta")}
                </Link>
              </Button>
            </div>
          </div>

          <p className="mt-8 max-w-2xl text-xs text-muted-foreground">{t("promotions.note")}</p>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
