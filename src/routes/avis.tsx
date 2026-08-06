import { createFileRoute } from "@tanstack/react-router";
import { CtaBand, ReviewsGrid, SectionHeader, Stars, TrustStats } from "@/components/site/Blocks";
import { REVIEWS } from "@/data/catalog";

export const Route = createFileRoute("/avis")({
  head: () => ({
    meta: [
      { title: "Avis clients — Allô Techno Abomey-Calavi" },
      {
        name: "description",
        content:
          "Plus de 5 000 appareils réparés et 4,8/5 de satisfaction : lisez les avis vérifiés des clients Allô Techno à Abomey-Calavi et Cotonou.",
      },
      { property: "og:title", content: "Avis clients — Allô Techno" },
      {
        property: "og:description",
        content: "Témoignages vérifiés de nos clients réparation smartphone, ordinateur et console au Bénin.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Avis,
});

function Avis() {
  const avg = REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length;

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">Ils nous font confiance</span>
          <h1 className="at-display text-4xl md:text-6xl">Avis clients</h1>
          <div className="mt-6 flex items-center gap-4">
            <Stars n={Math.round(avg)} />
            <span className="font-mono text-sm">
              {avg.toFixed(1).replace(".", ",")}/5 · {REVIEWS.length} avis vérifiés
            </span>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <ReviewsGrid limit={REVIEWS.length} />
        </div>
      </section>

      <section className="border-t border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader eyebrow="En chiffres" title="Une expertise mesurable" />
          <TrustStats />
        </div>
      </section>

      <CtaBand />
    </>
  );
}
