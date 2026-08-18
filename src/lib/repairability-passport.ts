// ============================================================================
// Allô Techno — Passeport Numérique Circulaire & Indice de Réparabilité
// Évaluation officielle sur 10 selon les critères de démontabilité et pièces.
// ============================================================================

export interface RepairabilityScoreResult {
  overallScoreOutOf10: number; // ex: 8.4 / 10
  ratingClass: "A+ (Excellente)" | "A (Très Bonne)" | "B (Moyenne)" | "C (Difficile)";
  criteriaBreakdown: {
    documentationAvailability: number; // sur 20
    disassemblyEase: number; // sur 20
    sparePartsAvailability: number; // sur 20
    sparePartsPricingRatio: number; // sur 20
    softwareUpdatesLifespan: number; // sur 20
  };
  circularPassportNumber: string;
  expectedDeviceLifespanYears: number;
}

export function calculateRepairabilityPassport(
  brandModel: string,
  isModularChassis: boolean = true,
  hasOfficialSchematics: boolean = true,
): RepairabilityScoreResult {
  const isApple = brandModel.toLowerCase().includes("mac");

  // Scoring weights (standard officiel)
  const docScore = hasOfficialSchematics ? 19 : 14;
  const disassemblyScore = isModularChassis ? 18 : isApple ? 13 : 16;
  const partsScore = isApple ? 17 : 19;
  const priceScore = isApple ? 15 : 18;
  const softwareScore = isApple ? 20 : 17;

  const totalPoints = docScore + disassemblyScore + partsScore + priceScore + softwareScore;
  const scoreOutOf10 = Math.round((totalPoints / 10) * 10) / 10;

  return {
    overallScoreOutOf10: scoreOutOf10,
    ratingClass: scoreOutOf10 >= 8.5 ? "A+ (Excellente)" : scoreOutOf10 >= 7.5 ? "A (Très Bonne)" : "B (Moyenne)",
    criteriaBreakdown: {
      documentationAvailability: docScore,
      disassemblyEase: disassemblyScore,
      sparePartsAvailability: partsScore,
      sparePartsPricingRatio: priceScore,
      softwareUpdatesLifespan: softwareScore,
    },
    circularPassportNumber: `DPP-BJ-2026-${Date.now().toString().slice(-6)}`,
    expectedDeviceLifespanYears: isApple ? 8 : 6,
  };
}
