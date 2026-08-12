import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Heart, MapPin, Shield, Wrench, Users } from "lucide-react";
import { CtaBand } from "@/components/site/Blocks";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";
import { PageBreadcrumb } from "@/components/site/PageBreadcrumb";
import { localeSeo } from "@/lib/seo";

export const Route = createFileRoute("/$locale/about")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const suffix = "/about";
    const seo = localeSeo(locale, suffix);
    return {
      meta: [
        { title: translate(locale, "about.meta.title") },
        { name: "description", content: translate(locale, "about.meta.description") },
        { property: "og:title", content: translate(locale, "about.meta.og.title") },
        { property: "og:description", content: translate(locale, "about.meta.og.description") },
        ...seo.meta,
      ],
      links: [...seo.links],
    };
  },
  component: About,
});

const VALUES = [
  { icon: Wrench, key: "expertise" },
  { icon: Shield, key: "confiance" },
  { icon: Heart, key: "proximite" },
  { icon: Award, key: "excellence" },
] as const;

const TIMELINE = [
  { year: "2020", key: "fondation" },
  { year: "2022", key: "atelier" },
  { year: "2024", key: "expansion" },
  { year: "2026", key: "aujourd" },
] as const;

function About() {
  const { locale, t } = useI18n();

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="at-eyebrow">{t("about.eyebrow")}</span>
            <PageBreadcrumb items={[{ label: t("nav.about") }]} />
          </div>
          <h1 className="at-display text-4xl md:text-6xl">{t("about.title")}</h1>
          <p className="mt-6 max-w-2xl text-muted-foreground">{t("about.hero")}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <span className="at-eyebrow mb-4 block">{t("about.mission.eyebrow")}</span>
              <h2 className="at-display text-3xl">{t("about.mission.title")}</h2>
              <p className="mt-6 leading-relaxed text-muted-foreground">
                {t("about.mission.text")}
              </p>
            </div>
            <div className="grid gap-px border border-border bg-border sm:grid-cols-2">
              {VALUES.map((v) => {
                const Icon = v.icon;
                return (
                  <div key={v.key} className="flex flex-col bg-card p-6">
                    <Icon className="size-6 text-primary" strokeWidth={1.5} />
                    <h3 className="mt-4 text-base font-bold tracking-tight">
                      {t(`about.values.${v.key}`)}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t(`about.values.${v.key}.text`)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-8 block">{t("about.timeline.eyebrow")}</span>
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-10">
              {TIMELINE.map((item) => (
                <div key={item.year} className="relative pl-10">
                  <div className="absolute left-0 top-1 flex items-center">
                    <span className="relative flex size-6 items-center justify-center">
                      <span className="relative inline-flex size-3 bg-primary" />
                    </span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-sm font-bold text-primary">{item.year}</span>
                    <h3 className="text-lg font-bold tracking-tight">
                      {t(`about.timeline.${item.key}`)}
                    </h3>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t(`about.timeline.${item.key}.text`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <span className="at-eyebrow mb-4 block">{t("about.chiffres.eyebrow")}</span>
              <h2 className="at-display text-3xl">{t("about.chiffres.title")}</h2>
              <div className="mt-8 grid gap-8 sm:grid-cols-2">
                {(["reparations", "clients", "satisfaction", "garantie"] as const).map((k) => (
                  <div key={k}>
                    <div className="font-mono text-3xl font-bold text-primary">
                      {t(`about.chiffres.${k}.value`)}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t(`about.chiffres.${k}.label`)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <div className="rounded-sm border border-border bg-card p-8">
                <div className="flex items-center gap-3">
                  <MapPin className="size-5 text-primary" />
                  <h3 className="text-lg font-bold">{t("about.localisation")}</h3>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{t("about.localisation.text")}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link
                    to="/$locale/contact"
                    params={{ locale }}
                    className="rounded-sm bg-primary px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    {t("about.localisation.cta")}
                  </Link>
                  <Link
                    to="/$locale/magasins"
                    params={{ locale }}
                    className="rounded-sm border border-border px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("about.localisation.stores")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            {(
              [
                { icon: Users, key: "equipe" },
                { icon: Award, key: "certifications" },
                { icon: Heart, key: "engagements" },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.key} className="text-center">
                  <Icon className="mx-auto size-8 text-primary" strokeWidth={1.5} />
                  <h3 className="mt-4 text-lg font-bold">{t(`about.extra.${item.key}`)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t(`about.extra.${item.key}.text`)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
