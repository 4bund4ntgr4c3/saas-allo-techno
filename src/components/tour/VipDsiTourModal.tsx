import * as React from "react";
import { Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function VipDsiTourModal() {
  const [currentStep, setCurrentStep] = React.useState(0);

  const steps = [
    {
      title: "1. Cartographie & Santé Prédictive de Flotte",
      desc: "Visualisez en un clin d'œil vos 50+ postes de travail (Cotonou, Calavi, Porto-Novo), leurs scores de santé thermique et l'usure de leurs batteries.",
      metric: "99.8% Disponibilité Flotte",
      badge: "Vue DSI Consolidée",
    },
    {
      title: "2. Signalement Incident & Engagement SLA < 2h",
      desc: "Un collaborateur subit une panne d'écran ? Créez un ticket critique en 10 secondes. Le coursier est dépêché immédiatement avec un PC de secours.",
      metric: "MTTR Moyen : 47 minutes",
      badge: "SLA Platine",
    },
    {
      title: "3. Laboratoire Technique & Micro-Soudure",
      desc: "Intervention sous microscope binoculaire, remplacement de pièces d'origine certifiées et PV de réception signé électroniquement sur tablette.",
      metric: "Garantie 6 Mois Inviolable",
      badge: "Certifié Apple & Dell",
    },
    {
      title: "4. Facturation SYSCOHADA & Bilan RSE Carbone",
      desc: "Clôture mensuelle automatisée avec facture normalisée e-MECeF pour le DAF et calcul des tonnes de CO2 évitées grâce au reconditionnement.",
      metric: "Économie Moyenne : +42% vs Neuf",
      badge: "Conforme DGI Bénin",
    },
  ];

  const current = steps[currentStep] ?? {
    title: "1. Cartographie & Santé Prédictive de Flotte",
    desc: "Visualisez en un clin d'œil vos 50+ postes de travail (Cotonou, Calavi, Porto-Novo), leurs scores de santé thermique et l'usure de leurs batteries.",
    metric: "99.8% Disponibilité Flotte",
    badge: "Vue DSI Consolidée",
  };

  return (
    <div className="border border-border bg-card p-5 sm:p-7 rounded-2xl max-w-xl mx-auto space-y-6 shadow-xl animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">
            Visite Démo VIP — Plateforme Entreprises
          </h3>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-[10px] text-primary border-primary/40 bg-primary/10"
        >
          Étape {currentStep + 1} / {steps.length}
        </Badge>
      </div>

      {/* ─── Step Content ─── */}
      <div className="space-y-3 bg-surface p-5 rounded-xl border border-border">
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className="text-xs font-mono font-bold text-emerald-600 border-emerald-600/40 bg-emerald-600/10"
          >
            {current.badge}
          </Badge>
          <strong className="text-xs font-mono text-primary font-bold">{current.metric}</strong>
        </div>

        <h4 className="font-bold text-base text-foreground mt-2">{current.title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{current.desc}</p>
      </div>

      {/* ─── Stepper Controls ─── */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === currentStep ? "w-6 bg-primary" : "w-2 bg-border"
              }`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          {currentStep > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep((p) => p - 1)}
              className="text-xs"
            >
              Précédent
            </Button>
          )}

          {currentStep < steps.length - 1 ? (
            <Button
              variant="technical"
              size="sm"
              onClick={() => setCurrentStep((p) => p + 1)}
              className="text-xs font-bold uppercase tracking-wider"
            >
              Suivant <ChevronRight className="size-3.5 ml-1" />
            </Button>
          ) : (
            <Button
              asChild
              variant="technical"
              size="sm"
              className="text-xs font-bold uppercase tracking-wider"
            >
              <a
                href={`https://wa.me/22960000000?text=${encodeURIComponent(
                  "Bonjour Allô Techno Direction, nous souhaitons planifier un entretien pour la mise en place d'une convention de maintenance pour notre entreprise.",
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Planifier un Audit Flotte Offert &rarr;
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
