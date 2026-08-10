import { createServerFn } from "@tanstack/react-start";
import { getRateLimitStats } from "@/lib/security";

export const getSecurityStats = createServerFn({ method: "GET" }).handler(async () => {
  return await getRateLimitStats();
});
