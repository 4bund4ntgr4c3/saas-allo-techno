import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CtaBand, SectionHeader } from "@/components/site/Blocks";
import { FAQ } from "@/data/catalog";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Questions fréquentes — Allô Techno Abomey-Calavi" },
      {
        name: "description",
        content:
          "Délais, garanties, paiement Mobile Money, données personnelles, suivi de dossier : toutes les réponses sur la réparation chez Allô Techno.",
      },
      { property: "og:title", content: "FAQ réparation — Allô Techno" },
      {
        property: "og:description",
        content: "Les réponses aux questions les plus posées par nos clients au Bénin.",
      },
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
  }),
  component: Faq,
});

const CATS = ["Toutes", ...Array.from(new Set(FAQ.map((f) => f.cat)))];

function Faq() {
  const [cat, setCat] = useState("Toutes");
  const [q, setQ] = useState("");

  const items = FAQ.filter(
    (f) =>
      (cat === "Toutes" || f.cat === cat) &&
      (q.trim() === "" || `${f.q} ${f.a}`.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">Aide</span>
          <h1 className="at-display text-4xl md:text-6xl">Questions fréquentes</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">
            Délais, garanties, paiement, confidentialité des données : l'essentiel avant de confier
            votre appareil.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher une question…"
            aria-label="Rechercher dans la FAQ"
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
                {c}
              </button>
            ))}
          </div>

          <div className="mt-8 divide-y divide-border border border-border bg-card">
            {items.map((f) => (
              <details key={f.q} className="group p-6">
                <summary className="cursor-pointer list-none text-sm font-bold tracking-tight marker:hidden">
                  {f.q}
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
            {items.length === 0 && (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Aucune question ne correspond à votre recherche.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow="Encore une question ?"
            title="Notre atelier répond en moins de 15 minutes"
            text="Appelez-nous, écrivez sur WhatsApp ou passez directement à Zogbadjè pendant les heures d'ouverture."
          />
        </div>
      </section>

      <CtaBand />
    </>
  );
}
