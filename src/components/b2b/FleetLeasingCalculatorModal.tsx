import * as React from "react";
import { Building2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";
import { calculateFleetLeasing } from "@/lib/fleet-leasing-calculator";

export function FleetLeasingCalculatorModal() {
  const formTopRef = React.useRef<HTMLDivElement>(null);
  const [laptopUnitsCount, setLaptopUnitsCount] = React.useState<number>(15);
  const [tier, setTier] = React.useState<"standard_pro" | "expert_dev">("standard_pro");
  const [durationMonths, setDurationMonths] = React.useState<12 | 24 | 36>(24);

  const plan = React.useMemo(() => {
    return calculateFleetLeasing(laptopUnitsCount, tier, durationMonths);
  }, [laptopUnitsCount, tier, durationMonths]);

  return (
    <div ref={formTopRef} className="border border-border bg-card p-5 sm:p-7 rounded-2xl max-w-2xl mx-auto space-y-6 shadow-xl animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Building2 className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Simulateur de Leasing Informatique &amp; LOA Flotte B2B
            </h3>
            <p className="text-xs text-muted-foreground">
              Équipez votre entreprise sans apport initial avec loyers mensuels 100% déductibles (OPEX)
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-xs text-emerald-600 border-emerald-600/40 bg-emerald-600/10 font-bold">
          Rachat à 1 FCFA
        </Badge>
      </div>

      {/* Configuration Controls */}
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-muted-foreground block mb-1">Nombre d'ordinateurs à équiper :</label>
            <Input
              type="number"
              min={3}
              max={200}
              required
              value={laptopUnitsCount}
              onChange={(e) => setLaptopUnitsCount(Number(e.target.value))}
              className="font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-muted-foreground block mb-1">Gamme d'équipements :</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "standard_pro", label: "Pack Pro (Core i5 / 16G)" },
                { id: "expert_dev", label: "Pack Dev (M1 / i7 32G)" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTier(t.id as "standard_pro" | "expert_dev")}
                  className={`p-2 rounded-lg border text-center text-[10px] font-semibold transition-all ${
                    tier === t.id
                      ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="text-muted-foreground block mb-1">Durée du contrat de location :</label>
          <div className="grid grid-cols-3 gap-2 font-mono">
            {[12, 24, 36].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setDurationMonths(m as 12 | 24 | 36)}
                className={`p-2 rounded-lg border text-center font-bold text-xs transition-all ${
                  durationMonths === m
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                {m} Mois
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Result Cards */}
      <div className="p-4 rounded-xl bg-surface/70 border border-border space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-card border border-primary/30 space-y-1">
            <span className="text-[10px] text-primary font-bold block">Loyer Mensuel Total</span>
            <strong className="font-mono text-lg font-extrabold text-primary block">
              {formatFcfa(plan.totalMonthlyBillingFcfa)} / mois
            </strong>
            <span className="text-[10px] text-muted-foreground">Soit {formatFcfa(plan.monthlyRentalFeePerUnitFcfa)} / PC</span>
          </div>

          <div className="p-3 rounded-xl bg-card border border-border space-y-1">
            <span className="text-[10px] text-muted-foreground block">Valeur Matériel Neuf</span>
            <strong className="font-mono text-lg font-extrabold text-foreground block">
              {formatFcfa(plan.totalCatalogValueFcfa)}
            </strong>
            <span className="text-[10px] text-muted-foreground">0 FCFA d'apport requis</span>
          </div>

          <div className="p-3 rounded-xl bg-card border border-emerald-600/30 space-y-1">
            <span className="text-[10px] text-emerald-600 font-bold block">Option Rachat Final</span>
            <strong className="font-mono text-lg font-extrabold text-emerald-600 block">
              1 FCFA
            </strong>
            <span className="text-[10px] text-muted-foreground">Transfert de propriété</span>
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <span className="font-bold text-foreground uppercase tracking-wide block text-[11px]">
            Services &amp; Garanties Inclus dans le Loyer :
          </span>
          {plan.includedServices.map((srv, idx) => (
            <div key={idx} className="flex items-center gap-2 text-muted-foreground text-[11px]">
              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
              <span>{srv}</span>
            </div>
          ))}
        </div>
      </div>

      <Button asChild variant="technical" className="w-full font-bold uppercase tracking-wider text-xs h-9">
        <a
          href={`https://wa.me/22960000000?text=${encodeURIComponent(
            `Bonjour Allô Techno B2B, nous souhaitons recevoir une offre de leasing informatique LOA (${plan.laptopUnitsCount} PC sur ${plan.durationMonths} mois à ${formatFcfa(
              plan.totalMonthlyBillingFcfa,
            )}/mois).`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Demander une Offre de Leasing Entreprise &rarr;
        </a>
      </Button>
    </div>
  );
}
