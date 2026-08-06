import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, FileText, Truck, Users } from "lucide-react";
import { CtaBand, SectionHeader, TrustStats } from "@/components/site/Blocks";
import { Button } from "@/components/ui/button";
import { COMPANY, formatFcfa } from "@/data/catalog";

export const Route = createFileRoute("/entreprises")({
  head: () => ({
    meta: [
      { title: "Maintenance informatique entreprises — Allô Techno Bénin" },
      {
        name: "description",
        content:
          "Contrats de maintenance, parc informatique, facturation et virement B2B : Allô Techno accompagne les entreprises et ONG à Abomey-Calavi et Cotonou.",
      },
      { property: "og:title", content: "Offre entreprises — Allô Techno" },
      {
        property: "og:description",
        content:
          "Prise en charge prioritaire, appareils de prêt et facturation adaptée aux structures.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Entreprises,
});

const SERVICES = [
  {
    icon: Building2,
    t: "Gestion de parc",
    x: "Inventaire, étiquetage et historique d'intervention par appareil.",
  },
  {
    icon: Truck,
    t: "Enlèvement sur site",
    x: "Collecte et restitution à votre bureau à Abomey-Calavi, Cotonou et Godomey.",
  },
  {
    icon: Users,
    t: "Appareils de prêt",
    x: "Un poste ou smartphone de remplacement pendant l'immobilisation.",
  },
  {
    icon: FileText,
    t: "Facturation B2B",
    x: "Devis signés, factures conformes et paiement par virement à 30 jours.",
  },
];

const PLANS = [
  {
    name: "Essentiel",
    price: 75000,
    unit: "/ mois",
    items: [
      "Jusqu'à 15 appareils",
      "Prise en charge sous 48 h",
      "Diagnostic illimité",
      "Facturation mensuelle",
    ],
  },
  {
    name: "Business",
    price: 180000,
    unit: "/ mois",
    items: [
      "Jusqu'à 50 appareils",
      "Prise en charge sous 24 h",
      "Enlèvement sur site inclus",
      "2 appareils de prêt",
    ],
  },
  {
    name: "Sur mesure",
    price: 0,
    unit: "",
    items: ["Parc illimité", "Technicien dédié", "SLA contractuel", "Reporting trimestriel"],
  },
];

function Entreprises() {
  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">Offre B2B</span>
          <h1 className="at-display text-4xl md:text-6xl">Entreprises & institutions</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">
            Un parc immobilisé coûte plus cher qu'une réparation. Nous maintenons les appareils des
            PME, ONG et administrations de {COMPANY.city} et Cotonou avec des délais contractuels.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="technical" size="lg">
              <Link to="/contact">Demander une proposition</Link>
            </Button>
            <Button asChild variant="technicalOutline" size="lg">
              <Link to="/tarifs">Voir la grille tarifaire</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader eyebrow="Prestations" title="Ce que couvre le contrat" />
          <div className="grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.t} className="bg-card p-8">
                  <Icon className="size-6 text-primary" />
                  <h3 className="mt-6 text-lg font-bold tracking-tight">{s.t}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.x}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow="Formules"
            title="Contrats de maintenance"
            text="Tarifs hors pièces détachées, facturées au prix de la grille publique."
          />
          <div className="grid gap-px border border-border bg-border md:grid-cols-3">
            {PLANS.map((p) => (
              <div key={p.name} className="bg-card p-8">
                <span className="at-eyebrow">{p.name}</span>
                <div className="mt-4 font-mono text-3xl font-medium">
                  {p.price ? formatFcfa(p.price) : "Sur devis"}
                  <span className="ml-1 text-sm text-muted-foreground">{p.unit}</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm">
                  {p.items.map((i) => (
                    <li key={i} className="border-b border-border pb-3 text-muted-foreground">
                      {i}
                    </li>
                  ))}
                </ul>
                <Button asChild variant="technicalOutline" className="mt-8 w-full">
                  <Link to="/contact">Nous contacter</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <TrustStats />
        </div>
      </section>

      <CtaBand />
    </>
  );
}
