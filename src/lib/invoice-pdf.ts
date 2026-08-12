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
  return QRCode.toDataURL(dataUrl, { width: 120, margin: 1, color: { dark: "#0f172a" } });
}

export async function generateInvoicePdf(invoice: InvoiceData): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  // 1. Premium Brand Header (Dark Slate #0f172a)
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 36, "F");

  // Orange Technical Accent Line (#f97316)
  doc.setFillColor(249, 115, 22);
  doc.rect(0, 36, pageWidth, 2.5, "F");

  // Brand Name & Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(COMPANY.name.toUpperCase(), margin, 16);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text("FACTURE OFFICIELLE DE RÉPARATION & SERVICE", margin, 23);
  doc.text(`${COMPANY.address} · Abomey-Calavi, Bénin`, margin, 29);

  // Company Contact (Right aligned)
  doc.text(`Tél: ${COMPANY.phone}`, pageWidth - margin, 16, { align: "right" });
  doc.text(`Email: ${COMPANY.email}`, pageWidth - margin, 22, { align: "right" });
  doc.text(`Web: allotechno.africa`, pageWidth - margin, 28, { align: "right" });

  y = 46;

  // 2. Title & Document Meta Card
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURE ACQUITTÉE", margin, y);

  // Status Badge
  const isPaid = invoice.paidAmount >= invoice.totalAmount;
  doc.setFillColor(isPaid ? 220 : 254, isPaid ? 252 : 243, isPaid ? 231 : 199);
  doc.setDrawColor(isPaid ? 134 : 247, isPaid ? 239 : 178, isPaid ? 172 : 107);
  doc.rect(pageWidth - margin - 40, y - 6, 40, 8, "FD");
  doc.setFontSize(8.5);
  doc.setTextColor(isPaid ? 22 : 180, isPaid ? 101 : 83, isPaid ? 52 : 9);
  doc.setFont("helvetica", "bold");
  doc.text(isPaid ? "PAYÉ EN TOTALITÉ" : "PAIEMENT PARTIEL", pageWidth - margin - 20, y - 0.5, { align: "center" });

  y += 7;

  // Meta Box (Gray #f8fafc)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 18, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`N° FACTURE :`, margin + 4, y + 6);
  doc.setFont("courier", "bold");
  doc.text(invoice.reference, margin + 28, y + 6);

  doc.setFont("helvetica", "bold");
  doc.text(`DATE RÈGLEMENT :`, margin + 4, y + 13);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.completedAt || new Date().toLocaleDateString("fr-FR"), margin + 37, y + 13);

  doc.setFont("helvetica", "bold");
  doc.text(`MODE PAIEMENT :`, margin + 100, y + 6);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.paymentMethod ? invoice.paymentMethod.toUpperCase() : "ESPECES / MOMO", margin + 132, y + 6);

  doc.setFont("helvetica", "bold");
  doc.text(`GARANTIE INCLUSE :`, margin + 100, y + 13);
  doc.setFont("helvetica", "normal");
  doc.text(`${invoice.warrantyMonths ?? 6} mois pièces & MO`, margin + 137, y + 13);

  y += 24;

  // 3. Customer & Device Information Grid
  const colWidth = (contentWidth - 6) / 2;

  // Customer Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, colWidth, 32, "D");
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, colWidth, 7, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("CLIENT", margin + 4, y + 5);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text(`Nom :`, margin + 4, y + 13);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.customerName, margin + 18, y + 13);

  doc.setFont("helvetica", "bold");
  doc.text(`Téléphone :`, margin + 4, y + 19);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.phone, margin + 24, y + 19);

  doc.setFont("helvetica", "bold");
  doc.text(`Email :`, margin + 4, y + 25);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.email || "Non renseigné", margin + 18, y + 25);

  // Device Box
  doc.rect(margin + colWidth + 6, y, colWidth, 32, "D");
  doc.setFillColor(241, 245, 249);
  doc.rect(margin + colWidth + 6, y, colWidth, 7, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("APPAREIL CONCERNÉ", margin + colWidth + 10, y + 5);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text(`Marque / Modèle :`, margin + colWidth + 10, y + 13);
  doc.setFont("helvetica", "normal");
  doc.text(`${invoice.brand} ${invoice.device}`, margin + colWidth + 42, y + 13);

  doc.setFont("helvetica", "bold");
  doc.text(`Panne(s) Réparée(s) :`, margin + colWidth + 10, y + 19);
  doc.setFont("helvetica", "normal");
  doc.text((invoice.faults || []).join(", ") || "Intervention technique", margin + colWidth + 45, y + 19);

  doc.setFont("helvetica", "bold");
  doc.text(`Description :`, margin + colWidth + 10, y + 25);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.repairDescription || "Remplacement composant & contrôle qualité", margin + colWidth + 32, y + 25);

  y += 38;

  // 4. Prestations & Pricing Table
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DÉTAIL DE LA FACTURATION", margin, y);
  y += 4;

  // Table Header
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 8, "F");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Désignation Produit / Service", margin + 4, y + 5.5);
  doc.text("Qté", margin + contentWidth * 0.62, y + 5.5, { align: "center" });
  doc.text("Prix Unit. (FCFA)", margin + contentWidth * 0.78, y + 5.5, { align: "right" });
  doc.text("Total (FCFA)", margin + contentWidth - 4, y + 5.5, { align: "right" });

  y += 8;

  // Table Body Rows
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);

  let calculatedTotal = 0;
  (invoice.items || []).forEach((item, index) => {
    const itemTotal = item.quantity * item.unitPrice;
    calculatedTotal += itemTotal;

    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 7, "F");
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 7, margin + contentWidth, y + 7);

    doc.text(item.label, margin + 4, y + 5);
    doc.text(String(item.quantity), margin + contentWidth * 0.62, y + 5, { align: "center" });
    doc.text(formatFcfa(item.unitPrice), margin + contentWidth * 0.78, y + 5, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(formatFcfa(itemTotal), margin + contentWidth - 4, y + 5, { align: "right" });
    doc.setFont("helvetica", "normal");

    y += 7;
  });

  const finalTotal = invoice.totalAmount || calculatedTotal;

  // Financial Breakdown Block
  y += 4;
  const breakW = contentWidth * 0.45;
  const breakX = margin + contentWidth - breakW;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(breakX, y, breakW, 20, "FD");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text("Total HT :", breakX + 4, y + 5);
  doc.text(formatFcfa(Math.round(finalTotal / 1.18)), breakX + breakW - 4, y + 5, { align: "right" });

  doc.text("TVA (18%) :", breakX + 4, y + 10);
  doc.text(formatFcfa(Math.round(finalTotal - finalTotal / 1.18)), breakX + breakW - 4, y + 10, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text("TOTAL TTC :", breakX + 4, y + 16);
  doc.setTextColor(249, 115, 22);
  doc.text(formatFcfa(finalTotal), breakX + breakW - 4, y + 16, { align: "right" });

  y += 28;

  // 5. Signatures & QR Code Section (Bottom)
  const footerY = pageHeight - 34;

  doc.setDrawColor(203, 213, 225);
  doc.line(margin, footerY - 8, margin + contentWidth, footerY - 8);

  // QR Code Image
  const qrUrl = await generateQrCode(`https://allotechno.africa/suivi?ref=${invoice.reference}`);
  doc.addImage(qrUrl, "PNG", margin, footerY - 6, 22, 22);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("AUTHENTICITÉ DU DOCUMENT", margin + 25, footerY - 2);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Scannez ce QR Code pour vérifier l'authenticité de cette facture.", margin + 25, footerY + 3);
  doc.text("Paiements acceptés : Mobile Money (MTN/Moov), Carte Bancaire, Espèces.", margin + 25, footerY + 8);

  // Stamp Box
  doc.setDrawColor(203, 213, 225);
  doc.rect(pageWidth - margin - 55, footerY - 6, 55, 20, "D");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("CACHET / SIGNATURE ATELIER", pageWidth - margin - 51, footerY - 2);

  return doc.output("blob");
}

export async function downloadInvoicePdf(invoice: InvoiceData) {
  const blob = await generateInvoicePdf(invoice);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `facture-allotechno-${invoice.reference}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
