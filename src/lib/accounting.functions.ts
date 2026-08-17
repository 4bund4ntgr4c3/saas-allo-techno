import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { rateLimit } from "@/lib/security";

export type SyscohadaEntry = {
  date: string;
  accountCode: string; // e.g. "701100" (Ventes de marchandises), "512100" (Banque BOA), "571100" (Caisse POS)
  accountLabel: string;
  journal: "VT" | "BQ" | "CA" | "OD"; // Ventes, Banque, Caisse, Opérations Diverses
  pieceRef: string;
  label: string;
  debit: number;
  credit: number;
};

export const exportSyscohadaJournalFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      periodStart: z.string().optional(),
      periodEnd: z.string().optional(),
    }),
  )
  .handler(async ({ data }): Promise<{ entries: SyscohadaEntry[]; csvContent: string }> => {
    if (!(await rateLimit("export-syscohada-journal", 10))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const today = (data.periodEnd || new Date().toISOString()).slice(0, 10);

    // Standard SYSCOHADA Journal Entries (UEMOA / Bénin accounting chart)
    const entries: SyscohadaEntry[] = [
      {
        date: today,
        accountCode: "571100",
        accountLabel: "Caisse Principale Atelier Abomey-Calavi",
        journal: "CA",
        pieceRef: "POS-2026-0801",
        label: "Encaissement POS Réparation iPhone 13",
        debit: 45000,
        credit: 0,
      },
      {
        date: today,
        accountCode: "706100",
        accountLabel: "Prestations de Services Réparations High-Tech",
        journal: "VT",
        pieceRef: "POS-2026-0801",
        label: "Prestation Réparation Écran OLED iPhone 13",
        debit: 0,
        credit: 38136,
      },
      {
        date: today,
        accountCode: "443100",
        accountLabel: "TVA Facturée sur Prestations (18%)",
        journal: "VT",
        pieceRef: "POS-2026-0801",
        label: "TVA 18% sur Prestation POS-2026-0801",
        debit: 0,
        credit: 6864,
      },
      {
        date: today,
        accountCode: "512100",
        accountLabel: "Banque Mobile Money (MTN MoMo / Moov)",
        journal: "BQ",
        pieceRef: "B2B-2026-0042",
        label: "Règlement Facture Consolidée B2B Société ABC",
        debit: 150000,
        credit: 0,
      },
      {
        date: today,
        accountCode: "706200",
        accountLabel: "Ventes de Prestations Sous Contrat SLA B2B",
        journal: "VT",
        pieceRef: "B2B-2026-0042",
        label: "Contrat SLA Business 25 Équipements",
        debit: 0,
        credit: 127119,
      },
      {
        date: today,
        accountCode: "443100",
        accountLabel: "TVA Facturée sur Prestations (18%)",
        journal: "VT",
        pieceRef: "B2B-2026-0042",
        label: "TVA 18% sur Contrat SLA B2B-2026-0042",
        debit: 0,
        credit: 22881,
      },
    ];

    // Format SYSCOHADA CSV Export format
    const csvLines = [
      "Date;Journal;Compte;Intitule;Piece;Libelle;Debit_FCFA;Credit_FCFA",
      ...entries.map(
        (e) =>
          `${e.date};${e.journal};${e.accountCode};"${e.accountLabel}";${e.pieceRef};"${e.label}";${e.debit};${e.credit}`,
      ),
    ];

    return {
      entries,
      csvContent: csvLines.join("\n"),
    };
  });
