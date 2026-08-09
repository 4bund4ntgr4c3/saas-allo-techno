import { useState, useEffect } from "react";
import {
  getSatisfactionStats,
  getSatisfactionEntries,
  type SatisfactionEntry,
} from "@/lib/satisfaction.functions";
import { Star, ThumbsUp, ThumbsDown, BarChart3 } from "lucide-react";

export function AdminSatisfaction() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getSatisfactionStats>> | null>(null);
  const [entries, setEntries] = useState<SatisfactionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [s, e] = await Promise.all([getSatisfactionStats(), getSatisfactionEntries()]);
        setStats(s);
        setEntries(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="h-40 rounded-lg bg-muted animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold flex items-center gap-2">
        <BarChart3 className="size-5" /> Satisfaction client
      </h3>

      {stats && (
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-[10px] uppercase text-muted-foreground">NPS Score</p>
            <p
              className={`text-2xl font-bold ${stats.nps >= 50 ? "text-success" : stats.nps >= 0 ? "text-amber-600" : "text-destructive"}`}
            >
              {stats.nps > 0 ? "+" : ""}
              {stats.nps}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-[10px] uppercase text-muted-foreground">Note moyenne</p>
            <div className="flex items-center gap-1">
              <p className="text-2xl font-bold">{stats.avgRating}</p>
              <Star className="size-4 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-[10px] uppercase text-muted-foreground">Promoteurs</p>
            <div className="flex items-center gap-1">
              <ThumbsUp className="size-4 text-success" />
              <p className="text-2xl font-bold">{stats.promoters}</p>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-[10px] uppercase text-muted-foreground">Détracteurs</p>
            <div className="flex items-center gap-1">
              <ThumbsDown className="size-4 text-destructive" />
              <p className="text-2xl font-bold">{stats.detractors}</p>
            </div>
          </div>
        </div>
      )}

      {stats && stats.total > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium mb-2">Distribution des notes</p>
          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.distribution[star] ?? 0;
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-4 text-right">{star}</span>
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-bold">Avis récents</h4>
          {entries.slice(0, 10).map((e) => (
            <div key={e.id} className="rounded-lg border bg-card p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{e.customer_name}</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`size-3 ${s <= e.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                    />
                  ))}
                  <span className="ml-1 text-xs text-muted-foreground">NPS: {e.nps_score}</span>
                </div>
              </div>
              {e.comment && <p className="text-xs text-muted-foreground">{e.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
