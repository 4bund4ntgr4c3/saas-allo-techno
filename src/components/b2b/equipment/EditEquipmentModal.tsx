import * as React from "react";
import { Sparkles, X, Loader2, Send, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import type { EquipmentItem, OrgSite } from "@/lib/org.functions";

export interface EditEquipmentModalProps {
  equipment: EquipmentItem | null;
  sites: OrgSite[];
  isOpen: boolean;
  onClose: () => void;
  onNavigateDetail: (equipmentId: string) => void;
  onSave: (data: { name: string; serial: string; tag: string }) => Promise<void>;
  onTransfer: (targetSiteId: string) => Promise<void>;
  isSaving?: boolean;
  isTransferring?: boolean;
}

export function EditEquipmentModal({
  equipment,
  sites,
  isOpen,
  onClose,
  onNavigateDetail,
  onSave,
  onTransfer,
  isSaving = false,
  isTransferring = false,
}: EditEquipmentModalProps) {
  const [name, setName] = React.useState("");
  const [serial, setSerial] = React.useState("");
  const [tag, setTag] = React.useState("");
  const [transferSiteId, setTransferSiteId] = React.useState("");

  React.useEffect(() => {
    if (equipment) {
      setName(equipment.name ?? "");
      setSerial(equipment.serial_number ?? "");
      setTag(equipment.asset_tag ?? "");
      setTransferSiteId(equipment.site_id ?? "");
    }
  }, [equipment]);

  if (!isOpen || !equipment) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-equipment-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl border border-border bg-card p-6 shadow-2xl space-y-5 rounded-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 id="modal-equipment-title" className="text-base font-bold text-foreground">
              Gestion de l'Équipement — {equipment.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              Réf QR : <span className="font-mono text-primary font-bold">{equipment.qr_id}</span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Diagnostic IA Header */}
        <div className="border border-primary/30 bg-primary/5 p-3.5 space-y-2 text-xs rounded-md">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5 text-primary">
              <Sparkles className="size-4" /> Diagnostic IA &amp; Score de Santé Matériel
            </span>
            <Badge
              variant="outline"
              className="text-[10px] uppercase font-mono border-primary/40 text-primary"
            >
              IA Allô Techno v2
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono">
            <div className="bg-card p-2 border border-border rounded">
              <span className="text-[10px] text-muted-foreground block">Santé Globale</span>
              <strong className="text-base text-foreground">94%</strong>
            </div>
            <div className="bg-card p-2 border border-border rounded">
              <span className="text-[10px] text-muted-foreground block">Risque Panne (6M)</span>
              <strong className="text-base text-amber-600">12%</strong>
            </div>
            <div className="bg-card p-2 border border-border rounded">
              <span className="text-[10px] text-muted-foreground block">SLA Recommandé</span>
              <strong className="text-base text-primary">Entretien Q3</strong>
            </div>
          </div>
        </div>

        {/* Edit / Transfer Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <Label className="text-xs">Désignation / Nom</Label>
            <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Numéro de Série</Label>
            <Input className="mt-1" value={serial} onChange={(e) => setSerial(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Tag / Code d'Inventaire</Label>
            <Input className="mt-1" value={tag} onChange={(e) => setTag(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Transférer vers un autre Site</Label>
            <Select value={transferSiteId} onValueChange={setTransferSiteId}>
              <SelectTrigger className="mt-1">
                <SelectValue
                  placeholder={equipment.site_name ?? equipment.location ?? "Choisir site..."}
                />
              </SelectTrigger>
              <SelectContent>
                {sites.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onNavigateDetail(equipment.id)}
          >
            Accéder à la Fiche Détaillée &amp; Historique &rarr;
          </Button>

          <div className="flex items-center gap-2">
            {transferSiteId && transferSiteId !== equipment.site_id && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isTransferring}
                onClick={() => onTransfer(transferSiteId)}
                className="border-primary/40 text-primary hover:bg-primary/10"
              >
                {isTransferring ? (
                  <Loader2 className="size-4 animate-spin mr-1" />
                ) : (
                  <Send className="size-3.5 mr-1" />
                )}
                Confirmer le Transfert
              </Button>
            )}
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={isSaving}
              onClick={() => onSave({ name, serial, tag })}
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin mr-1" />
              ) : (
                <Pencil className="size-3.5 mr-1" />
              )}
              Enregistrer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
