import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { CtaBand, SectionHeader } from "@/components/site/Blocks";
import { Button } from "@/components/ui/button";
import { FAQ } from "@/data/catalog";

export const Route = createFileRoute("/garantie")({
  head: () => ({
    meta: [
      { title: "Garantie réparation 6 mois — Allô Techno Abomey-Calavi" },
      {
        name: "description",
        content:
          "Écrans et batteries premium garantis 6 mois, micro-soudure 3 mois, pièces Apple d'origine jusqu'à 1 an. Conditions détaillées de la garantie Allô Techno.",
      },
      { property: "og:title", content: "Garantie réparation — Allô Techno" },
      {
        property: "og:description",
        content: "Ce que couvre notre garantie, sa durée, et comment la faire jouer en atelier.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Garantie,
});

const TIERS = [
  {
    d: "6 mois",
    t: "Écrans & batteries premium",
    x: "Pièces grade A+ et service pack posées en atelier.",
  },
  {
    d: "3 mois",
    t: "Pièces compatibles & micro-soudure",
    x: "Interventions carte mère, connecteurs de charge, nappes.",
  },
  {
    d: "12 mois",
    t: "Pièces Apple d'origine",
    x: "Sur les modèles éligibles au programme pièces d'origine.",
  },
];

const COVERED = [
  "Défaut de la pièce installée (dalle, batterie, connecteur…)",
  "Défaut de main-d'œuvre ou de montage",
  "Panne identique réapparaissant après intervention",
  "Réglages et calibrations liés à la réparation",
];

const NOT_COVERED = [
  "Nouvelle chute, choc ou pression sur l'écran",
  "Oxydation, contact avec un liquide après réparation",
  "Intervention réalisée par un tiers sur l'appareil",
  "Usure normale de la batterie au-delà des cycles annoncés",
];

function Garantie() {
  const garantieFaq = FAQ.filter((f) => f.cat === "Garantie");

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">Engagement atelier</span>
          <h1 className="at-display text-4xl md:text-6xl">Notre garantie</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">
            Chaque réparation est couverte, tracée sur votre facture et rejouable en atelier sans
            frais tant que la garantie court.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-px border border-border bg-border md:grid-cols-3">
            {TIERS.map((t) => (
              <div key={t.t} className="bg-card p-8">
                <ShieldCheck className="size-6 text-primary" />
                <div className="mt-6 font-mono text-3xl font-medium">{t.d}</div>
                <h2 className="mt-2 text-lg font-bold tracking-tight">{t.t}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t.x}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 grid gap-px border border-border bg-border md:grid-cols-2">
            <div className="bg-card p-8">
              <span className="at-eyebrow text-primary">Couvert</span>
              <ul className="mt-4 space-y-3 text-sm">
                {COVERED.map((c) => (
                  <li key={c} className="border-b border-border pb-3">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card p-8">
              <span className="at-eyebrow">Non couvert</span>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                {NOT_COVERED.map((c) => (
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
            eyebrow="Faire jouer la garantie"
            title="Trois étapes, sans frais"
            text="Munissez-vous de votre facture ou de votre numéro de dossier AT-2026-XXXX."
          />
          <ol className="grid gap-px border border-border bg-border md:grid-cols-3">
            {[
              "Vérifiez le statut de votre dossier en ligne",
              "Rapportez l'appareil à l'atelier de Zogbadjè",
              "Nous rediagnostiquons et réparons sans frais",
            ].map((s, i) => (
              <li key={s} className="bg-card p-6">
                <span className="font-mono text-3xl font-medium text-primary">{i + 1}</span>
                <p className="mt-4 text-sm">{s}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="technical">
              <Link to="/suivi">Suivre mon dossier</Link>
            </Button>
            <Button asChild variant="technicalOutline">
              <Link to="/contact">Contacter l'atelier</Link>
            </Button>
          </div>

          <div className="mt-12 divide-y divide-border border border-border bg-card">
            {garantieFaq.map((f) => (
              <details key={f.q} className="p-6">
                <summary className="cursor-pointer list-none text-sm font-bold tracking-tight">
                  {f.q}
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
