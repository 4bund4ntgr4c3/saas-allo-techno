// ============================================================================
// Allô Techno — Générateur de Contrat-Cadre de Maintenance B2B & Convention SLA
// Conforme droit commercial OHADA & Code du Numérique Bénin.
// ============================================================================

import jsPDF from "jspdf";
import QRCode from "qrcode";
import { COMPANY, formatFcfa } from "@/data/catalog/company";

export interface B2BContractData {
  contractNumber: string;
  clientCompanyName: string;
  clientRccmIfu: string;
  clientSignatoryName: string;
  clientSignatoryRole: string;
  slaTier: "SLA Platine (MTTR < 2h)" | "SLA Gold (MTTR < 4h)" | "SLA Silver (MTTR < 24h)";
  coveredFleetCount: number;
  monthlyAmountFcfa: number;
  startDate: string;
  durationMonths: number;
  penaltyClausePerDelayedHourFcfa: number;
}

export async function downloadB2BContractPdf(data: B2BContractData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const verifyUrl = `https://allotechno.africa/fr/entreprises?contract=${data.contractNumber}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 150, margin: 1 }).catch(() => "");

  // ─── En-tête officiel Contrat B2B ───
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, 210, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("CONVENTION DE MAINTENANCE INFORMATIQUE & SLA", 15, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(226, 232, 240);
  doc.text("Contrat-cadre d'infogérance, maintenance préventive et curative de flotte", 15, 26);
  doc.text("Entreprise Agréée Allô Techno SAS · RCCM RB/COT/21 B 29481 · IFU 3202112849102", 15, 32);

  // Badge Référence Contrat
  doc.setFillColor(234, 88, 12);
  doc.roundedRect(140, 10, 55, 20, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("CONTRAT N°", 144, 16);
  doc.setFontSize(10);
  doc.text(data.contractNumber, 144, 24);

  let y = 52;
  doc.setTextColor(15, 23, 42);

  // ─── Article 1 : Les Parties ───
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("ARTICLE 1 — DÉSIGNATION DES PARTIES CONTRACTANTES", 15, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`1.1 Le Prestataire : ${COMPANY.name}, domicilié à ${COMPANY.address}.`, 20, y);
  y += 5.5;
  doc.text(
    `1.2 Le Client : ${data.clientCompanyName} (RCCM / IFU : ${data.clientRccmIfu}), représenté par ${data.clientSignatoryName} (${data.clientSignatoryRole}).`,
    20,
    y,
  );

  // ─── Article 2 : Objet & Niveau de Service SLA ───
  y += 11;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("ARTICLE 2 — ENGAGEMENTS DE SERVICE (SLA) & PÉRIMÈTRE", 15, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Niveau de Service Souscrit : ${data.slaTier}`, 20, y);
  y += 5.5;
  doc.text(`Nombre d'équipements sous contrat : ${data.coveredFleetCount} machines (Laptops, Desktops, Serveurs)`, 20, y);
  y += 5.5;
  doc.text("Délai maximal de rétablissement (MTTR) garanti avec mise à disposition immédiate d'ordinateurs de prêt.", 20, y);

  // ─── Article 3 : Conditions Financières & Pénalités ───
  y += 11;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("ARTICLE 3 — CONDITIONS FINANCIÈRES & PÉNALITÉS DE RETARD", 15, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Redevance Mensuelle Forfaitaire : ${formatFcfa(data.monthlyAmountFcfa)} HT / mois.`, 20, y);
  y += 5.5;
  doc.text(`Durée d'engagement : ${data.durationMonths} mois fermes à compter du ${data.startDate}.`, 20, y);
  y += 5.5;
  doc.text(
    `Clause de pénalités SLA : ${formatFcfa(
      data.penaltyClausePerDelayedHourFcfa,
    )} par heure de retard injustifiée au-delà du seuil garanti.`,
    20,
    y,
  );

  // ─── Article 4 : Confidentialité & Protection des Données ───
  y += 11;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("ARTICLE 4 — CONFIDENTIALITÉ (NDA) & CONFORMITÉ APDP BÉNIN", 15, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "Allô Techno s'engage au secret professionnel absolu concernant l'ensemble des disques et données manipulés.",
    20,
    y,
  );
  y += 5;
  doc.text(
    "Les techniciens sont soumis à une clause de non-divulgation stricte et à la traçabilité des accès.",
    20,
    y,
  );

  // ─── Encadré d'authentification ───
  y += 12;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, y, 180, 36, 2, 2, "F");
  doc.rect(15, y, 180, 36, "S");

  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, "PNG", 18, y + 3, 30, 30);
    } catch {}
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("Scellé Électronique & Vérification Contractuelle", 54, y + 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Enregistré au registre central Allô Techno B2B le ${data.startDate}.`, 54, y + 16);
  doc.text("Document original numérisé certifié et opposable devant les juridictions compétentes de Cotonou.", 54, y + 22);

  // Signatures
  y += 46;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Pour Allô Techno Africa SAS :", 20, y);
  doc.text(`Pour ${data.clientCompanyName} :`, 120, y);

  y += 5;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Direction Générale & Cachet", 20, y);
  doc.text(`${data.clientSignatoryName} (${data.clientSignatoryRole})`, 120, y);

  doc.save(`Contrat_SLA_AlloTechno_${data.contractNumber}.pdf`);
}
