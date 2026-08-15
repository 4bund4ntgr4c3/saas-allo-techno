import { createServerFn } from "@tanstack/react-start";
import { requireStaff } from "@/lib/rbac";
import { rateLimit } from "@/lib/security";

export interface SatisfactionEntry {
  id: string;
  reservation_id: string;
  customer_name: string;
  rating: number;
  nps_score: number;
  comment: string | null;
  recommend: boolean;
  created_at: string;
}

export const submitSatisfaction = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { reservation_id, customer_name, rating, nps_score, comment, recommend } = data as {
      reservation_id: string;
      customer_name: string;
      rating: number;
      nps_score: number;
      comment?: string;
      recommend: boolean;
    };
    if (rating < 1 || rating > 5) throw new Error("Rating 1-5");
    if (nps_score < 0 || nps_score > 10) throw new Error("NPS 0-10");
    return {
      reservation_id,
      customer_name,
      rating,
      nps_score,
      comment: comment ?? null,
      recommend,
    };
  })
  .handler(async ({ data }) => {
    if (!(await rateLimit("submit-satisfaction", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("satisfaction_surveys" as never)
      .insert(data as never);
    if (error) throw new Error(error.message);
    return { submitted: true };
  });

export const getSatisfactionStats = createServerFn({ method: "GET" }).handler(async () => {
  if (!(await rateLimit("get-satisfaction-stats", 60))) {
    throw new Error("Trop de demandes. Réessayez dans une minute.");
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await requireStaff(supabaseAdmin);
  const { data } = await supabaseAdmin
    .from("satisfaction_surveys" as never)
    .select("*")
    .order("created_at", { ascending: false });

  const entries = (data ?? []) as unknown as SatisfactionEntry[];
  if (entries.length === 0) {
    return {
      total: 0,
      avgRating: 0,
      avgNps: 0,
      nps: 0,
      promoters: 0,
      passives: 0,
      detractors: 0,
      distribution: {} as Record<number, number>,
    };
  }

  const total = entries.length;
  const avgRating = entries.reduce((s, e) => s + e.rating, 0) / total;
  const avgNps = entries.reduce((s, e) => s + e.nps_score, 0) / total;

  const promoters = entries.filter((e) => e.nps_score >= 9).length;
  const detractors = entries.filter((e) => e.nps_score <= 6).length;
  const passives = total - promoters - detractors;
  const nps = Math.round(((promoters - detractors) / total) * 100);

  const distribution: Record<number, number> = {};
  for (const e of entries) {
    distribution[e.rating] = (distribution[e.rating] ?? 0) + 1;
  }

  return {
    total,
    avgRating: Math.round(avgRating * 10) / 10,
    avgNps: Math.round(avgNps * 10) / 10,
    nps,
    promoters,
    passives,
    detractors,
    distribution,
  };
});

export const getSatisfactionEntries = createServerFn({ method: "GET" }).handler(async () => {
  if (!(await rateLimit("get-satisfaction-entries", 60))) {
    throw new Error("Trop de demandes. Réessayez dans une minute.");
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await requireStaff(supabaseAdmin);
  const { data, error } = await supabaseAdmin
    .from("satisfaction_surveys" as never)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as SatisfactionEntry[];
});
