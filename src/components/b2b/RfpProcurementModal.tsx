import * as React from "react";
import { CheckCircle2, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";
import {
  calculateFleetTco,
  submitB2bRfpConsultationFn,
} from "@/lib/rfp-procurement.functions";

export function RfpProcurementModal() {
  const formTopRef = React.useRef<HTMLDivElement>(null);
  const [step, setStep] = React.useState<1 | 2>(1);

  // States with default first selection
  const [clientCompanyName, setClientCompanyName] = React.useState("Société Générale Bénin");
  const [laptopCount, setLaptopCount] = React.useState<number>(30);
  const [targetBudgetFcfa, setTargetBudgetFcfa] = React.useState<number>(10500000); // 350k/poste
  const [preferredBrand, setPreferredBrand] = React.useState("Dell Latitude");
  const includeEnergyEfficiency = true;

  const [loading, setLoading] = React.useState(false);
  const [submittedRfpId, setSubmittedRfpId] = React.useState<string | null>(null);

  // Auto-scroll when step changes
  React.useEffect(() => {
    if (formTopRef.current) {
      formTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [step]);

  const tco = React.useMemo(() => {
    const unitCost = Math.round(targetBudgetFcfa / Math.max(1, laptopCount));
    return calculateFleetTco(laptopCount, unitCost, includeEnergyEfficiency);
  }, [laptopCount, targetBudgetFcfa, includeEnergyEfficiency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await submitB2bRfpConsultationFn({
        data: {
          clientCompanyName,
          laptopCount,
          targetBudgetFcfa,
          preferredBrand,
          includeEnergyEfficiency,
        },
      });
      if (res.success) {
        setSubmittedRfpId(res.rfpId);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={formTopRef} className="border border-border bg-card p-5 sm:p-7 rounded-2xl max-w-2xl mx-auto space-y-6 shadow-xl animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Building2 className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Portail E-Procurement &amp; Appels d'Offres B2B
            </h3>
            <p className="text-xs text-muted-foreground">
              Simulateur d'achat de flotte informatique et calcul du TCO sur 3 ans (SBEE + Maintenance)
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/40 bg-primary/10">
          Matrice TCO Conforme DSI
        </Badge>
      </div>

      {submittedRfpId ? (
        <div className="border border-emerald-600/30 bg-surface/80 p-6 rounded-2xl text-center space-y-4 shadow-sm animate-in zoom-in-95 duration-200">
          <div className="size-12 rounded-full bg-emerald-600/10 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="size-7" />
          </div>
          <h4 className="text-lg font-bold text-foreground">Dossier d'Appel d'Offres Transmis avec Succès</h4>
          <Badge variant="outline" className="font-mono text-sm text-primary font-bold">
            Consultation Réf : {submittedRfpId}
          </Badge>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            Notre direction grands comptes prépare l'offre technique et financière consolidée avec engagement de reprise à 3 ans.
          </p>
          <div className="pt-2">
            <Button asChild variant="technical" className="text-xs font-bold uppercase">
              <a
                href={`https://wa.me/22960000000?text=${encodeURIComponent(
                  `Bonjour Allô Techno Direction B2B, nous confirmons le dépôt de notre appel d'offres N° ${submittedRfpId} pour l'équipement de ${laptopCount} postes de travail (${clientCompanyName}).`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Échanger avec un Chargé de Compte B2B &rarr;
              </a>
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {step === 1 ? (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-muted-foreground block mb-1">Raison Sociale de l'Entreprise :</label>
                  <Input
                    required
                    value={clientCompanyName}
                    onChange={(e) => setClientCompanyName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-muted-foreground block mb-1">Nombre d'ordinateurs à acquérir :</label>
                  <Input
                    type="number"
                    min={5}
                    max={500}
                    required
                    value={laptopCount}
                    onChange={(e) => setLaptopCount(Number(e.target.value))}
                    className="font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-muted-foreground block mb-1">Budget d'acquisition global prévisionnel (FCFA) :</label>
                  <Input
                    type="number"
                    min={1000000}
                    step={100000}
                    required
                    value={targetBudgetFcfa}
                    onChange={(e) => setTargetBudgetFcfa(Number(e.target.value))}
                    className="font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground block mb-1">Gamme de matériel préconisée :</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {["Dell Latitude", "ThinkPad T14", "MacBook Air"].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setPreferredBrand(b)}
                        className={`p-2 rounded-lg border text-center font-semibold transition-all ${
                          preferredBrand === b
                            ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                            : "border-border bg-surface text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => setStep(2)}
                variant="technical"
                className="w-full font-bold uppercase tracking-wider text-xs h-9 mt-2"
              >
                Calculer la Matrice TCO sur 3 Ans &rarr;
              </Button>
            </div>
          ) : (
            <div className="space-y-5 text-xs">
              {/* TCO Matrix Breakdown */}
              <div className="border border-border bg-surface/70 p-4 rounded-xl space-y-3">
                <span className="font-bold text-foreground block text-xs uppercase tracking-wide">
                  Analyse Prédictive du Coût Total de Possession (TCO sur 3 Ans) :
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-card border border-border">
                    <span className="text-muted-foreground block text-[10px]">Achat Flotte</span>
                    <strong className="text-foreground font-mono">{formatFcfa(tco.acquisitionCost)}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-card border border-border">
                    <span className="text-muted-foreground block text-[10px]">Énergie SBEE (3 ans)</span>
                    <strong className="text-amber-600 font-mono">{formatFcfa(tco.energyCost3Years)}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-card border border-border">
                    <span className="text-muted-foreground block text-[10px]">Support SLA Allô Techno</span>
                    <strong className="text-primary font-mono">{formatFcfa(tco.maintenanceSupportCost)}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-600/10 border border-emerald-600/30">
                    <span className="text-emerald-800 block text-[10px]">Reprise Garantie (30%)</span>
                    <strong className="text-emerald-700 font-mono">-{formatFcfa(tco.residualResaleValue)}</strong>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-border pt-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">TCO Net Réel sur 3 Ans :</span>
                    <strong className="font-mono text-primary text-base font-extrabold block">{formatFcfa(tco.netTco)}</strong>
                  </div>
                  <div className="text-right text-[11px] text-emerald-600 font-bold">
                    <span>🌱 {tco.co2SavedKg.toLocaleString()} kg CO2 évités</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="w-1/3 text-xs"
                >
                  &larr; Modifier
                </Button>
                <Button
                  type="submit"
                  variant="technical"
                  disabled={loading}
                  className="w-2/3 font-bold uppercase tracking-wider text-xs h-9"
                >
                  {loading ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : null}
                  {loading ? "Génération..." : "Transmettre l'Appel d'Offres"}
                </Button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
