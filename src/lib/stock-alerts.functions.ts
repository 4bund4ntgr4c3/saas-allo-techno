// ============================================================================
// Allô Techno — Gestion des Alertes de Stock & Réapprovisionnement Atelier
// Détection des seuils critiques et commande automatique auprès des fournisseurs.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface StockItemAlert {
  id: string;
  sku: string;
  name: string;
  category: "ecran" | "batterie" | "pate_thermique" | "composant_smd" | "clavier";
  currentStock: number;
  minThreshold: number;
  preferredSupplier: "Shenzhen Express" | "Dubaï Hub" | "Paris Roissy" | "Fournisseur Local";
  unitCostFcfa: number;
  isUrgent: boolean;
}

export const MOCK_STOCK_ALERTS: StockItemAlert[] = [
  {
    id: "stk-01",
    sku: "SCR-MBP14-A2442",
    name: "Dalle Retina Liquid MacBook Pro 14 (A2442)",
    category: "ecran",
    currentStock: 1,
    minThreshold: 3,
    preferredSupplier: "Dubaï Hub",
    unitCostFcfa: 110000,
    isUrgent: true,
  },
  {
    id: "stk-02",
    sku: "BAT-DELL-XPS15",
    name: "Batterie OEM 86Wh Dell XPS 15 (9500/9510)",
    category: "batterie",
    currentStock: 0,
    minThreshold: 2,
    preferredSupplier: "Paris Roissy",
    unitCostFcfa: 38000,
    isUrgent: true,
  },
  {
    id: "stk-03",
    sku: "THM-MX4-20G",
    name: "Pâte Thermique Haute Conductivité Arctic MX-4 (Seringue 20g)",
    category: "pate_thermique",
    currentStock: 2,
    minThreshold: 5,
    preferredSupplier: "Fournisseur Local",
    unitCostFcfa: 15000,
    isUrgent: false,
  },
  {
    id: "stk-04",
    sku: "SMD-ISL9240",
    name: "Contrôleur de Charge USB-C ISL9240HI (MacBook Air/Pro)",
    category: "composant_smd",
    currentStock: 3,
    minThreshold: 8,
    preferredSupplier: "Shenzhen Express",
    unitCostFcfa: 4500,
    isUrgent: false,
  },
];

export const getLowStockAlertsFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<{
    alerts: StockItemAlert[];
    urgentCount: number;
    totalRestockBudgetFcfa: number;
  }> => {
    const urgentCount = MOCK_STOCK_ALERTS.filter(
      (item) => item.currentStock <= item.minThreshold / 2,
    ).length;
    const totalRestockBudgetFcfa = MOCK_STOCK_ALERTS.reduce(
      (sum, item) => sum + (item.minThreshold * 2 - item.currentStock) * item.unitCostFcfa,
      0,
    );

    return {
      alerts: MOCK_STOCK_ALERTS,
      urgentCount,
      totalRestockBudgetFcfa,
    };
  },
);

export const triggerSupplierRestockOrderFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      itemId: z.string().min(1),
      quantityToOrder: z.number().min(1),
    }),
  )
  .handler(
    async ({
      data: input,
    }): Promise<{ success: boolean; purchaseOrderId: string; message: string }> => {
      return {
        success: true,
        purchaseOrderId: `PO-SUPPLIER-${Date.now().toString().slice(-6)}`,
        message: `Bon de commande de réapprovisionnement (${input.quantityToOrder} unités) généré et transmis au hub logistique.`,
      };
    },
  );
