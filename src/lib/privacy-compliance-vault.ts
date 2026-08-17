// ============================================================================
// Allô Techno — Coffre-Fort de Conformité APDP & Registre Cryptographique SHA-256
// Traçabilité immuable des consentements et procès-verbaux de purge données.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { rateLimit } from "@/lib/security";

export interface PrivacyRecord {
  recordId: string;
  clientName: string;
  clientType: "Banque / Finance" | "Cabinet d'Avocats" | "PME / Particulier";
  actionType: "Effacement_NIST_800_88" | "Consentement_Traitement_APDP" | "Restitution_Sécurisée";
  sha256ProofHash: string;
  timestamp: string;
  dpoSignature: string;
  status: "scellé_conforme" | "en_attente_visa";
}

export const MOCK_PRIVACY_VAULT: PrivacyRecord[] = [
  {
    recordId: "APDP-VAULT-9102",
    clientName: "Banque Internationale du Bénin (BIBE)",
    clientType: "Banque / Finance",
    actionType: "Effacement_NIST_800_88",
    sha256ProofHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    timestamp: "16 Août 2026 15:42:10 UTC+1",
    dpoSignature: "Visa DPO Allô Techno N° DPO-BJ-2026-44",
    status: "scellé_conforme",
  },
  {
    recordId: "APDP-VAULT-8831",
    clientName: "Cabinet Notarial Me Agbessi",
    clientType: "Cabinet d'Avocats",
    actionType: "Consentement_Traitement_APDP",
    sha256ProofHash: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
    timestamp: "14 Août 2026 11:20:04 UTC+1",
    dpoSignature: "Visa DPO Allô Techno N° DPO-BJ-2026-39",
    status: "scellé_conforme",
  },
];

export const getPrivacyRecordsFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ records: PrivacyRecord[]; totalSealedCount: number }> => {
    if (!(await rateLimit("get-privacy-records", 60))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    return {
      records: MOCK_PRIVACY_VAULT,
      totalSealedCount: MOCK_PRIVACY_VAULT.length,
    };
  },
);
