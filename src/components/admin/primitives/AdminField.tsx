import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const field =
  "h-10 w-full rounded-sm border border-border bg-card px-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

type AdminFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

const AdminField = forwardRef<HTMLInputElement, AdminFieldProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const fieldId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <input ref={ref} id={fieldId} className={cn(field, error && "border-destructive", className)} {...props} />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  },
);
AdminField.displayName = "AdminField";

const AdminSelect = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const fieldId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <select ref={ref} id={fieldId} className={cn(field, "pr-8", error && "border-destructive", className)} {...props}>
          {children}
        </select>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  },
);
AdminSelect.displayName = "AdminSelect";

export { AdminField, AdminSelect, field };
