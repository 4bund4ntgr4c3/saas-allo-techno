import { cn } from "@/lib/utils";

// Couleur du point indicateur par statut
const STATUS_DOT: Record<string, string> = {
  // Réservations
  en_attente: "bg-chart-4",
  confirmee: "bg-primary",
  pieces: "bg-chart-4",
  en_cours: "bg-chart-2",
  pret: "bg-success",
  livre: "bg-success",
  terminee: "bg-success",
  terminee_garantie: "bg-success",
  annulee: "bg-destructive",
  // Paiements
  pending: "bg-chart-4",
  paid: "bg-success",
  failed: "bg-destructive",
  rembourse: "bg-chart-5",
  non_remboursable: "bg-muted-foreground",
  // Livraisons
  delivered: "bg-success",
  shipped: "bg-chart-2",
  processing: "bg-chart-4",
  // Génériques
  active: "bg-success",
  inactive: "bg-muted-foreground",
  ok: "bg-success",
  warning: "bg-chart-4",
  critical: "bg-destructive",
  // B2B tickets
  open: "bg-chart-2",
  in_progress: "bg-primary",
  resolved: "bg-success",
  closed: "bg-muted-foreground",
  draft: "bg-chart-5",
};

// Style de la badge (fond + texte) par statut
const STATUS_BADGE: Record<string, string> = {
  en_attente: "border-chart-4/30 bg-chart-4/8 text-chart-4",
  confirmee: "border-primary/30 bg-primary/8 text-primary",
  pieces: "border-chart-4/30 bg-chart-4/8 text-chart-4",
  en_cours: "border-chart-2/30 bg-chart-2/8 text-chart-2",
  pret: "border-success/30 bg-success/8 text-success",
  livre: "border-success/30 bg-success/8 text-success",
  terminee: "border-success/30 bg-success/8 text-success",
  terminee_garantie: "border-success/30 bg-success/8 text-success",
  annulee: "border-destructive/30 bg-destructive/8 text-destructive",
  pending: "border-chart-4/30 bg-chart-4/8 text-chart-4",
  paid: "border-success/30 bg-success/8 text-success",
  failed: "border-destructive/30 bg-destructive/8 text-destructive",
  rembourse: "border-chart-5/30 bg-chart-5/8 text-chart-5",
  non_remboursable: "border-border bg-muted/50 text-muted-foreground",
  delivered: "border-success/30 bg-success/8 text-success",
  shipped: "border-chart-2/30 bg-chart-2/8 text-chart-2",
  processing: "border-chart-4/30 bg-chart-4/8 text-chart-4",
  active: "border-success/30 bg-success/8 text-success",
  inactive: "border-border bg-muted/50 text-muted-foreground",
  ok: "border-success/30 bg-success/8 text-success",
  warning: "border-chart-4/30 bg-chart-4/8 text-chart-4",
  critical: "border-destructive/30 bg-destructive/8 text-destructive",
  open: "border-chart-2/30 bg-chart-2/8 text-chart-2",
  in_progress: "border-primary/30 bg-primary/8 text-primary",
  resolved: "border-success/30 bg-success/8 text-success",
  closed: "border-border bg-muted/50 text-muted-foreground",
  draft: "border-chart-5/30 bg-chart-5/8 text-chart-5",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  const dotClass = STATUS_DOT[status] ?? "bg-muted-foreground";
  const badgeClass = STATUS_BADGE[status] ?? "border-border bg-muted/50 text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider",
        badgeClass,
      )}
    >
      <span className={cn("size-1.5 shrink-0", dotClass)} />
      {label}
    </span>
  );
}
