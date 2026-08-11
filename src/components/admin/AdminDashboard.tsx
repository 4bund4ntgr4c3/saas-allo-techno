import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Activity, Calendar, DollarSign, LayoutGrid, Loader2,
  RadioTower, ShoppingCart, Users, Wrench,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STATUS_LABEL: Record<string, string> = {
  en_attente: "En attente",
  en_cours: "En cours",
  termine: "Terminé",
  terminee: "Terminé",
  annulee: "Annulée",
};

export function AdminDashboard() {
  const { t } = useI18n();

  const activeRepairs = useQuery({
    queryKey: ["dash-active-repairs"],
    queryFn: async () => {
      const { count } = await supabase
        .from("reservations")
        .select("*", { count: "exact", head: true })
        .in("status", ["en_attente", "en_cours"]);
      return count ?? 0;
    },
  });

  const todayReservations = useQuery({
    queryKey: ["dash-today"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0]!;
      const { count } = await supabase
        .from("reservations")
        .select("*", { count: "exact", head: true })
        .eq("slot_date", today);
      return count ?? 0;
    },
  });

  const monthRevenue = useQuery({
    queryKey: ["dash-revenue"],
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { data } = await supabase
        .from("reservations")
        .select("payment")
        .gte("created_at", startOfMonth)
        .in("status", ["terminee", "en_cours"]);
      if (!data) return 0;
      return data.reduce((sum, r) => {
        const payment = r.payment as unknown as Record<string, unknown> | null;
        const amount = payment?.["amount"];
        return sum + (typeof amount === "number" ? amount : 0);
      }, 0);
    },
  });

  const recentActivity = useQuery({
    queryKey: ["dash-recent"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reservation_status_history")
        .select("id, reservation_id, new_status, note, created_at, reservations(reference, customer_name)")
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  const kpis = [
    {
      title: t("admin.dash.activeRepairs"),
      value: activeRepairs.data ?? 0,
      icon: Wrench,
      color: "text-blue-500",
      loading: activeRepairs.isLoading,
    },
    {
      title: t("admin.dash.todayReservations"),
      value: todayReservations.data ?? 0,
      icon: Calendar,
      color: "text-amber-500",
      loading: todayReservations.isLoading,
    },
    {
      title: t("admin.dash.monthRevenue"),
      value: `${(monthRevenue.data ?? 0).toLocaleString("fr-FJ")} FCFA`,
      icon: DollarSign,
      color: "text-emerald-500",
      loading: monthRevenue.isLoading,
    },
    {
      title: t("admin.dash.onlineUsers"),
      value: "—",
      icon: Users,
      color: "text-purple-500",
      loading: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                <kpi.icon className={`size-4 ${kpi.color}`} />
              </div>
              <div className="mt-2">
                {kpi.loading ? (
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                ) : (
                  <p className="text-2xl font-bold">{kpi.value}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Recent Activity */}
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t("admin.dash.recentActivity")}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/dossiers">
                <RadioTower className="mr-2 size-4" />
                {t("admin.dash.viewDossiers")}
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentActivity.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : (recentActivity.data ?? []).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("admin.dash.noActivity")}
              </p>
            ) : (
              <div className="space-y-4">
                {(recentActivity.data ?? []).map((entry) => {
                  const reservation = Array.isArray(entry.reservations)
                    ? entry.reservations[0]
                    : entry.reservations;
                  return (
                    <div key={entry.id} className="flex items-center gap-4">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Activity className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">
                          {t("admin.dash.repairFor", [reservation?.customer_name ?? "—"])}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {reservation?.reference ?? "—"} · {t("admin.dash.statusChanged", [STATUS_LABEL[entry.new_status] ?? entry.new_status])}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(entry.created_at).toLocaleTimeString("fr-FJ", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">{t("admin.dash.quickActions")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
