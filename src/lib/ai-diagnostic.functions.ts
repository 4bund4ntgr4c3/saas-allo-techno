// ============================================================================
// Allô Techno — Moteur d'IA Diagnostic Express & Analyse de Symptômes
// Prédiction de panne, composants à tester et estimation tarifaire indicative.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface AiDiagnosticResult {
  detectedIssue: string;
  probabilityScore: number;
  criticalComponent: string;
  recommendedIntervention: string;
  estimatedDuration: string;
  priceRangeFcfa: { min: number; max: number };
  emergencyLevel: "faible" | "moyen" | "urgent";
}

export const analyzeDeviceSymptomFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      deviceType: z.string().min(1),
      symptomDescription: z.string().min(3),
    }),
  )
  .handler(async ({ data: input }): Promise<AiDiagnosticResult> => {
    const text = input.symptomDescription.toLowerCase();

    // 1. Détection de liquide / eau
    if (text.includes("eau") || text.includes("liquide") || text.includes("café") || text.includes("mouillé")) {
      return {
        detectedIssue: "Oxydation de la carte mère & courts-circuits de lignes d'alimentation",
        probabilityScore: 94,
        criticalComponent: "Carte mère / Circuits intégrés de puissance / Puces BGA",
        recommendedIntervention: "Désoxydation ultrasonique d'urgence & reconstruction de pistes",
        estimatedDuration: "24h à 48h",
        priceRangeFcfa: { min: 25000, max: 55000 },
        emergencyLevel: "urgent",
      };
    }

    // 2. Détection de panne d'affichage / écran
    if (text.includes("écran") || text.includes("noir") || text.includes("ligne") || text.includes("fissur") || text.includes("cassé")) {
      return {
        detectedIssue: "Dalle LCD/OLED endommagée ou coupure de la nappe eDP / Backlight",
        probabilityScore: 92,
        criticalComponent: "Dalle d'écran Retina / LCD ou Nappe vidéo",
        recommendedIntervention: "Remplacement de dalle certifiée d'origine & test de calibration",
        estimatedDuration: "1h à 3h (Express)",
        priceRangeFcfa: { min: 35000, max: 120000 },
        emergencyLevel: "moyen",
      };
    }

    // 3. Détection de batterie / autonomie / extinction
    if (text.includes("batterie") || text.includes("charge") || text.includes("autonomie") || text.includes("éteint") || text.includes("gonfl")) {
      return {
        detectedIssue: "Dégradation chimique de la batterie lithium ou défaillance du circuit de charge (IC Tristar/ISL)",
        probabilityScore: 89,
        criticalComponent: "Cellules de batterie OEM ou Contrôleur de charge",
        recommendedIntervention: "Changement de batterie certifiée neuve + test de cycles",
        estimatedDuration: "45 minutes",
        priceRangeFcfa: { min: 18000, max: 45000 },
        emergencyLevel: "moyen",
      };
    }

    // 4. Détection de surchauffe / lenteur / bruit
    if (text.includes("chauffe") || text.includes("bruit") || text.includes("lent") || text.includes("rame") || text.includes("ventilateur")) {
      return {
        detectedIssue: "Encrassement du dissipateur thermique & pâte thermique asséchée (Harmattan)",
        probabilityScore: 91,
        criticalComponent: "Ventilateur PWM, radiateur cuivre et pâte thermique CPU/GPU",
        recommendedIntervention: "Nettoyage intégral sous air comprimé & repasting haute conductivité",
        estimatedDuration: "1h",
        priceRangeFcfa: { min: 10000, max: 20000 },
        emergencyLevel: "faible",
      };
    }

    // Diagnostic généraliste par défaut
    return {
      detectedIssue: "Dysfonctionnement matériel ou micrologiciel nécessitant un banc de test",
      probabilityScore: 78,
      criticalComponent: "Composants internes / Circuit d'alimentation",
      recommendedIntervention: "Diagnostic complet multipoints en atelier sous 30 minutes",
      estimatedDuration: "30 minutes (Diagnostic offert)",
      priceRangeFcfa: { min: 15000, max: 45000 },
      emergencyLevel: "moyen",
    };
  });
