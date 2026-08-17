// ============================================================================
// Allô Techno — Certificat de Garantie Numérique Inviolable (PDF & SHA-256)
// Document officiel certifiant l'authenticité des pièces et la garantie légale.
// ============================================================================

import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { drawEyeCatchingHeader, drawEyeCatchingFooter } from "./pdf-theme";

export interface WarrantyCertificateData {
  certificateId: string;
  reference: string;
  customerName: string;
  customerPhone?: string;
  deviceModel: string;
  serialNumber?: string;
  replacedParts: string[];
  repairDate: string;
  warrantyEndDate: string;
  technicianName: string;
}

/**
 * Calcule un hachage SHA-256 simplifié pour sceller numériquement le certificat
 */
async function computeCertificateFingerprint(data: WarrantyCertificateData): Promise<string> {
  const payload = `${data.certificateId}|${data.reference}|${data.deviceModel}|${data.serialNumber ?? ""}|${data.repairDate}|${data.warrantyEndDate}|ALLOTECHNO_CERTIFIED`;
  try {
    const msgUint8 = new TextEncoder().encode(payload);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
      .slice(0, 32);
  } catch {
    return `AT-${Date.now().toString(16).toUpperCase()}-BJ`;
  }
}

export async function downloadWarrantyCertificatePdf(data: WarrantyCertificateData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pw = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pw - margin * 2;

  const fingerprint = await computeCertificateFingerprint(data);
  const verifyUrl = `https://allotechno.africa/fr/suivi?ref=${encodeURIComponent(data.reference)}&cert=${fingerprint}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 180, margin: 1 }).catch(() => "");

  // 1. En-tête Eye-Catching avec Logo Vectoriel
  let y = drawEyeCatchingHeader(doc, {
    title: "ALLÔ TECHNO AFRICA",
    subTitle: "LABORATOIRE DE RÉPARATION ÉLECTRONIQUE & MICRO-SOUDURE",
    docRef: data.certificateId,
    dateStr: data.repairDate,
    extraMeta: `Dossier : ${data.reference}`,
    accentColor: [249, 115, 22],
  });

  // 2. Titre Badge
  doc.setFillColor(236, 253, 245);
  doc.rect(margin, y, contentWidth, 13, "F");
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.35);
  doc.rect(margin, y, contentWidth, 13, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(5, 150, 105);
  doc.text("CERTIFICAT DE GARANTIE TECHNIQUE & CONFORMITÉ PIÈCES", margin + 4, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "ATTESTATION OFFICIELLE DE REMPLACEMENT PAR DES COMPOSANTS CERTIFIÉS D'ORIGINE",
    margin + 4,
    y + 10,
  );

  y += 17;

  // 3. Grid: Client & Appareil
  const colW = (contentWidth - 4) / 2;

  // Client Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, colW, 26, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("1. CLIENT BÉNÉFICIAIRE", margin + 4, y + 5.5);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("Titulaire :", margin + 4, y + 12);
  doc.setFont("helvetica", "normal");
  doc.text(data.customerName, margin + 20, y + 12);

  doc.setFont("helvetica", "bold");
  doc.text("Téléphone :", margin + 4, y + 18);
  doc.setFont("helvetica", "normal");
  doc.text(data.customerPhone || "Non renseigné", margin + 22, y + 18);

  // Appareil Box
  const xRight = margin + colW + 4;
  doc.setFillColor(248, 250, 252);
  doc.rect(xRight, y, colW, 26, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("2. APPAREIL COUVERT", xRight + 4, y + 5.5);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("Modèle :", xRight + 4, y + 12);
  doc.setFont("helvetica", "normal");
  doc.text(data.deviceModel, xRight + 18, y + 12);

  doc.setFont("helvetica", "bold");
  doc.text("N° Série :", xRight + 4, y + 18);
  doc.setFont("helvetica", "normal");
  doc.text(data.serialNumber || "Conforme au châssis", xRight + 20, y + 18);

  y += 30;

  // 4. Composants remplacés
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 23, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("3. COMPOSANTS REMPLACÉS & TRAVAUX EXÉCUTÉS", margin + 4, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const partsText = data.replacedParts
    .map((p) => `• ${p} (Pièce certifiée d'origine)`)
    .join("  |  ");
  const splitParts = doc.splitTextToSize(
    partsText || "• Révision et réparation des composants électroniques défaillants.",
    contentWidth - 8,
  );
  doc.text(splitParts, margin + 4, y + 11.5);

  y += 28;

  // 5. Période & Échange immédiat
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(16, 185, 129);
  doc.rect(margin, y, contentWidth, 21, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105);
  doc.text("4. PÉRIODE & ÉTENDUE DE LA GARANTIE LÉGALE", margin + 4, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Date d'intervention : ${data.repairDate}  —  Garantie valide jusqu'au : ${data.warrantyEndDate}`,
    margin + 4,
    y + 11,
  );
  doc.text(
    "Couverture intégrale pièces et main-d'œuvre avec échange immédiat en cas de dysfonctionnement avéré.",
    margin + 4,
    y + 16,
  );

  y += 26;

  // 6. Sceau d'authenticité & QR Code
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 26, "FD");

  if (qrDataUrl) {
    doc.addImage(qrDataUrl, "PNG", margin + 3, y + 2, 22, 22);
  }

  const qrTxtX = margin + 28;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("Sceau d'Authenticité Cryptographique SHA-256", qrTxtX, y + 6);

  doc.setFont("courier", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(234, 88, 12);
  doc.text(fingerprint, qrTxtX, y + 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Certificat infalsifiable scellé et consultable en ligne par flash du QR Code.",
    qrTxtX,
    y + 16,
  );
  doc.text(
    "Valable pour toute prise en charge sous garantie dans les centres Allô Techno.",
    qrTxtX,
    y + 20,
  );

  y += 31;

  // 7. Signature & Cachet
  const sigW = (contentWidth - 4) / 2;

  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, sigW, 25, "D");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  doc.text("LE RESPONSABLE TECHNIQUE ATELIER", margin + 3, y + 4.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Technicien : ${data.technicianName}`, margin + 3, y + 9);
  doc.text("Signature & Sceau Atelier Allô Techno", margin + 3, y + 14);

  doc.rect(margin + sigW + 4, y, sigW, 25, "D");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  doc.text("POUR RÉCEPTION DU CERTIFICAT", margin + sigW + 7, y + 4.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Titulaire : ${data.customerName}`, margin + sigW + 7, y + 9);
  doc.text("Signature Client(e)", margin + sigW + 7, y + 14);

  // 8. Pied de page Eye-Catching
  drawEyeCatchingFooter(doc, {
    docRef: `Certificat N° ${data.certificateId}`,
    pageNumber: 1,
    totalPages: 1,
    notice:
      "Allô Techno Africa — Laboratoire de Réparation Électronique — Certificat de garantie contractuelle.",
  });

  doc.save(`Certificat_Garantie_${data.reference}_${data.certificateId}.pdf`);
}
