// Overlay du visit tour : spotlights l'élément ciblé (data-tour) et affiche
// une bulle de présentation avec navigation (Précédent / Suivant / Terminer).
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { tourTarget, useTourStore } from "@/lib/tour/store";
import { Button } from "@/components/ui/button";

const SPOT_PADDING = 8;
const MAX_WIDTH = 340;

export function TourOverlay() {
  const { t } = useI18n();
  const { active, index, steps, next, back, stop } = useTourStore();
  const [rect, setRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const step = steps[index];

  const measure = useCallback(() => {
    if (!active || !step) return;
    const el = tourTarget(step);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [active, step]);

  useLayoutEffect(() => {
    measure();
    if (!active || !step) return;
    const el = tourTarget(step);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, [active, step, measure]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") stop();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, next, back, stop]);

  if (!active || !step) return null;

  const placement = rect && rect.top > 280 ? "bottom" : "top";
  const tipLeft =
    rect && rect.left + MAX_WIDTH / 2 > window.innerWidth - 16
      ? window.innerWidth - MAX_WIDTH - 16
      : Math.max(16, (rect ? rect.left + rect.width / 2 : window.innerWidth / 2) - MAX_WIDTH / 2);
  const tipTop = !rect
    ? window.innerHeight / 2 - 90
    : placement === "bottom"
      ? rect.top + rect.height + SPOT_PADDING + 14
      : rect.top - 14 - 120;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-label={step.titleKey}>
      {rect ? (
        <div
          className="pointer-events-none fixed rounded-md"
          style={{
            top: rect.top - SPOT_PADDING,
            left: rect.left - SPOT_PADDING,
            width: rect.width + SPOT_PADDING * 2,
            height: rect.height + SPOT_PADDING * 2,
            boxShadow: "0 0 0 9999px rgb(2 6 23 / 0.72)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-950/72" />
      )}

      <div
        className="fixed flex flex-col gap-3 border border-border bg-card p-5 shadow-2xl"
        style={{
          top: tipTop,
          left: tipLeft,
          width: "min(100vw - 32px, 340px)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {t("demo.tourStep")} {index + 1} / {steps.length}
          </span>
          <button
            type="button"
            aria-label="Fermer"
            onClick={stop}
            className="rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <div>
          <h3 className="text-base font-semibold leading-tight">{t(step.titleKey)}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(step.bodyKey)}</p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={back} disabled={index === 0}>
              {t("demo.tourBack")}
            </Button>
            {index < steps.length - 1 ? (
              <Button size="sm" onClick={next}>
                {t("demo.tourNext")}
              </Button>
            ) : (
              <Button size="sm" onClick={stop}>
                {t("demo.tourDone")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
