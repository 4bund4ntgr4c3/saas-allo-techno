// Bouton flottant "Visite guidée" : propose le tour adapté à la page courante.
import { useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { tourForPath } from "@/lib/tour/steps";
import { useTourStore } from "@/lib/tour/store";
import { Button } from "@/components/ui/button";

export function TourLauncher() {
  const { t } = useI18n();
  const location = useLocation();
  const start = useTourStore((s) => s.start);
  const [open, setOpen] = useState(false);
  const tour = tourForPath(location.pathname);
  if (!tour) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="flex flex-col gap-1 rounded-sm border border-border bg-card p-2 shadow-lg">
          <button
            type="button"
            className="rounded-sm px-3 py-2 text-left text-sm hover:bg-accent"
            onClick={() => {
              start(tour.steps);
              setOpen(false);
            }}
          >
            <span className="font-medium">{t(tour.labelKey)}</span>
            <span className="block text-xs text-muted-foreground">{t("demo.tourStart")}</span>
          </button>
        </div>
      )}
      <Button size="sm" onClick={() => setOpen((v) => !v)}>
        <Compass className="mr-2 size-4" />
        {t("demo.visitTour")}
      </Button>
    </div>
  );
}
