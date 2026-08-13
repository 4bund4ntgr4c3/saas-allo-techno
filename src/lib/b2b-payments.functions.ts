import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type B2bPaymentProvider = "fedapay" | "kkiapay" | "bank_transfer";
export type MobileMoneyOperator = "mtn" | "moov" | "celtiis" | "card";

export type InitiateSlaPaymentInput = {
  orgId: string;
  contractNumber: string;
  amountFcfa: number;
  provider: B2bPaymentProvider;
  operator?: MobileMoneyOperator;
  phoneNumber?: string;
};

export const initiateSlaPaymentFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orgId: z.string(),
      contractNumber: z.string(),
      amountFcfa: z.number(),
      provider: z.enum(["fedapay", "kkiapay", "bank_transfer"]),
      operator: z.enum(["mtn", "moov", "celtiis", "card"]).optional(),
      phoneNumber: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    const paymentRef = `SLA-${data.contractNumber}-${Date.now().toString().slice(-6)}`;

    if (data.provider === "bank_transfer") {
      return {
        paymentRef,
        status: "pending_wire_transfer",
        instructions: "Virement bancaire vers BOA Bénin - RIB : BJ061 01001 001234567890 12",
        checkoutUrl: null,
      };
    }

    // FedaPay / KkiaPay Mobile Money Checkout URL
    const checkoutUrl = `https://checkout.fedapay.com/pay/${paymentRef}?amount=${data.amountFcfa}&currency=XOF`;

    return {
      paymentRef,
      status: "initiated",
      instructions: `Paiement Mobile Money (${(data.operator ?? "MTN").toUpperCase()}) en cours pour ${data.amountFcfa.toLocaleString()} FCFA`,
      checkoutUrl,
    };
  });
