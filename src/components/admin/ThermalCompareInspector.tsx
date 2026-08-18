import * as React from "react";
import { Flame, Scan, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  analyzeThermalMapFn,
  type ThermalComparisonResult,
} from "@/lib/thermal-compare-ai.functions";

export function ThermalCompareInspector() {
  const [selectedBoard, setSelectedBoard] = React.useState<
    "macbook_m1_a2337" | "dell_latitude_5420"
  >("macbook_m1_a2337");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<ThermalComparisonResult | null>(null);

  const fetchThermalData = React.useCallback(
    async (type: "macbook_m1_a2337" | "dell_latitude_5420") => {
      setLoading(true);
      try {
        const res = await analyzeThermalMapFn({ data: { boardType: type } });
        setResult(res);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    fetchThermalData(selectedBoard);
  }, [selectedBoard, fetchThermalData]);

  return (
    <div className="border border-border bg-card p-5 sm:p-7 rounded-2xl space-y-6 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Flame className="size-5 text-destructive shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Allô ThermoCompare — IA de Diagnostic Infrarouge Différentiel
            </h3>
            <p className="text-xs text-muted-foreground">
              Superposition spectrale automatique vs carte mère étalon et détection de court-circuit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[
            { id: "macbook_m1_a2337", label: "MacBook M1 A2337" },
            { id: "dell_latitude_5420", label: "Dell Latitude 5420" },
          ].map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelectedBoard(b.id as "macbook_m1_a2337" | "dell_latitude_5420")}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                selectedBoard === b.id
                  ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {loading || !result ? (
        <div className="py-12 text-center space-y-2">
          <Loader2 className="size-8 text-primary animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">
            Alignement spectral FLIR et calcul du gradient thermique...
          </p>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Specs */}
          <div className="p-4 rounded-xl bg-surface/70 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <strong className="text-sm text-foreground block">{result.boardModel}</strong>
              <span className="text-[11px] text-muted-foreground">
                Réf Inspection : {result.inspectionId} · Capteur Infrarouge FLIR E8-XT
              </span>
            </div>
            <Badge
              variant="outline"
              className="font-mono text-xs text-destructive border-destructive/40 bg-destructive/10 font-bold"
            >
              Point Chaud Anormal : +{result.deltaTempCelsius}°C
            </Badge>
          </div>

          {/* Temperature Comparison Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-border bg-surface/60 space-y-1">
              <span className="text-[10px] text-muted-foreground block">
                Température Normale (Étalon)
              </span>
              <strong className="font-mono text-base font-extrabold text-foreground block">
                {result.nominalHotspotMaxTempCelsius}°C
              </strong>
              <span className="text-[10px] text-muted-foreground">
                Profil de référence Allô Labs
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-destructive/40 bg-destructive/5 space-y-1">
              <span className="text-[10px] text-destructive font-bold block">
                Température Mesurée (Sous Tension)
              </span>
              <strong className="font-mono text-base font-extrabold text-destructive block">
                {result.measuredHotspotTempCelsius}°C
              </strong>
              <span className="text-[10px] text-destructive">Surchauffe critique détectée</span>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-surface/60 space-y-1">
              <span className="text-[10px] text-muted-foreground block">
                Rail d'Alimentation Touché
              </span>
              <strong className="font-mono text-base font-extrabold text-primary block">
                {result.identifiedFailingChip.railAffected}
              </strong>
              <span className="text-[10px] text-muted-foreground">
                Ligne en court-circuit franc
              </span>
            </div>
          </div>

          {/* Failing Chip Identification Box */}
          <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Scan className="size-4 text-destructive" />
                <strong className="text-destructive font-bold text-xs">
                  Composant Cible : {result.identifiedFailingChip.componentDesignator}
                </strong>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                Pad X={result.identifiedFailingChip.coordinates.x}, Y=
                {result.identifiedFailingChip.coordinates.y}
              </Badge>
            </div>

            <p className="text-foreground font-semibold leading-relaxed">
              {result.identifiedFailingChip.description}
            </p>

            <div className="pt-2 border-t border-destructive/20 text-[11px] text-muted-foreground">
              <span className="font-bold text-foreground">Action Recommandée Atelier : </span>
              {result.recommendedIntervention}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
