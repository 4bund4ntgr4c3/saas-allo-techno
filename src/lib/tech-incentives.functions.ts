// ============================================================================
// Allô Techno — Gamification & Commissions MoMo des Techniciens Atelier
// Primes de performance au ticket, respect SLA express et satisfaction client.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { rateLimit } from "@/lib/security";

export interface TechIncentiveProfile {
  technicianId: string;
  name: string;
  avatarUrl?: string;
  resolvedTicketsThisMonth: number;
  slaExpressBonusCount: number; // bonus < 1h
  fiveStarReviewsCount: number;
  totalCommissionEarnedFcfa: number;
  momoPayoutPhoneNumber: string;
  rankBadge: "Master Microsoudeur" | "Expert Forensics" | "Technicien Élite";
}

export const MOCK_TECH_INCENTIVES: TechIncentiveProfile[] = [
  {
    technicianId: "TECH-01",
    name: "Brice Hountondji",
    resolvedTicketsThisMonth: 42,
    slaExpressBonusCount: 18,
    fiveStarReviewsCount: 29,
    totalCommissionEarnedFcfa: 125000,
    momoPayoutPhoneNumber: "+229 97 00 11 22",
    rankBadge: "Master Microsoudeur",
  },
  {
    technicianId: "TECH-02",
    name: "Cédric Agbossou",
    resolvedTicketsThisMonth: 28,
    slaExpressBonusCount: 12,
    fiveStarReviewsCount: 22,
    totalCommissionEarnedFcfa: 98000,
    momoPayoutPhoneNumber: "+229 96 33 44 55",
    rankBadge: "Expert Forensics",
  },
  {
    technicianId: "TECH-03",
    name: "Marc Alapini",
    resolvedTicketsThisMonth: 51,
    slaExpressBonusCount: 24,
    fiveStarReviewsCount: 38,
    totalCommissionEarnedFcfa: 142000,
    momoPayoutPhoneNumber: "+229 95 66 77 88",
    rankBadge: "Technicien Élite",
  },
];

export const getTechIncentivesLeaderboardFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ technicians: TechIncentiveProfile[]; totalCommissionsPoolFcfa: number }> => {
    if (!(await rateLimit("get-tech-incentives-leaderboard", 60))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const totalPool = MOCK_TECH_INCENTIVES.reduce((sum, t) => sum + t.totalCommissionEarnedFcfa, 0);
    return {
      technicians: MOCK_TECH_INCENTIVES.sort(
        (a, b) => b.totalCommissionEarnedFcfa - a.totalCommissionEarnedFcfa,
      ),
      totalCommissionsPoolFcfa: totalPool,
    };
  },
);
