import * as React from "react";
import { Trophy, Star, Zap, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";
import {
  getTechIncentivesLeaderboardFn,
  type TechIncentiveProfile,
} from "@/lib/tech-incentives.functions";

export function TechIncentivesLeaderboard() {
  const [techs, setTechs] = React.useState<TechIncentiveProfile[]>([]);
  const [totalPool, setTotalPool] = React.useState(0);

  React.useEffect(() => {
    getTechIncentivesLeaderboardFn()
      .then((res) => {
        setTechs(res.technicians);
        setTotalPool(res.totalCommissionsPoolFcfa);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="border border-border bg-card p-5 sm:p-6 rounded-2xl space-y-6 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Trophy className="size-5 text-amber-500 shrink-0" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">
              Leaderboard &amp; Primes de Performance Techniciens
            </h3>
            <p className="text-xs text-muted-foreground">
              Commissions automatiques indexées sur les SLA express, tickets résolus et avis 5
              étoiles
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className="font-mono text-xs font-bold text-primary border-primary/40 bg-primary/10"
        >
          Cagnotte MoMo : {formatFcfa(totalPool)}
        </Badge>
      </div>

      <div className="space-y-3">
        {techs.map((tech, idx) => (
          <div
            key={tech.technicianId}
            className="p-4 rounded-xl border border-border bg-surface/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs text-xs"
          >
            <div className="flex items-center gap-3">
              <span
                className={`size-8 rounded-full flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
                  idx === 0
                    ? "bg-amber-500 text-white shadow-xs"
                    : idx === 1
                      ? "bg-slate-300 text-slate-800"
                      : "bg-amber-700/60 text-white"
                }`}
              >
                #{idx + 1}
              </span>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <strong className="text-foreground text-sm">{tech.name}</strong>
                  <Badge variant="outline" className="text-[10px] text-primary border-primary/20">
                    {tech.rankBadge}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                  <span>{tech.resolvedTicketsThisMonth} tickets résolus</span>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <Zap className="size-3" /> {tech.slaExpressBonusCount} bonus SLA &lt; 1h
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-amber-500 font-semibold">
                    <Star className="size-3" /> {tech.fiveStarReviewsCount} avis 5★
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-border/60">
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-muted-foreground block">
                  Prime MoMo Cumulée :
                </span>
                <strong className="font-mono text-base font-extrabold text-primary">
                  {formatFcfa(tech.totalCommissionEarnedFcfa)}
                </strong>
              </div>

              <Badge
                variant="outline"
                className="text-[10px] text-emerald-600 border-emerald-600/30 font-mono"
              >
                <Smartphone className="size-3 mr-1" /> {tech.momoPayoutPhoneNumber}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
