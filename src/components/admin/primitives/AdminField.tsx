import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { field } from "./field";

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
        <input
          ref={ref}
          id={fieldId}
          className={cn(field, error && "border-destructive", className)}
          {...props}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  },
);
AdminField.displayName = "AdminField";

const AdminSelect = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }
>(({ className, label, error, id, children, ...props }, ref) => {
  const fieldId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={fieldId}
        className={cn(field, "pr-8", error && "border-destructive", className)}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
});
AdminSelect.displayName = "AdminSelect";

export { AdminField, AdminSelect };
export { field } from "./field";
