import * as React from "react";
import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";

export function RoiCalculatorModal() {
  const [fleetSize, setFleetSize] = React.useState(25);
  const [newLaptopCostFcfa, setNewLaptopCostFcfa] = React.useState(650000);
  const [renewalCycleYears, setRenewalCycleYears] = React.useState(3);

  // Calculs financiers comparatifs
  const renewalCostWithoutMaintenance = React.useMemo(() => {
    return fleetSize * newLaptopCostFcfa;
  }, [fleetSize, newLaptopCostFcfa]);

  const annualMaintenanceCost = React.useMemo(() => {
    // Tarif Allô Techno Pro Formule Essentiel / Business moyen : ~15 000 FCFA / poste / mois
    return fleetSize * 15000 * 12;
  }, [fleetSize]);

  const prolongedLifeYears = 5; // Avec maintenance préventive Allô Techno : 5 ans au lieu de 3 ans
  const totalSavingsOver5Years = React.useMemo(() => {
    const costIfRenewedTwice = (fleetSize * newLaptopCostFcfa * (prolongedLifeYears / renewalCycleYears));
    const costWithMaintenanceAndUpgrade = (fleetSize * newLaptopCostFcfa) + (annualMaintenanceCost * prolongedLifeYears);
    return Math.max(0, Math.round(costIfRenewedTwice - costWithMaintenanceAndUpgrade));
  }, [fleetSize, newLaptopCostFcfa, renewalCycleYears, annualMaintenanceCost, prolongedLifeYears]);

  const roiPercent = React.useMemo(() => {
    if (annualMaintenanceCost === 0) return 0;
    return Math.round((totalSavingsOver5Years / (annualMaintenanceCost * prolongedLifeYears)) * 100);
  }, [totalSavingsOver5Years, annualMaintenanceCost, prolongedLifeYears]);

  return (
    <div className="border border-border bg-card p-5 sm:p-7 rounded-xl space-y-6 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Calculator className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Simulateur ROI &amp; Amortissement Flotte DSI
            </h3>
            <p className="text-xs text-muted-foreground">
              Mesurez l'impact financier de la maintenance préventive Allô Techno sur votre trésorerie
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-xs border-emerald-600/40 text-emerald-600 bg-emerald-600/10">
          ROI Moyen Constaté : +{roiPercent}%
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Paramètres Flotte */}
        <div className="lg:col-span-6 space-y-4">
          <div>
            <Label className="text-xs">Taille de votre parc informatique (Postes / PC / Mac) :</Label>
            <div className="mt-1.5 flex items-center gap-3">
              <Input
                type="number"
                min={1}
                max={1000}
                className="font-mono font-bold text-sm w-32"
                value={fleetSize}
                onChange={(e) => setFleetSize(Math.max(1, Number(e.target.value)))}
              />
              <span className="text-xs text-muted-foreground">équipements gérés</span>
            </div>
          </div>

          <div>
            <Label className="text-xs">Coût moyen d'acquisition d'une machine neuve (FCFA) :</Label>
            <Input
              type="number"
              step={10000}
              className="mt-1.5 font-mono font-bold text-sm"
              value={newLaptopCostFcfa}
              onChange={(e) => setNewLaptopCostFcfa(Number(e.target.value))}
            />
          </div>

          <div>
            <Label className="text-xs">Cycle habituel de renouvellement complet :</Label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {[2, 3, 4].map((years) => (
                <button
                  key={years}
                  type="button"
                  onClick={() => setRenewalCycleYears(years)}
                  className={`p-2 rounded-lg border text-xs font-semibold ${
                    renewalCycleYears === years
                      ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                      : "border-border bg-surface text-muted-foreground"
                  }`}
                >
                  Tous les {years} ans
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bilan Économique & ROI */}
        <div className="lg:col-span-6 border border-primary/30 bg-primary/5 p-5 rounded-xl flex flex-col justify-between space-y-4">
          <div>
            <span className="at-eyebrow text-muted-foreground text-[10px] block">
              Économies Nettes Estimées sur 5 Ans
            </span>
            <strong className="text-2xl sm:text-3xl font-mono font-extrabold text-foreground block mt-1">
              {formatFcfa(totalSavingsOver5Years)}
            </strong>
            <p className="text-xs text-muted-foreground mt-1">
              En prolongeant la durée de vie de 3 à 5 ans grâce aux révisions trimestrielles et repasting.
            </p>

            <div className="mt-4 space-y-2 border-t border-border/60 pt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Budget rachat neuf systématique :</span>
                <span className="font-mono text-destructive font-bold">{formatFcfa(renewalCostWithoutMaintenance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contrat annuel Allô Techno Pro :</span>
                <span className="font-mono text-foreground font-bold">{formatFcfa(annualMaintenanceCost)} / an</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-600 pt-1 border-t border-border/40">
                <span>Gain de Trésorerie Net :</span>
                <span className="font-mono">+{formatFcfa(totalSavingsOver5Years)}</span>
              </div>
            </div>
          </div>

          <Button
            asChild
            variant="technical"
            className="w-full font-bold uppercase tracking-wider text-xs"
          >
            <a
              href={`https://wa.me/22960000000?text=${encodeURIComponent(
                `Bonjour Allô Techno, je souhaite une proposition SLA pour notre parc de ${fleetSize} ordinateurs (estimation d'économies de ${formatFcfa(
                  totalSavingsOver5Years,
                )} sur le simulateur).`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Demander un Audit Gratuit de Flotte &rarr;
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
