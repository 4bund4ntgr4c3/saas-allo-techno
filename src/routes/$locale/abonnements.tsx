import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageBreadcrumb } from "@/components/site/PageBreadcrumb";
import { formatFcfa } from "@/data/catalog/company";
import { normalizeLocale, type Locale } from "@/lib/i18n/locales";
import { localeSeo } from "@/lib/seo";

export const Route = createFileRoute("/$locale/abonnements")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const seo = localeSeo(locale, "/services");
    return {
      meta: [
        { title: "Abonnements & Packs Sérénité Maintenance — Allô Techno" },
        {
          name: "description",
          content:
            "Abonnements d'entretien préventif annuel, dépoussiérages illimités et prêt de PC de courtoisie pour particuliers et professionnels.",
        },
        ...seo.meta,
      ],
      links: [...seo.links],
    };
  },
  component: SubscriptionsPage,
});

function SubscriptionsPage() {
  const plans = [
    {
      id: "particulier",
      name: "Pack Sérénité Solo",
      target: "Étudiants & Particuliers",
      priceMonthlyFcfa: 4900,
      priceAnnualFcfa: 49000,
      popular: false,
      features: [
        "2 révisions complètes par an (dépoussiérage & pâte thermique)",
        "Bilan santé batterie & stockage SSD semestriel",
        "Assistance WhatsApp prioritaire avec un technicien",
        "Remise permanente de -15% sur toutes les pièces détachées",
        "Priorité atelier 24h",
      ],
    },
    {
      id: "freelance",
      name: "Pack Sérénité Pro & Créateur",
      target: "Freelances, Développeurs & Cadres",
      priceMonthlyFcfa: 12500,
      priceAnnualFcfa: 125000,
      popular: true,
      features: [
        "Entretien thermique illimité (Spécial Harmattan & Chaleur)",
        "Prêt d'un PC/Mac de courtoisie gratuit jusqu'à 3 jours / an",
        "Nettoyage antivirus, spyware & optimisation système trimestrielle",
        "Remise permanente de -20% sur les réparations et pièces",
        "Coupe-file atelier prioritaire 2h",
      ],
    },
    {
      id: "pme",
      name: "Pack Sérénité Flotte PME (jusqu'à 5 postes)",
      target: "Bureaux, Agences & Cabinets",
      priceMonthlyFcfa: 29000,
      priceAnnualFcfa: 290000,
      popular: false,
      features: [
        "Visite technique mensuelle sur site (Cotonou & Calavi)",
        "Audit thermique, santé des batteries et contrôle onduleurs",
        "Prêt d'ordinateurs de remplacement en cas d'immobilisation",
        "Support technique d'astreinte 6j/7",
        "Rapports de maintenance et d'inventaire trimestriels pour le DAF",
      ],
    },
  ];

  return (
    <div className="min-h-screen pb-16">
      {/* ─── Hero Header ─── */}
      <section className="border-b border-border py-12 bg-surface/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="at-eyebrow text-primary font-bold">Tranquillité &amp; Longévité</span>
            <PageBreadcrumb items={[{ label: "Abonnements Sérénité" }]} />
          </div>
          <h1 className="at-display text-3xl sm:text-5xl font-extrabold text-foreground">
            Abonnements de Maintenance Préventive
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl">
            Préservez la durée de vie de vos ordinateurs face à la chaleur et à la poussière.
            Bénéficiez d'entretiens illimités, d'un ordinateur de secours et d'une priorité absolue
            en atelier.
          </p>
        </div>
      </section>

      {/* ─── Plans Grid ─── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`border rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all ${
              plan.popular
                ? "border-primary bg-card shadow-xl relative ring-1 ring-primary/30"
                : "border-border bg-card shadow-xs"
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">{plan.target}</span>
                {plan.popular && (
                  <Badge
                    variant="outline"
                    className="text-primary border-primary/40 bg-primary/10 text-[10px] uppercase font-bold"
                  >
                    Recommandé
                  </Badge>
                )}
              </div>

              <div>
                <h3 className="font-bold text-base text-foreground">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <strong className="text-2xl sm:text-3xl font-mono font-extrabold text-foreground">
                    {formatFcfa(plan.priceMonthlyFcfa)}
                  </strong>
                  <span className="text-xs text-muted-foreground">/ mois</span>
                </div>
                <span className="text-[11px] text-muted-foreground block mt-0.5">
                  ou {formatFcfa(plan.priceAnnualFcfa)} / an (2 mois offerts)
                </span>
              </div>

              <div className="border-t border-border/80 pt-4 space-y-2.5">
                <span className="text-[11px] font-bold text-foreground uppercase tracking-wide block">
                  Avantages Inclus :
                </span>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-foreground">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Button
              asChild
              variant={plan.popular ? "technical" : "outline"}
              className="w-full font-bold uppercase tracking-wider text-xs"
            >
              <a
                href={`https://wa.me/22960000000?text=${encodeURIComponent(
                  `Bonjour Allô Techno, je souhaite souscrire à l'abonnement "${plan.name}" (${formatFcfa(
                    plan.priceMonthlyFcfa,
                  )}/mois).`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Souscrire à la Formule &rarr;
              </a>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
