// ============================================================================
// Allô Techno — E-Procurement B2B & Moteur d'Appels d'Offres (RFP)
// Gestion des consultations d'achat de parc et calcul du TCO sur 3 ans.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface RfpRequirement {
  id: string;
  category: "laptops" | "desktops" | "servers" | "network_ups";
  quantity: number;
  minSpecs: string;
  targetBudgetFcfa: number;
  deliveryDeadline: string;
}

export interface RfpProposal {
  rfpId: string;
  clientCompanyName: string;
  requirements: RfpRequirement[];
  calculatedTco3YearsFcfa: {
    acquisitionCost: number;
    energyCost3Years: number;
    maintenanceSupportCost: number;
    residualResaleValue: number;
    netTco: number;
  };
  recommendedFleetModel: string;
  environmentalRoiCo2Kg: number;
  status: "brouillon" | "soumis_analyse" | "valide_dsi";
}

export function calculateFleetTco(
  laptopCount: number,
  unitAcquisitionFcfa: number,
  isRenewableEnergyEfficient: boolean,
) {
  const acquisitionCost = laptopCount * unitAcquisitionFcfa;
  // Consommation électrique moyenne : 65W x 8h/j x 250j/an x 3 ans = ~390 kWh par poste.
  // Tarif SBEE Pro : 125 FCFA/kWh. Si modèle efficient (Apple Silicon / Intel Evo) : 50% d'économie.
  const kwhPerDevice = isRenewableEnergyEfficient ? 195 : 390;
  const energyCost3Years = laptopCount * kwhPerDevice * 125;

  // Support & Maintenance préventive 3 ans Allô Techno : 15 000 FCFA/an/poste = 45 000 FCFA
  const maintenanceSupportCost = laptopCount * 45000;

  // Valeur résiduelle de reprise garantie après 3 ans (30% de la valeur d'achat)
  const residualResaleValue = Math.round(acquisitionCost * 0.3);

  const netTco = acquisitionCost + energyCost3Years + maintenanceSupportCost - residualResaleValue;
  const co2SavedKg = isRenewableEnergyEfficient ? laptopCount * 140 : laptopCount * 60;

  return {
    acquisitionCost,
    energyCost3Years,
    maintenanceSupportCost,
    residualResaleValue,
    netTco,
    co2SavedKg,
  };
}

export const submitB2bRfpConsultationFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      clientCompanyName: z.string().min(2),
      laptopCount: z.number().min(5),
      targetBudgetFcfa: z.number().min(1000000),
      preferredBrand: z.string(),
      includeEnergyEfficiency: z.boolean(),
    }),
  )
  .handler(async ({ data: input }): Promise<{ success: boolean; rfpId: string; tco: ReturnType<typeof calculateFleetTco>; message: string }> => {
    const rfpId = `RFP-${Date.now().toString().slice(-6)}`;
    const unitCost = Math.round(input.targetBudgetFcfa / input.laptopCount);
    const tco = calculateFleetTco(input.laptopCount, unitCost, input.includeEnergyEfficiency);

    return {
      success: true,
      rfpId,
      tco,
      message: `Appel d'offres N° ${rfpId} généré pour ${input.clientCompanyName}. Analyse comparative TCO prête pour le comité de direction.`,
    };
  });
