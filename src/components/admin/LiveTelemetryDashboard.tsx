import * as React from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Cpu,
  HardDrive,
  Battery,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLiveTelemetryFleetFn, type TelemetryEndpoint } from "@/lib/telemetry-agent.functions";

export function LiveTelemetryDashboard() {
  const [endpoints, setEndpoints] = React.useState<TelemetryEndpoint[]>([]);
  const [criticalCount, setCriticalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const fetchTelemetry = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLiveTelemetryFleetFn();
      setEndpoints(res.endpoints);
      setCriticalCount(res.criticalCount);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTelemetry();
  }, [fetchTelemetry]);

  return (
    <div className="border border-border bg-card p-5 sm:p-6 rounded-2xl space-y-5 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Activity className="size-5 text-primary animate-pulse shrink-0" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">
              Allô Pulse — Télémétrie en Direct &amp; IA Prédictive
            </h3>
            <p className="text-xs text-muted-foreground">
              Surveillance proactive de la température CPU, santé SSD et prédiction de pannes de
              flotte
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`font-mono text-xs font-bold ${
              criticalCount > 0
                ? "text-destructive border-destructive/40 bg-destructive/10"
                : "text-emerald-600 border-emerald-600/40 bg-emerald-600/10"
            }`}
          >
            {criticalCount > 0 ? `${criticalCount} Alerte Critique Détectée` : "Flotte 100% Saine"}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchTelemetry}
            disabled={loading}
            className="size-8 p-0"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* ─── Endpoints Live Monitoring List ─── */}
      <div className="space-y-3">
        {endpoints.map((ep) => (
          <div
            key={ep.deviceId}
            className={`p-4 rounded-xl border transition-all ${
              ep.riskStatus === "critique"
                ? "border-destructive/40 bg-destructive/5 shadow-xs"
                : ep.riskStatus === "avertissement"
                  ? "border-amber-500/40 bg-amber-500/5 shadow-xs"
                  : "border-border bg-surface/60"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-foreground bg-surface px-2 py-0.5 rounded border border-border">
                    {ep.computerName}
                  </span>
                  <strong className="text-xs text-foreground">{ep.assignedUser}</strong>
                  <span className="text-[10px] text-muted-foreground">({ep.department})</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>Dernier ping : {ep.lastHeartbeat}</span>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 text-xs">
              <div className="flex items-center gap-2">
                <Cpu className="size-4 text-primary shrink-0" />
                <div>
                  <span className="text-[10px] text-muted-foreground block">Température CPU</span>
                  <strong
                    className={`font-mono text-xs ${ep.cpuTempCelsius > 80 ? "text-destructive font-bold" : "text-foreground"}`}
                  >
                    {ep.cpuTempCelsius}°C ({ep.cpuLoadPercent}% load)
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <HardDrive className="size-4 text-blue-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-muted-foreground block">Santé SSD</span>
                  <strong
                    className={`font-mono text-xs ${ep.ssdHealthPercent < 30 ? "text-destructive font-bold" : "text-foreground"}`}
                  >
                    {ep.ssdHealthPercent}% ({ep.ssdWearTbwRemaining} TBW rest.)
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Battery className="size-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-muted-foreground block">Batterie</span>
                  <strong className="font-mono text-xs text-foreground">
                    {ep.batteryHealthPercent}%
                  </strong>
                </div>
              </div>

              <div className="flex items-center justify-end">
                {ep.riskStatus === "critique" ? (
                  <Badge
                    variant="outline"
                    className="text-destructive border-destructive/40 bg-destructive/10 text-[10px] font-bold"
                  >
                    <AlertTriangle className="size-3 mr-1" /> Remplacement Urgent
                  </Badge>
                ) : ep.riskStatus === "avertissement" ? (
                  <Badge
                    variant="outline"
                    className="text-amber-600 border-amber-600/40 bg-amber-600/10 text-[10px] font-bold"
                  >
                    Entretien Conseillé
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-emerald-600 border-emerald-600/40 bg-emerald-600/10 text-[10px] font-bold"
                  >
                    <CheckCircle2 className="size-3 mr-1" /> Nominal
                  </Badge>
                )}
              </div>
            </div>

            {/* Predictive Failure Warning Box */}
            {ep.predictedFailure && (
              <div className="mt-3 p-3 rounded-lg bg-background border border-destructive/30 space-y-1 text-xs">
                <div className="flex items-center justify-between text-destructive font-bold text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="size-3.5" /> Panne Matérielle Prévue sous{" "}
                    {ep.predictedFailure.estimatedDaysRemaining} jours :
                  </span>
                  <span>{ep.predictedFailure.component}</span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  {ep.predictedFailure.recommendedAction}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
