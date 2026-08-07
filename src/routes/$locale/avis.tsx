import { createFileRoute } from "@tanstack/react-router";
import { CtaBand, ReviewsGrid, SectionHeader, Stars, TrustStats } from "@/components/site/Blocks";
import { REVIEWS } from "@/data/catalog";
import { listReviews } from "@/lib/content.functions";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import "@/lib/i18n/segments/avis";
import type { Locale } from "@/lib/i18n/locales";

export const Route = createFileRoute("/$locale/avis")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    return {
      meta: [
        { title: translate(locale, "avis.meta.title") },
        { name: "description", content: translate(locale, "avis.meta.description") },
        {
          property: "og:title",
          content: translate(locale, "avis.title"),
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  loader: () => listReviews({ data: { fallback: REVIEWS } }),
  component: Avis,
});

function Avis() {
  const reviews = Route.useLoaderData();
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / Math.max(reviews.length, 1);
  const { t } = useI18n();

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">{t("avis.eyebrow")}</span>
          <h1 className="at-display text-4xl md:text-6xl">{t("avis.title")}</h1>
          <div className="mt-6 flex items-center gap-4">
            <Stars n={Math.round(avg)} />
            <span className="font-mono text-sm">
              {avg.toFixed(1).replace(".", ",")}/5 · {reviews.length} {t("avis.verified")}
            </span>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <ReviewsGrid limit={Math.max(reviews.length, 1)} reviews={reviews} />
        </div>
      </section>

      <section className="border-t border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader eyebrow={t("avis.eyebrow")} title={t("avis.subtitle")} />
          <TrustStats />
        </div>
      </section>

      <CtaBand />
    </>
  );
}
