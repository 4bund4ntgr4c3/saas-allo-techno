import * as React from "react";
import { Gauge, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getMetrologyRecordsFn,
  type CalibrationRecord,
} from "@/lib/metrology-calibration.functions";

export function MetrologyCalibrationDrawer() {
  const [records, setRecords] = React.useState<CalibrationRecord[]>([]);
  const [complianceRate, setComplianceRate] = React.useState(100);

  React.useEffect(() => {
    getMetrologyRecordsFn()
      .then((res) => {
        setRecords(res.records);
        setComplianceRate(res.overallCompliancePercent);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="border border-border bg-card p-5 sm:p-6 rounded-2xl space-y-5 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Gauge className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">
              Registre Métrologique &amp; Étalonnage ISO 9001
            </h3>
            <p className="text-xs text-muted-foreground">
              Certificats de précision des fers JBC, caméras thermiques Flir et bancs de test
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-xs font-bold text-emerald-600 border-emerald-600/40 bg-emerald-600/10"
        >
          Conformité Parc : {complianceRate}%
        </Badge>
      </div>

      <div className="space-y-3">
        {records.map((item) => (
          <div
            key={item.equipmentId}
            className="p-4 rounded-xl border border-border bg-surface/60 space-y-2 shadow-xs text-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                  {item.equipmentId}
                </span>
                <strong className="text-foreground">{item.instrumentName}</strong>
              </div>
              <Badge
                variant="outline"
                className="text-emerald-600 border-emerald-600/40 bg-emerald-600/10 text-[10px] font-bold"
              >
                <CheckCircle2 className="size-3 mr-1" /> Étalonné Conforme
              </Badge>
            </div>

            <div className="text-[11px] text-muted-foreground">
              Modèle : <strong className="text-foreground">{item.brandModel}</strong> ·{" "}
              {item.measuredTolerance}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-1">
              <div>
                <span>Dernier Étalonnage : </span>
                <strong className="text-foreground">{item.lastCalibrationDate}</strong>
              </div>
              <div>
                <span>Prochaine Échéance : </span>
                <strong className="text-foreground">{item.nextCalibrationDueDate}</strong>
              </div>
            </div>

            <div className="bg-background p-2 rounded-lg border border-border flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span>Organisme : {item.calibratedBy}</span>
              <span className="text-primary font-bold">{item.certificateRef}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
