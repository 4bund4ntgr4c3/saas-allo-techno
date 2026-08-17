import * as React from "react";
import { GitPullRequest, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getSmartDispatchQueueFn,
  type TechnicianWorkload,
  type DispatchedTicket,
} from "@/lib/smart-dispatch.functions";

export function SmartDispatchBoard() {
  const [technicians, setTechnicians] = React.useState<TechnicianWorkload[]>([]);
  const [dispatches, setDispatches] = React.useState<DispatchedTicket[]>([]);

  React.useEffect(() => {
    getSmartDispatchQueueFn().then((res) => {
      setTechnicians(res.technicians);
      setDispatches(res.activeDispatches);
    }).catch(() => {});
  }, []);

  return (
    <div className="border border-border bg-card p-5 sm:p-6 rounded-2xl space-y-6 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <GitPullRequest className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">
              Moteur IA de Dispatching &amp; Routage Atelier
            </h3>
            <p className="text-xs text-muted-foreground">
              Allocation prédictive des dossiers selon les spécialités fines et le respect strict des SLA
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-xs font-bold text-emerald-600 border-emerald-600/40 bg-emerald-600/10">
          SLA Global : 98.4%
        </Badge>
      </div>

      {/* ─── Technicians Bench Workload Row ─── */}
      <div className="space-y-2">
        <span className="font-bold text-xs uppercase tracking-wide text-foreground block">
          Capacités &amp; Bancs Techniques Disponibles :
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {technicians.map((t) => (
            <div
              key={t.technicianId}
              className="p-3.5 rounded-xl border border-border bg-surface/60 space-y-2 text-xs"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <strong className="text-foreground block">{t.name}</strong>
                  <span className="text-[10px] text-primary font-semibold">{t.specialty}</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono text-emerald-600 border-emerald-600/30">
                  {t.slaSuccessRatePercent}% SLA
                </Badge>
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Charge active :</span>
                  <span className="font-mono font-bold text-foreground">
                    {t.currentActiveTickets} / {t.maxCapacity} postes
                  </span>
                </div>
                <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(t.currentActiveTickets / t.maxCapacity) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Active Dispatches List ─── */}
      <div className="space-y-2">
        <span className="font-bold text-xs uppercase tracking-wide text-foreground block">
          Dossiers en Cours de Résolution Prioritaire :
        </span>
        <div className="space-y-3">
          {dispatches.map((d) => (
            <div
              key={d.ticketId}
              className="p-4 rounded-xl border border-border bg-surface/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                    {d.ticketId}
                  </span>
                  <strong className="text-foreground">{d.deviceTitle}</strong>
                </div>
                <p className="text-muted-foreground text-[11px]">{d.faultSummary}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1">
                  <span>Assigné à : <strong className="text-foreground">{d.assignedTechnicianName}</strong></span>
                  <span>·</span>
                  <span>Emplacement : <strong className="text-foreground">{d.benchNumber}</strong></span>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0">
                <Badge variant="outline" className="text-primary border-primary/30 font-mono text-[10px]">
                  <Clock className="size-3 mr-1" /> Reste {d.estimatedCompletionTime}
                </Badge>
                <span className="text-[10px] text-muted-foreground">Objectif SLA : {d.slaTargetHours}h</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
