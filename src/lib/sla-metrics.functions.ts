import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireStaff } from "@/lib/rbac";
import { rateLimit } from "@/lib/security";

export type SlaPerformanceMetrics = {
  responseSlaCompliancePercent: number;
  resolutionSlaCompliancePercent: number;
  averageResponseTimeMinutes: number;
  averageResolutionTimeHours: number;
  totalTicketsCount: number;
  monthlyTrend: {
    month: string;
    responseTimeMinutes: number;
    resolutionTimeHours: number;
    complianceScore: number;
  }[];
};

export const getSlaPerformanceMetricsFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orgId: z.string(),
    }),
  )
  .handler(async (): Promise<SlaPerformanceMetrics> => {
    if (!(await rateLimit("get-sla-performance-metrics-fn", 60))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireStaff(supabaseAdmin);
    return {
      responseSlaCompliancePercent: 98.4,
      resolutionSlaCompliancePercent: 95.2,
      averageResponseTimeMinutes: 28,
      averageResolutionTimeHours: 14.5,
      totalTicketsCount: 42,
      monthlyTrend: [
        { month: "Mai", responseTimeMinutes: 35, resolutionTimeHours: 18, complianceScore: 92 },
        { month: "Juin", responseTimeMinutes: 30, resolutionTimeHours: 16, complianceScore: 94 },
        { month: "Juil", responseTimeMinutes: 25, resolutionTimeHours: 15, complianceScore: 97 },
        { month: "Août", responseTimeMinutes: 28, resolutionTimeHours: 14.5, complianceScore: 98 },
      ],
    };
  });
