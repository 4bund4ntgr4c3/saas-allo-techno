// ============================================================================
// Allô Techno — Simulateur de Leasing Informatique & LOA Flotte B2B
// Calcul des loyers mensuels OPEX déductibles et rachat optionnel à 1 FCFA.
// ============================================================================

export interface LeasingPlanSimulation {
  durationMonths: 12 | 24 | 36;
  laptopUnitsCount: number;
  totalCatalogValueFcfa: number;
  monthlyRentalFeePerUnitFcfa: number;
  totalMonthlyBillingFcfa: number;
  residualPurchaseOptionFcfa: number; // 1 FCFA
  taxDeductibleOpexTotalFcfa: number;
  includedServices: string[];
}

export function calculateFleetLeasing(
  laptopUnitsCount: number,
  tier: "standard_pro" | "expert_dev" = "standard_pro",
  durationMonths: 12 | 24 | 36 = 24,
): LeasingPlanSimulation {
  const unitPrice = tier === "standard_pro" ? 380000 : 750000;
  const totalCatalog = laptopUnitsCount * unitPrice;

  // Coefficients financiers LOA
  const coef = durationMonths === 12 ? 0.095 : durationMonths === 24 ? 0.052 : 0.038;
  const monthlyPerUnit = Math.round(unitPrice * coef);
  const totalMonthly = monthlyPerUnit * laptopUnitsCount;

  return {
    durationMonths,
    laptopUnitsCount,
    totalCatalogValueFcfa: totalCatalog,
    monthlyRentalFeePerUnitFcfa: monthlyPerUnit,
    totalMonthlyBillingFcfa: totalMonthly,
    residualPurchaseOptionFcfa: 1, // Option d'achat à 1 FCFA symbolique
    taxDeductibleOpexTotalFcfa: totalMonthly * durationMonths,
    includedServices: [
      "Garantie matérielle totale Allô Care+ (0 franchise sur panne/casse)",
      "Prêt d'un ordinateur de secours sous 4h en cas d'immobilisation",
      "Maintenance préventive semestrielle et repâtage thermique sur site",
      "Option de rachat à 1 FCFA ou renouvellement à neuf au terme du contrat",
    ],
  };
}
