// ============================================================================
// Allô Techno — Certificat Fiscal de Sortie d'Actif & Rebut DEEE
// Document officiel de mise au rebut pour dépréciation comptable DGI / DAF.
// ============================================================================

import jsPDF from "jspdf";
import QRCode from "qrcode";
import { COMPANY } from "@/data/catalog/company";

export interface FiscalDeeeCertificateData {
  certificateNumber: string;
  clientCompanyName: string;
  clientIfuRccm: string;
  deviceBrandModel: string;
  deviceSerialNumber: string;
  assetInventoryTag: string;
  acquisitionYear: string;
  technicalDecommissioningReason: string;
  recyclingChannel: string;
  issuedDate: string;
}

export async function downloadFiscalDeeeCertificatePdf(data: FiscalDeeeCertificateData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const verifyUrl = `https://allotechno.africa/fr/entreprises?deee=${data.certificateNumber}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 150, margin: 1 }).catch(() => "");

  // ─── En-tête Fiscal & Légal ───
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, 210, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("ATTESTATION TECHNIQUE DE MISE AU REBUT", 15, 17);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text("Certificat de sortie d'actif pour dépréciation comptable & recyclage DEEE", 15, 25);
  doc.text(`Émis par ${COMPANY.name} · Tél : ${COMPANY.phone} · Cotonou, Bénin`, 15, 31);

  // Badge N° Certificat
  doc.setFillColor(239, 68, 68); // Red-500
  doc.roundedRect(138, 10, 57, 20, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("RÉFÉRENCE DGI / DEEE", 143, 16);
  doc.setFontSize(10.5);
  doc.text(data.certificateNumber, 143, 25);

  let y = 54;
  doc.setTextColor(15, 23, 42);

  // ─── Cadre Entreprise Propriétaire ───
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("1. IDENTIFICATION DU DÉTENTEUR DE L'ACTIF", 15, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Raison Sociale : ${data.clientCompanyName}`, 20, y);
  doc.text(`N° IFU / RCCM : ${data.clientIfuRccm}`, 120, y);

  // ─── Description du Matériel Réformé ───
  y += 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("2. CARACTÉRISTIQUES DE L'ÉQUIPEMENT RÉFORMÉ", 15, y);

  y += 7;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, y, 180, 28, 2, 2, "F");
  doc.rect(15, y, 180, 28, "S");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Équipement / Modèle : ${data.deviceBrandModel}`, 20, y + 7);
  doc.text(`Année d'Acquisition : ${data.acquisitionYear}`, 120, y + 7);

  doc.text(`N° de Série (S/N) : ${data.deviceSerialNumber}`, 20, y + 15);
  doc.text(`Code Immo / Asset Tag : ${data.assetInventoryTag}`, 120, y + 15);

  doc.text(`Filière de Traitement : ${data.recyclingChannel}`, 20, y + 23);

  // ─── Constat Technique d'Irréparabilité ───
  y += 38;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("3. CONSTAT D'IRRÉPARABILITÉ ÉCONOMIQUE & TECHNIQUE", 15, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(
    `Après expertise approfondie au banc d'essai, le matériel ci-dessus désigné est déclaré irréparable :`,
    20,
    y,
  );
  y += 6;
  doc.setFont("courier", "bold");
  doc.setTextColor(185, 28, 28);
  doc.text(`Motif : "${data.technicalDecommissioningReason}"`, 20, y);

  y += 7;
  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    "Le coût de remise en état excède la valeur vénale résiduelle de l'appareil. La mise au rebut et",
    20,
    y,
  );
  y += 4.5;
  doc.text(
    "l'extraction des composants polluants (batterie lithium, condensateurs) sont préconisées conformément aux règles DGI.",
    20,
    y,
  );

  // ─── Attestation d'intégrité et QR Code ───
  y += 14;
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
  doc.text("Visa d'Expertise Technique & Destruction DEEE", 54, y + 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Fait à Cotonou, le ${data.issuedDate}.`, 54, y + 16);
  doc.text("Valable pour justification d'annulation d'actif en comptabilité générale.", 54, y + 22);

  // Signatures
  y += 50;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("Chef d'Atelier Allô Techno :", 20, y);
  doc.text(`Direction Financière (${data.clientCompanyName}) :`, 120, y);

  doc.save(`Certificat_Rebut_DEEE_${data.certificateNumber}.pdf`);
}
