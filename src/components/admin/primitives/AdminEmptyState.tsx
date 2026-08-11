import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminEmptyStateProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
};

export function AdminEmptyState({ icon, title, description, action, className }: AdminEmptyStateProps) {
  return (
    <div className={cn("border border-dashed border-border bg-card p-16 text-center", className)}>
      <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      {action && (
        <Button variant="technical" className="mt-6" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
