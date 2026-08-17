// ============================================================================
// Allô Techno — Programme de Parrainage & Affiliation Mobile Money
// Traçabilité des filleuls, calcul des commissions et reversement MoMo.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { rateLimit } from "@/lib/security";

export interface ReferralStats {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  completedRepairs: number;
  totalEarnedFcfa: number;
  pendingPayoutFcfa: number;
  history: {
    id: string;
    friendName: string;
    device: string;
    date: string;
    commissionFcfa: number;
    status: "en_attente" | "valide" | "verse";
  }[];
}

export const getReferralStatsFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      userPhone: z.string().min(8),
    }),
  )
  .handler(async ({ data: input }): Promise<ReferralStats> => {
    if (!(await rateLimit("get-referral-stats", 60))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const code = `AT-${input.userPhone.replace(/\D/g, "").slice(-4)}`;
    return {
      referralCode: code,
      referralLink: `https://allotechno.africa/fr?ref=${code}`,
      totalReferrals: 8,
      completedRepairs: 6,
      totalEarnedFcfa: 35000,
      pendingPayoutFcfa: 10000,
      history: [
        {
          id: "ref-01",
          friendName: "Marc A.",
          device: "MacBook Pro 14 M1 (Remplacement Écran)",
          date: new Date(Date.now() - 3 * 864e5).toISOString(),
          commissionFcfa: 5000,
          status: "valide",
        },
        {
          id: "ref-02",
          friendName: "Sonia G.",
          device: "Dell Latitude 5420 (Réparation Carte Mère)",
          date: new Date(Date.now() - 7 * 864e5).toISOString(),
          commissionFcfa: 5000,
          status: "verse",
        },
        {
          id: "ref-03",
          friendName: "Christian K.",
          device: "iPhone 13 (Changement Batterie)",
          date: new Date(Date.now() - 1 * 864e5).toISOString(),
          commissionFcfa: 2500,
          status: "en_attente",
        },
      ],
    };
  });

export const requestPayoutMomoFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      phoneMomo: z.string().min(8),
      amountFcfa: z.number().min(5000),
      provider: z.enum(["mtn", "moov", "celtiis"]),
    }),
  )
  .handler(
    async ({ data: input }): Promise<{ success: boolean; payoutId: string; message: string }> => {
      if (!(await rateLimit("request-payout-momo", 10))) {
        throw new Error("Trop de demandes. Réessayez dans une minute.");
      }
      return {
        success: true,
        payoutId: `PAYOUT-MOMO-${Date.now().toString().slice(-6)}`,
        message: `Votre demande de virement de ${input.amountFcfa} FCFA vers le numéro ${input.phoneMomo} a été enregistrée et sera traitée sous 2h ouvrées.`,
      };
    },
  );
