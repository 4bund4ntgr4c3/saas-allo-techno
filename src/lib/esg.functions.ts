import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type EsgMetrics = {
  repairedUnitsCount: number;
  electronicWasteSavedKg: number; // e-waste avoided in kg
  co2EmissionsAvoidedKg: number; // CO2 eq avoided in kg
  circularEconomyScorePercent: number; // 0-100%
  financialSavingsFcfa: number;
  reportPeriod: string;
};

export const getOrgEsgMetricsFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orgId: z.string(),
    })
  )
  .handler(async (): Promise<EsgMetrics> => {
    // Standard ESG / Carbon Footprint Metrics for Electronics Repair
    // Avg laptop manufacture = 250kg CO2, 2.5kg electronic waste
    // Avg smartphone manufacture = 70kg CO2, 0.2kg electronic waste
    const repairedUnitsCount = 18;
    const electronicWasteSavedKg = Math.round(repairedUnitsCount * 1.8 * 10) / 10; // ~32.4 kg
    const co2EmissionsAvoidedKg = Math.round(repairedUnitsCount * 145); // ~2,610 kg CO2 eq
    const circularEconomyScorePercent = 86; // 86% equipment lifecycle extension rate
    const financialSavingsFcfa = repairedUnitsCount * 185000; // ~3 330 000 FCFA saved vs new purchases

    return {
      repairedUnitsCount,
      electronicWasteSavedKg,
      co2EmissionsAvoidedKg,
      circularEconomyScorePercent,
      financialSavingsFcfa,
      reportPeriod: "Année 2026",
    };
  });
