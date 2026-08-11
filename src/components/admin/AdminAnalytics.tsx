import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { DataTable } from "@/components/admin/DataTable";
import type { ColumnDef } from "@tanstack/react-table";

function AnalyticsSection() {
  const { t } = useI18n();
  const events = useQuery({
    queryKey: ["analytics-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analytics_events")
        .select("event, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const counts = useQuery({
    queryKey: ["analytics-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("analytics_events").select("event");
      if (error) throw error;
      const map = new Map<string, number>();
      for (const row of data ?? []) {
        map.set(row.event, (map.get(row.event) ?? 0) + 1);
      }
      return [...map.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([event, count]) => ({ event, count }));
    },
  });

  const EVENT_LABEL: Record<string, string> = {
    step_viewed: t("admin.analytics.events.stepViewed"),
    estimation_shown: t("admin.analytics.events.estimationShown"),
    reservation_created: t("admin.analytics.events.reservationCreated"),
  };

  const columns: ColumnDef<{ event: string; created_at: string }, unknown>[] = [
    {
      accessorKey: "event",
      header: t("admin.analytics.events.column.event"),
      cell: ({ row }) => (
        <span className="inline-block rounded-sm bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {EVENT_LABEL[row.original.event] ?? row.original.event}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: t("admin.analytics.events.column.date"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {new Date(row.original.created_at).toLocaleString(t("locale") as string, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
  ];

  if (events.isLoading) {
    return <p className="mt-6 text-sm text-muted-foreground">{t("admin.analytics.loading")}</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="at-eyebrow">{t("admin.analytics.eyebrow")}</p>
          <h2 className="mt-1 text-xl font-semibold">{t("admin.analytics.overview.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.analytics.description")}</p>
        </div>
      </div>

      <div>
        <div className="grid gap-4 sm:grid-cols-3">
          {(counts.data ?? []).map((c) => (
            <div key={c.event} className="border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold">{c.count}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {EVENT_LABEL[c.event] ?? c.event}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">{t("admin.analytics.events.title")}</h2>
        <DataTable columns={columns} data={events.data ?? []} searchKey="event" searchPlaceholder={t("admin.analytics.search")} pageSize={50} />
      </div>
    </div>
  );
}

export { AnalyticsSection };
