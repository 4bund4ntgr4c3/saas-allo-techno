// ============================================================================
// Allô Techno — Simulateur de Récupération de Données & Laboratoire Salle Blanche
// Barème d'intervention pour disques durs, SSD, clés USB et serveurs RAID.
// ============================================================================

export type StorageMedium = "hdd_interne" | "hdd_externe" | "ssd_nvme" | "cle_usb" | "serveur_raid";
export type DamageSeverity = "logique_simple" | "electronique_pcb" | "mecanique_salle_blanche" | "chip_off_nand";

export interface DataRecoveryEstimate {
  medium: StorageMedium;
  severity: DamageSeverity;
  estimatedPriceFcfa: { min: number; max: number };
  turnaroundDays: string;
  successRatePercent: number;
  laboratoryTechnique: string;
}

export function estimateDataRecovery(medium: StorageMedium, severity: DamageSeverity): DataRecoveryEstimate {
  switch (severity) {
    case "logique_simple":
      return {
        medium,
        severity,
        estimatedPriceFcfa: { min: 25000, max: 45000 },
        turnaroundDays: "24h à 48h",
        successRatePercent: 96,
        laboratoryTechnique: "Extraction forensique logicielle sous image miroir bit-à-bit",
      };

    case "electronique_pcb":
      return {
        medium,
        severity,
        estimatedPriceFcfa: { min: 40000, max: 75000 },
        turnaroundDays: "2 à 4 jours",
        successRatePercent: 91,
        laboratoryTechnique: "Transplantation de puce ROM BIOS & remplacement carte électronique PCB",
      };

    case "chip_off_nand":
      return {
        medium,
        severity,
        estimatedPriceFcfa: { min: 50000, max: 95000 },
        turnaroundDays: "3 à 5 jours",
        successRatePercent: 88,
        laboratoryTechnique: "Dessoudage direct de puce NAND Flash BGA & reconstruction contrôleur ECC",
      };

    case "mecanique_salle_blanche":
      return {
        medium,
        severity,
        estimatedPriceFcfa: { min: 85000, max: 180000 },
        turnaroundDays: "5 à 8 jours",
        successRatePercent: 82,
        laboratoryTechnique: "Ouverture en Salle Blanche ISO 5 & remplacement de têtes de lecture",
      };
  }
}
