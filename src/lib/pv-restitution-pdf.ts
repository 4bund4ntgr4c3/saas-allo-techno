// ============================================================================
// Allô Techno Africa — Procès-Verbal de Restitution & Clôture de Maintenance
// Document officiel attestant la remise en service et la garantie légale.
// ============================================================================

import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { COMPANY } from "@/data/catalog/company";
import { drawEyeCatchingHeader, drawEyeCatchingFooter } from "./pdf-theme";

export type PvRestitutionInput = {
  pvNumber: string;
  orgName: string;
  clientContactName: string;
  equipmentName: string;
  serialNumber: string;
  interventionSummary: string;
  warrantyPeriodMonths: number;
  restitutionDate: string;
  technicianName: string;
};

export async function generatePvRestitutionPdf(input: PvRestitutionInput): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pw - margin * 2;

  // 1. En-tête Eye-Catching avec Logo Vectoriel Allô Techno
  let y = drawEyeCatchingHeader(doc, {
    title: "ALLÔ TECHNO AFRICA",
    subTitle: "SERVICES INFORMATIQUES B2B & MAINTENANCE SPÉCIALISÉE",
    docRef: input.pvNumber,
    dateStr: input.restitutionDate,
    extraMeta: "Statut : Matériel Révisé & Restitué",
    accentColor: [16, 185, 129], // Émeraude Restitution
  });

  // 2. Title & Subtitle Badge
  doc.setFillColor(236, 253, 245);
  doc.rect(margin, y, contentWidth, 13, "F");
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.35);
  doc.rect(margin, y, contentWidth, 13, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(5, 150, 105);
  doc.text("PROCÈS-VERBAL DE RESTITUTION & DE LIVRAISON DE MATÉRIEL", margin + 4, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "CERTIFICAT OFFICIEL DE CONFORMITÉ, RESTITUTION ET COUVERTURE DE GARANTIE",
    margin + 4,
    y + 10,
  );

  y += 17;

  // 3. Grid: Entreprise Bénéficiaire vs Équipement Concerné
  const colW = (contentWidth - 4) / 2;

  // Box Client
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, colW, 28, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("1. BÉNÉFICIAIRE / CLIENT", margin + 4, y + 5.5);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("Entreprise :", margin + 4, y + 12);
  doc.setFont("helvetica", "normal");
  doc.text(input.orgName, margin + 22, y + 12);

  doc.setFont("helvetica", "bold");
  doc.text("Destinataire :", margin + 4, y + 17.5);
  doc.setFont("helvetica", "normal");
  doc.text(input.clientContactName, margin + 22, y + 17.5);

  doc.setFont("helvetica", "bold");
  doc.text("Atelier Référent :", margin + 4, y + 23);
  doc.setFont("helvetica", "normal");
  doc.text("Allô Techno (Calavi Zogbadjè)", margin + 25, y + 23);

  // Box Équipement
  const xRight = margin + colW + 4;
  doc.setFillColor(248, 250, 252);
  doc.rect(xRight, y, colW, 28, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("2. ÉQUIPEMENT RESTITUÉ", xRight + 4, y + 5.5);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("Désignation :", xRight + 4, y + 12);
  doc.setFont("helvetica", "normal");
  doc.text(input.equipmentName, xRight + 22, y + 12);

  doc.setFont("helvetica", "bold");
  doc.text("N° Série / IMEI :", xRight + 4, y + 17.5);
  doc.setFont("helvetica", "normal");
  doc.text(input.serialNumber || "Non spécifié", xRight + 25, y + 17.5);

  doc.setFont("helvetica", "bold");
  doc.text("Date Restitution :", xRight + 4, y + 23);
  doc.setFont("helvetica", "normal");
  doc.text(input.restitutionDate, xRight + 26, y + 23);

  y += 33;

  // 4. Section: Synthèse des Travaux Réalisés (Dynamic Height)
  doc.setFillColor(248, 250, 252);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);

  const splitSummary = doc.splitTextToSize(
    input.interventionSummary || "Révision complète et maintenance effectuée avec succès.",
    contentWidth - 8,
  );
  const summaryBoxH = Math.max(22, 12 + splitSummary.length * 4.5);

  doc.rect(margin, y, contentWidth, summaryBoxH, "FD");
  doc.text("3. SYNTHÈSE DES RÉPARATIONS & TRAVAUX EXÉCUTÉS", margin + 4, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(splitSummary, margin + 4, y + 11.5);

  y += summaryBoxH + 5;

  // 5. Section: Certificat de Garantie Après-Vente
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.4);
  doc.rect(margin, y, contentWidth, 23, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(5, 150, 105);
  doc.text("4. COUVERTURE & ENGAGEMENT DE GARANTIE APRÈS-VENTE", margin + 4, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Cet équipement bénéficie d'une garantie pièces et main-d'œuvre de ${input.warrantyPeriodMonths} mois à compter de la date de restitution.`,
    margin + 4,
    y + 11,
  );
  doc.text(
    "Toute réintervention sous garantie sera prise en charge avec priorité absolue conformément aux engagements SLA Allô Techno.",
    margin + 4,
    y + 16,
  );
  doc.text(
    `Assistance technique & astreinte téléphonique : ${COMPANY.phone} · support@allotechno.africa`,
    margin + 4,
    y + 20.5,
  );

  y += 28;

  // 6. Signatures & QR Code (Dynamic Placement with page break protection)
  if (y + 36 > ph - 15) {
    doc.addPage();
    y = 20;
  }

  const qrUrl = await QRCode.toDataURL(`https://allotechno.africa/fr/suivi?pv=${input.pvNumber}`, {
    width: 120,
    margin: 1,
    color: { dark: "#0f172a" },
  }).catch(() => "");

  const sigBoxWidth = (contentWidth - 32) / 2;

  // Box Signature Atelier
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, sigBoxWidth, 26, "D");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  doc.text("POUR L'ATELIER ALLÔ TECHNO", margin + 3, y + 4.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Technicien : ${input.technicianName}`, margin + 3, y + 9);
  doc.text("Signature & Cachet d'atelier :", margin + 3, y + 14);

  // Box Signature Client
  const clientSigX = margin + sigBoxWidth + 4;
  doc.rect(clientSigX, y, sigBoxWidth, 26, "D");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  doc.text("BON POUR RÉCEPTION / ENTREPRISE", clientSigX + 3, y + 4.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Nom : ${input.clientContactName}`, clientSigX + 3, y + 9);
  doc.text("Date & Signature du réceptionnaire :", clientSigX + 3, y + 14);

  // QR Code Box
  if (qrUrl) {
    const qrX = pw - margin - 23;
    doc.addImage(qrUrl, "PNG", qrX, y, 23, 23);
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Authenticité QR", qrX + 11.5, y + 24.5, { align: "center" });
  }

  // 7. Pied de Page Eye-Catching
  drawEyeCatchingFooter(doc, {
    docRef: `PV N° ${input.pvNumber}`,
    pageNumber: 1,
    totalPages: 1,
    notice:
      "Allô Techno Africa — Document valant bon de livraison, clôture technique et certificat de garantie contractuelle.",
  });

  doc.save(`PV-Restitution-${input.pvNumber}.pdf`);
}
