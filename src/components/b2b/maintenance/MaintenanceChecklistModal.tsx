import * as React from "react";
import {
  CheckCircle2,
  FileText,
  Laptop,
  Monitor,
  Printer,
  Server,
  Smartphone,
  Wifi,
  Wrench,
  X,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { generatePvRestitutionPdf } from "@/lib/pv-restitution-pdf";
import { generateFicheInterventionPdf } from "@/lib/fiche-intervention-pdf";
import type { EquipmentMaintenanceSchedule } from "@/lib/org.functions";
import {
  MAINTENANCE_PROTOCOLS,
  MAINTENANCE_TYPES_CONFIG,
  type EquipmentCategory,
  type MaintenanceType,
} from "./preset-tasks";

export interface MaintenanceChecklistModalProps {
  schedule: EquipmentMaintenanceSchedule | null;
  orgName?: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (scheduleId: string) => void;
  isCompleting?: boolean;
}

const CATEGORY_ICONS: Record<EquipmentCategory, React.ComponentType<{ className?: string }>> = {
  laptop: Laptop,
  desktop: Monitor,
  server: Server,
  printer: Printer,
  smartphone: Smartphone,
  network_ups: Wifi,
};

export function MaintenanceChecklistModal({
  schedule,
  orgName = "Organisation B2B",
  isOpen,
  onClose,
  onComplete,
  isCompleting = false,
}: MaintenanceChecklistModalProps) {
  // Infer category from schedule/equipment or default to laptop
  const [selectedCategory, setSelectedCategory] = React.useState<EquipmentCategory>("laptop");
  const [selectedType, setSelectedType] = React.useState<MaintenanceType>("preventive");
  const [observations, setObservations] = React.useState("");
  const [technicianName] = React.useState("Technicien Référent Allô Techno");
  const [durationMinutes] = React.useState(45);
  const [partsReplaced, setPartsReplaced] = React.useState("");

  // Task statuses: { [taskId]: "conforme" | "corrige" | "a_surveiller" | "na" }
  const [taskStatuses, setTaskStatuses] = React.useState<
    Record<string, "conforme" | "corrige" | "a_surveiller" | "na">
  >({});

  const currentProtocol = MAINTENANCE_PROTOCOLS[selectedCategory] || MAINTENANCE_PROTOCOLS.laptop;

  // Initialize statuses when protocol changes
  React.useEffect(() => {
    const initial: Record<string, "conforme" | "corrige" | "a_surveiller" | "na"> = {};
    currentProtocol.tasks.forEach((t) => {
      initial[t.id] = "conforme";
    });
    setTaskStatuses(initial);
  }, [selectedCategory, currentProtocol.tasks]);

  if (!isOpen || !schedule) return null;

  const totalTasks = currentProtocol.tasks.length;
  const completedTasks = Object.values(taskStatuses).filter(
    (s) => s === "conforme" || s === "corrige",
  ).length;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);

  const handleDownloadFiche = () => {
    const checkpoints = currentProtocol.tasks.map((t) => ({
      task: t.label,
      status: taskStatuses[t.id] || "conforme",
      ...(t.description ? { note: t.description } : {}),
    }));

    void generateFicheInterventionPdf({
      ficheNumber: `FICH-${Date.now().toString().slice(-6)}`,
      maintenanceType: selectedType,
      orgName,
      clientContact: {
        name: "Responsable Informatique / DSI",
        phone: "+229 97 00 00 00",
        role: "Gestionnaire de Parc",
      },
      siteLocation: "Site d'exploitation / Agence Cotonou",
      equipment: {
        name: schedule.equipment?.name ?? "Équipement Principal",
        categoryLabel: currentProtocol.name,
        brand: schedule.equipment?.brand ?? "Constructeur Certifié",
        model: schedule.equipment?.model ?? "Modèle Entreprise",
        serialNumber: schedule.equipment?.serial_number ?? "SN-2026-X9",
        assignedUser: "Collaborateur assigné",
      },
      interventionDate: new Date().toLocaleDateString("fr-FR"),
      durationMinutes,
      technicianName,
      initialObservations:
        observations.trim() ||
        `Entretien périodique de conformité et audit de bon fonctionnement du matériel (${currentProtocol.name}).`,
      workPerformed: `Exécution complète du protocole ${currentProtocol.name} : ${currentProtocol.tasks.map((t) => t.label).join(", ")}.`,
      ...(partsReplaced.trim()
        ? {
            partsReplaced: [
              {
                name: partsReplaced.trim(),
                quantity: 1,
                status: "neuf" as const,
              },
            ],
          }
        : {}),
      checkpoints,
      finalStatus: "operationnel",
      recommendations: `Poursuivre le cycle d'utilisation normal. Prochaine maintenance préventive recommandée dans ${currentProtocol.recommendedFrequencyMonths} mois.`,
      warrantyMonths: 6,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-checklist-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-3xl border border-border bg-card p-6 shadow-2xl space-y-5 rounded-lg max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Wrench className="size-5 text-primary" />
              <h2 id="modal-checklist-title" className="text-base font-bold text-foreground">
                Fiche d'Intervention &amp; Protocole de Maintenance
              </h2>
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {schedule.task_title} · {orgName}
            </p>
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

        {/* 1. Maintenance Type Selector */}
        <div className="space-y-1.5">
          <span className="at-eyebrow text-[10px] text-muted-foreground block uppercase font-mono">
            Type d'Intervention
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {MAINTENANCE_TYPES_CONFIG.map((t) => {
              const isSelected = selectedType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedType(t.id)}
                  className={`p-2.5 text-left border rounded-md transition-all text-xs ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                      : "border-border bg-surface text-muted-foreground hover:border-border hover:bg-muted/40"
                  }`}
                >
                  <span className="block font-bold text-foreground truncate">{t.badge}</span>
                  <span className="text-[10px] text-muted-foreground line-clamp-1">{t.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Equipment Category Protocols */}
        <div className="space-y-1.5">
          <span className="at-eyebrow text-[10px] text-muted-foreground block uppercase font-mono">
            Catégorie de Matériel
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {(Object.keys(MAINTENANCE_PROTOCOLS) as EquipmentCategory[]).map((catKey) => {
              const proto = MAINTENANCE_PROTOCOLS[catKey];
              const Icon = CATEGORY_ICONS[catKey] || Laptop;
              const isSelected = selectedCategory === catKey;
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setSelectedCategory(catKey)}
                  className={`p-2 text-center border rounded-md transition-all flex flex-col items-center gap-1 text-xs ${
                    isSelected
                      ? "border-primary bg-primary/15 text-primary font-bold"
                      : "border-border bg-surface text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  <Icon
                    className={`size-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <span className="text-[10px] font-semibold truncate max-w-full">
                    {proto.name.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Equipment Info Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-muted/20 border border-border p-3.5 text-xs rounded-md">
          <div>
            <span className="text-muted-foreground text-[10px] uppercase font-mono block">
              Équipement
            </span>
            <span className="font-bold text-foreground block truncate">
              {schedule.equipment?.name ?? "Équipement Actif"}
            </span>
            <p className="text-muted-foreground text-[11px] truncate">
              {[schedule.equipment?.brand, schedule.equipment?.model].filter(Boolean).join(" ")}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground text-[10px] uppercase font-mono block">
              N° Série / Immatriculation
            </span>
            <span className="font-mono font-bold text-foreground block">
              {schedule.equipment?.serial_number ?? "SN-AT-2026-X"}
            </span>
            <p className="text-muted-foreground text-[11px]">
              Fréquence : tous les {currentProtocol.recommendedFrequencyMonths} mois
            </p>
          </div>
          <div>
            <span className="text-muted-foreground text-[10px] uppercase font-mono block">
              Technicien / Durée
            </span>
            <span className="font-semibold text-foreground block">{technicianName}</span>
            <p className="text-muted-foreground text-[11px]">
              {durationMinutes} minutes d'intervention
            </p>
          </div>
        </div>

        {/* 4. Interactive Protocol Tasks Checklist */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" />
              Protocole {currentProtocol.name} ({completedTasks} / {totalTasks} vérifiés)
            </h3>
            <span className="font-mono text-xs text-primary font-bold">
              {progressPercent}% Conforme
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
            {currentProtocol.tasks.map((task) => {
              const status = taskStatuses[task.id] || "conforme";
              return (
                <div
                  key={task.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 text-xs hover:bg-accent/5 transition-colors"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-foreground block">{task.label}</span>
                    {task.description && (
                      <span className="text-[11px] text-muted-foreground block">
                        {task.description}
                      </span>
                    )}
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setTaskStatuses((prev) => ({ ...prev, [task.id]: "conforme" }))
                      }
                      className={`px-2 py-1 text-[10px] font-mono font-bold rounded border transition-colors ${
                        status === "conforme"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-surface text-muted-foreground border-border hover:text-foreground"
                      }`}
                    >
                      Conforme
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskStatuses((prev) => ({ ...prev, [task.id]: "corrige" }))}
                      className={`px-2 py-1 text-[10px] font-mono font-bold rounded border transition-colors ${
                        status === "corrige"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-surface text-muted-foreground border-border hover:text-foreground"
                      }`}
                    >
                      Corrigé
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setTaskStatuses((prev) => ({ ...prev, [task.id]: "a_surveiller" }))
                      }
                      className={`px-2 py-1 text-[10px] font-mono font-bold rounded border transition-colors ${
                        status === "a_surveiller"
                          ? "bg-amber-600 text-white border-amber-600"
                          : "bg-surface text-muted-foreground border-border hover:text-foreground"
                      }`}
                    >
                      À surveiller
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Additional Observations & Consumables */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label htmlFor="obs-input" className="font-semibold text-foreground block mb-1">
              Observations &amp; Recommandations
            </label>
            <input
              id="obs-input"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Ex: Nettoyage effectué, pâte thermique renouvelée, batterie saine..."
              className="w-full border border-border bg-background px-3 py-2 text-xs rounded-md focus:border-primary outline-none"
            />
          </div>
          <div>
            <label htmlFor="parts-input" className="font-semibold text-foreground block mb-1">
              Pièces / Consommables Remplacés (optionnel)
            </label>
            <input
              id="parts-input"
              value={partsReplaced}
              onChange={(e) => setPartsReplaced(e.target.value)}
              placeholder="Ex: Pâte thermique MX-4, Ventilateur CPU neuf, Pad thermique..."
              className="w-full border border-border bg-background px-3 py-2 text-xs rounded-md focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadFiche}
              className="font-semibold"
            >
              <Download className="size-4 mr-1.5 text-primary" />
              Fiche d'Intervention (PDF)
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                generatePvRestitutionPdf({
                  pvNumber: `PV-MAINT-${Date.now().toString().slice(-4)}`,
                  orgName,
                  clientContactName: "Responsable Informatique / DSI",
                  equipmentName: schedule.equipment?.name ?? "Serveur Principal",
                  serialNumber: schedule.equipment?.serial_number ?? "SN-2026-X9",
                  interventionSummary: `Cycle de maintenance ${selectedType} (${currentProtocol.name}) réalisé avec succès par Allô Techno.`,
                  warrantyPeriodMonths: 6,
                  restitutionDate: new Date().toLocaleDateString("fr-FR"),
                  technicianName,
                })
              }
            >
              <FileText className="size-4 mr-1.5 text-muted-foreground" />
              PV de Restitution
            </Button>
          </div>

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
