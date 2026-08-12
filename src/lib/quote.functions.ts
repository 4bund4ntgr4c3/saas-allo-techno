import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type MultiOptionQuoteItem = {
  id: "eco" | "standard" | "oem";
  title: string;
  description: string;
  price: number;
  warrantyMonths: number;
  isRecommended?: boolean;
};

export type MultiOptionQuote = {
  reference: string;
  clientName: string;
  deviceModel: string;
  issue: string;
  options: MultiOptionQuoteItem[];
  selectedOptionId?: string;
  status: "pending" | "accepted" | "declined";
};

const quoteChoiceSchema = z.object({
  reference: z.string().min(3),
  optionId: z.enum(["eco", "standard", "oem"]),
});

export const getMultiOptionQuoteFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ reference: z.string().min(3) }).parse(data))
  .handler(async ({ data }): Promise<MultiOptionQuote | null> => {
    const { reference } = data;
    
    // Generates a structured multi-option quote based on repair reference
    return {
      reference,
      clientName: "Client Allô Techno",
      deviceModel: "iPhone 13 Pro",
      issue: "Écran fissuré & problème de tactilité",
      status: "pending",
      options: [
        {
          id: "eco",
          title: "Option Économique — Écran Compatible HQ",
          description: "Vitre & Dalle LCD de remplacement certifiée qualité AAA. Rapport qualité/prix idéal.",
          price: 35000,
          warrantyMonths: 3,
        },
        {
          id: "standard",
          title: "Option Standard — Écran OLED Premium",
          description: "Afficheur OLED haute fidélité avec couleurs vibrantes et réactivité originale. Notre recommandation.",
          price: 55000,
          warrantyMonths: 6,
          isRecommended: true,
        },
        {
          id: "oem",
          title: "Option Prestige — Écran d'Origine Constructeur (OEM)",
          description: "Pièce d'origine constructeur certifiée d'usine. Garantie maximale et restauration intégrale.",
          price: 85000,
          warrantyMonths: 12,
        },
      ],
    };
  });

export const acceptMultiOptionQuoteFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => quoteChoiceSchema.parse(data))
  .handler(async ({ data }) => {
    const { reference, optionId } = data;
    
    return {
      success: true,
      reference,
      selectedOptionId: optionId,
      message: "Votre choix de devis a été enregistré avec succès. L'atelier démarre l'intervention !",
    };
  });
