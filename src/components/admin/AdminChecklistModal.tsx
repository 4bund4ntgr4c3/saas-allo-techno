import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { saveChecklist } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ClipboardCheck, CheckCircle2, XCircle, HelpCircle, Save, X } from "lucide-react";

export type CheckStatus = "ok" | "ko" | "na";

export interface CheckItem {
  id: string;
  label: string;
  category: "ecran" | "audio_cameras" | "connectique" | "chassis_boutons";
  status: CheckStatus;
  notes?: string;
}

export const CHECKPOINTS: { id: string; label: string; category: CheckItem["category"] }[] = [
  { id: "display", label: "Écran / Affichage (taches, lignes)", category: "ecran" },
  { id: "touch", label: "Vitre & Réactivité Tactile", category: "ecran" },
  { id: "cam_front", label: "Caméra Avant & Face ID", category: "audio_cameras" },
  { id: "cam_back", label: "Caméra Arrière & Flash", category: "audio_cameras" },
  { id: "speakers_mic", label: "Haut-parleurs & Micros", category: "audio_cameras" },
  { id: "charge_battery", label: "Port de charge & Batterie", category: "connectique" },
  { id: "network_wifi", label: "Wi-Fi, Bluetooth & SIM", category: "connectique" },
  { id: "buttons", label: "Boutons physiques (Power, Volume)", category: "chassis_boutons" },
  { id: "frame_housing", label: "Châssis, Vitre arrière & Coque", category: "chassis_boutons" },
  { id: "biometry", label: "Empreinte / Capteurs proximité", category: "chassis_boutons" },
];

interface AdminChecklistModalProps {
  reservationId: string;
  reference: string;
  device: string;
  type: "intake" | "qa"; // intake = admission / qa = contrôle qualité final
  initialData?: Record<string, { status: CheckStatus; notes?: string }> | null;
  onClose: () => void;
}

export function AdminChecklistModal({
  reservationId,
  reference,
  device,
  type,
  initialData,
  onClose,
}: AdminChecklistModalProps) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<Record<string, { status: CheckStatus; notes: string }>>(() => {
    const state: Record<string, { status: CheckStatus; notes: string }> = {};
    CHECKPOINTS.forEach((cp) => {
      state[cp.id] = {
        status: initialData?.[cp.id]?.status ?? "ok",
        notes: initialData?.[cp.id]?.notes ?? "",
      };
    });
    return state;
  });

  const saveChecklistFn = useServerFn(saveChecklist);
  const saveMutation = useMutation({
    mutationFn: async () => {
      await saveChecklistFn({ data: { reservationId, type, items } });
    },
    onSuccess: () => {
      toast.success(
        type === "intake"
          ? "Checklist d'admission enregistrée avec succès"
          : "Contrôle qualité de sortie validé avec succès",
      );
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["atelier-board"] });
      onClose();
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    },
  });

  const okCount = Object.values(items).filter((i) => i.status === "ok").length;
  const koCount = Object.values(items).filter((i) => i.status === "ko").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-2xl rounded-xl bg-card border border-border p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardCheck className="size-5 text-primary" />
              <h3 className="font-bold text-base">
                {type === "intake"
                  ? "Inspection d'Admission (Entrée)"
                  : "Contrôle Qualité & Sortie (QA)"}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Dossier <span className="font-mono font-bold text-foreground">{reference}</span> •{" "}
              {device}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Counter badges */}
        <div className="flex items-center justify-between bg-muted/40 p-2.5 rounded-lg border border-border text-xs shrink-0">
          <span className="text-muted-foreground font-medium">
            Bilan des 10 points de contrôle :
          </span>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-success font-bold bg-success/10 px-2 py-0.5 rounded">
              <CheckCircle2 className="size-3.5" />
              {okCount} OK
            </span>
            {koCount > 0 && (
              <span className="inline-flex items-center gap-1 text-destructive font-bold bg-destructive/10 px-2 py-0.5 rounded">
                <XCircle className="size-3.5" />
                {koCount} KO (Défaut)
              </span>
            )}
          </div>
        </div>

        {/* Checkpoint list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 divide-y divide-border/60">
          {CHECKPOINTS.map((cp) => {
            const current = items[cp.id] ?? { status: "ok", notes: "" };
            return (
              <div
                key={cp.id}
                className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 sm:max-w-[55%]">
                  <p className="text-xs font-semibold text-foreground">{cp.label}</p>
                  <input
                    type="text"
                    placeholder="Remarques (ex: rayure légère, bouton dur...)"
                    value={current.notes}
                    onChange={(e) =>
                      setItems((prev) => ({
                        ...prev,
                        [cp.id]: {
                          status: prev[cp.id]?.status ?? "ok",
                          notes: e.target.value,
                        },
                      }))
                    }
                    className="w-full text-[11px] p-1.5 rounded border border-border bg-background/50 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setItems((prev) => ({
                        ...prev,
                        [cp.id]: {
                          notes: prev[cp.id]?.notes ?? "",
                          status: "ok",
                        },
                      }))
                    }
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-all ${
                      current.status === "ok"
                        ? "bg-success text-white font-bold shadow-sm"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <CheckCircle2 className="size-3.5" />
                    <span>OK</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setItems((prev) => ({
                        ...prev,
                        [cp.id]: {
                          notes: prev[cp.id]?.notes ?? "",
                          status: "ko",
                        },
                      }))
                    }
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-all ${
                      current.status === "ko"
                        ? "bg-destructive text-white font-bold shadow-sm"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <XCircle className="size-3.5" />
                    <span>Défaut</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setItems((prev) => ({
                        ...prev,
                        [cp.id]: {
                          notes: prev[cp.id]?.notes ?? "",
                          status: "na",
                        },
                      }))
                    }
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-all ${
                      current.status === "na"
                        ? "bg-foreground/20 text-foreground font-bold"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <HelpCircle className="size-3.5" />
                    <span>N/A</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-border pt-3 shrink-0">
          <p className="text-[11px] text-muted-foreground">
            L'inspection sera archivée et consultable sur la fiche dossier.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="gap-1.5"
            >
              <Save className="size-3.5" />
              <span>{saveMutation.isPending ? "Enregistrement..." : "Valider l'inspection"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
