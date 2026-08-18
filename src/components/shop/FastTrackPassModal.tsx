import * as React from "react";
import { Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";
import { FAST_TRACK_OPTIONS } from "@/lib/express-fast-track";

export function FastTrackPassModal() {
  const [selectedOptionId, setSelectedOptionId] = React.useState<
    "fast_track_atelier" | "fast_track_sur_site_vip"
  >("fast_track_atelier");

  const currentOption =
    FAST_TRACK_OPTIONS.find((o) => o.optionId === selectedOptionId) || FAST_TRACK_OPTIONS[0];

  return (
    <div className="border border-border bg-card p-5 sm:p-7 rounded-2xl max-w-xl mx-auto space-y-6 shadow-xl animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Zap className="size-5 text-amber-500 shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Pass Coupe-File &amp; Conciergerie Express 45 Min VIP
            </h3>
            <p className="text-xs text-muted-foreground">
              Zéro temps d'attente pour les professionnels et dirigeants pressés
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-xs text-amber-600 border-amber-600/40 bg-amber-600/10 font-bold"
        >
          Priorité Absolue
        </Badge>
      </div>

      {/* Selector */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {FAST_TRACK_OPTIONS.map((opt) => (
          <button
            key={opt.optionId}
            type="button"
            onClick={() => setSelectedOptionId(opt.optionId)}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedOptionId === opt.optionId
                ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                : "border-border bg-surface hover:border-border/80"
            }`}
          >
            <div className="flex justify-between items-center">
              <strong className="text-foreground block font-bold">{opt.title}</strong>
            </div>
            <strong className="text-lg font-mono font-extrabold text-primary block mt-1">
              +{formatFcfa(opt.priceFcfa)}
            </strong>
            <span className="text-[10px] text-muted-foreground">
              Délai maxi : {opt.delayMinutes} min
            </span>
          </button>
        ))}
      </div>

      {/* Perks */}
      {currentOption && (
        <div className="p-4 rounded-xl bg-surface/70 border border-border space-y-3 text-xs">
          <span className="font-bold text-foreground uppercase tracking-wide block text-[11px]">
            Privilèges Inclus dans le Pass :
          </span>

          <div className="space-y-2">
            {currentOption.perks.map((perk, idx) => (
              <div key={idx} className="flex items-start gap-2 text-foreground">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{perk}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        asChild
        variant="technical"
        className="w-full font-bold uppercase tracking-wider text-xs h-9"
      >
        <a
          href={`https://wa.me/22960000000?text=${encodeURIComponent(
            `Bonjour Allô Techno VIP, je souhaite activer le "${currentOption?.title}" (+${formatFcfa(
              currentOption?.priceFcfa || 0,
            )}) pour une intervention urgente.`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Activer le Pass Coupe-File Immédiat &rarr;
        </a>
      </Button>
    </div>
  );
}
