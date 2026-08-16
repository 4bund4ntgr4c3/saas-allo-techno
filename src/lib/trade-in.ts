// ============================================================================
// Allô Techno — Simulateur de Reprise Argus & Trade-In Informatique
// Évaluation immédiate de la valeur de reprise d'un équipement en FCFA.
// ============================================================================

export type DeviceCategory = "laptop" | "smartphone" | "tablet" | "desktop";
export type CosmeticState = "comme_neuf" | "bon_etat" | "rayures_visibles" | "chassis_abime";
export type FunctionalState = "parfait" | "batterie_usee" | "ecran_fissure" | "ne_sallume_plus";

export interface TradeInDeviceModel {
  id: string;
  category: DeviceCategory;
  brand: string;
  model: string;
  baseValueFcfa: number;
}

export const POPULAR_TRADE_IN_MODELS: TradeInDeviceModel[] = [
  // ── Laptops ──
  { id: "macbook-air-m1", category: "laptop", brand: "Apple", model: "MacBook Air M1 (2020)", baseValueFcfa: 280000 },
  { id: "macbook-air-m2", category: "laptop", brand: "Apple", model: "MacBook Air M2 (2022)", baseValueFcfa: 420000 },
  { id: "macbook-pro-m1-14", category: "laptop", brand: "Apple", model: "MacBook Pro 14 M1 Pro (2021)", baseValueFcfa: 520000 },
  { id: "macbook-pro-m2-14", category: "laptop", brand: "Apple", model: "MacBook Pro 14 M2 Pro (2023)", baseValueFcfa: 680000 },
  { id: "dell-xps-13", category: "laptop", brand: "Dell", model: "Dell XPS 13 (Intel i7)", baseValueFcfa: 250000 },
  { id: "dell-latitude-5420", category: "laptop", brand: "Dell", model: "Dell Latitude 5420 / 5430", baseValueFcfa: 180000 },
  { id: "hp-elitebook-840-g8", category: "laptop", brand: "HP", model: "HP EliteBook 840 G8", baseValueFcfa: 210000 },
  { id: "lenovo-thinkpad-t14", category: "laptop", brand: "Lenovo", model: "ThinkPad T14 Gen 2/3", baseValueFcfa: 230000 },

  // ── Smartphones ──
  { id: "iphone-13", category: "smartphone", brand: "Apple", model: "iPhone 13 (128 Go)", baseValueFcfa: 190000 },
  { id: "iphone-14-pro", category: "smartphone", brand: "Apple", model: "iPhone 14 Pro (128 Go)", baseValueFcfa: 340000 },
  { id: "iphone-15", category: "smartphone", brand: "Apple", model: "iPhone 15 (128 Go)", baseValueFcfa: 390000 },
  { id: "samsung-s22-ultra", category: "smartphone", brand: "Samsung", model: "Galaxy S22 Ultra", baseValueFcfa: 230000 },
  { id: "samsung-s23-ultra", category: "smartphone", brand: "Samsung", model: "Galaxy S23 Ultra", baseValueFcfa: 360000 },
];

export interface TradeInCalculationParams {
  modelId: string;
  cosmetic: CosmeticState;
  functional: FunctionalState;
  hasCharger: boolean;
}

export function calculateTradeInValue(params: TradeInCalculationParams): {
  estimatedValueFcfa: number;
  bonusVoucherFcfa: number;
  totalVoucherFcfa: number;
  device: TradeInDeviceModel;
} {
  const device = POPULAR_TRADE_IN_MODELS.find((m) => m.id === params.modelId) || POPULAR_TRADE_IN_MODELS[0]!;
  let multiplier = 1.0;

  // Décote esthétique
  switch (params.cosmetic) {
    case "comme_neuf":
      multiplier *= 1.0;
      break;
    case "bon_etat":
      multiplier *= 0.88;
      break;
    case "rayures_visibles":
      multiplier *= 0.72;
      break;
    case "chassis_abime":
      multiplier *= 0.55;
      break;
  }

  // Décote fonctionnelle
  switch (params.functional) {
    case "parfait":
      multiplier *= 1.0;
      break;
    case "batterie_usee":
      multiplier *= 0.85;
      break;
    case "ecran_fissure":
      multiplier *= 0.45;
      break;
    case "ne_sallume_plus":
      multiplier *= 0.25;
      break;
  }

  if (params.hasCharger) {
    multiplier += 0.05;
  }

  const estimatedValueFcfa = Math.round((device.baseValueFcfa * multiplier) / 500) * 500;
  // Bonus de 10% si utilisé en bon d'achat Allô Techno (réparation ou matériel reconditionné)
  const bonusVoucherFcfa = Math.round((estimatedValueFcfa * 0.1) / 500) * 500;

  return {
    estimatedValueFcfa,
    bonusVoucherFcfa,
    totalVoucherFcfa: estimatedValueFcfa + bonusVoucherFcfa,
    device,
  };
}
