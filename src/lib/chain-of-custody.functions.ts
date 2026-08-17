// ============================================================================
// Allô Techno — Chaîne de Garde & Scellé Judiciaire (« Chain of Custody »)
// Traçabilité médico-légale des pièces à conviction numériques et disques durs.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { rateLimit } from "@/lib/security";

export interface EvidenceTransferEvent {
  eventId: string;
  evidenceId: string;
  deviceDescription: string;
  serialNumber: string;
  securityBagSealNumber: string;
  sourceCustodian: string;
  targetCustodian: string;
  reasonForTransfer: string;
  timestamp: string;
  sha256SealHash: string;
  status: "scellé_intact" | "en_expertise_lab" | "restitué_sous_scellé";
}

export const MOCK_EVIDENCE_RECORDS: EvidenceTransferEvent[] = [
  {
    eventId: "EV-TRANS-01",
    evidenceId: "EVID-JUD-2026-89",
    deviceDescription: "SSD NVMe Samsung 980 Pro 1 To (Affaire Fraude Bancaire)",
    serialNumber: "S647NF0T104820W",
    securityBagSealNumber: "SEAL-BJ-840192",
    sourceCustodian: "Me Dossou (Huissier de Justice Cotonou)",
    targetCustodian: "Dr. Cédric Agbossou (Expert Judiciaire Informatique Allô Techno)",
    reasonForTransfer: "Clonage bit-à-bit forensique et extraction des logs de transaction",
    timestamp: "17 Août 2026 08:30:15 UTC+1",
    sha256SealHash: "a8f5f167f44f4964e6c998dee827110c01759f00523078fff5fc82d6190cf5a4",
    status: "en_expertise_lab",
  },
  {
    eventId: "EV-TRANS-02",
    evidenceId: "EVID-JUD-2026-74",
    deviceDescription: "Serveur Rack Dell PowerEdge R640 (Audit DSI Conformité)",
    serialNumber: "CN-084910-8491",
    securityBagSealNumber: "SEAL-BJ-720194",
    sourceCustodian: "DSI Banque Atlantique Bénin",
    targetCustodian: "Laboratoire Forensic Allô Techno",
    reasonForTransfer: "Recherche d'intrusion et analyse de persistance malware",
    timestamp: "15 Août 2026 14:15:00 UTC+1",
    sha256SealHash: "3f79bb7b435b05321651daefd374cdc681dc06faa65e374e38337b88ca046dea",
    status: "scellé_intact",
  },
];

export const getChainOfCustodyLogsFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ records: EvidenceTransferEvent[]; totalActiveEvidence: number }> => {
    if (!(await rateLimit("get-chain-of-custody-logs", 60))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    return {
      records: MOCK_EVIDENCE_RECORDS,
      totalActiveEvidence: MOCK_EVIDENCE_RECORDS.length,
    };
  },
);
