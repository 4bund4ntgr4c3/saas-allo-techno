import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  size?: "sm" | "md" | "lg";
  fullPage?: boolean;
}

export function LoadingState({
  message = "Chargement en cours...",
  size = "md",
  fullPage = false,
  className,
  ...props
}: LoadingStateProps) {
  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-10 w-10",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-6 text-muted-foreground",
        fullPage ? "min-h-[60vh] w-full" : "w-full py-12",
        className
      )}
      {...props}
    >
      <Loader2 className={cn("animate-spin text-primary", iconSizes[size])} />
      {message && (
        <p className={cn("font-medium text-foreground/80 animate-pulse", textSizes[size])}>
          {message}
        </p>
      )}
      <span className="sr-only">{message}</span>
    </div>
  );
}
