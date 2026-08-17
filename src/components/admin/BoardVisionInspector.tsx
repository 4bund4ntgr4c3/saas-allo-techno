import * as React from "react";
import { Zap, Microscope, Scan, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  analyzeMotherboardImageFn,
  type BoardAnalysisResult,
} from "@/lib/board-vision-ai.functions";

export function BoardVisionInspector() {
  const [boardType, setBoardType] = React.useState<"macbook_820_00850" | "dell_la_k011p">(
    "macbook_820_00850",
  );
  const [analyzing, setAnalyzing] = React.useState(false);
  const [result, setResult] = React.useState<BoardAnalysisResult | null>(null);

  const runAnalysis = React.useCallback(async (typeId: string) => {
    setAnalyzing(true);
    try {
      const res = await analyzeMotherboardImageFn({ data: { imageSampleId: typeId } });
      setResult(res);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  React.useEffect(() => {
    runAnalysis(boardType);
  }, [boardType, runAnalysis]);

  return (
    <div className="border border-border bg-card p-5 sm:p-7 rounded-2xl space-y-6 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Microscope className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              IA Vision &amp; Copilote Schématique de Micro-Soudure
            </h3>
            <p className="text-xs text-muted-foreground">
              Détection automatique des CMS brûlés, identification de carte mère et rails
              d'alimentation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {["macbook_820_00850", "dell_la_k011p"].map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setBoardType(id as "macbook_820_00850" | "dell_la_k011p")}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                boardType === id
                  ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {id === "macbook_820_00850" ? "MacBook 820-00850" : "Dell LA-K011P"}
            </button>
          ))}
        </div>
      </div>

      {analyzing || !result ? (
        <div className="py-12 text-center space-y-3">
          <Loader2 className="size-8 text-primary animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">
            Analyse spectrale et corrélation avec la base de schémas vectoriels...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Identification */}
          <div className="p-4 rounded-xl bg-surface/70 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                  {result.boardReference}
                </span>
                <strong className="text-sm text-foreground">{result.deviceModel}</strong>
              </div>
              <span className="text-[11px] text-muted-foreground block mt-1">
                Réf Analyse : {result.analysisId} · Base Schématique Allô Techno Labs
              </span>
            </div>
            <Badge
              variant="outline"
              className="font-mono text-xs text-emerald-600 border-emerald-600/40 bg-emerald-600/10 font-bold"
            >
              Schéma Vectoriel Synchronisé
            </Badge>
          </div>

          {/* ─── Detected Defects Section ─── */}
          <div className="space-y-3">
            <span className="font-bold text-xs text-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Scan className="size-4 text-destructive" /> Composants Défaillants Détectés par IA
              Vision :
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {result.detectedDefects.map((defect) => (
                <div
                  key={defect.componentId}
                  className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-xs text-destructive">
                      {defect.componentId}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] text-destructive border-destructive/30 font-mono"
                    >
                      Confiance : {defect.confidenceScore}%
                    </Badge>
                  </div>
                  <p className="text-xs text-foreground font-semibold">{defect.suspectedFault}</p>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <span>
                      Coordonnées Pad Carte : X={defect.testPadCoordinates.x}, Y=
                      {defect.testPadCoordinates.y}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Critical Power Rails Reference Table ─── */}
          <div className="space-y-3">
            <span className="font-bold text-xs text-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Zap className="size-4 text-amber-500" /> Rails d'Alimentation Principaux &amp;
              Impédances Normales :
            </span>

            <div className="border border-border rounded-xl overflow-hidden text-xs">
              <div className="grid grid-cols-12 bg-surface p-2.5 font-bold text-muted-foreground border-b border-border text-[11px]">
                <div className="col-span-3">Nom du Rail</div>
                <div className="col-span-2">Tension</div>
                <div className="col-span-3">Résistance Normale</div>
                <div className="col-span-4">Conseil Dépannage</div>
              </div>

              {result.criticalPowerRails.map((rail) => (
                <div
                  key={rail.railName}
                  className="grid grid-cols-12 p-3 border-b border-border/60 items-center last:border-0 hover:bg-surface/30 transition-all"
                >
                  <div className="col-span-3 font-mono font-bold text-primary">{rail.railName}</div>
                  <div className="col-span-2 font-mono font-semibold text-foreground">
                    {rail.nominalVoltage}
                  </div>
                  <div className="col-span-3 font-mono text-muted-foreground">
                    {rail.normalResistanceToGround}
                  </div>
                  <div className="col-span-4 text-[11px] text-muted-foreground leading-relaxed">
                    {rail.troubleshootingTip}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
