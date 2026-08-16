// ============================================================================
// Allô Techno — Certificat Officiel de Destruction Sécurisée des Données & DEEE
// Conforme normes NIST SP 800-88 Rev. 1 & DoD 5220.22-M pour banques et institutions.
// ============================================================================

import jsPDF from "jspdf";
import QRCode from "qrcode";

export interface DataDestructionCertificateData {
  certificateNumber: string;
  clientCompanyName: string;
  clientContactPerson: string;
  destructionStandard: "NIST_800_88_PURGE" | "DOD_5220_22_M_3PASS" | "PHYSICAL_DEMAGNETIZATION";
  disksDestroyed: {
    diskType: "SSD NVMe" | "SSD SATA" | "HDD 2.5/3.5" | "Clé USB / Carte";
    serialNumber: string;
    capacityGb: number;
    wipedStatus: "Purged & Zeroed" | "Demagnetized" | "Mechanically Shredded";
  }[];
  dateOfDestruction: string;
  authorizedInspector: string;
  apdpComplianceToken: string;
}

export async function downloadDataDestructionCertificatePdf(data: DataDestructionCertificateData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const verifyUrl = `https://allotechno.africa/fr/suivi?cert=${data.certificateNumber}&token=${data.apdpComplianceToken}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 150, margin: 1 }).catch(() => "");

  // ─── En-tête officiel Sécurité & DSI ───
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, 210, 42, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("ALLÔ TECHNO LABS — SÉCURITÉ DES DONNÉES", 15, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(226, 232, 240);
  doc.text("CERTIFICAT D'EFFACEMENT SÉCURISÉ & DESTRUCTION DE MÉMOIRE", 15, 26);
  doc.text("Attestation d'irréversibilité conforme NIST SP 800-88 & Décret APDP Bénin", 15, 32);

  // Badge Certificat
  doc.setFillColor(234, 88, 12);
  doc.roundedRect(138, 10, 57, 22, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("ATTESTATION N°", 143, 17);
  doc.setFontSize(10.5);
  doc.text(data.certificateNumber, 143, 26);

  // ─── Corps du Certificat ───
  let y = 56;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("1. DONNEUR D'ORDRE & CONTEXTE SÉCURITÉ", 15, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(`Organisation Cliente : ${data.clientCompanyName}`, 20, y);
  doc.text(`Responsable Sécurité / DSI : ${data.clientContactPerson}`, 110, y);

  y += 6;
  doc.text(`Date de Traitement : ${data.dateOfDestruction}`, 20, y);
  doc.text(`Standard Appliqué : ${data.destructionStandard.replace(/_/g, " ")}`, 110, y);

  // ─── Table des disques ───
  y += 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("2. INVENTAIRE DES SUPPORTS DE STOCKAGE DÉTRUITS / PURGÉS", 15, y);

  y += 8;
  doc.setFillColor(241, 245, 249);
  doc.rect(15, y, 180, 8, "F");
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text("TYPE SUPPORT", 18, y + 5.5);
  doc.text("NUMÉRO DE SÉRIE (S/N)", 65, y + 5.5);
  doc.text("CAPACITÉ", 125, y + 5.5);
  doc.text("STATUT D'EFFACEMENT", 150, y + 5.5);

  y += 8;
  doc.setFont("helvetica", "normal");
  data.disksDestroyed.forEach((disk) => {
    doc.text(disk.diskType, 18, y + 5.5);
    doc.text(disk.serialNumber, 65, y + 5.5);
    doc.text(`${disk.capacityGb} Go`, 125, y + 5.5);
    doc.text(disk.wipedStatus, 150, y + 5.5);
    y += 7;
  });

  // ─── Clause Juridique et Garantie d'Irréversibilité ───
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("3. CLAUSE D'IRRÉVERSIBILITÉ & PROTECTION DES DONNÉES", 15, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "Allô Techno certifie que l'ensemble des secteurs magnétiques et puces NAND Flash ont fait l'objet d'une réécriture",
    20,
    y,
  );
  y += 5;
  doc.text(
    "complète ou d'une destruction physique rendant toute récupération de données strictement impossible.",
    20,
    y,
  );

  // ─── Sceau et QR Code ───
  y += 12;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, y, 180, 42, 2, 2, "F");
  doc.rect(15, y, 180, 42, "S");

  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, "PNG", 20, y + 4, 34, 34);
    } catch {}
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Jeton de Traçabilité APDP / Audit SIEM :", 60, y + 12);

  doc.setFont("courier", "bold");
  doc.setFontSize(9);
  doc.setTextColor(234, 88, 12);
  doc.text(data.apdpComplianceToken, 60, y + 19);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Inspecteur Agréé : " + data.authorizedInspector, 60, y + 26);
  doc.text("Document opposable et certifié pour les audits ISO 27001 et APDP Bénin.", 60, y + 32);

  // Signatures
  y += 50;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Pour le Laboratoire Allô Techno :", 20, y);
  doc.text("Pour l'Entreprise Cliente (DSI) :", 120, y);

  doc.save(`Certificat_Destruction_Donnees_${data.certificateNumber}.pdf`);
}
