import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";

export function ErrorRoute({ error, reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="w-full max-w-md border border-border bg-card p-8 text-center">
        <h2 className="at-display mb-2 text-2xl">{t("error.title")}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{error?.message ?? t("error.text")}</p>
        <Button variant="technical" onClick={() => reset()}>
          {t("error.retry")}
        </Button>
      </div>
    </div>
  );
}
