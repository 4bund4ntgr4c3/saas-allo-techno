import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CtaBand, SectionHeader } from "@/components/site/Blocks";
import { FAQ } from "@/data/catalog";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";
import { PageBreadcrumb } from "@/components/site/PageBreadcrumb";
import "@/lib/i18n/segments/info";

export const Route = createFileRoute("/$locale/faq")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    return {
      meta: [
        { title: translate(locale, "faq.meta.title") },
        { name: "description", content: translate(locale, "faq.meta.description") },
        { property: "og:title", content: translate(locale, "faq.og.title") },
        { property: "og:description", content: translate(locale, "faq.og.description") },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: {
                "@type": "Answer",
                text: f.a,
              },
            })),
          }),
        },
      ],
    };
  },
  component: Faq,
});

const ALL = "__all__";
const CATS = [ALL, ...Array.from(new Set(FAQ.map((f) => f.cat)))];

const CAT_I18N: Record<string, string> = {
  Reparation: "faq.cat.repair",
  Garantie: "faq.cat.warranty",
  Paiement: "faq.cat.payment",
  Donnees: "faq.cat.data",
  Suivi: "faq.cat.tracking",
};

function Faq() {
  const [cat, setCat] = useState(ALL);
  const [q, setQ] = useState("");
  const { t } = useI18n();

  const items = FAQ.filter(
    (f) =>
      (cat === ALL || f.cat === cat) &&
      (q.trim() === "" || `${f.q} ${f.a}`.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="at-eyebrow">{t("faq.eyebrow")}</span>
            <PageBreadcrumb items={[{ label: t("nav.faq") }]} />
          </div>
          <h1 className="at-display text-4xl md:text-6xl">{t("faq.title")}</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">{t("faq.intro")}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("faq.searchPlaceholder")}
            aria-label={t("faq.searchAria")}
            className="h-11 w-full rounded-sm border border-border bg-background px-4 text-sm focus:border-primary focus:outline-none"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  cat === c
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {c === ALL ? t("faq.all") : (CAT_I18N[c] ? t(CAT_I18N[c]) : c)}
              </button>
            ))}
          </div>

          <div className="mt-8 divide-y divide-border border border-border bg-card">
            {items.map((f) => (
              <details key={f.q} className="group p-6">
                <summary className="cursor-pointer list-none text-sm font-bold tracking-tight marker:hidden">
                  {t(f.q)}
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{t(f.a)}</p>
              </details>
            ))}
            {items.length === 0 && (
              <p className="p-8 text-center text-sm text-muted-foreground">{t("faq.noResult")}</p>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow={t("faq.cta.eyebrow")}
            title={t("faq.cta.title")}
            text={t("faq.cta.text")}
          />
        </div>
      </section>

      <CtaBand />
    </>
  );
}
