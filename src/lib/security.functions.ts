import { createServerFn } from "@tanstack/react-start";
import { requireStaff } from "@/lib/rbac";
import { getRateLimitStats, rateLimit } from "@/lib/security";

export const getSecurityStats = createServerFn({ method: "GET" }).handler(async () => {
  if (!(await rateLimit("get-security-stats", 60))) {
    throw new Error("Trop de demandes. Réessayez dans une minute.");
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await requireStaff(supabaseAdmin);
  return await getRateLimitStats();
});
