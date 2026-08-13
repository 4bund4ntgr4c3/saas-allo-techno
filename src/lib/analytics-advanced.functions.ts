import { createServerFn } from "@tanstack/react-start";

export type FunnelStep = {
  step: string;
  count: number;
  label: string;
};

export type SourceStat = {
  source: string;
  count: number;
  percentage: number;
};

export const getConversionFunnel = createServerFn({ method: "GET" }).handler(
  async (): Promise<FunnelStep[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { requireStaff } = await import("@/lib/rbac");
    await requireStaff(supabaseAdmin);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

    const [estimations, reservations, completed] = await Promise.all([
      supabaseAdmin
        .from("analytics_events" as never)
        .select("id", { count: "exact", head: true })
        .eq("event", "estimation_shown")
        .gte("created_at", thirtyDaysAgo),
      supabaseAdmin
        .from("analytics_events" as never)
        .select("id", { count: "exact", head: true })
        .eq("event", "reservation_created")
        .gte("created_at", thirtyDaysAgo),
      supabaseAdmin
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .in("status", ["terminee", "livre"])
        .gte("created_at", thirtyDaysAgo),
    ]);

    const eCount = estimations.count ?? 0;
    const rCount = reservations.count ?? 0;
    const cCount = completed.count ?? 0;

    return [
      { step: "estimation", count: eCount, label: "Estimations" },
      { step: "reservation", count: rCount, label: "Réservations" },
      { step: "completed", count: cCount, label: "Terminées" },
    ];
  },
);

export const getSourceStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<SourceStat[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { requireStaff } = await import("@/lib/rbac");
    await requireStaff(supabaseAdmin);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

    const { data, error } = await supabaseAdmin
      .from("analytics_events" as never)
      .select("source")
      .not("source", "is", null)
      .gte("created_at", thirtyDaysAgo);

    if (error) throw new Error(error.message);

    const rows = (data ?? []) as { source: string | null }[];
    const counts = new Map<string, number>();
    for (const row of rows) {
      const src = row.source ?? "direct";
      counts.set(src, (counts.get(src) ?? 0) + 1);
    }

    const total = rows.length || 1;
    return Array.from(counts.entries())
      .map(([source, count]) => ({
        source,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  },
);

export const getRecentErrors = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ message: string; count: number; last: string }[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { requireStaff } = await import("@/lib/rbac");
    await requireStaff(supabaseAdmin);

    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();

    const { data, error } = await supabaseAdmin
      .from("analytics_events" as never)
      .select("event, created_at")
      .eq("event", "error")
      .gte("created_at", oneDayAgo)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw new Error(error.message);

    const rows = (data ?? []) as { event: string; created_at: string }[];
    const grouped = new Map<string, { count: number; last: string }>();
    for (const row of rows) {
      const existing = grouped.get(row.event);
      if (existing) {
        existing.count++;
      } else {
        grouped.set(row.event, { count: 1, last: row.created_at });
      }
    }

    return Array.from(grouped.entries())
      .map(([message, { count, last }]) => ({ message, count, last }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  },
);
