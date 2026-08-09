import jsPDF from "jspdf";
import QRCode from "qrcode";
import { COMPANY, formatFcfa } from "@/data/catalog/company";

export interface InvoiceData {
  reference: string;
  customerName: string;
  email: string;
  phone: string;
  device: string;
  brand: string;
  faults: string[];
  repairDescription: string;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: string;
  completedAt: string;
  warrantyMonths: number;
  items: { label: string; quantity: number; unitPrice: number }[];
}

async function generateQrCode(dataUrl: string): Promise<string> {
  return QRCode.toDataURL(dataUrl, { width: 100, margin: 1, color: { dark: "#18181b" } });
}

export async function generateInvoicePdf(invoice: InvoiceData): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Header
  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, pageWidth, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY.name, margin, 16);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`${COMPANY.address}`, margin, 22);
  doc.text(`Tél: ${COMPANY.phone}`, margin, 26);

  const qrUrl = await generateQrCode(`https://allo-techno.com/suivi?ref=${invoice.reference}`);
  doc.addImage(qrUrl, "PNG", pageWidth - margin - 20, 5, 20, 20);

  y = 38;

  // FACTURE title
  doc.setTextColor(24, 24, 27);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURE", margin, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(113, 113, 122);
  doc.text(`Réf: ${invoice.reference}`, margin, y);
  y += 4;
  doc.text(`Date: ${invoice.completedAt}`, margin, y);
  y += 4;
  doc.text(`Garantie: ${invoice.warrantyMonths} mois`, margin, y);
  y += 8;

  // Customer
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(24, 24, 27);
  doc.text("Client", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${invoice.customerName}`, margin, y);
  y += 4;
  doc.text(`${invoice.phone} — ${invoice.email}`, margin, y);
  y += 8;

  // Device
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Appareil", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${invoice.brand} ${invoice.device}`, margin, y);
  y += 4;
  doc.text(`Panne(s): ${invoice.faults.join(", ")}`, margin, y);
  y += 4;
  if (invoice.repairDescription) {
    const lines = doc.splitTextToSize(`Réparation: ${invoice.repairDescription}`, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 4;
  }
  y += 4;

  // Items table
  doc.setFillColor(249, 250, 251);
  doc.rect(margin, y - 4, contentWidth, 7, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Désignation", margin + 2, y);
  doc.text("Qté", margin + contentWidth * 0.55, y);
  doc.text("Prix", margin + contentWidth * 0.65, y);
  doc.text("Total", margin + contentWidth * 0.82, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  for (const item of invoice.items) {
    const total = item.quantity * item.unitPrice;
    doc.text(item.label, margin + 2, y);
    doc.text(String(item.quantity), margin + contentWidth * 0.55, y);
    doc.text(formatFcfa(item.unitPrice), margin + contentWidth * 0.65, y);
    doc.text(formatFcfa(total), margin + contentWidth * 0.82, y);
    y += 5;
  }

  doc.setDrawColor(228, 228, 231);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Totals
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Total", margin, y);
  doc.text(formatFcfa(invoice.totalAmount), pageWidth - margin - 25, y, { align: "right" });
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Payé (${invoice.paymentMethod})`, margin, y);
  doc.text(formatFcfa(invoice.paidAmount), pageWidth - margin - 25, y, { align: "right" });
  y += 6;
  if (invoice.totalAmount > invoice.paidAmount) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(220, 38, 38);
    doc.text("Reste à payer", margin, y);
    doc.text(formatFcfa(invoice.totalAmount - invoice.paidAmount), pageWidth - margin - 25, y, { align: "right" });
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(228, 228, 231);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(161, 161, 170);
  doc.text(`${COMPANY.name} — SIRET: ${COMPANY.email}`, margin, footerY);

  return doc.output("blob");
}

export async function downloadInvoicePdf(invoice: InvoiceData) {
  const blob = await generateInvoicePdf(invoice);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `facture-${invoice.reference}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
