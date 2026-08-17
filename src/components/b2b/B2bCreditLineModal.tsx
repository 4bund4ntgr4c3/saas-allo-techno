import * as React from "react";
import { CreditCard, Loader2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";
import {
  evaluateB2bCreditLineFn,
  type CreditScoringResult,
} from "@/lib/b2b-credit-scoring.functions";

export function B2bCreditLineModal() {
  const formTopRef = React.useRef<HTMLDivElement>(null);
  const [step, setStep] = React.useState<1 | 2>(1);

  // Default first selections
  const [companyName, setCompanyName] = React.useState("Groupement Bolloré Logistics Bénin");
  const [ifuNumber, setIfuNumber] = React.useState("3201948201948");
  const [annualRevenueBracket, setAnnualRevenueBracket] = React.useState<
    "moins_50m" | "50m_a_200m" | "plus_200m"
  >("plus_200m");
  const [requestedCreditFcfa, setRequestedCreditFcfa] = React.useState<number>(3000000);

  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<CreditScoringResult | null>(null);

  React.useEffect(() => {
    if (formTopRef.current) {
      formTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [step]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await evaluateB2bCreditLineFn({
        data: {
          companyName,
          ifuNumber,
          annualRevenueBracket,
          requestedCreditFcfa,
        },
      });
      setResult(res);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={formTopRef}
      className="border border-border bg-card p-5 sm:p-7 rounded-2xl max-w-2xl mx-auto space-y-6 shadow-xl animate-in fade-in duration-200"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <CreditCard className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Ligne de Crédit B2B &amp; Paiement 30/60 Jours
            </h3>
            <p className="text-xs text-muted-foreground">
              Scoring instantané basé sur l'IFU pour réparer votre parc sans blocage de trésorerie
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-xs text-emerald-600 border-emerald-600/40 bg-emerald-600/10 font-bold"
        >
          0 FCFA d'Intérêts
        </Badge>
      </div>

      {step === 1 ? (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-muted-foreground block mb-1">
                Raison Sociale Entreprise :
              </label>
              <Input
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-muted-foreground block mb-1">Numéro IFU (13 Chiffres) :</label>
              <Input
                required
                value={ifuNumber}
                onChange={(e) => setIfuNumber(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-muted-foreground block mb-1">
              Tranche de Chiffre d'Affaires Annuel :
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "moins_50m", label: "< 50M FCFA" },
                { id: "50m_a_200m", label: "50M - 200M FCFA" },
                { id: "plus_200m", label: "> 200M FCFA" },
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() =>
                    setAnnualRevenueBracket(b.id as "moins_50m" | "50m_a_200m" | "plus_200m")
                  }
                  className={`p-2.5 rounded-lg border text-center font-semibold transition-all ${
                    annualRevenueBracket === b.id
                      ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-muted-foreground block mb-1">
              Ligne de crédit souhaitée (FCFA) :
            </label>
            <Input
              type="number"
              min={500000}
              max={10000000}
              step={100000}
              value={requestedCreditFcfa}
              onChange={(e) => setRequestedCreditFcfa(Number(e.target.value))}
              className="font-mono font-bold"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            variant="technical"
            className="w-full font-bold uppercase tracking-wider text-xs h-9 mt-2"
          >
            {loading ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : null}
            {loading ? "Évaluation du Bilan..." : "Évaluer ma Ligne de Crédit &rarr;"}
          </Button>
        </form>
      ) : result ? (
        <div className="space-y-5 animate-in zoom-in-95 duration-200">
          <div className="p-5 rounded-2xl bg-surface border border-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
              <div>
                <span className="text-[11px] text-muted-foreground block">
                  Note de Solvabilité Attribuée :
                </span>
                <strong className="text-xl font-bold text-emerald-600 flex items-center gap-1.5">
                  <Award className="size-5" /> {result.scoreRating}
                </strong>
              </div>
              <Badge variant="outline" className="font-mono text-sm text-primary font-bold">
                Paiement sous {result.paymentTermsDays} Jours
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-card border border-border">
                <span className="text-muted-foreground block text-[10px]">Plafond Accordé</span>
                <strong className="font-mono text-base font-extrabold text-primary block">
                  {formatFcfa(result.creditLimitApprovedFcfa)}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border">
                <span className="text-muted-foreground block text-[10px]">
                  Indice de Confiance DGI
                </span>
                <strong className="font-mono text-base font-extrabold text-emerald-600 block">
                  {result.riskScorePercent}% Conforme
                </strong>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {result.recommendedPlan}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)} className="w-1/3 text-xs">
              Modifier
            </Button>
            <Button asChild variant="technical" className="w-2/3 text-xs font-bold uppercase">
              <a
                href={`https://wa.me/22960000000?text=${encodeURIComponent(
                  `Bonjour Allô Techno B2B, nous souhaitons activer notre ligne de crédit de ${formatFcfa(
                    result.creditLimitApprovedFcfa,
                  )} à ${result.paymentTermsDays} jours pour ${companyName} (IFU : ${ifuNumber}).`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Activer le Compte B2B &rarr;
              </a>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
