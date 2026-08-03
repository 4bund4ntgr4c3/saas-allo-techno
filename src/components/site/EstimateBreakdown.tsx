import { ClipboardCheck, Cpu, ShieldCheck, Wrench } from "lucide-react";
import { formatFcfa } from "@/data/catalog";
import type { Estimate } from "@/lib/estimate";

const LINE_ICON: Record<string, typeof Cpu> = {
  parts: Cpu,
  labor: Wrench,
  service: ClipboardCheck,
  warranty: ShieldCheck,
};

type Props = {
  estimate: Estimate;
  title?: string;
  subtitle?: string | null;
};

/**
 * Décomposition du devis en direct : pièces, main-d'œuvre, service atelier et
 * garantie. Affichée en permanence dans l'assistant et recalculée à chaque
 * changement de panne sélectionnée.
 */
export function EstimateBreakdown({
  estimate,
  title = "Devis en direct",
  subtitle = "Mis à jour instantanément",
}: Props) {
  const total = estimate.total;

  return (
    <div className="border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
        <span className="at-eyebrow">{title}</span>
        {subtitle && (
          <span className="font-mono text-[10px] uppercase text-muted-foreground">{subtitle}</span>
        )}
      </div>

      <ul className="divide-y divide-border px-5">
        {estimate.lines.map((line) => {
          const Icon = LINE_ICON[line.key] ?? Wrench;
          return (
            <li key={line.key} className="flex items-start justify-between gap-4 py-3">
              <span className="flex items-start gap-2.5">
                <Icon className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.5} />
                <span>
                  <span className="block text-sm font-semibold">{line.label}</span>
                  <span className="block font-mono text-[10px] uppercase text-muted-foreground">
                    {line.detail}
                  </span>
                </span>
              </span>
              <span className="font-mono text-xs whitespace-nowrap">
                {line.amount > 0 ? formatFcfa(line.amount) : "—"}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between gap-4 border-t border-border px-5 py-4">
        <span className="text-sm font-bold uppercase tracking-tight">Total estimé</span>
        <span className="font-mono text-lg font-bold text-primary">
          {total > 0 ? formatFcfa(total) : "Diagnostic gratuit"}
        </span>
      </div>

      <p className="px-5 pb-4 text-[11px] text-muted-foreground">
        Estimation indicative — le devis définitif est confirmé après diagnostic en atelier.
      </p>
    </div>
  );
}
