import * as React from "react";
import { Sparkles, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";
import {
  analyzeDeviceSymptomFn,
  type AiDiagnosticResult,
} from "@/lib/ai-diagnostic.functions";

export function AiDiagnosticAssistant() {
  const [deviceType, setDeviceType] = React.useState("MacBook / Laptop");
  const [symptom, setSymptom] = React.useState("");
  const [result, setResult] = React.useState<AiDiagnosticResult | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptom.trim()) return;
    setLoading(true);
    try {
      const res = await analyzeDeviceSymptomFn({
        data: {
          deviceType,
          symptomDescription: symptom.trim(),
        },
      });
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-border bg-card p-5 sm:p-7 rounded-2xl space-y-5 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Bot className="size-5" />
          </div>
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Assistant IA de Diagnostic Pré-Atelier
            </h3>
            <p className="text-xs text-muted-foreground">
              Décrivez les symptômes de votre panne pour obtenir une prédiction immédiate
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] uppercase border-primary/40 text-primary bg-primary/10">
          IA Diagnostic v2.4
        </Badge>
      </div>

      <form onSubmit={handleAnalyze} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {["MacBook / Laptop", "iPhone / Smartphone", "Serveur / Tour PC"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setDeviceType(type)}
              className={`p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                deviceType === type
                  ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div>
          <Textarea
            placeholder="Ex : Mon PC a pris un peu d'eau hier, il ne démarre plus et le voyant clignote en orange... ou l'écran reste noir mais le ventilateur tourne à fond."
            className="text-xs min-h-[75px]"
            value={symptom}
            onChange={(e) => setSymptom(e.target.value)}
            required
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="technical"
            disabled={loading || !symptom.trim()}
            className="font-bold uppercase tracking-wider text-xs"
          >
            {loading ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <Sparkles className="size-3.5 mr-1.5" />}
            Analyser avec l'IA Allô Techno &rarr;
          </Button>
        </div>
      </form>

      {/* ─── AI Analysis Result ─── */}
      {result && (
        <div className="border border-primary/40 bg-primary/5 p-5 rounded-xl space-y-4 animate-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="at-eyebrow text-muted-foreground text-[10px] block">
                Diagnostic Prédictif ({result.probabilityScore}% de certitude)
              </span>
              <h4 className="font-bold text-sm text-foreground mt-0.5">{result.detectedIssue}</h4>
            </div>
            <Badge
              variant="outline"
              className={`font-mono text-[10px] uppercase font-bold ${
                result.emergencyLevel === "urgent"
                  ? "border-destructive text-destructive bg-destructive/10"
                  : "border-amber-500 text-amber-600 bg-amber-500/10"
              }`}
            >
              Urgence : {result.emergencyLevel}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-background p-3.5 rounded-lg border border-border">
            <div>
              <span className="text-muted-foreground block">Composant critique à tester :</span>
              <strong className="text-foreground">{result.criticalComponent}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">Intervention préconisée :</span>
              <strong className="text-primary">{result.recommendedIntervention}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">Délai estimé de réparation :</span>
              <span className="font-semibold">{result.estimatedDuration}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Estimation tarifaire :</span>
              <span className="font-mono font-bold text-foreground">
                {formatFcfa(result.priceRangeFcfa.min)} — {formatFcfa(result.priceRangeFcfa.max)}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <p className="text-[11px] text-muted-foreground">
              Diagnostic physique approfondi gratuit et sans engagement à notre atelier.
            </p>
            <Button
              asChild
              variant="technical"
              size="sm"
              className="text-xs font-bold uppercase tracking-wider shrink-0"
            >
              <a
                href={`https://wa.me/22960000000?text=${encodeURIComponent(
                  `Bonjour Allô Techno, voici le diagnostic IA de mon ${deviceType} : "${result.detectedIssue}". Je souhaite déposer l'appareil pour confirmation en atelier.`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Prendre Rendez-Vous avec ce Diagnostic &rarr;
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
