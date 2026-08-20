import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  Calendar,
  Clock,
  DollarSign,
  LayoutGrid,
  Loader2,
  RadioTower,
  ShoppingCart,
  Wrench,
  TrendingUp,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { getAdminDashboardStats } from "@/lib/admin.functions";

export function AdminDashboard() {
  const { t } = useI18n();
  const getStatsFn = useServerFn(getAdminDashboardStats);

  const stats = useQuery({
    queryKey: ["dash-stats"],
    queryFn: () => getStatsFn({ data: undefined }),
    refetchInterval: 30_000,
  });

  const activeRepairs = { data: stats.data?.activeRepairs, isLoading: stats.isLoading };
  const todayReservations = { data: stats.data?.todayReservations, isLoading: stats.isLoading };
  const monthRevenue = { data: stats.data?.monthRevenue, isLoading: stats.isLoading };
  const recentActivity = { data: stats.data?.recentActivity, isLoading: stats.isLoading };
  const pendingQuotes = { data: stats.data?.pendingQuotes, isLoading: stats.isLoading };
  const realtimeActive = { data: stats.data?.realtimeActive, isLoading: stats.isLoading };

  const kpis = [
    {
      label: t("admin.dash.activeRepairs"),
      value: activeRepairs.data ?? 0,
      icon: Wrench,
      loading: activeRepairs.isLoading,
      accentClass: "border-l-primary/50",
    },
    {
      label: t("admin.dash.todayReservations"),
      value: todayReservations.data ?? 0,
      icon: Calendar,
      loading: todayReservations.isLoading,
      accentClass: "border-l-chart-2/50",
    },
    {
      label: t("admin.dash.pendingQuotes"),
      value: pendingQuotes.data ?? 0,
      icon: Clock,
      loading: pendingQuotes.isLoading,
      accentClass: "border-l-chart-4/50",
    },
    {
      label: t("admin.dash.monthRevenue"),
      value: `${(monthRevenue.data ?? 0).toLocaleString(t("locale") as string)} FCFA`,
      icon: DollarSign,
      loading: monthRevenue.isLoading,
      accentClass: "border-l-success/50",
    },
    {
      label: t("admin.dash.inPipeline"),
      value: realtimeActive.data ?? 0,
      icon: RadioTower,
      loading: realtimeActive.isLoading,
      accentClass: "border-l-accent/50",
    },
  ];

  return (
    <div className="at-in space-y-8">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="at-eyebrow">{t("admin.dash.eyebrow")}</p>
          <h2 className="at-display mt-1 text-2xl">{t("admin.dash.title")}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{t("admin.dash.intro")}</p>
        </div>
        <Button variant="technicalOutline" size="sm" asChild>
          <Link to="/admin/stats">
            <TrendingUp className="mr-1.5 size-3.5" />
            {t("admin.stats.tab")}
          </Link>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {kpis.map((kpi, i) => (
          <div
            key={kpi.label}
            className="flex flex-col justify-between border-l-2 bg-card p-4 transition-colors hover:bg-surface"
            style={{
              borderLeftColor: "var(--color-border)",
              animationDelay: `${i * 80}ms`,
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="at-eyebrow">{kpi.label}</p>
              <kpi.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            </div>
            <div className="mt-3">
              {kpi.loading ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              ) : (
                <p className="text-2xl font-bold tabular-nums">{kpi.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Recent Activity */}
        <section className="border border-border bg-card lg:col-span-4">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">{t("admin.dash.recentActivity")}</h3>
            <Button variant="ghost" size="sm" asChild className="h-7 gap-1.5 text-xs">
              <Link to="/admin/dossiers">
                <RadioTower className="size-3.5" />
                {t("admin.dash.viewDossiers")}
              </Link>
            </Button>
          </div>

          {recentActivity.isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (recentActivity.data ?? []).length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {t("admin.dash.noActivity")}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {(recentActivity.data ?? []).map((entry, i) => {
                const reservation = Array.isArray(entry.reservations)
                  ? entry.reservations[0]
                  : entry.reservations;
                return (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center bg-muted text-muted-foreground">
                      <Activity className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {t("admin.dash.repairFor", [reservation?.customer_name ?? "—"])}
                      </p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {reservation?.reference ?? "—"} · {entry.new_status}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {new Date(entry.created_at).toLocaleTimeString(t("locale") as string, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="border border-border bg-card lg:col-span-3">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">{t("admin.dash.quickActions")}</h3>
          </div>
          <div className="p-4 space-y-2">
            <Button variant="technical" className="w-full justify-start" asChild>
              <Link to="/admin/dossiers">
                <RadioTower className="mr-2 size-4" />
                {t("admin.dash.viewDossiers")}
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/admin/dossiers" search={{ view: "kanban" }}>
                <LayoutGrid className="mr-2 size-4" />
                {t("admin.dash.openKanban")}
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/admin/commandes">
                <ShoppingCart className="mr-2 size-4" />
                {t("admin.tab.commandes")}
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/admin/stats">
                <Activity className="mr-2 size-4" />
                {t("admin.stats.tab")}
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
