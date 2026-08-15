import * as React from "react";
import { Plus, Trash2, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface EditingSiteData {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  manager: string;
  departments: string[];
}

export interface EditSiteModalProps {
  site: EditingSiteData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (site: EditingSiteData) => void;
  onDelete: (siteId: string) => void;
  isSaving?: boolean;
  isDeleting?: boolean;
}

export function EditSiteModal({
  site,
  isOpen,
  onClose,
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false,
}: EditSiteModalProps) {
  const [formData, setFormData] = React.useState<EditingSiteData | null>(null);
  const [newDeptInput, setNewDeptInput] = React.useState("");

  React.useEffect(() => {
    setFormData(site);
    setNewDeptInput("");
  }, [site]);

  if (!isOpen || !formData) return null;

  const addDepartment = () => {
    const trimmed = newDeptInput.trim();
    if (!trimmed || formData.departments.includes(trimmed)) return;
    setFormData({
      ...formData,
      departments: [...formData.departments, trimmed],
    });
    setNewDeptInput("");
  };

  const removeDepartment = (dept: string) => {
    setFormData({
      ...formData,
      departments: formData.departments.filter((d) => d !== dept),
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-site-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl border border-border bg-card p-6 shadow-2xl space-y-5 rounded-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 id="modal-site-title" className="text-base font-bold text-foreground">
              Configuration du Site &amp; Départements
            </h2>
            <p className="text-xs text-muted-foreground font-mono">{formData.name}</p>
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

        {/* Site Info Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <Label>Nom du Site</Label>
            <Input
              className="mt-1"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <Label>Ville</Label>
            <Input
              className="mt-1"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>
          <div>
            <Label>Adresse / Emplacement</Label>
            <Input
              className="mt-1"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div>
            <Label>Responsable de Site</Label>
            <Input
              className="mt-1"
              value={formData.manager}
              onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Téléphone de Contact</Label>
            <Input
              className="mt-1"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>

        {/* Departments Section */}
        <div className="border border-primary/20 bg-primary/5 p-4 space-y-3 rounded-md">
          <div className="flex items-center justify-between">
            <span className="at-eyebrow text-xs text-primary font-bold">
              Départements rattachés au site ({formData.departments.length})
            </span>
            <span className="text-[11px] text-muted-foreground">Ex: DSI, Finance, RH</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.departments.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Aucun département configuré pour ce site.
              </p>
            ) : (
              formData.departments.map((d) => (
                <Badge
                  key={d}
                  variant="outline"
                  className="gap-1.5 py-1 px-2.5 text-xs bg-card border-border font-medium"
                >
                  {d}
                  <button
                    type="button"
                    onClick={() => removeDepartment(d)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Supprimer ${d}`}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Input
              placeholder="Nom du nouveau département (ex: Service Client)"
              className="text-xs bg-card"
              value={newDeptInput}
              onChange={(e) => setNewDeptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addDepartment();
                }
              }}
            />
            <Button type="button" size="sm" variant="outline" onClick={addDepartment}>
              <Plus className="size-3.5 mr-1" />
              Ajouter
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10"
            disabled={isDeleting}
            onClick={() => onDelete(formData.id)}
          >
            <Trash2 className="size-4 mr-1.5" />
            Supprimer le Site
          </Button>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="button" disabled={isSaving} onClick={() => onSave(formData)}>
              {isSaving ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}
              Enregistrer les Modifications
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
