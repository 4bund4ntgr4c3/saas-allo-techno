import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireStaff } from "@/lib/rbac";
import { getRateLimitStats } from "@/lib/security";

export const getSecurityStats = createServerFn({ method: "GET" }).handler(async () => {
  await requireStaff(supabaseAdmin);
  return await getRateLimitStats();
});
