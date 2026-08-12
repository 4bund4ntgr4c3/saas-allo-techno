import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminEmptyStateProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  eyebrow?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
};

export function AdminEmptyState({
  icon,
  title,
  description,
  eyebrow,
  action,
  className,
}: AdminEmptyStateProps) {
  return (
    <div
      className={cn("border border-dashed border-border/60 bg-surface p-16 text-center", className)}
    >
      {/* Icône carrée — style "precision engineering" */}
      <div className="mx-auto mb-4 flex size-12 items-center justify-center bg-muted text-muted-foreground">
        {icon}
      </div>
      {eyebrow && <p className="at-eyebrow mb-2">{eyebrow}</p>}
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
      {action && (
        <Button variant="technical" className="mt-6" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
