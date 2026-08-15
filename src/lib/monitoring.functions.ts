import { createServerFn } from "@tanstack/react-start";
import { getMetricsSummary } from "@/lib/monitoring";
import { rateLimit } from "@/lib/security";

export const getMetrics = createServerFn({ method: "GET" }).handler(async () => {
  if (!(await rateLimit("get-metrics", 60))) {
    throw new Error("Trop de demandes. Réessayez dans une minute.");
  }
  const { requireStaff } = await import("@/lib/rbac");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await requireStaff(supabaseAdmin);
  return getMetricsSummary();
});
