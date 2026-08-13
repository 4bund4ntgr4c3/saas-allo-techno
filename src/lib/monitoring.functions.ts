import { createServerFn } from "@tanstack/react-start";
import { getMetricsSummary } from "@/lib/monitoring";

export const getMetrics = createServerFn({ method: "GET" }).handler(async () => {
  const { requireStaff } = await import("@/lib/rbac");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await requireStaff(supabaseAdmin);
  return getMetricsSummary();
});
