import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { CtaBand, SectionHeader } from "@/components/site/Blocks";
import { Button } from "@/components/ui/button";
import { FAQ } from "@/data/catalog";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import { localeSeo } from "@/lib/seo";
import type { Locale } from "@/lib/i18n/locales";

export const Route = createFileRoute("/$locale/garantie")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const suffix = "/garantie";
    return {
      meta: [
        { title: translate(locale, "garantie.meta.title") },
        { name: "description", content: translate(locale, "garantie.meta.description") },
        { property: "og:title", content: translate(locale, "garantie.og.title") },
        { property: "og:description", content: translate(locale, "garantie.og.description") },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [...localeSeo(locale, suffix).links],
    };
  },
  component: Garantie,
});

function Garantie() {
  const { locale, t } = useI18n();
  const garantieFaq = FAQ.filter((f) => f.cat === "Garantie");
  const tiers = [
    { d: t("garantie.tier1.d"), t: t("garantie.tier1.t"), x: t("garantie.tier1.x") },
    { d: t("garantie.tier2.d"), t: t("garantie.tier2.t"), x: t("garantie.tier2.x") },
    { d: t("garantie.tier3.d"), t: t("garantie.tier3.t"), x: t("garantie.tier3.x") },
  ];
  const covered = [1, 2, 3, 4].map((i) => t(`garantie.covered${i}`));
  const notCovered = [1, 2, 3, 4].map((i) => t(`garantie.notcovered${i}`));

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">{t("garantie.eyebrow")}</span>
          <h1 className="at-display text-4xl md:text-6xl">{t("garantie.title")}</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">{t("garantie.intro")}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-px border border-border bg-border md:grid-cols-3">
            {tiers.map((tier) => (
              <div key={tier.t} className="bg-card p-8">
                <ShieldCheck className="size-6 text-primary" />
                <div className="mt-6 font-mono text-3xl font-medium">{tier.d}</div>
                <h2 className="mt-2 text-lg font-bold tracking-tight">{tier.t}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{tier.x}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 grid gap-px border border-border bg-border md:grid-cols-2">
            <div className="bg-card p-8">
              <span className="at-eyebrow text-primary">{t("garantie.covered")}</span>
              <ul className="mt-4 space-y-3 text-sm">
                {covered.map((c) => (
                  <li key={c} className="border-b border-border pb-3">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card p-8">
              <span className="at-eyebrow">{t("garantie.notCovered")}</span>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                {notCovered.map((c) => (
                  <li key={c} className="border-b border-border pb-3">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <SectionHeader
            eyebrow={t("garantie.claim.eyebrow")}
            title={t("garantie.claim.title")}
            text={t("garantie.claim.text")}
          />
          <ol className="grid gap-px border border-border bg-border md:grid-cols-3">
            {[t("garantie.step1"), t("garantie.step2"), t("garantie.step3")].map((s, i) => (
              <li key={s} className="bg-card p-6">
                <span className="font-mono text-3xl font-medium text-primary">{i + 1}</span>
                <p className="mt-4 text-sm">{s}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="technical">
              <Link to="/$locale/suivi" params={{ locale }}>
                {t("garantie.track")}
              </Link>
            </Button>
            <Button asChild variant="technicalOutline">
              <Link to="/$locale/contact" params={{ locale }}>
                {t("garantie.contact")}
              </Link>
            </Button>
          </div>

          <div className="mt-12 divide-y divide-border border border-border bg-card">
            {garantieFaq.map((f) => (
              <details key={f.q} className="p-6">
                <summary className="cursor-pointer list-none text-sm font-bold tracking-tight">
                  {t(f.q)}
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{t(f.a)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
