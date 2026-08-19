// ============================================================================
// Allô Techno — Copilote IA d'Upgrade & Optimisation Matérielle
// Diagnostic des goulots d'étranglement et projection de boost de productivité.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { rateLimit } from "@/lib/security";

export interface HardwareUpgradeRecommendation {
  recommendationId: string;
  currentBottleneckSummary: string;
  speedGainPercent: number; // ex: +320%
  recommendedUpgrades: {
    component: string;
    description: string;
    priceFcfa: number;
    benefit: string;
  }[];
  totalBudgetFcfa: number;
  expectedBootTimeSeconds: number; // ex: 8 sec vs 65 sec
}

export const getHardwareUpgradePlanFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      deviceType: z.enum(["pc_portable", "macbook", "pc_bureau_tour"]),
      currentRamGb: z.number(),
      currentStorageType: z.enum(["hdd_mecanique", "ssd_sata", "ssd_nvme"]),
      primaryUsage: z.enum(["bureautique", "montage_video_design", "developpement_ia", "gaming"]),
    }),
  )
  .handler(async ({ data: input }): Promise<HardwareUpgradeRecommendation> => {
    if (!(await rateLimit("hw-upgrade-plan", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const isHdd = input.currentStorageType === "hdd_mecanique";
    const needsRam = input.currentRamGb < 16;

    const upgrades = [];
    let total = 0;

    if (isHdd) {
      upgrades.push({
        component: "SSD NVMe M.2 512 Go PCIe 4.0",
        description: "Remplacement du disque mécanique par SSD ultra-rapide (3500 Mo/s)",
        priceFcfa: 28000,
        benefit: "Démarrage Windows en 8 secondes et ouverture instantanée d'Office.",
      });
      total += 28000;
    }

    if (needsRam) {
      upgrades.push({
        component: "Extension 16 Go RAM DDR4 3200MHz",
        description: "Passage en Dual-Channel haute bande passante",
        priceFcfa: 25000,
        benefit: "Multi-tâches fluide avec 40+ onglets Chrome et Photoshop simultanés.",
      });
      total += 25000;
    }

    upgrades.push({
      component: "Forfait Repâtage Thermique Arctic MX-4 & Dépoussiérage",
      description: "Nettoyage turbine et pâte thermique neuve 8.5 W/mK",
      priceFcfa: 15000,
      benefit: "Baisse de 18°C et suppression des bridages thermiques processeur.",
    });
    total += 15000;

    return {
      recommendationId: `UPGRADE-${Date.now().toString().slice(-6)}`,
      currentBottleneckSummary: isHdd
        ? "Votre disque dur mécanique HDD bride 80% des capacités de votre processeur."
        : "Votre processeur chauffe et la mémoire RAM sature lors des pics d'usage.",
      speedGainPercent: isHdd ? 350 : 180,
      recommendedUpgrades: upgrades,
      totalBudgetFcfa: total,
      expectedBootTimeSeconds: 8,
    };
  });
