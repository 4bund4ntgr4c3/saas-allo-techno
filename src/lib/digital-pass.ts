// ============================================================================
// Allô Techno — Carte de Fidélité & Pass VIP Numérique (Allô Club)
// Pass dématérialisé avec QR Code client, solde de points et remises atelier.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface DigitalLoyaltyCard {
  cardId: string;
  memberNumber: string;
  customerName: string;
  tier: "Club Bronze" | "Club Gold VIP" | "Club Platinum Élixir";
  loyaltyPoints: number;
  discountPercentage: number;
  freeMaintenanceCount: number;
  qrPayload: string;
  validUntil: string;
}

export const getDigitalLoyaltyCardFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      phone: z.string().min(8),
    }),
  )
  .handler(async ({ data: input }): Promise<DigitalLoyaltyCard> => {
    const memberNo = `ATC-${input.phone.replace(/\D/g, "").slice(-4)}`;
    return {
      cardId: `PASS-WALLET-${Date.now().toString().slice(-6)}`,
      memberNumber: memberNo,
      customerName: "Abonné Privilège Allô Techno",
      tier: "Club Gold VIP",
      loyaltyPoints: 3450,
      discountPercentage: 15,
      freeMaintenanceCount: 1,
      qrPayload: `https://allotechno.africa/fr/suivi?member=${memberNo}`,
      validUntil: "31 Décembre 2027",
    };
  });
