import jsPDF from "jspdf";
import QRCode from "qrcode";
import { COMPANY, formatFcfa } from "@/data/catalog/company";

export interface DevisData {
  reference: string;
  customerName: string;
  email: string;
  phone: string;
  device: string;
  brand: string;
  faults: string[];
  diagnosis: string;
  estimatedCost: number;
  validUntil: string;
  notes?: string;
  items: { label: string; quantity: number; unitPrice: number }[];
}

async function generateQrCode(dataUrl: string): Promise<string> {
  return QRCode.toDataURL(dataUrl, { width: 120, margin: 1, color: { dark: "#18181b" } });
}

export async function generateDevisPdf(devis: DevisData): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Header
  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, pageWidth, 35, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY.name, margin, 18);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`${COMPANY.address} — ${COMPANY.city}`, margin, 25);
  doc.text(`Tél: ${COMPANY.phone} — ${COMPANY.email}`, margin, 30);

  // QR Code
  const qrUrl = await generateQrCode(`https://allo-techno.com/devis?ref=${devis.reference}`);
  doc.addImage(qrUrl, "PNG", pageWidth - margin - 25, 5, 25, 25);

  y = 45;

  // Title
  doc.setTextColor(24, 24, 27);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("DEVIS", margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(113, 113, 122);
  doc.text(`Référence: ${devis.reference}`, margin, y);
  y += 5;
  doc.text(`Date: ${new Date().toLocaleDateString("fr-BJ")}`, margin, y);
  y += 5;
  doc.text(`Validité: ${devis.validUntil}`, margin, y);
  y += 10;

  // Separator
  doc.setDrawColor(228, 228, 231);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Customer info
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(24, 24, 27);
  doc.text("Informations client", margin, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Nom: ${devis.customerName}`, margin, y);
  y += 5;
  doc.text(`Tél: ${devis.phone}`, margin, y);
  y += 5;
  doc.text(`Email: ${devis.email}`, margin, y);
  y += 10;

  // Device info
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Appareil", margin, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Marque: ${devis.brand}`, margin, y);
  y += 5;
  doc.text(`Modèle: ${devis.device}`, margin, y);
  y += 5;
  doc.text(`Panne(s): ${devis.faults.join(", ")}`, margin, y);
  y += 5;
  if (devis.diagnosis) {
    const lines = doc.splitTextToSize(`Diagnostic: ${devis.diagnosis}`, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 5;
  }
  y += 5;

  // Items table
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Détail des prestations", margin, y);
  y += 7;

  // Table header
  doc.setFillColor(249, 250, 251);
  doc.rect(margin, y - 4, contentWidth, 7, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Désignation", margin + 2, y);
  doc.text("Qté", margin + contentWidth * 0.55, y);
  doc.text("Prix unit.", margin + contentWidth * 0.65, y);
  doc.text("Total", margin + contentWidth * 0.82, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  for (const item of devis.items) {
    const total = item.quantity * item.unitPrice;
    doc.text(item.label, margin + 2, y);
    doc.text(String(item.quantity), margin + contentWidth * 0.55, y);
    doc.text(formatFcfa(item.unitPrice), margin + contentWidth * 0.65, y);
    doc.text(formatFcfa(total), margin + contentWidth * 0.82, y);
    y += 6;
  }

  // Separator
  doc.setDrawColor(228, 228, 231);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  // Total
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Total estimé", margin, y);
  doc.text(formatFcfa(devis.estimatedCost), pageWidth - margin - 30, y, { align: "right" });
  y += 10;

  // Notes
  if (devis.notes) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Notes", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const noteLines = doc.splitTextToSize(devis.notes, contentWidth);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 4 + 5;
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setDrawColor(228, 228, 231);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(161, 161, 170);
  doc.text(`${COMPANY.name} — ${COMPANY.address}`, margin, footerY);
  doc.text(`Tél: ${COMPANY.phone} — ${COMPANY.email}`, margin, footerY + 4);
  doc.text("Ce devis est valable 30 jours à compter de la date d'émission.", margin, footerY + 8);

  return doc.output("blob");
}

export async function downloadDevisPdf(devis: DevisData) {
  const blob = await generateDevisPdf(devis);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `devis-${devis.reference}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
