import * as React from "react";
import { Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";
import { calculateSolarItSetup } from "@/lib/solar-datacenter-planner";

export function SolarDatacenterPlannerModal() {
  const formTopRef = React.useRef<HTMLDivElement>(null);
  const [rackCount, setRackCount] = React.useState<number>(2);
  const [autonomyHours, setAutonomyHours] = React.useState<number>(18);

  const plan = React.useMemo(() => {
    return calculateSolarItSetup(rackCount, 800, autonomyHours);
  }, [rackCount, autonomyHours]);

  return (
    <div ref={formTopRef} className="border border-border bg-card p-5 sm:p-7 rounded-2xl max-w-3xl mx-auto space-y-6 shadow-xl animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Sun className="size-5 text-amber-500 shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Simulateur Solaire &amp; Autonomie Salle Serveurs
            </h3>
            <p className="text-xs text-muted-foreground">
              Dimensionnement photovoltaïque et batteries LiFePO4 pour 100% de continuité réseau
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-xs text-emerald-600 border-emerald-600/40 bg-emerald-600/10 font-bold">
          Zéro Coupure SBEE
        </Badge>
      </div>

      {/* Inputs Configuration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="text-muted-foreground block mb-1">Nombre de baies serveurs / réseau :</label>
          <Input
            type="number"
            min={1}
            max={20}
            value={rackCount}
            onChange={(e) => setRackCount(Math.max(1, Number(e.target.value)))}
            className="font-mono font-bold"
          />
        </div>

        <div>
          <label className="text-muted-foreground block mb-1">Autonomie sur batterie souhaitée (heures) :</label>
          <Input
            type="number"
            min={4}
            max={48}
            value={autonomyHours}
            onChange={(e) => setAutonomyHours(Math.max(4, Number(e.target.value)))}
            className="font-mono font-bold"
          />
        </div>
      </div>

      {/* Sizing Results Dashboard */}
      <div className="space-y-4 pt-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-border bg-surface/60 space-y-1">
            <span className="text-[10px] text-muted-foreground block">Panneaux Solaires</span>
            <strong className="font-mono text-base font-extrabold text-foreground block">
              {plan.solarPanelsKwc} kWc
            </strong>
            <span className="text-[10px] text-muted-foreground">({plan.solarPanelsCount450w} x 450W Mono-PERC)</span>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface/60 space-y-1">
            <span className="text-[10px] text-muted-foreground block">Batteries LiFePO4</span>
            <strong className="font-mono text-base font-extrabold text-foreground block">
              {plan.batteryCapacityKwh} kWh
            </strong>
            <span className="text-[10px] text-muted-foreground">({plan.lifepo4PackCount48v100ah} packs 48V 100Ah)</span>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface/60 space-y-1">
            <span className="text-[10px] text-muted-foreground block">Onduleur Hybride</span>
            <strong className="font-mono text-base font-extrabold text-primary block">
              {plan.hybridInverterKva} kVA MPPT
            </strong>
            <span className="text-[10px] text-muted-foreground">Pur Sinus Double Conversion</span>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface/60 space-y-1">
            <span className="text-[10px] text-muted-foreground block">Retour sur Investissement</span>
            <strong className="font-mono text-base font-extrabold text-emerald-600 block">
              {plan.roiPaybackYears} ans
            </strong>
            <span className="text-[10px] text-muted-foreground">Économies SBEE + Groupe</span>
          </div>
        </div>

        {/* Total Cost & Action */}
        <div className="p-4 rounded-xl bg-surface/80 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-muted-foreground block">Budget Clé en Main Estimé (Matériel + Pose) :</span>
            <strong className="text-lg font-mono font-black text-primary">
              {formatFcfa(plan.estimatedInvestmentFcfa)}
            </strong>
          </div>

          <Button asChild variant="technical" size="sm" className="font-bold uppercase tracking-wider text-xs h-9">
            <a
              href={`https://wa.me/22960000000?text=${encodeURIComponent(
                `Bonjour Allô Techno Solaire, nous souhaitons une étude pour solariser ${rackCount} baies serveurs (${plan.batteryCapacityKwh} kWh LiFePO4, budget estimé ${formatFcfa(
                  plan.estimatedInvestmentFcfa,
                )}).`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Demander l'Étude d'Ingénierie Solaire &rarr;
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
