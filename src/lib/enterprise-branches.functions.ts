// ============================================================================
// Allô Techno — Gestion Multi-Filiales & Approbations Hiérarchiques B2B
// Centralisation des agences régionales, plafonds de dépenses et circuits DAF.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { rateLimit } from "@/lib/security";

export interface EnterpriseBranch {
  branchId: string;
  branchName: string;
  city: "Cotonou" | "Porto-Novo" | "Parakou" | "Bohicon" | "Natitingou";
  localManagerName: string;
  monthlyBudgetCapFcfa: number;
  currentMonthSpentFcfa: number;
  activeFleetCount: number;
  pendingApprovalsCount: number;
}

export const MOCK_BRANCHES: EnterpriseBranch[] = [
  {
    branchId: "BR-COT-01",
    branchName: "Direction Générale & Siège Cotonou",
    city: "Cotonou",
    localManagerName: "Marcelle Tossou (DSI)",
    monthlyBudgetCapFcfa: 2000000,
    currentMonthSpentFcfa: 840000,
    activeFleetCount: 48,
    pendingApprovalsCount: 0,
  },
  {
    branchId: "BR-PRK-02",
    branchName: "Succursale Régionale Parakou",
    city: "Parakou",
    localManagerName: "Ibrahim Salami (Chef d'Agence)",
    monthlyBudgetCapFcfa: 800000,
    currentMonthSpentFcfa: 420000,
    activeFleetCount: 18,
    pendingApprovalsCount: 2,
  },
  {
    branchId: "BR-PTN-03",
    branchName: "Agence Porto-Novo Ouando",
    city: "Porto-Novo",
    localManagerName: "Honorine Kpadonou (Responsable Opérations)",
    monthlyBudgetCapFcfa: 500000,
    currentMonthSpentFcfa: 180000,
    activeFleetCount: 12,
    pendingApprovalsCount: 1,
  },
];

export const getEnterpriseBranchesFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orgId: z.string().min(1),
    }),
  )
  .handler(async (): Promise<{ branches: EnterpriseBranch[]; totalFleetCount: number }> => {
    if (!(await rateLimit("get-enterprise-branches", 60))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const totalFleet = MOCK_BRANCHES.reduce((acc, b) => acc + b.activeFleetCount, 0);
    return {
      branches: MOCK_BRANCHES,
      totalFleetCount: totalFleet,
    };
  });
