import * as React from "react";
import { CloudSun, Wind, CloudRain, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCurrentTropicalClimateAdvisory } from "@/lib/tropical-climate-advisor";

export function TropicalAdvisoryCard() {
  const advisory = React.useMemo(() => getCurrentTropicalClimateAdvisory(), []);

  const getIcon = () => {
    switch (advisory.seasonKey) {
      case "harmattan":
        return <Wind className="size-5 text-amber-500" />;
      case "mousson_pluie":
        return <CloudRain className="size-5 text-blue-500" />;
      case "chaleur_transition":
        return <CloudSun className="size-5 text-orange-500" />;
    }
  };

  const getBorderColor = () => {
    switch (advisory.riskFactor) {
      case "Critique":
        return "border-destructive/40 bg-destructive/5";
      case "Élevé":
        return "border-amber-500/40 bg-amber-500/5";
      case "Moyen":
        return "border-blue-500/40 bg-blue-500/5";
    }
  };

  return (
    <div
      className={`border p-5 rounded-lg space-y-4 shadow-xs animate-in fade-in duration-200 ${getBorderColor()}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div className="flex items-center gap-2.5">
          {getIcon()}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">
                {advisory.title}
              </h3>
              <Badge variant="outline" className="font-mono text-[10px]">
                {advisory.weatherIndicator}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{advisory.seasonLabel}</p>
          </div>
        </div>
        <span className="font-mono text-xs font-bold uppercase text-primary px-2.5 py-1 rounded bg-background border border-border">
          Risque Matériel : {advisory.riskFactor}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="space-y-2">
          <span className="at-eyebrow text-muted-foreground block text-[10px]">
            Menaces Typiques Identifiées :
          </span>
          <ul className="space-y-1.5 text-muted-foreground">
            {advisory.mainThreats.map((threat, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <AlertTriangle className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>{threat}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <span className="at-eyebrow text-foreground block text-[10px]">
            Recommandations Allô Techno Pro :
          </span>
          <ul className="space-y-1.5 text-foreground">
            {advisory.recommendedActions.map((action, i) => (
              <li key={i} className="flex items-start gap-1.5 font-medium">
                <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
