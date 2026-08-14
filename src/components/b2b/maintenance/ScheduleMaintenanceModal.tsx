import * as React from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EquipmentItem } from "@/lib/org.functions";
import { PRESET_TASKS } from "./MaintenanceChecklistModal";

export interface ScheduleMaintenanceModalProps {
  equipmentList: EquipmentItem[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    equipmentId: string;
    taskTitle: string;
    intervalMonths: number;
    nextDueAt: string;
  }) => void;
  isPending?: boolean;
}

export function ScheduleMaintenanceModal({
  equipmentList,
  isOpen,
  onClose,
  onSubmit,
  isPending = false,
}: ScheduleMaintenanceModalProps) {
  const [selectedEqId, setSelectedEqId] = React.useState<string>(
    () => equipmentList[0]?.id ?? "",
  );
  const [taskTitle, setTaskTitle] = React.useState<string>(PRESET_TASKS[0] ?? "");
  const [intervalMonths, setIntervalMonths] = React.useState<string>("3");
  const [nextDueAt, setNextDueAt] = React.useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().slice(0, 10);
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEqId) return;
    onSubmit({
      equipmentId: selectedEqId,
      taskTitle,
      intervalMonths: Number(intervalMonths) || 3,
      nextDueAt,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-4 rounded-lg shadow-sm animate-in fade-in duration-150"
    >
      <div>
        <Label>Matériel Concerné</Label>
        <Select value={selectedEqId} onValueChange={setSelectedEqId}>
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="Choisir équipement..." />
          </SelectTrigger>
          <SelectContent>
            {equipmentList.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name} ({[e.brand, e.model].filter(Boolean).join(" ") || e.type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Tâche / Type d'Entretien</Label>
        <Select value={taskTitle} onValueChange={setTaskTitle}>
          <SelectTrigger className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRESET_TASKS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Fréquence (Mois)</Label>
        <Select value={intervalMonths} onValueChange={setIntervalMonths}>
          <SelectTrigger className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Mensuel (1 mois)</SelectItem>
            <SelectItem value="2">Bimestriel (2 mois)</SelectItem>
            <SelectItem value="3">Trimestriel (3 mois)</SelectItem>
            <SelectItem value="6">Semestriel (6 mois)</SelectItem>
            <SelectItem value="12">Annuel (12 mois)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Prochaine Échéance</Label>
        <Input
          type="date"
          className="mt-1.5"
          value={nextDueAt}
          onChange={(e) => setNextDueAt(e.target.value)}
        />
      </div>

      <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-end gap-2 pt-2 border-t border-border">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          <X className="size-4 mr-1" />
          Annuler
        </Button>
        <Button type="submit" size="sm" disabled={isPending || !selectedEqId}>
          <Plus className="size-4 mr-1" />
          Planifier la Maintenance
        </Button>
      </div>
    </form>
  );
}
