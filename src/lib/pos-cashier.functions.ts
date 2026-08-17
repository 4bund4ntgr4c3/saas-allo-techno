// ============================================================================
// Allô Techno — Terminal Point de Vente (POS) & Encaissement Caisse Comptoir
// Gestion de caisse tactile, splits de paiement et génération de tickets thermiques.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { rateLimit } from "@/lib/security";

export interface PosLineItem {
  id: string;
  label: string;
  unitPriceFcfa: number;
  quantity: number;
  category: "reparation" | "piece_detachee" | "accessoire" | "service";
}

export interface PosTransactionResult {
  receiptNumber: string;
  cashierName: string;
  timestamp: string;
  totalFcfa: number;
  paymentBreakdown: {
    cashFcfa: number;
    momoFcfa: number;
    cardFcfa: number;
  };
  mecefSecurityCode: string;
  mecefQrPayload: string;
  changeDueFcfa: number;
}

export const processPosCheckoutFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      cashierName: z.string().min(1),
      items: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
          unitPriceFcfa: z.number(),
          quantity: z.number(),
        }),
      ),
      cashReceivedFcfa: z.number().default(0),
      momoReceivedFcfa: z.number().default(0),
      cardReceivedFcfa: z.number().default(0),
    }),
  )
  .handler(async ({ data: input }): Promise<PosTransactionResult> => {
    if (!(await rateLimit("process-pos-checkout", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const total = input.items.reduce((sum, item) => sum + item.unitPriceFcfa * item.quantity, 0);
    const totalPaid = input.cashReceivedFcfa + input.momoReceivedFcfa + input.cardReceivedFcfa;
    const changeDue = Math.max(0, totalPaid - total);
    const receiptNo = `REC-POS-${Date.now().toString().slice(-6)}`;
    const mecefCode = `e-MECeF-BJ-${Date.now().toString().slice(-8)}-OK`;

    return {
      receiptNumber: receiptNo,
      cashierName: input.cashierName,
      timestamp: new Date().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "medium" }),
      totalFcfa: total,
      paymentBreakdown: {
        cashFcfa: input.cashReceivedFcfa,
        momoFcfa: input.momoReceivedFcfa,
        cardFcfa: input.cardReceivedFcfa,
      },
      mecefSecurityCode: mecefCode,
      mecefQrPayload: `https://emc.dgi.bj/v1/verify?code=${mecefCode}&total=${total}`,
      changeDueFcfa: changeDue,
    };
  });
