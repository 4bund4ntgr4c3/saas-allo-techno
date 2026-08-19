// ============================================================================
// Allô Techno — Simulateur d'Injection de Tension & Détection Court-Circuit
// Calcul de la tension de sécurité (V/A) et wattage dissipé par le composant HS.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { rateLimit } from "@/lib/security";

export interface InjectionSafetyGuide {
  railName: string;
  nominalVoltage: number; // ex: 12.6V
  safeMaxInjectionVoltage: number; // ex: 1.0V (protection CPU)
  currentLimitAmps: number; // ex: 3.0A
  shortCircuitResistanceOhms: number; // ex: 0.15 Ohm
  dissipatedPowerWatts: number; // P = U*I (ex: 3.0W)
  thermalSignatureDescription: string;
  warningNotice: string;
}

export const calculateVoltageInjectionFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      railType: z.enum(["ppbus_g3h_12v", "vcc_core_cpu_1v", "vcc_3v3_always"]),
    }),
  )
  .handler(async ({ data: input }): Promise<InjectionSafetyGuide> => {
    if (!(await rateLimit("voltage-injection", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    if (input.railType === "ppbus_g3h_12v") {
      return {
        railName: "PPBUS_G3H (Ligne Principale 12.6V)",
        nominalVoltage: 12.6,
        safeMaxInjectionVoltage: 1.0,
        currentLimitAmps: 2.5,
        shortCircuitResistanceOhms: 0.2,
        dissipatedPowerWatts: 2.5,
        thermalSignatureDescription:
          "Condensateur céramique CMS (0805) en court-circuit franc près du connecteur batterie.",
        warningNotice:
          "Ne JAMAIS injecter 12V directement tant que l'intégrité des MOSFETs High-Side CPU n'est pas vérifiée à 100%.",
      };
    }

    if (input.railType === "vcc_core_cpu_1v") {
      return {
        railName: "VCC_CORE (Alimentation Cœurs Processeur)",
        nominalVoltage: 0.9,
        safeMaxInjectionVoltage: 0.8,
        currentLimitAmps: 4.0,
        shortCircuitResistanceOhms: 0.05,
        dissipatedPowerWatts: 3.2,
        thermalSignatureDescription:
          "Échauffement direct du die SoC M1/Intel (Court-circuit interne processeur irrémédiable).",
        warningNotice:
          "Zone extrêmement sensible. Ne jamais dépasser 0.85V sous peine de destruction immédiate des transistors 5nm.",
      };
    }

    return {
      railName: "+3.3V_ALWAYS (Alimentation KBC / Super I/O)",
      nominalVoltage: 3.3,
      safeMaxInjectionVoltage: 2.5,
      currentLimitAmps: 1.5,
      shortCircuitResistanceOhms: 0.8,
      dissipatedPowerWatts: 3.75,
      thermalSignatureDescription:
        "Puce Super I/O ENE / ITE chauffant instantanément dès l'injection à 2.5V.",
      warningNotice:
        "Vérifier le condensateur de filtrage avant de dessouder le composant principal.",
    };
  });
