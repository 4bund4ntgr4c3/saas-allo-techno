// ============================================================================
// Allô Techno — Registre Circulaire DEEE & Valorisation Métaux Précieux
// Traçabilité des cartes mères recyclées et pesée des fractions d'or/cuivre.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { rateLimit } from "@/lib/security";

export interface EwasteScrapBatch {
  batchId: string;
  recycledDate: string;
  sourceType:
    "Cartes Mères MacBook Déclassées" | "Serveurs Hors d'Usage" | "Smartphones & Tablettes HS";
  totalWeightKg: number;
  extractedPreciousMetals: {
    goldGrams: number;
    silverGrams: number;
    copperGrams: number;
    tantalumGrams: number;
  };
  destinationSmelter: string;
  officialRseCertificateNumber: string;
}

export const MOCK_EWASTE_BATCHES: EwasteScrapBatch[] = [
  {
    batchId: "DEEE-REC-2026-08",
    recycledDate: "12 Août 2026",
    sourceType: "Cartes Mères MacBook Déclassées",
    totalWeightKg: 42.5,
    extractedPreciousMetals: {
      goldGrams: 14.8, // ~0.35g or / kg carte mère haute densité
      silverGrams: 45.2,
      copperGrams: 8400,
      tantalumGrams: 320,
    },
    destinationSmelter: "Filière Éco-Métaux Afrique / Cotonou Port",
    officialRseCertificateNumber: "CERT-RSE-MCVDD-2026-8902",
  },
  {
    batchId: "DEEE-REC-2026-07",
    recycledDate: "28 Juillet 2026",
    sourceType: "Serveurs Hors d'Usage",
    totalWeightKg: 110.0,
    extractedPreciousMetals: {
      goldGrams: 28.5,
      silverGrams: 112.0,
      copperGrams: 24500,
      tantalumGrams: 850,
    },
    destinationSmelter: "Filière Éco-Métaux Afrique / Cotonou Port",
    officialRseCertificateNumber: "CERT-RSE-MCVDD-2026-8411",
  },
];

export const getEwasteLedgerFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<{
    batches: EwasteScrapBatch[];
    totalGoldGramsAllTime: number;
    totalKgProcessed: number;
  }> => {
    if (!(await rateLimit("ewaste-ledger", 60))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const totalGold = MOCK_EWASTE_BATCHES.reduce(
      (sum, b) => sum + b.extractedPreciousMetals.goldGrams,
      0,
    );
    const totalKg = MOCK_EWASTE_BATCHES.reduce((sum, b) => sum + b.totalWeightKg, 0);

    return {
      batches: MOCK_EWASTE_BATCHES,
      totalGoldGramsAllTime: Math.round(totalGold * 10) / 10,
      totalKgProcessed: Math.round(totalKg * 10) / 10,
    };
  },
);
