import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { CtaBand } from "@/components/site/Blocks";
import { COMPANY } from "@/data/catalog/company";
import { QUARTIERS, QUARTIER_INFO, type QuartierInfo } from "@/data/local-seo";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale, type Locale } from "@/lib/i18n/locales";
import "@/lib/i18n/segments/quartiers";
import { localeSeo, localeUrl } from "@/lib/seo";

export const Route = createFileRoute("/$locale/quartiers/")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const suffix = "/quartiers";
    const seo = localeSeo(locale, suffix);
    return {
      meta: [
        { title: translate(locale, "quartiers.meta.title") },
        { name: "description", content: translate(locale, "quartiers.meta.description") },
        { property: "og:title", content: translate(locale, "quartiers.meta.og.title") },
        {
          property: "og:description",
          content: translate(locale, "quartiers.meta.og.description"),
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...seo.meta,
      ],
      links: [...seo.links],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "CollectionPage",
                name: translate(locale, "quartiers.page.title"),
                url: localeUrl(locale, "/quartiers"),
                mainEntity: {
                  "@type": "ItemList",
                  itemListElement: QUARTIER_INFO.map((q, i) => ({
                    "@type": "ListItem",
                    position: i + 1,
                    name: q.name,
                    url: localeUrl(locale, `/quartiers/${q.slug}`),
                  })),
                },
              },
              {
                "@type": "LocalBusiness",
                name: COMPANY.name,
                telephone: COMPANY.phone,
                email: COMPANY.email,
                address: {
                  "@type": "PostalAddress",
                  streetAddress: COMPANY.address,
                  addressLocality: COMPANY.city,
                  addressCountry: "BJ",
                },
                geo: { "@type": "GeoCoordinates", latitude: COMPANY.lat, longitude: COMPANY.lng },
                areaServed: [...QUARTIERS, "Abomey-Calavi", "Cotonou"],
              },
            ],
          }),
        },
      ],
    };
  },
  component: QuartiersIndex,
});

function QuartiersIndex() {
  const { locale, t } = useI18n();

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">{t("quartiers.page.eyebrow")}</span>
          <h1 className="at-display text-4xl md:text-6xl">{t("quartiers.page.title")}</h1>
          <p className="mt-6 max-w-2xl text-muted-foreground">{t("quartiers.page.text")}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
            {QUARTIER_INFO.map((q) => (
              <QuartierCard key={q.slug} quartier={q} locale={locale} />
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}

function QuartierCard({ quartier, locale }: { quartier: QuartierInfo; locale: Locale }) {
  const { t } = useI18n();
  const local = quartier.local[locale];
  return (
    <Link
      to="/$locale/quartiers/$slug"
      params={{ locale, slug: quartier.slug }}
      className="group flex flex-col bg-card p-8 transition-colors hover:bg-surface"
    >
      <h2 className="text-lg font-bold tracking-tight">{quartier.name}</h2>
      <p className="mt-3 line-clamp-4 text-sm text-muted-foreground">{local.intro}</p>
      <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-primary">
        {t("quartiers.cta")} <ArrowRight className="ml-1 inline size-3" />
      </p>
    </Link>
  );
}
