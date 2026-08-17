// ============================================================================
// Allô Techno — Générateur d'Ordre de Virement Bancaire Normalisé UEMOA / Bénin
// Compatible banques locales : Ecobank, BOA, UBA, Société Générale Bénin.
// ============================================================================

import jsPDF from "jspdf";
import { formatFcfa } from "@/data/catalog/company";

export type UemoaBank = "ecobank" | "boa" | "uba" | "sgb";

export interface BankAccountDetails {
  bankKey: UemoaBank;
  bankName: string;
  ribCode: string;
  iban: string;
  swiftBic: string;
}

export const OFFICIAL_BANK_ACCOUNTS: Record<UemoaBank, BankAccountDetails> = {
  ecobank: {
    bankKey: "ecobank",
    bankName: "Ecobank Bénin (Agence Principale Ganhi)",
    ribCode: "BJ061 01001 00123456789 45",
    iban: "BJ66 BJ06 1010 0100 1234 5678 9045",
    swiftBic: "ECOCBJBX",
  },
  boa: {
    bankKey: "boa",
    bankName: "Bank of Africa (BOA Bénin)",
    ribCode: "BJ047 02002 00987654321 88",
    iban: "BJ66 BJ04 7020 0200 9876 5432 1088",
    swiftBic: "AFRIBJBX",
  },
  uba: {
    bankKey: "uba",
    bankName: "United Bank for Africa (UBA Bénin)",
    ribCode: "BJ032 03003 00554433221 12",
    iban: "BJ66 BJ03 2030 0300 5544 3322 1012",
    swiftBic: "UNAFBJBX",
  },
  sgb: {
    bankKey: "sgb",
    bankName: "Société Générale Bénin (SGB)",
    ribCode: "BJ025 04004 00778899001 33",
    iban: "BJ66 BJ02 5040 0400 7788 9900 1033",
    swiftBic: "SGEBBJBX",
  },
};

export interface BankTransferOrderData {
  orderReference: string;
  emitterCompanyName: string;
  emitterBankName: string;
  emitterRib: string;
  invoiceReference: string;
  amountFcfa: number;
  selectedBank: UemoaBank;
  valueDate?: string;
}

export function generateBankTransferOrderPdf(data: BankTransferOrderData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const destBank = OFFICIAL_BANK_ACCOUNTS[data.selectedBank];

  // En-tête
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("ORDRE DE VIREMENT BANCAIRE IRRÉVOCABLE", 15, 25);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Réf Ordre : ${data.orderReference} — Émis le ${new Date().toLocaleDateString("fr-FR")}`,
    15,
    32,
  );

  doc.setDrawColor(203, 213, 225);
  doc.line(15, 36, 195, 36);

  // Donneur d'ordre
  let y = 48;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("1. DONNEUR D'ORDRE (ÉMETTEUR)", 15, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Raison Sociale : ${data.emitterCompanyName}`, 20, y);
  y += 6;
  doc.text(`Banque Émettrice : ${data.emitterBankName}`, 20, y);
  y += 6;
  doc.text(`RIB Compte à Débiter : ${data.emitterRib}`, 20, y);

  // Bénéficiaire
  y += 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("2. COMPTE BÉNÉFICIAIRE (ALLÔ TECHNO)", 15, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Bénéficiaire : ALLÔ TECHNO AFRICA SARL", 20, y);
  y += 6;
  doc.text(`Banque Domiciliataire : ${destBank.bankName}`, 20, y);
  y += 6;
  doc.text(`RIB Bénéficiaire : ${destBank.ribCode}`, 20, y);
  y += 6;
  doc.text(`IBAN : ${destBank.iban}`, 20, y);
  y += 6;
  doc.text(`Code SWIFT / BIC : ${destBank.swiftBic}`, 20, y);

  // Montant et Motif
  y += 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("3. MONTANT & MOTIF DU RÈGLEMENT", 15, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    `Montant à Transférer : ${formatFcfa(data.amountFcfa)} (Net de frais de virement)`,
    20,
    y,
  );
  y += 6;
  doc.text(`Motif / Réf Facture : Règlement Facture SAV / SLA N° ${data.invoiceReference}`, 20, y);
  y += 6;
  doc.text(`Date de Valeur Souhaitée : ${data.valueDate || "Au plus tôt (J)"}`, 20, y);

  // Signatures
  y += 25;
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, y, 180, 45);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Signature Autorisée & Cachet de l'Entreprise :", 20, y + 8);
  doc.text("Visa & Cachet Réception Banque :", 110, y + 8);

  doc.save(`Ordre_Virement_${data.orderReference}_${data.invoiceReference}.pdf`);
}
