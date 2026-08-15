import { createServerFn } from "@tanstack/react-start";
import { requireStaff } from "@/lib/rbac";
import { rateLimit } from "@/lib/security";

export interface ReportConfig {
  id: string;
  name: string;
  date_from: string;
  date_to: string;
  metrics: string[];
  group_by: "day" | "week" | "month" | "status" | "brand";
  created_at: string;
}

export interface ReportResult {
  period: { from: string; to: string };
  total_reservations: number;
  total_revenue: number;
  status_breakdown?: Record<string, number>;
  brand_breakdown?: Record<string, number>;
  payment_methods?: Record<string, number>;
  daily?: Record<string, number>;
}

export const generateReport = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { date_from, date_to, metrics, group_by } = data as {
      date_from: string;
      date_to: string;
      metrics: string[];
      group_by: ReportConfig["group_by"];
    };
    return { date_from, date_to, metrics, group_by };
  })
  .handler(async ({ data }): Promise<ReportResult> => {
    if (!(await rateLimit("generate-report", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireStaff(supabaseAdmin);
    const [reservations, payments] = await Promise.all([
      supabaseAdmin
        .from("reservations")
        .select("status, device, slot_date, created_at")
        .gte("created_at", data.date_from)
        .lte("created_at", data.date_to + "T23:59:59"),
      supabaseAdmin
        .from("payments")
        .select("amount, method, status, created_at")
        .gte("created_at", data.date_from)
        .lte("created_at", data.date_to + "T23:59:59"),
    ]);

    const resRows = (reservations.data ?? []) as {
      status: string;
      device: string;
      slot_date: string;
      created_at: string;
    }[];
    const payRows = (payments.data ?? []) as {
      amount: number;
      method: string;
      status: string;
      created_at: string;
    }[];

    const result: ReportResult = {
      period: { from: data.date_from, to: data.date_to },
      total_reservations: resRows.length,
      total_revenue: payRows
        .filter((p) => p.status === "paid")
        .reduce((s, p) => s + (p.amount ?? 0), 0),
    };

    if (data.group_by === "status" || data.metrics.includes("status_breakdown")) {
      result.status_breakdown = resRows.reduce(
        (acc, r) => {
          acc[r.status] = (acc[r.status] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );
    }

    if (data.group_by === "brand" || data.metrics.includes("brand_breakdown")) {
      result.brand_breakdown = resRows.reduce(
        (acc, r) => {
          const brand = r.device.split(" ")[0] ?? "Unknown";
          acc[brand] = (acc[brand] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );
    }

    if (data.metrics.includes("payment_methods")) {
      result.payment_methods = payRows.reduce(
        (acc, p) => {
          acc[p.method] = (acc[p.method] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );
    }

    if (data.group_by === "day" || data.metrics.includes("daily")) {
      result.daily = resRows.reduce(
        (acc, r) => {
          const day = r.created_at.slice(0, 10);
          acc[day] = (acc[day] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );
    }

    return result;
  });

export const getSavedReports = createServerFn({ method: "GET" }).handler(async () => {
  if (!(await rateLimit("get-saved-reports", 60))) {
    throw new Error("Trop de demandes. Réessayez dans une minute.");
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await requireStaff(supabaseAdmin);
  const { data, error } = await supabaseAdmin
    .from("saved_reports" as never)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ReportConfig[];
});
