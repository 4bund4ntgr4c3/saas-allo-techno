import { useState, useEffect } from "react";
import { getSLABreaches, getSLAStats, type SLABreach } from "@/lib/sla";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { DataTable } from "@/components/admin/DataTable";
import type { ColumnDef } from "@tanstack/react-table";

export function AdminSLA() {
  const { t } = useI18n();
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

  const stageColumns: ColumnDef<{ stage: string; avg_hours: number; p90_hours: number; count: number }, unknown>[] = [
    {
      accessorKey: "stage",
      header: t("admin.sla.transition"),
      cell: ({ row }) => (
        <span className="text-xs font-mono">{row.original.stage}</span>
      ),
    },
    {
      accessorKey: "avg_hours",
      header: t("admin.sla.average"),
      cell: ({ row }) => (
        <span className="text-xs font-bold">{row.original.avg_hours}h</span>
      ),
    },
    {
      accessorKey: "p90_hours",
      header: "P90",
      cell: ({ row }) => (
        <span className="text-xs">{row.original.p90_hours}h</span>
      ),
    },
    {
      accessorKey: "count",
      header: t("admin.sla.samples"),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.count}</span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-20 rounded-lg bg-muted animate-pulse" />
        <div className="h-40 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="at-eyebrow">{t("admin.sla.eyebrow")}</p>
          <h2 className="mt-1 text-xl font-semibold">{t("admin.sla.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.sla.description")}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="size-4 text-destructive" />
            <span className="text-[10px] uppercase text-muted-foreground">{t("admin.sla.critical")}</span>
          </div>
          <p className="text-2xl font-bold text-destructive">{critical.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="size-4 text-amber-500" />
            <span className="text-[10px] uppercase text-muted-foreground">{t("admin.sla.alerts")}</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{warnings.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="size-4 text-success" />
            <span className="text-[10px] uppercase text-muted-foreground">{t("admin.sla.onTime")}</span>
          </div>
          <p className="text-2xl font-bold">{Math.max(0, 100 - breaches.length)}</p>
        </div>
      </div>

      {breaches.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-bold">{t("admin.sla.lateDossiers")}</h4>
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
                  {b.breach_severity === "critical" ? t("admin.sla.exceeded") : t("admin.sla.alert")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {stats.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-bold">{t("admin.sla.avgTimeByStage")}</h4>
          <DataTable columns={stageColumns} data={stats} />
        </div>
      )}

      {breaches.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center">
          <CheckCircle className="mx-auto size-8 text-success mb-2" />
          <p className="text-sm text-muted-foreground">{t("admin.sla.allOnTime")}</p>
        </div>
      )}
    </div>
  );
}
