import { useState, useEffect } from "react";
import { getSLABreaches, getSLAStats, type SLABreach } from "@/lib/sla";
import { Clock, AlertTriangle, CheckCircle, Timer } from "lucide-react";

export function AdminSLA() {
  const [breaches, setBreaches] = useState<SLABreach[]>([]);
  const [stats, setStats] = useState<
    { stage: string; avg_hours: number; p90_hours: number; count: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [b, s] = await Promise.all([getSLABreaches(), getSLAStats()]);
        setBreaches(b);
        setStats(s);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const critical = breaches.filter((b) => b.breach_severity === "critical");
  const warnings = breaches.filter((b) => b.breach_severity === "warning");

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-20 rounded-lg bg-muted animate-pulse" />
        <div className="h-40 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold flex items-center gap-2">
        <Timer className="size-5" /> Suivi SLA
      </h3>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="size-4 text-destructive" />
            <span className="text-[10px] uppercase text-muted-foreground">Critiques</span>
          </div>
          <p className="text-2xl font-bold text-destructive">{critical.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="size-4 text-amber-500" />
            <span className="text-[10px] uppercase text-muted-foreground">Alertes</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{warnings.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="size-4 text-success" />
            <span className="text-[10px] uppercase text-muted-foreground">Dans les temps</span>
          </div>
          <p className="text-2xl font-bold">{Math.max(0, 100 - breaches.length)}</p>
        </div>
      </div>

      {breaches.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-bold">Dossiers en retard</h4>
          {breaches.map((b) => (
            <div
              key={b.reservation_id}
              className={`flex items-center justify-between rounded-lg border p-3 ${
                b.breach_severity === "critical"
                  ? "border-destructive bg-destructive/5"
                  : "border-amber-300 bg-amber-50"
              }`}
            >
              <div>
                <p className="text-sm font-medium">
                  {b.reference} — {b.customer_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {b.device} · {b.status}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">
                  {b.elapsed_hours}h / {b.target_hours}h
                </p>
                <p
                  className={`text-[10px] font-medium ${b.breach_severity === "critical" ? "text-destructive" : "text-amber-600"}`}
                >
                  {b.breach_severity === "critical" ? "Dépassé" : "Alerte"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {stats.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-bold">Temps moyen par étape</h4>
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-4 py-2 text-xs font-medium">Transition</th>
                  <th className="px-4 py-2 text-xs font-medium">Moyen</th>
                  <th className="px-4 py-2 text-xs font-medium">P90</th>
                  <th className="px-4 py-2 text-xs font-medium">Échantillons</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.stage} className="border-b last:border-0">
                    <td className="px-4 py-2 text-xs font-mono">{s.stage}</td>
                    <td className="px-4 py-2 text-xs font-bold">{s.avg_hours}h</td>
                    <td className="px-4 py-2 text-xs">{s.p90_hours}h</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{s.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {breaches.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center">
          <CheckCircle className="mx-auto size-8 text-success mb-2" />
          <p className="text-sm text-muted-foreground">Tous les dossiers sont dans les temps</p>
        </div>
      )}
    </div>
  );
}
