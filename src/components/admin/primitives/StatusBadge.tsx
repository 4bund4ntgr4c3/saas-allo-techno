import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  en_attente: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  en_cours: "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  termine: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  annule: "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400",
  rembourse: "border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400",
  non_remboursable: "border-muted-foreground/40 bg-muted/50 text-muted-foreground",
  active: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  inactive: "border-muted-foreground/40 bg-muted/50 text-muted-foreground",
  pending: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  paid: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  failed: "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400",
  delivered: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  shipped: "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  processing: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  critical: "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  ok: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
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
