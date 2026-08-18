import * as React from "react";
import { Zap, AlertTriangle, Flame, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  calculateVoltageInjectionFn,
  type InjectionSafetyGuide,
} from "@/lib/short-circuit-locator.functions";

export function ShortCircuitLocatorInspector() {
  const [selectedRail, setSelectedRail] = React.useState<"ppbus_g3h_12v" | "vcc_core_cpu_1v" | "vcc_3v3_always">("ppbus_g3h_12v");
  const [loading, setLoading] = React.useState(false);
  const [guide, setGuide] = React.useState<InjectionSafetyGuide | null>(null);

  const fetchGuide = React.useCallback(async (rail: "ppbus_g3h_12v" | "vcc_core_cpu_1v" | "vcc_3v3_always") => {
    setLoading(true);
    try {
      const res = await calculateVoltageInjectionFn({ data: { railType: rail } });
      setGuide(res);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchGuide(selectedRail);
  }, [selectedRail, fetchGuide]);

  return (
    <div className="border border-border bg-card p-5 sm:p-7 rounded-2xl space-y-6 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Zap className="size-5 text-amber-500 shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Simulateur d'Injection de Tension &amp; Localisation de Court-Circuit
            </h3>
            <p className="text-xs text-muted-foreground">
              Calcul des paramètres sécurisés U/I de laboratoire pour révéler les CMS en fuite
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {[
            { id: "ppbus_g3h_12v", label: "PPBUS (12.6V)" },
            { id: "vcc_core_cpu_1v", label: "VCC_CORE CPU (0.9V)" },
            { id: "vcc_3v3_always", label: "3.3V ALWAYS" },
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelectedRail(r.id as "ppbus_g3h_12v" | "vcc_core_cpu_1v" | "vcc_3v3_always")}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                selectedRail === r.id
                  ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading || !guide ? (
        <div className="py-12 text-center space-y-2">
          <Loader2 className="size-8 text-primary animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Calcul des lois d'Ohm et dissipation thermique en cours...</p>
        </div>
      ) : (
        <div className="space-y-5 animate-in fade-in duration-200 text-xs">
          {/* Header Specs */}
          <div className="p-4 rounded-xl bg-surface/70 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <strong className="text-sm text-foreground block">{guide.railName}</strong>
              <span className="text-[11px] text-muted-foreground">
                Tension nominale usine : {guide.nominalVoltage} V · Impédance mesurée : {guide.shortCircuitResistanceOhms} Ω
              </span>
            </div>
            <Badge variant="outline" className="font-mono text-xs text-amber-600 border-amber-600/40 bg-amber-600/10 font-bold">
              Dissipation : {guide.dissipatedPowerWatts} Watts
            </Badge>
          </div>

          {/* Safe Parameters Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-1">
              <span className="text-[10px] text-primary font-bold block">Tension d'Injection Max Sécurisée</span>
              <strong className="font-mono text-xl font-extrabold text-primary block">
                {guide.safeMaxInjectionVoltage} V
              </strong>
              <span className="text-[10px] text-muted-foreground">Protection anti-claquage CPU</span>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-surface/60 space-y-1">
              <span className="text-[10px] text-muted-foreground block">Courant Limite Alimentation DC</span>
              <strong className="font-mono text-xl font-extrabold text-foreground block">
                {guide.currentLimitAmps} A
              </strong>
              <span className="text-[10px] text-muted-foreground">Réglage alimentation Rigol</span>
            </div>

            <div className="p-3.5 rounded-xl border border-destructive/40 bg-destructive/5 space-y-1">
              <span className="text-[10px] text-destructive font-bold block">Puissance Thermique Libérée</span>
              <strong className="font-mono text-xl font-extrabold text-destructive block">
                {guide.dissipatedPowerWatts} W
              </strong>
              <span className="text-[10px] text-destructive">Point chaud visible caméra FLIR</span>
            </div>
          </div>

          {/* Thermal Signature & Warning */}
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
            <div className="flex items-center gap-2">
              <Flame className="size-4 text-amber-500 shrink-0" />
              <strong className="text-foreground font-bold text-xs">
                Signature Thermique Attendue sous Alcool Isopropylique / Caméra FLIR :
              </strong>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {guide.thermalSignatureDescription}
            </p>
          </div>

          <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/5 flex items-start gap-2 text-[11px] text-destructive">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <span><strong>Protocole Sécurité Atelier :</strong> {guide.warningNotice}</span>
          </div>
        </div>
      )}
    </div>
  );
}
