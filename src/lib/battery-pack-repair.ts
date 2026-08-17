// ============================================================================
// Allô Techno — Laboratoire Batteries Lithium & Recellage Énergie
// Diagnostic, remplacement de BMS et reconstruction de packs 18650/21700.
// ============================================================================

export type BatteryPackType =
  | "trottinette_36v"
  | "velo_vae_48v"
  | "drone_lipo_6s"
  | "station_solaire_lifepo4";

export type BatteryServiceType =
  | "diagnostic_capacite"
  | "remplacement_bms"
  | "equilibrage_cellules"
  | "recellage_integral";

export interface BatteryRepairEstimate {
  packType: BatteryPackType;
  serviceType: BatteryServiceType;
  estimatedPriceFcfa: { min: number; max: number };
  cellTechnology: string;
  turnaroundDays: string;
  warrantyMonths: number;
}

export function estimateBatteryRepair(
  packType: BatteryPackType,
  serviceType: BatteryServiceType,
): BatteryRepairEstimate {
  switch (serviceType) {
    case "diagnostic_capacite":
      return {
        packType,
        serviceType,
        estimatedPriceFcfa: { min: 5000, max: 10000 },
        cellTechnology: "Banc de décharge électronique & mesure de résistance interne",
        turnaroundDays: "24h",
        warrantyMonths: 3,
      };

    case "equilibrage_cellules":
      return {
        packType,
        serviceType,
        estimatedPriceFcfa: { min: 18000, max: 32000 },
        cellTechnology: "Équilibrage actif sous courant pulsé & isolation thermique Kapton",
        turnaroundDays: "48h",
        warrantyMonths: 6,
      };

    case "remplacement_bms":
      return {
        packType,
        serviceType,
        estimatedPriceFcfa: { min: 25000, max: 45000 },
        cellTechnology: "Carte de gestion BMS intelligente avec protection thermique et court-circuit",
        turnaroundDays: "48h à 72h",
        warrantyMonths: 6,
      };

    case "recellage_integral":
      return {
        packType,
        serviceType,
        estimatedPriceFcfa: { min: 55000, max: 135000 },
        cellTechnology: "Cellules Samsung / LG 18650 / 21700 Grade A d'origine avec soudure par points nickel",
        turnaroundDays: "3 à 5 jours",
        warrantyMonths: 12,
      };
  }
}
