import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog";
import {
  listRefundablePayments,
  initiateRefund,
  type RefundablePayment,
} from "@/lib/refund.functions";

const field =
  "h-11 w-full rounded-sm border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function RefundsSection() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(listRefundablePayments);
  const refundFn = useServerFn(initiateRefund);
  const [query, setQuery] = useState("");
  const [confirmPayment, setConfirmPayment] = useState<RefundablePayment | null>(null);
  const [reason, setReason] = useState("");

  const payments = useQuery({
    queryKey: ["admin-refundable-payments"],
    queryFn: () => listFn({ data: {} }),
  });

  const doRefund = useMutation({
    mutationFn: async () => {
      if (!confirmPayment) return;
      await refundFn({ data: { paymentId: confirmPayment.id, reason: reason.trim() } });
    },
    onSuccess: () => {
      toast.success("Remboursement enregistré");
      setConfirmPayment(null);
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-refundable-payments"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Remboursement impossible"),
  });

  if (payments.isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement des paiements…</p>;
  }

  const rows = (payments.data ?? []).filter((p) => {
    const q = query.trim().toLowerCase();
    return (
      !q ||
      p.reference.toLowerCase().includes(q) ||
      (p.customer_name ?? "").toLowerCase().includes(q) ||
      (p.phone ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <h2 className="text-lg font-semibold">Remboursements</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Paiements confirmés éligibles au remboursement. Le statut passe à « Remboursé » et une
        entrée d'audit est créée.
      </p>
      <label htmlFor="refund-search" className="sr-only">
        Rechercher un paiement
      </label>
      <input
        id="refund-search"
        className={`${field} mt-4`}
        placeholder="Rechercher (référence, nom, téléphone)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Aucun paiement remboursable ne correspond à cette recherche.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((p) => (
            <li key={p.id} className="border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-primary/50 px-3 py-1 font-mono text-xs font-bold text-primary">
                    {p.reference}
                  </span>
                  <p className="font-medium">{p.customer_name ?? "Anonyme"}</p>
                  <Badge variant="outline" className="border-success/50 text-success">
                    {formatFcfa(p.amount)}
                  </Badge>
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    {p.method}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setConfirmPayment(p);
                    setReason("");
                  }}
                >
                  Rembourser
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{p.phone ?? "—"}</span>
                <span>{p.source}</span>
                <span>{new Date(p.created_at).toLocaleString("fr-FR")}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={confirmPayment !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmPayment(null);
            setReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer le remboursement</DialogTitle>
            <DialogDescription>
              Le paiement de <strong>{confirmPayment?.reference}</strong> (
              {confirmPayment ? formatFcfa(confirmPayment.amount) : ""}) sera marqué comme
              remboursé. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <label htmlFor="refund-reason" className="block">
            <span className="at-eyebrow mb-2 block">Motif du remboursement</span>
            <textarea
              id="refund-reason"
              className={`${field} min-h-20 py-1.5 text-xs`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Indiquez la raison du remboursement…"
              maxLength={500}
            />
          </label>
          {!reason.trim() && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AlertCircle className="size-3" />
              Un motif est requis pour créer l'entrée d'audit.
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={doRefund.isPending}
              onClick={() => {
                setConfirmPayment(null);
                setReason("");
              }}
            >
              Annuler
            </Button>
            <Button
              variant="technical"
              disabled={doRefund.isPending || !reason.trim()}
              onClick={() => doRefund.mutate()}
            >
              {doRefund.isPending ? "Remboursement…" : "Confirmer le remboursement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
