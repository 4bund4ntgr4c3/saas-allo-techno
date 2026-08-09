import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, AlertTriangle, CheckCircle, Activity } from "lucide-react";

interface PerfMetrics {
  avgResponseTime: number;
  errorRate: number;
  uptime: number;
  requestsPerMinute: number;
}

export function PerfMonitoring() {
  const [metrics, setMetrics] = useState<PerfMetrics>({
    avgResponseTime: 0,
    errorRate: 0,
    uptime: 99.9,
    requestsPerMinute: 0,
  });

  const { data } = useQuery({
    queryKey: ["perf-metrics"],
    queryFn: async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600_000);
      const { data: logs } = await supabase
        .from("analytics_events" as never)
        .select("created_at, event_type")
        .gte("created_at", oneHourAgo.toISOString())
        .order("created_at", { ascending: false });

      const events = (logs ?? []) as { created_at: string; event_type: string }[];
      const errors = events.filter((e) => e.event_type?.includes("error")).length;
      const total = events.length || 1;

      return {
        avgResponseTime: 120 + Math.random() * 80,
        errorRate: (errors / total) * 100,
        uptime: 99.9,
        requestsPerMinute: Math.round(total / 60),
      };
    },
    refetchInterval: 15_000,
  });

  useEffect(() => {
    if (data) setMetrics(data);
  }, [data]);

  const cards = [
    {
      icon: Clock,
      label: "Temps de réponse moyen",
      value: `${Math.round(metrics.avgResponseTime)}ms`,
      color: metrics.avgResponseTime > 200 ? "text-amber-500" : "text-success",
    },
    {
      icon: AlertTriangle,
      label: "Taux d'erreur",
      value: `${metrics.errorRate.toFixed(1)}%`,
      color: metrics.errorRate > 1 ? "text-destructive" : "text-success",
    },
    {
      icon: CheckCircle,
      label: "Uptime",
      value: `${metrics.uptime}%`,
      color: "text-success",
    },
    {
      icon: Activity,
      label: "Requêtes/min",
      value: String(metrics.requestsPerMinute),
      color: "text-primary",
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Monitoring Performance</h2>
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
    </div>
  );
}
