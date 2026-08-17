// ============================================================================
// Allô Techno — Registre National Anti-Recel & Traçabilité Matériel Volé
// Vérification instantanée des numéros de série et IMEI pour sécurité atelier.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface StolenDeviceRecord {
  serialNumber: string;
  deviceModel: string;
  isFlaggedStolen: boolean;
  policeReportNumber?: string;
  declarationDate?: string;
  declarantName?: string;
  statusNotes?: string;
}

export const MOCK_STOLEN_DATABASE: Record<string, StolenDeviceRecord> = {
  "C02G1234MD6R": {
    serialNumber: "C02G1234MD6R",
    deviceModel: "MacBook Pro 16 M1 Max",
    isFlaggedStolen: true,
    policeReportNumber: "PV-2026-POL-8491",
    declarationDate: "2026-07-12",
    declarantName: "Société Générale Bénin (DSI)",
    statusNotes: "Vol par effraction dans les bureaux de l'agence Ganhi. Appareil sous verrouillage d'activation MDM.",
  },
  "5CD1234XYZ": {
    serialNumber: "5CD1234XYZ",
    deviceModel: "HP EliteBook 840 G8",
    isFlaggedStolen: true,
    policeReportNumber: "PL-CALAVI-902",
    declarationDate: "2026-08-01",
    declarantName: "Cabinet d'Avocats Me Dossou",
    statusNotes: "Vol à la tire sacoche informatique carrefour Arconville.",
  },
};

export const checkDeviceStolenStatusFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      serialNumber: z.string().min(4),
    }),
  )
  .handler(async ({ data: input }): Promise<StolenDeviceRecord> => {
    const cleanSn = input.serialNumber.trim().toUpperCase();
    const record = MOCK_STOLEN_DATABASE[cleanSn];

    if (record) return record;

    return {
      serialNumber: cleanSn,
      deviceModel: "Appareil Non Fiché",
      isFlaggedStolen: false,
      statusNotes: "Numéro de série intègre. Aucun signalement de vol ou litige enregistré dans la base Allô Techno & Forces de l'Ordre.",
    };
  });

export const reportStolenDeviceFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      serialNumber: z.string().min(4),
      deviceModel: z.string().min(2),
      policeReportNumber: z.string().min(3),
      declarantName: z.string().min(2),
      declarantPhone: z.string().min(8),
    }),
  )
  .handler(async ({ data: input }): Promise<{ success: boolean; registryToken: string; message: string }> => {
    const token = `ALERT-ANTI-RECEL-${Date.now().toString().slice(-6)}`;
    return {
      success: true,
      registryToken: token,
      message: `Votre signalement pour l'appareil S/N ${input.serialNumber.toUpperCase()} a été enregistré. En cas de dépôt physique à l'atelier Allô Techno, l'appareil sera immédiatement consigné et les forces de l'ordre notifiées.`,
    };
  });
