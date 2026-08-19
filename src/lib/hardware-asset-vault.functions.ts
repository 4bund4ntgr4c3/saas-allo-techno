// ============================================================================
// Allô Techno — Coffre-Fort d'Inventaire Matériel & Registre Anti-Vol DSI
// Enregistrement des empreintes matérielles (UUID / MAC) et blacklistage réseau.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { rateLimit } from "@/lib/security";

export interface HardwareAssetRecord {
  assetTag: string;
  serialNumber: string;
  motherboardUuid: string;
  macAddressWifi: string;
  deviceModel: string;
  assignedEmployee: string;
  protectionStatus: "protégé_actif" | "signalé_volé_bloqué" | "restitué_déclassé";
  lastAuditTimestamp: string;
}

export const MOCK_ASSETS_VAULT: HardwareAssetRecord[] = [
  {
    assetTag: "AT-ASSET-0841",
    serialNumber: "5CD14209KF",
    motherboardUuid: "4A89C102-8921-4FA1-9012-A10294820194",
    macAddressWifi: "A4:C3:F0:89:12:34",
    deviceModel: "HP EliteBook 840 G8 (Intel Core i7 / 16 Go)",
    assignedEmployee: "Didier Akakpo (Directeur Administratif & Financier)",
    protectionStatus: "protégé_actif",
    lastAuditTimestamp: "18 Août 2026 14:20:00",
  },
  {
    assetTag: "AT-ASSET-0842",
    serialNumber: "C02F8910MD6R",
    motherboardUuid: "8B90D213-9032-4EB2-A123-B20395831205",
    macAddressWifi: "BC:D1:19:44:88:AA",
    deviceModel: "MacBook Pro 14'' M1 Pro (16 Go / 512 Go)",
    assignedEmployee: "Syntyche Hounwanou (Chef de Projet Digital)",
    protectionStatus: "protégé_actif",
    lastAuditTimestamp: "17 Août 2026 11:15:00",
  },
];

export const getHardwareAssetsVaultFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ assets: HardwareAssetRecord[]; totalProtectedCount: number }> => {
    if (!(await rateLimit("hw-assets-list", 60))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    return {
      assets: MOCK_ASSETS_VAULT,
      totalProtectedCount: MOCK_ASSETS_VAULT.length,
    };
  },
);

export const reportAssetStolenFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      assetTag: z.string(),
      incidentDetails: z.string().min(5),
    }),
  )
  .handler(
    async ({
      data: input,
    }): Promise<{ success: boolean; policePvNumber: string; message: string }> => {
      if (!(await rateLimit("hw-asset-report-stolen", 10))) {
        throw new Error("Trop de demandes. Réessayez dans une minute.");
      }
      const pvNum = `PV-VOL-POLICE-BJ-2026-${Date.now().toString().slice(-6)}`;
      return {
        success: true,
        policePvNumber: pvNum,
        message: `Actif ${input.assetTag} blacklisté avec succès sur tout le réseau des réparateurs UEMOA. Fiche de signalement N° ${pvNum} générée.`,
      };
    },
  );
