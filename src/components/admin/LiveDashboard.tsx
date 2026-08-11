import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, Wrench, DollarSign } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface LiveMetrics {
  activeRepairs: number;
  todayReservations: number;
  todayRevenue: number;
  onlineUsers: number;
}

export function LiveDashboard() {
  const { t } = useI18n();
  const [metrics, setMetrics] = useState<LiveMetrics>({
    activeRepairs: 0,
    todayReservations: 0,
    todayRevenue: 0,
    onlineUsers: 0,
  });

  const { data } = useQuery({
    queryKey: ["live-metrics"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0] ?? new Date().toISOString().slice(0, 10);
      const [active, reservations, payments] = await Promise.all([
        supabase.from("reservations").select("id", { count: "exact", head: true }).in("status", ["en_cours", "pieces"]),
        supabase.from("reservations").select("id", { count: "exact", head: true }).eq("slot_date", today),
        supabase.from("payments").select("amount").eq("status", "paid").gte("created_at", today),
      ]);
      return {
        activeRepairs: active.count ?? 0,
        todayReservations: reservations.count ?? 0,
        todayRevenue: (payments.data ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0),
        onlineUsers: 0,
      };
    },
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (data) setMetrics(data);
  }, [data]);

  useEffect(() => {
    const channel = supabase
      .channel("live-metrics")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => {})
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => {})
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const cards = [
    { icon: Wrench, label: t("admin.live.activeRepairs"), value: metrics.activeRepairs, color: "text-primary" },
    { icon: Activity, label: t("admin.live.todayReservations"), value: metrics.todayReservations, color: "text-success" },
    { icon: DollarSign, label: t("admin.live.todayRevenue"), value: `${(metrics.todayRevenue / 1000).toFixed(0)}k FCFA`, color: "text-amber-500" },
    { icon: Users, label: t("admin.live.onlineUsers"), value: metrics.onlineUsers, color: "text-purple-500" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">{card.label}</CardTitle>
            <card.icon className={`size-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
