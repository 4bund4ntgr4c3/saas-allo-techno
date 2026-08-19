// ============================================================================
// Allô Techno — Gestion Multi-Entrepôts & Réapprovisionnement Automatique
// Suivi des stocks de sécurité entre Haie Vive, Calavi et Parakou.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { rateLimit } from "@/lib/security";

export interface WarehouseStockItem {
  partSku: string;
  partName: string;
  haieViveStock: number;
  calaviStock: number;
  parakouStock: number;
  safetyThreshold: number;
  reorderStatus: "stock_nominal" | "seuil_alerte" | "reappro_auto_declenché";
  recommendedOrderUnits: number;
  preferredSupplier: string;
}

export const MOCK_WAREHOUSE_STOCKS: WarehouseStockItem[] = [
  {
    partSku: "SKU-LCD-FHD-30P",
    partName: "Dalles Écran 15.6'' Slim 30 Pins FHD IPS",
    haieViveStock: 2,
    calaviStock: 1,
    parakouStock: 0,
    safetyThreshold: 6,
    reorderStatus: "reappro_auto_declenché",
    recommendedOrderUnits: 15,
    preferredSupplier: "Grossiste Écrans Shenzhen Express (Fret 4j)",
  },
  {
    partSku: "SKU-PMIC-ISL9239",
    partName: "Puces Contrôleur Charge ISL9239 MacBook",
    haieViveStock: 8,
    calaviStock: 4,
    parakouStock: 2,
    safetyThreshold: 5,
    reorderStatus: "stock_nominal",
    recommendedOrderUnits: 0,
    preferredSupplier: "Mouser Electronics Paris",
  },
  {
    partSku: "SKU-TH-PASTE-MX4",
    partName: "Tubes Pâte Thermique Arctic MX-4 (4g)",
    haieViveStock: 3,
    calaviStock: 2,
    parakouStock: 1,
    safetyThreshold: 10,
    reorderStatus: "seuil_alerte",
    recommendedOrderUnits: 20,
    preferredSupplier: "Distributeur Officiel Arctic UEMOA",
  },
];

export const getWarehouseStocksFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<{
    items: WarehouseStockItem[];
    alertsCount: number;
    totalUnitsInHubs: number;
  }> => {
    if (!(await rateLimit("warehouse-stocks", 60))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const totalUnits = MOCK_WAREHOUSE_STOCKS.reduce(
      (acc, i) => acc + i.haieViveStock + i.calaviStock + i.parakouStock,
      0,
    );
    const alerts = MOCK_WAREHOUSE_STOCKS.filter((i) => i.reorderStatus !== "stock_nominal").length;

    return {
      items: MOCK_WAREHOUSE_STOCKS,
      alertsCount: alerts,
      totalUnitsInHubs: totalUnits,
    };
  },
);
