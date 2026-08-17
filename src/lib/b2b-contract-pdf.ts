// ============================================================================
// Allô Techno — Générateur de Contrat-Cadre de Maintenance B2B & Convention SLA
// Conforme droit commercial OHADA & Code du Numérique Bénin.
// ============================================================================

import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { COMPANY, formatFcfa } from "@/data/catalog/company";
import { drawEyeCatchingHeader, drawEyeCatchingFooter } from "./pdf-theme";

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

  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pw - margin * 2;

  const verifyUrl = `https://allotechno.africa/fr/entreprises?contract=${data.contractNumber}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 150, margin: 1 }).catch(() => "");

  // 1. En-tête Eye-Catching avec Logo Vectoriel
  let y = drawEyeCatchingHeader(doc, {
    title: "ALLÔ TECHNO AFRICA",
    subTitle: "SERVICES INFORMATIQUES B2B & INFOGÉRANCE D'ENTREPRISE",
    docRef: data.contractNumber,
    dateStr: data.startDate,
    extraMeta: "Statut : Convention B2B Scellée",
    accentColor: [59, 130, 246], // Bleu Contractuel
  });

  // 2. Titre de la convention
  doc.setFillColor(239, 246, 255);
  doc.rect(margin, y, contentWidth, 13, "F");
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.35);
  doc.rect(margin, y, contentWidth, 13, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 64, 175);
  doc.text("CONVENTION DE MAINTENANCE INFORMATIQUE & ENGAGEMENT SLA", margin + 4, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "INFOGÉRANCE, MAINTENANCE PRÉVENTIVE, CURATIVE ET MATÉRIEL DE SECOURS",
    margin + 4,
    y + 10,
  );

  y += 17;

  // 3. Article 1 : Les Parties
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("ARTICLE 1 — DÉSIGNATION DES PARTIES CONTRACTANTES", margin, y);

  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `1.1 Le Prestataire : ${COMPANY.name}, domicilié à ${COMPANY.address}, RCCM RB/COT/24 B 12345.`,
    margin + 3,
    y,
  );
  y += 4.2;

  const clientText = `1.2 Le Client : ${data.clientCompanyName} (RCCM / IFU : ${data.clientRccmIfu || "En cours"}), représenté par ${data.clientSignatoryName} (${data.clientSignatoryRole}).`;
  const splitClient = doc.splitTextToSize(clientText, contentWidth - 6);
  doc.text(splitClient, margin + 3, y);
  y += splitClient.length * 4.2 + 3.5;

  // 4. Article 2 : SLA & Périmètre
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("ARTICLE 2 — ENGAGEMENTS DE SERVICE (SLA) & PÉRIMÈTRE D'INFOGÉRANCE", margin, y);

  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(51, 65, 85);
  doc.text(`• Formule de Service Souscrite : ${data.slaTier}`, margin + 3, y);
  y += 4.2;
  doc.text(
    `• Parc Couvert : ${data.coveredFleetCount} équipements informatiques (Laptops, Desktops, Serveurs, Imprimantes).`,
    margin + 3,
    y,
  );
  y += 4.2;
  doc.text(
    "• Délai de Rétablissement Garanti : Remplacement ou prêt immédiat d'équipements de secours en cas d'immobilisation.",
    margin + 3,
    y,
  );
  y += 7.5;

  // 5. Article 3 : Conditions Financières & Pénalités
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("ARTICLE 3 — CONDITIONS FINANCIÈRES & PÉNALITÉS DE RETARD", margin, y);

  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `• Redevance Forfaitaire Mensuelle : ${formatFcfa(data.monthlyAmountFcfa)} HT / mois (payable à réception de facture).`,
    margin + 3,
    y,
  );
  y += 4.2;
  doc.text(
    `• Durée de la Convention : ${data.durationMonths} mois fermes avec reconduction tacite, prenant effet le ${data.startDate}.`,
    margin + 3,
    y,
  );
  y += 4.2;
  doc.text(
    `• Clause Pénalité SLA : ${formatFcfa(data.penaltyClausePerDelayedHourFcfa)} par heure de retard injustifiée au-delà du délai garanti.`,
    margin + 3,
    y,
  );
  y += 7.5;

  // 6. Article 4 : Confidentialité & RGPD / APDP
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("ARTICLE 4 — CONFIDENTIALITÉ ABSOLUE (NDA) & CONFORMITÉ APDP BÉNIN", margin, y);

  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(51, 65, 85);
  doc.text(
    "Allô Techno garantit le secret professionnel absolu et l'étanchéité des données manipulées lors des interventions.",
    margin + 3,
    y,
  );
  y += 4.2;
  doc.text(
    "Tout personnel intervenant est lié par une clause de non-divulgation stricte et auditée périodiquement.",
    margin + 3,
    y,
  );
  y += 8.5;

  // 7. Sceau Électronique & QR Code (Preventing overflow)
  if (y + 55 > ph - 14) {
    doc.addPage();
    y = 15;
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 24, "FD");

  if (qrDataUrl) {
    doc.addImage(qrDataUrl, "PNG", margin + 3, y + 2, 20, 20);
  }

  const qrTextX = margin + 26;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.8);
  doc.setTextColor(15, 23, 42);
  doc.text("Scellé Électronique & Vérification Contractuelle en Ligne", qrTextX, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Enregistré au registre central Allô Techno B2B sous le code de scellé ${data.contractNumber}.`,
    qrTextX,
    y + 10,
  );
  const legalText =
    "Document original certifié opposable devant les juridictions de Cotonou conformément au droit OHADA.";
  doc.text(legalText, qrTextX, y + 14.5);

  y += 29;

  // 8. Signatures des parties
  const sigW = (contentWidth - 4) / 2;

  // Sign Prestataire
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, sigW, 24, "D");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("POUR ALLÔ TECHNO AFRICA", margin + 3, y + 4.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text("Direction Générale & Cachet Officiel", margin + 3, y + 9);

  // Sign Client
  const clientBoxX = margin + sigW + 4;
  doc.rect(clientBoxX, y, sigW, 24, "D");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`POUR ${data.clientCompanyName.toUpperCase()}`, clientBoxX + 3, y + 4.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(`${data.clientSignatoryName} (${data.clientSignatoryRole})`, clientBoxX + 3, y + 9);
  doc.text("Date & Signature (Bon pour accord)", clientBoxX + 3, y + 13.5);

  // 9. Pied de Page Eye-Catching
  drawEyeCatchingFooter(doc, {
    docRef: `Contrat N° ${data.contractNumber}`,
    pageNumber: 1,
    totalPages: 1,
    notice:
      "Allô Techno Africa — Infogérance & Conventions SLA — Exemplaire contractuel certifié conforme.",
  });

  doc.save(`Contrat_SLA_AlloTechno_${data.contractNumber}.pdf`);
}
