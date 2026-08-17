// ============================================================================
// Allô Techno — Bordereaux d'Expédition Intervilles Bénin (Format A6)
// Colis sécurisés pour Parakou, Bohicon, Natitingou via transporteurs agréés.
// ============================================================================

import jsPDF from "jspdf";
import QRCode from "qrcode";
import { COMPANY, formatFcfa } from "@/data/catalog/company";

export interface ShippingLabelData {
  trackingNumber: string;
  recipientName: string;
  recipientCity: "Parakou" | "Bohicon" | "Natitingou" | "Djougou" | "Porto-Novo" | "Kandi";
  recipientPhone: string;
  recipientAgencyPickup: string; // ex: Agence Baobab Express Parakou Marché
  carrierName: "Baobab Express" | "ATT Transport" | "Pax Express" | "La Poste du Bénin";
  packageContents: string; // ex: MacBook Pro 14 (Écran réparé)
  declaredValueFcfa: number;
  isFragile: boolean;
  issuedDate: string;
}

export async function downloadShippingLabelPdf(data: ShippingLabelData) {
  // Format A6 : 105mm x 148mm
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [105, 148],
  });

  const verifyUrl = `https://allotechno.africa/fr/suivi?colis=${data.trackingNumber}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 120, margin: 1 }).catch(() => "");

  // ─── En-tête Transporteur & Allô Techno ───
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, 105, 25, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("ALLÔ TECHNO AFRICA — ENVOI SÉCURISÉ", 6, 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text(`Transporteur Partenaire : ${data.carrierName}`, 6, 16);
  doc.text(`Expédié le : ${data.issuedDate}`, 6, 21);

  // ─── Bloc Destinataire ───
  let y = 32;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(5, y, 95, 34, 2, 2, "F");
  doc.rect(5, y, 95, 34, "S");

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("DESTINATAIRE (RETRAIT GARE) :", 8, y + 6);

  doc.setFontSize(11);
  doc.text(data.recipientName, 8, y + 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Ville : ${data.recipientCity.toUpperCase()} · Tél : ${data.recipientPhone}`, 8, y + 20);
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Point de retrait : ${data.recipientAgencyPickup}`, 8, y + 27);

  // ─── Bloc Contenu & Fragilité ───
  y += 38;
  doc.setFillColor(254, 242, 242); // Red-50
  doc.roundedRect(5, y, 95, 22, 2, 2, "F");
  doc.rect(5, y, 95, 22, "S");

  doc.setTextColor(185, 28, 28);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(
    data.isFragile ? "ATTENTION : MATÉRIEL ÉLECTRONIQUE FRAGILE" : "COLIS SÉCURISÉ",
    8,
    y + 6,
  );

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(`Contenu : ${data.packageContents}`, 8, y + 12);
  doc.text(`Valeur déclarée sous assurance : ${formatFcfa(data.declaredValueFcfa)}`, 8, y + 17);

  // ─── Code-barres & QR Code de Suivi ───
  y += 26;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(5, y, 95, 36, 2, 2, "F");
  doc.rect(5, y, 95, 36, "S");

  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, "PNG", 8, y + 4, 28, 28);
    } catch {
      /* ignore */
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("N° DE SUIVI COLIS (TRACKING) :", 40, y + 10);

  doc.setFont("courier", "bold");
  doc.setFontSize(11);
  doc.setTextColor(234, 88, 12);
  doc.text(data.trackingNumber, 40, y + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Scannez ce QR code pour suivre l'acheminement en temps réel.", 40, y + 25);
  doc.text(`Expéditeur : ${COMPANY.name} · Tél : ${COMPANY.phone}`, 40, y + 30);

  doc.save(`Bordereau_Expedition_${data.trackingNumber}.pdf`);
}
