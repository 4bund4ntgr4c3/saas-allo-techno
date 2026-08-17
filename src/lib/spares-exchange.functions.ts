// ============================================================================
// Allô Techno — Bourse d'Échange & Mutualisation de Pièces Rares UEMOA
// Réseau inter-ateliers de micro-électronique (Cotonou, Lomé, Abidjan, Dakar).
// ============================================================================

import { createServerFn } from "@tanstack/react-start";

export interface SharedSparePart {
  partId: string;
  componentRef: string;
  category: "Puce PMIC / IC Charge" | "Écran OLED Rétroéclairé" | "Contrôleur Thunderbolt" | "Clavier Rétroéclairé OEM";
  holdingWorkshopCity: "Cotonou (Hub Central)" | "Lomé (Togo Tech)" | "Abidjan (Plateau Labs)" | "Dakar (Sénégal Micro)";
  quantityAvailable: number;
  unitPriceFcfa: number;
  expressDeliveryHours: number; // ex: 24h via Asky / Air Côte d'Ivoire
}

export const MOCK_SHARED_SPARES: SharedSparePart[] = [
  {
    partId: "SPARE-UEMOA-01",
    componentRef: "ISL9240 PMIC MacBook Pro M1/M2",
    category: "Puce PMIC / IC Charge",
    holdingWorkshopCity: "Abidjan (Plateau Labs)",
    quantityAvailable: 8,
    unitPriceFcfa: 22000,
    expressDeliveryHours: 24,
  },
  {
    partId: "SPARE-UEMOA-02",
    componentRef: "Dalle 14'' OLED 2.8K 90Hz ASUS ZenBook",
    category: "Écran OLED Rétroéclairé",
    holdingWorkshopCity: "Lomé (Togo Tech)",
    quantityAvailable: 3,
    unitPriceFcfa: 75000,
    expressDeliveryHours: 6, // Route Cotonou-Lomé par navette express
  },
  {
    partId: "SPARE-UEMOA-03",
    componentRef: "Contrôleur Type-C CD3217B12 Apple",
    category: "Contrôleur Thunderbolt",
    holdingWorkshopCity: "Dakar (Sénégal Micro)",
    quantityAvailable: 15,
    unitPriceFcfa: 18000,
    expressDeliveryHours: 48,
  },
];

export const getSharedSparesCatalogFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ spares: SharedSparePart[]; totalStockUnits: number }> => {
    const totalUnits = MOCK_SHARED_SPARES.reduce((sum, p) => sum + p.quantityAvailable, 0);
    return {
      spares: MOCK_SHARED_SPARES,
      totalStockUnits: totalUnits,
    };
  },
);
