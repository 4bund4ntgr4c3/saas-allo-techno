import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, Clock, GraduationCap, MapPin, Shield, TrendingUp, Wrench } from "lucide-react";
import { CtaBand } from "@/components/site/Blocks";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";
import { localeSeo } from "@/lib/seo";

export const Route = createFileRoute("/$locale/work-at")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const suffix = "/work-at";
    const seo = localeSeo(locale, suffix);
    return {
      meta: [
        { title: translate(locale, "work-at.meta.title") },
        { name: "description", content: translate(locale, "work-at.meta.description") },
        { property: "og:title", content: translate(locale, "work-at.meta.og.title") },
        { property: "og:description", content: translate(locale, "work-at.meta.og.description") },
        ...seo.meta,
      ],
      links: [...seo.links],
    };
  },
  component: WorkAt,
});

const ROLES = [
  { icon: Wrench, key: "technicien" },
  { icon: Briefcase, key: "commercial" },
  { icon: GraduationCap, key: "stagiare" },
  { icon: TrendingUp, key: "manager" },
] as const;

const PERKS = [
  { icon: Shield, key: "stabilite" },
  { icon: GraduationCap, key: "formation" },
  { icon: Clock, key: "equilibre" },
  { icon: MapPin, key: "proximite" },
] as const;

function WorkAt() {
  const { locale, t } = useI18n();

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">{t("work-at.eyebrow")}</span>
          <h1 className="at-display text-4xl md:text-6xl">{t("work-at.title")}</h1>
          <p className="mt-6 max-w-2xl text-muted-foreground">{t("work-at.hero")}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">{t("work-at.why.eyebrow")}</span>
          <h2 className="at-display text-3xl">{t("work-at.why.title")}</h2>
          <p className="mt-4 max-w-xl text-muted-foreground">{t("work-at.why.text")}</p>
          <div className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {PERKS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.key} className="flex flex-col bg-card p-6">
                  <Icon className="size-6 text-primary" strokeWidth={1.5} />
                  <h3 className="mt-4 text-base font-bold tracking-tight">
                    {t(`work-at.perks.${p.key}`)}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t(`work-at.perks.${p.key}.text`)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-8 block">{t("work-at.roles.eyebrow")}</span>
          <div className="grid gap-6 md:grid-cols-2">
            {ROLES.map((r) => {
              const Icon = r.icon;
              return (
                <article key={r.key} className="rounded-sm border border-border bg-card p-6">
                  <div className="flex items-center gap-3">
                    <Icon className="size-5 text-primary" strokeWidth={1.5} />
                    <h3 className="text-lg font-bold">{t(`work-at.roles.${r.key}`)}</h3>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {t(`work-at.roles.${r.key}.text`)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-sm border border-border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t(`work-at.roles.${r.key}.type`)}
                    </span>
                    <span className="rounded-sm border border-border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t(`work-at.roles.${r.key}.location`)}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <span className="at-eyebrow mb-4 block">{t("work-at.process.eyebrow")}</span>
              <h2 className="at-display text-3xl">{t("work-at.process.title")}</h2>
              <ol className="mt-8 space-y-6">
                {(["candidature", "entretien", "essai", "embauche"] as const).map((step, i) => (
                  <li key={step} className="flex gap-4">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-primary font-mono text-sm font-bold text-primary">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-bold">{t(`work-at.process.${step}`)}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t(`work-at.process.${step}.text`)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex flex-col justify-center">
              <div className="rounded-sm border border-border bg-card p-8">
                <h3 className="text-lg font-bold">{t("work-at.apply.title")}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{t("work-at.apply.text")}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/$locale/contact"
                    params={{ locale }}
                    className="rounded-sm bg-primary px-6 py-3 text-[10px] font-extrabold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    {t("work-at.apply.cta")}
                  </Link>
                  <a
                    href={`mailto:recrutement@allotechno.africa`}
                    className="rounded-sm border border-border px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("work-at.apply.email")}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
