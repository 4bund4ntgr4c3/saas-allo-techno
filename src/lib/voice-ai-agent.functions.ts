// ============================================================================
// Allô Techno — Agent Vocal IA Conversationnel 24/7 (« Allô Voice AI »)
// Dialogue vocal interactif, pré-diagnostic et tarification instantanée.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { rateLimit } from "@/lib/security";

export interface VoiceAiResponse {
  sessionId: string;
  transcriptUser: string;
  assistantVoiceText: string;
  detectedIntent: "devis_reparation" | "prise_rdv" | "suivi_dossier" | "conseil_achat";
  suggestedAction?: {
    label: string;
    route: string;
  };
  estimatedPriceFcfa?: number;
}

export const processVoiceQueryFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      audioTranscript: z.string().min(2),
      language: z.enum(["fr", "fon"]),
    }),
  )
  .handler(async ({ data: input }): Promise<VoiceAiResponse> => {
    if (!(await rateLimit("process-voice-query", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const text = input.audioTranscript.toLowerCase();
    const isFon = input.language === "fon";

    if (text.includes("écran") || text.includes("casse") || text.includes("dalle")) {
      return {
        sessionId: `VOICE-${Date.now().toString().slice(-6)}`,
        transcriptUser: input.audioTranscript,
        assistantVoiceText: isFon
          ? "Un yí gbe nú écran tɔn gblé. Enan byɔ 45 000 FCFA ɖo atelier Haie Vive. A jró na sɔ rendez-vous à ?"
          : "J'ai bien noté le problème d'écran cassé. Le remplacement d'une dalle FHD 15.6 pouces est à 45 000 FCFA avec garantie 6 mois. Souhaitez-vous que je réserve votre créneau d'atelier ?",
        detectedIntent: "devis_reparation",
        suggestedAction: {
          label: "Réserver ce créneau d'atelier",
          route: "/reservation",
        },
        estimatedPriceFcfa: 45000,
      };
    }

    return {
      sessionId: `VOICE-${Date.now().toString().slice(-6)}`,
      transcriptUser: input.audioTranscript,
      assistantVoiceText: isFon
        ? "Kú abɔ̌! Allô Techno ɖo kpɔ́ xá we. Mi kɛnklɛn ɖɔ nǔ e ɖo azɔ̌ wà wɛ ɖo ordinatɛ́ɛ tɔn mɛ é."
        : "Bonjour ! Je suis l'assistant vocal Allô Techno. Nos ateliers de Cotonou et Calavi sont ouverts jusqu'à 19h. Décrivez-moi votre panne informatique pour un devis immédiat.",
      detectedIntent: "conseil_achat",
      suggestedAction: {
        label: "Voir tous nos tarifs",
        route: "/tarifs",
      },
    };
  });
