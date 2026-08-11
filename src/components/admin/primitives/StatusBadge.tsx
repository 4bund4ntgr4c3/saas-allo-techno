import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  en_attente: "border-chart-4/40 bg-chart-4/10 text-chart-4",
  en_cours: "border-chart-2/40 bg-chart-2/10 text-chart-2",
  termine: "border-chart-3/40 bg-chart-3/10 text-chart-3",
  annule: "border-destructive/40 bg-destructive/10 text-destructive",
  rembourse: "border-chart-5/40 bg-chart-5/10 text-chart-5",
  non_remboursable: "border-muted-foreground/40 bg-muted/50 text-muted-foreground",
  active: "border-chart-3/40 bg-chart-3/10 text-chart-3",
  inactive: "border-muted-foreground/40 bg-muted/50 text-muted-foreground",
  pending: "border-chart-4/40 bg-chart-4/10 text-chart-4",
  paid: "border-chart-3/40 bg-chart-3/10 text-chart-3",
  failed: "border-destructive/40 bg-destructive/10 text-destructive",
  delivered: "border-chart-3/40 bg-chart-3/10 text-chart-3",
  shipped: "border-chart-2/40 bg-chart-2/10 text-chart-2",
  processing: "border-chart-4/40 bg-chart-4/10 text-chart-4",
  critical: "border-destructive/40 bg-destructive/10 text-destructive",
  warning: "border-chart-4/40 bg-chart-4/10 text-chart-4",
  ok: "border-chart-3/40 bg-chart-3/10 text-chart-3",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium capitalize", STATUS_STYLES[status] ?? "")}
    >
      {label}
    </Badge>
  );
}
