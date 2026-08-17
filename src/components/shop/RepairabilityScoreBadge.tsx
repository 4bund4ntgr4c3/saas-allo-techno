import * as React from "react";
import { Wrench } from "lucide-react";
import { getDeviceRepairability } from "@/lib/repairability";

export function RepairabilityScoreBadge({ modelName = "ThinkPad T14" }: { modelName?: string }) {
  const repairability = React.useMemo(() => {
    return getDeviceRepairability(modelName);
  }, [modelName]);

  return (
    <div className="border border-border bg-card p-4 rounded-xl space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="size-4 text-primary" />
          <span className="font-bold text-xs uppercase tracking-wide text-foreground">
            Indice de Réparabilité
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${repairability.colorClass}`}>
            {repairability.score.toFixed(1)} / 10
          </span>
          <span className="font-bold text-xs text-muted-foreground">Classe {repairability.grade}</span>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">{repairability.notes}</p>

      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/60 text-[10px] text-muted-foreground">
        <div>
          <span className="block">Démontage :</span>
          <strong className="text-foreground">{repairability.disassemblyRating} / 20</strong>
        </div>
        <div>
          <span className="block">Dispo Pièces :</span>
          <strong className="text-foreground">{repairability.partsAvailabilityRating} / 20</strong>
        </div>
        <div>
          <span className="block">Composants :</span>
          <strong className={repairability.modularComponents ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
            {repairability.modularComponents ? "Modulaires" : "Soudés"}
          </strong>
        </div>
      </div>
    </div>
  );
}
