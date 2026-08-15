import * as React from "react";
import { CheckCircle2, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generatePvRestitutionPdf } from "@/lib/pv-restitution-pdf";
import type { EquipmentMaintenanceSchedule } from "@/lib/org.functions";
import { PRESET_TASKS } from "./preset-tasks";

export interface MaintenanceChecklistModalProps {
  schedule: EquipmentMaintenanceSchedule | null;
  orgName?: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (scheduleId: string) => void;
  isCompleting?: boolean;
}

export function MaintenanceChecklistModal({
  schedule,
  orgName = "Organisation B2B",
  isOpen,
  onClose,
  onComplete,
  isCompleting = false,
}: MaintenanceChecklistModalProps) {
  const [checklistState, setChecklistState] = React.useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: false,
    3: false,
    4: false,
  });

  if (!isOpen || !schedule) return null;

  const completedCount = Object.values(checklistState).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / PRESET_TASKS.length) * 100);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-checklist-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl border border-border bg-card p-6 shadow-2xl space-y-5 rounded-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 id="modal-checklist-title" className="text-base font-bold text-foreground">
              Cycle de Maintenance Préventive
            </h2>
            <p className="text-xs text-muted-foreground font-mono">{schedule.task_title}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Equipment & Site Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/20 border border-border p-4 text-xs rounded-md">
          <div>
            <span className="at-eyebrow text-[10px] text-muted-foreground block uppercase">
              Matériel Concerné
            </span>
            <span className="font-bold text-sm text-foreground block">
              {schedule.equipment?.name ?? "Équipement Principal"}
            </span>
            <p className="text-muted-foreground">
              {[schedule.equipment?.brand, schedule.equipment?.model].filter(Boolean).join(" ")}
            </p>
          </div>
          <div>
            <span className="at-eyebrow text-[10px] text-muted-foreground block uppercase">
              Implantation / Site
            </span>
            <span className="font-bold text-sm text-foreground block">
              Site d'exploitation / Parc actif
            </span>
            <p className="text-muted-foreground">Atelier Référent : Allô Techno</p>
          </div>
        </div>

        {/* Checklist of Tasks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" />
              Checklist d'Intervention ({completedCount} / {PRESET_TASKS.length} réalisées)
            </h3>
            <span className="font-mono text-xs text-primary font-bold">
              {progressPercent}% Achevé
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="divide-y divide-border border border-border bg-background rounded-md overflow-hidden">
            {PRESET_TASKS.map((task, idx) => {
              const isChecked = Boolean(checklistState[idx]);
              return (
                <label
                  key={task}
                  className="flex items-center gap-3 p-3 text-xs cursor-pointer hover:bg-accent/10 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => setChecklistState((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                    className="size-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span
                    className={
                      isChecked
                        ? "line-through text-muted-foreground"
                        : "font-medium text-foreground"
                    }
                  >
                    {task}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              generatePvRestitutionPdf({
                pvNumber: `PV-MAINT-${Date.now().toString().slice(-4)}`,
                orgName,
                clientContactName: "Responsable Informatique / DSI",
                equipmentName: schedule.equipment?.name ?? "Serveur Principal",
                serialNumber: schedule.equipment?.serial_number ?? "SN-2026-X9",
                interventionSummary: `Cycle de maintenance préventive récurrente "${schedule.task_title}" réalisé avec succès à l'atelier Allô Techno.`,
                warrantyPeriodMonths: 6,
                restitutionDate: new Date().toLocaleDateString("fr-FR"),
                technicianName: "Technicien Référent Allô Techno",
              })
            }
          >
            <FileText className="size-4 mr-1.5 text-primary" />
            Télécharger le PV (PDF)
          </Button>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Fermer
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={isCompleting}
              onClick={() => onComplete(schedule.id)}
            >
              <CheckCircle2 className="size-4 mr-1.5" />
              Valider le Cycle
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
