// ============================================================================
// Allô Techno — Plan de Continuité d'Activité (PCA/DRP) & Prêt de Flotte Express
// Calcul du coût d'interruption horaire, RTO/RPO et réserve de secours 4h.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { rateLimit } from "@/lib/security";

export interface DisasterRecoveryEstimate {
  estimatedHourlyDowntimeCostFcfa: number;
  rtoGuaranteedHours: number; // ex: 4h
  emergencyFleetReserveCount: number;
  monthlyDisasterInsuranceFcfa: number;
  activationSlaDetails: {
    dispatchCenter: string;
    preconfiguredOs: string;
    deliveryTimeMinutes: number;
  };
}

export function calculateDisasterRecoveryImpact(
  employeeCount: number,
  averageHourlySalaryFcfa: number = 7500,
  dailyTurnoverLossFcfa: number = 5000000,
): DisasterRecoveryEstimate {
  const laborLossPerHour = employeeCount * averageHourlySalaryFcfa;
  const businessLossPerHour = dailyTurnoverLossFcfa / 8;
  const totalHourlyLoss = laborLossPerHour + businessLossPerHour;

  const fleetReserve = Math.min(employeeCount, 50);
  const monthlySubscription = 150000 + fleetReserve * 7500;

  return {
    estimatedHourlyDowntimeCostFcfa: totalHourlyLoss,
    rtoGuaranteedHours: 4,
    emergencyFleetReserveCount: fleetReserve,
    monthlyDisasterInsuranceFcfa: monthlySubscription,
    activationSlaDetails: {
      dispatchCenter: "Hub Logistique Allô Techno Haie Vive Cotonou",
      preconfiguredOs: "Windows 11 Pro / BitLocker / VPN Entreprise",
      deliveryTimeMinutes: 240, // 4 heures max
    },
  };
}

export const submitDisasterRecoveryContractFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      companyName: z.string().min(2),
      employeeCount: z.number().min(1),
      fleetReserveRequested: z.number().min(1),
    }),
  )
  .handler(
    async ({ data: input }): Promise<{ contractId: string; success: boolean; message: string }> => {
      if (!(await rateLimit("drp-contract-submit", 10))) {
        throw new Error("Trop de demandes. Réessayez dans une minute.");
      }
      const contractId = `PCA-DRP-${Date.now().toString().slice(-6)}`;
      return {
        contractId,
        success: true,
        message: `Contrat de Continuité d'Activité ${contractId} validé pour ${input.companyName}. Réserve de ${input.fleetReserveRequested} PC pré-configurés mobilisables sous 4h.`,
      };
    },
  );
