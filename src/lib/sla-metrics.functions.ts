import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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
    })
  )
  .handler(async (): Promise<SlaPerformanceMetrics> => {
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
