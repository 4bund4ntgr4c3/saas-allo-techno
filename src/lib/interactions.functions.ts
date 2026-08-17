// ============================================================================
// Allô Techno — Journal des Interactions Client & Notes d'Atelier SAV
// Traçabilité des appels téléphoniques, échanges WhatsApp et mémos techniciens.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { rateLimit } from "@/lib/security";

export type InteractionChannel = "phone_call" | "whatsapp" | "in_person" | "internal_memo";

export interface ClientInteractionEntry {
  id: string;
  reference: string;
  channel: InteractionChannel;
  authorName: string;
  summary: string;
  nextAction?: string | null;
  createdAt: string;
}

export const MOCK_INTERACTIONS: ClientInteractionEntry[] = [
  {
    id: "int-01",
    reference: "SAV-8492",
    channel: "phone_call",
    authorName: "Koffi (Technicien)",
    summary: "Appel client : Accord reçu pour le remplacement de l'écran Retina sous 48h.",
    nextAction: "Lancer le déballage de la pièce dès dédouanement",
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: "int-02",
    reference: "SAV-8492",
    channel: "whatsapp",
    authorName: "Support Allô Techno",
    summary: "Envoi des photos de l'état initial constatées au démontage (oxydation nappe).",
    nextAction: null,
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
];

export const getClientInteractionsFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      reference: z.string().min(1),
    }),
  )
  .handler(async ({ data: input }): Promise<ClientInteractionEntry[]> => {
    if (!(await rateLimit("get-client-interactions", 60))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    return MOCK_INTERACTIONS.filter(
      (i) => i.reference === input.reference || input.reference === "ALL",
    );
  });

export const addClientInteractionFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      reference: z.string().min(1),
      channel: z.enum(["phone_call", "whatsapp", "in_person", "internal_memo"]),
      authorName: z.string().min(1),
      summary: z.string().min(1),
      nextAction: z.string().optional(),
    }),
  )
  .handler(
    async ({ data: input }): Promise<{ success: boolean; entry: ClientInteractionEntry }> => {
      if (!(await rateLimit("add-client-interaction", 20))) {
        throw new Error("Trop de demandes. Réessayez dans une minute.");
      }
      const entry: ClientInteractionEntry = {
        id: `int-${Date.now()}`,
        reference: input.reference,
        channel: input.channel,
        authorName: input.authorName,
        summary: input.summary,
        nextAction: input.nextAction ?? null,
        createdAt: new Date().toISOString(),
      };
      MOCK_INTERACTIONS.unshift(entry);
      return { success: true, entry };
    },
  );
