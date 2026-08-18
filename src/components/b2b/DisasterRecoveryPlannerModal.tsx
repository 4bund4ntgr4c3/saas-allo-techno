import * as React from "react";
import { ShieldAlert, CheckCircle2, Truck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";
import {
  calculateDisasterRecoveryImpact,
  submitDisasterRecoveryContractFn,
} from "@/lib/disaster-recovery-plan.functions";

export function DisasterRecoveryPlannerModal() {
  const formTopRef = React.useRef<HTMLDivElement>(null);

  // States with default first selection
  const [companyName, setCompanyName] = React.useState("Société Béninoise des Brasseries (SOBEBRA)");
  const [employeeCount, setEmployeeCount] = React.useState<number>(35);
  const [dailyTurnoverLossFcfa, setDailyTurnoverLossFcfa] = React.useState<number>(8000000);

  const [loading, setLoading] = React.useState(false);
  const [submittedContractId, setSubmittedContractId] = React.useState<string | null>(null);

  const plan = React.useMemo(() => {
    return calculateDisasterRecoveryImpact(employeeCount, 7500, dailyTurnoverLossFcfa);
  }, [employeeCount, dailyTurnoverLossFcfa]);

  React.useEffect(() => {
    if (submittedContractId && formTopRef.current) {
      formTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [submittedContractId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await submitDisasterRecoveryContractFn({
        data: {
          companyName,
          employeeCount,
          fleetReserveRequested: plan.emergencyFleetReserveCount,
        },
      });
      if (res.success) {
        setSubmittedContractId(res.contractId);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={formTopRef} className="border border-border bg-card p-5 sm:p-7 rounded-2xl max-w-3xl mx-auto space-y-6 shadow-xl animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              PCA &amp; Plan de Continuité d'Activité Informatique DSI
            </h3>
            <p className="text-xs text-muted-foreground">
              Chiffrage de l'arrêt de production et prêt garanti d'un parc de secours sous 4 heures
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-xs text-emerald-600 border-emerald-600/40 bg-emerald-600/10 font-bold">
          RTO Garanti &lt; 4h
        </Badge>
      </div>

      {submittedContractId ? (
        <div className="border border-emerald-600/30 bg-surface/80 p-6 rounded-2xl text-center space-y-4 shadow-sm animate-in zoom-in-95 duration-200">
          <div className="size-12 rounded-full bg-emerald-600/10 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="size-7" />
          </div>
          <h4 className="text-lg font-bold text-foreground">Plan de Continuité Validé</h4>
          <Badge variant="outline" className="font-mono text-sm text-primary font-bold">
            Contrat PCA : {submittedContractId}
          </Badge>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            Votre réserve de {plan.emergencyFleetReserveCount} postes de travail prêts à l'emploi est sécurisée dans notre coffre-fort logistique pour {companyName}.
          </p>
          <div className="pt-2">
            <Button asChild variant="technical" className="text-xs font-bold uppercase">
              <a
                href={`https://wa.me/22960000000?text=${encodeURIComponent(
                  `Bonjour Allô Techno PCA, nous confirmons l'ouverture du contrat de continuité N° ${submittedContractId} (${plan.emergencyFleetReserveCount} PC sous 4h) pour ${companyName}.`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Finaliser l'Accord PCA &rarr;
              </a>
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-muted-foreground block mb-1">Raison Sociale de l'Entreprise :</label>
              <Input
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-muted-foreground block mb-1">Nombre de collaborateurs sur PC :</label>
              <Input
                type="number"
                min={1}
                max={500}
                required
                value={employeeCount}
                onChange={(e) => setEmployeeCount(Number(e.target.value))}
                className="font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-muted-foreground block mb-1 text-xs">
              Chiffre d'affaires journalier exposé aux pannes (FCFA) :
            </label>
            <Input
              type="number"
              min={500000}
              step={500000}
              value={dailyTurnoverLossFcfa}
              onChange={(e) => setDailyTurnoverLossFcfa(Number(e.target.value))}
              className="font-mono font-bold text-xs"
            />
          </div>

          {/* Sizing & Impact Simulation Dashboard */}
          <div className="p-4 rounded-xl bg-surface/70 border border-border space-y-3">
            <span className="font-bold text-xs uppercase tracking-wide text-foreground block">
              Simulation d'Impact Financier d'une Interruption :
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-card border border-destructive/30">
                <span className="text-[10px] text-muted-foreground block">Coût d'Arrêt / Heure</span>
                <strong className="font-mono text-base font-extrabold text-destructive block">
                  {formatFcfa(plan.estimatedHourlyDowntimeCostFcfa)}
                </strong>
                <span className="text-[10px] text-muted-foreground">Masse salariale + Ventes</span>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border">
                <span className="text-[10px] text-muted-foreground block">Flotte de Secours Réservée</span>
                <strong className="font-mono text-base font-extrabold text-primary block">
                  {plan.emergencyFleetReserveCount} Ordinateurs
                </strong>
                <span className="text-[10px] text-muted-foreground">Masterisés &amp; Chiffrés</span>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border">
                <span className="text-[10px] text-muted-foreground block">Abonnement Sérénité PCA</span>
                <strong className="font-mono text-base font-extrabold text-emerald-600 block">
                  {formatFcfa(plan.monthlyDisasterInsuranceFcfa)} / mois
                </strong>
                <span className="text-[10px] text-muted-foreground">Assurance Disponibilité</span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-muted-foreground flex items-center gap-2">
              <Truck className="size-3.5 text-primary shrink-0" />
              <span>Livraison sur site à Cotonou / Calavi sous <strong>{plan.rtoGuaranteedHours} heures maximum</strong> après déclenchement de l'alerte DSI.</span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            variant="technical"
            className="w-full font-bold uppercase tracking-wider text-xs h-9 mt-2"
          >
            {loading ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : null}
            {loading ? "Validation..." : "Souscrire au Contrat de Continuité d'Activité &rarr;"}
          </Button>
        </form>
      )}
    </div>
  );
}
