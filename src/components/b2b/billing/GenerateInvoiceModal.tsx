import * as React from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface GenerateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { periodMonth: string; notes: string }) => void;
  isPending?: boolean;
}

export function GenerateInvoiceModal({
  isOpen,
  onClose,
  onSubmit,
  isPending = false,
}: GenerateInvoiceModalProps) {
  const [periodMonth, setPeriodMonth] = React.useState(() => new Date().toISOString().slice(0, 7));
  const [notes, setNotes] = React.useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ periodMonth, notes });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-invoice-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg border border-border bg-card p-6 shadow-2xl space-y-4 rounded-lg">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 id="modal-invoice-title" className="text-base font-bold text-foreground">
            Générer un Appel de Facturation Périodique
          </h3>
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <Label htmlFor="inv-period">Mois de Période de Référence</Label>
            <Input
              id="inv-period"
              type="month"
              required
              className="mt-1"
              value={periodMonth}
              onChange={(e) => setPeriodMonth(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="inv-notes">Notes / Référence de Commande Client</Label>
            <Input
              id="inv-notes"
              className="mt-1"
              placeholder="Ex: PO-2026-HQ-01, Maintenance trimestrielle"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin mr-1.5" />
              ) : (
                <Plus className="size-4 mr-1.5" />
              )}
              Générer la Facture
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
