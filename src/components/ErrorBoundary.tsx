import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

export function ErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="w-full max-w-md border border-border bg-card p-8 text-center">
        <AlertTriangle className="mx-auto mb-4 size-10 text-destructive" />
        <h2 className="at-display mb-2 text-2xl">{t("error.title")}</h2>
        <p className="mb-6 text-sm text-muted-foreground">{t("error.text")}</p>
        {error?.message && (
          <p className="mb-6 font-mono text-xs text-destructive/80">{error.message}</p>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              reset();
              navigate({ to: "/", replace: true });
            }}
          >
            <Home className="mr-1.5 size-3.5" />
            {t("error.home")}
          </Button>
          <Button variant="primaryBlock" size="sm" onClick={() => reset()}>
            <RotateCcw className="mr-1.5 size-3.5" />
            {t("error.retry")}
          </Button>
        </div>
      </div>
    </div>
  );
}
