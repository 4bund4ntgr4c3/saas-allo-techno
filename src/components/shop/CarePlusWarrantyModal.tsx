import * as React from "react";
import { CheckCircle2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";
import { CARE_PLUS_PLANS } from "@/lib/extended-warranty-engine";

export function CarePlusWarrantyModal() {
  const [selectedPlanId, setSelectedPlanId] = React.useState<"care_plus_12m" | "care_plus_24m">("care_plus_12m");

  const selectedPlan = CARE_PLUS_PLANS.find((p) => p.planId === selectedPlanId) || CARE_PLUS_PLANS[0];

  return (
    <div className="border border-border bg-card p-5 sm:p-7 rounded-2xl max-w-xl mx-auto space-y-6 shadow-xl animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Award className="size-5 text-amber-500 shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Allô Techno Care+ — Garantie Casse &amp; Surtension
            </h3>
            <p className="text-xs text-muted-foreground">
              L'assurance tout-inclus pour votre Mac ou PC portable avec 0 FCFA de franchise
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] text-amber-600 border-amber-600/40 bg-amber-600/10 font-bold">
          0 FCFA de Franchise
        </Badge>
      </div>

      {/* ─── Plan Selector ─── */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {CARE_PLUS_PLANS.map((plan) => (
          <button
            key={plan.planId}
            type="button"
            onClick={() => setSelectedPlanId(plan.planId)}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedPlanId === plan.planId
                ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                : "border-border bg-surface hover:border-border/80"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-bold text-foreground">Care+ {plan.durationMonths} Mois</span>
              {plan.durationMonths === 24 && (
                <Badge className="bg-amber-500 text-white text-[9px] font-bold border-0">Conseillé</Badge>
              )}
            </div>
            <strong className="text-lg font-mono font-extrabold text-primary block mt-1">
              {formatFcfa(plan.pricePerYearFcfa)}
            </strong>
            <span className="text-[10px] text-muted-foreground">Pour toute la durée de couverture</span>
          </button>
        ))}
      </div>

      {/* ─── Selected Plan Perks ─── */}
      {selectedPlan && (
        <div className="p-4 rounded-xl bg-surface/70 border border-border space-y-3 text-xs">
          <span className="font-bold text-foreground uppercase tracking-wide block text-[11px]">
            Privilèges Inclus dans votre Couverture Care+ :
          </span>

          <div className="space-y-2">
            {selectedPlan.coverageFeatures.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-2 text-foreground">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        asChild
        variant="technical"
        className="w-full font-bold uppercase tracking-wider text-xs h-9"
      >
        <a
          href={`https://wa.me/22960000000?text=${encodeURIComponent(
            `Bonjour Allô Techno, je souhaite souscrire à l'assurance Allô Care+ (${selectedPlan?.durationMonths} mois à ${formatFcfa(
              selectedPlan?.pricePerYearFcfa || 0,
            )}) pour mon ordinateur.`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Souscrire la Couverture Allô Care+ &rarr;
        </a>
      </Button>
    </div>
  );
}
