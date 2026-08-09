import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { rateLimit } from "@/lib/security";

export interface DeviceHistoryEntry {
  id: string;
  reservation_id: string;
  reference: string;
  device: string;
  issue: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  total_cost: number;
}

export const getDeviceHistory = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { phone, email, device } = data as { phone?: string; email?: string; device?: string };
    return { phone, email, device };
  })
  .handler(async ({ data }) => {
    if (!rateLimit("device-history", 10)) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const hasQuery = data.phone || data.email || data.device;
    if (!hasQuery) throw new Error("Renseignez un numéro, un email ou un appareil.");

    let query = supabaseAdmin
      .from("reservations")
      .select("id, reference, device, issue, status, created_at, phone, email");

    if (data.phone) {
      query = query.eq("phone", data.phone);
    } else if (data.email) {
      query = query.eq("email", data.email);
    } else if (data.device) {
      query = query.ilike("device", `%${data.device}%`);
    }

    const { data: reservations, error } = await query
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);

    const rows = (reservations ?? []) as {
      id: string;
      reference: string;
      device: string;
      issue: string;
      status: string;
      created_at: string;
    }[];

    const entries: DeviceHistoryEntry[] = rows.map((r) => ({
      id: r.id,
      reservation_id: r.id,
      reference: r.reference,
      device: r.device,
      issue: r.issue,
      status: r.status,
      created_at: r.created_at,
      completed_at: r.status === "terminee" || r.status === "livre" ? r.created_at : null,
      total_cost: 0,
    }));

    return entries;
  });

export const getDeviceStats = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { phone, email } = data as { phone?: string; email?: string };
    return { phone, email };
  })
  .handler(async ({ data }) => {
    if (!rateLimit("device-stats", 10)) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    if (!data.phone && !data.email) {
      throw new Error("Renseignez un numéro ou un email.");
    }

    let query = supabaseAdmin.from("reservations").select("device, status, created_at");
    if (data.phone) query = query.eq("phone", data.phone);
    else if (data.email) query = query.eq("email", data.email);

    const { data: rows } = await query;
    const all = (rows ?? []) as { device: string; status: string; created_at: string }[];

    const deviceCounts = all.reduce(
      (acc, r) => {
        acc[r.device] = (acc[r.device] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalRepairs = all.length;
    const completedRepairs = all.filter(
      (r) => r.status === "terminee" || r.status === "livre",
    ).length;

    return {
      totalRepairs,
      completedRepairs,
      completionRate: totalRepairs > 0 ? Math.round((completedRepairs / totalRepairs) * 100) : 0,
      deviceBreakdown: deviceCounts,
    };
  });
