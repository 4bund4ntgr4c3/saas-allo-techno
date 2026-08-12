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
  return QRCode.toDataURL(dataUrl, { width: 120, margin: 1, color: { dark: "#0f172a" } });
}

export async function generateDevisPdf(devis: DevisData): Promise<Blob> {
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
  doc.text("EXPERT RÉPARATION & MAINTENANCE HIGH-TECH", margin, 23);
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
  doc.text("DEVIS D'INTERVENTION", margin, y);

  // Status Badge
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(pageWidth - margin - 38, y - 6, 38, 8, "FD");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("ESTIMATION OFFICIELLE", pageWidth - margin - 19, y - 0.5, { align: "center" });

  y += 7;

  // Meta Box (Gray #f8fafc)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 18, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`N° RÉFÉRENCE :`, margin + 4, y + 6);
  doc.setFont("courier", "bold");
  doc.text(devis.reference, margin + 32, y + 6);

  doc.setFont("helvetica", "bold");
  doc.text(`DATE D'ÉMISSION :`, margin + 4, y + 13);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleDateString("fr-FR"), margin + 37, y + 13);

  doc.setFont("helvetica", "bold");
  doc.text(`VALIDITÉ DEVIS :`, margin + 100, y + 6);
  doc.setFont("helvetica", "normal");
  doc.text(devis.validUntil, margin + 132, y + 6);

  doc.setFont("helvetica", "bold");
  doc.text(`GARANTIE INCLUSE :`, margin + 100, y + 13);
  doc.setFont("helvetica", "normal");
  doc.text("6 mois pièces & main-d'œuvre", margin + 137, y + 13);

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
  doc.text(devis.customerName, margin + 20, y + 13);

  doc.setFont("helvetica", "bold");
  doc.text(`Téléphone :`, margin + 4, y + 19);
  doc.setFont("helvetica", "normal");
  doc.text(devis.phone, margin + 24, y + 19);

  doc.setFont("helvetica", "bold");
  doc.text(`Email :`, margin + 4, y + 25);
  doc.setFont("helvetica", "normal");
  doc.text(devis.email || "Non renseigné", margin + 20, y + 25);

  // Device Box
  doc.rect(margin + colWidth + 6, y, colWidth, 32, "D");
  doc.setFillColor(241, 245, 249);
  doc.rect(margin + colWidth + 6, y, colWidth, 7, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("APPAREIL & PANNE", margin + colWidth + 10, y + 5);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text(`Marque / Modèle :`, margin + colWidth + 10, y + 13);
  doc.setFont("helvetica", "normal");
  doc.text(`${devis.brand} ${devis.device}`, margin + colWidth + 42, y + 13);

  doc.setFont("helvetica", "bold");
  doc.text(`Symptôme(s) :`, margin + colWidth + 10, y + 19);
  doc.setFont("helvetica", "normal");
  doc.text(devis.faults.join(", ") || "Inspection complète", margin + colWidth + 35, y + 19);

  doc.setFont("helvetica", "bold");
  doc.text(`Diagnostic Atelier :`, margin + colWidth + 10, y + 25);
  doc.setFont("helvetica", "normal");
  doc.text(devis.diagnosis || "Test matériel & banc d'essai", margin + colWidth + 42, y + 25);

  y += 38;

  // 4. Prestations & Pricing Table
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DÉTAIL DES PRESTATIONS & PIÈCES DÉTACHÉES", margin, y);
  y += 4;

  // Table Header
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 8, "F");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Désignation Prestation / Composant", margin + 4, y + 5.5);
  doc.text("Qté", margin + contentWidth * 0.62, y + 5.5, { align: "center" });
  doc.text("Prix Unit. (FCFA)", margin + contentWidth * 0.78, y + 5.5, { align: "right" });
  doc.text("Total (FCFA)", margin + contentWidth - 4, y + 5.5, { align: "right" });

  y += 8;

  // Table Body Rows
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);

  let totalCalculated = 0;
  devis.items.forEach((item, index) => {
    const itemTotal = item.quantity * item.unitPrice;
    totalCalculated += itemTotal;

    // Alternating Row Fill
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

  const finalAmount = devis.estimatedCost || totalCalculated;

  // Total Summary Block
  y += 4;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin + contentWidth * 0.5, y, contentWidth * 0.5, 12, "FD");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("MONTANT TOTAL ESTIMÉ :", margin + contentWidth * 0.52, y + 7.5);
  doc.setFontSize(13);
  doc.setTextColor(249, 115, 22);
  doc.text(formatFcfa(finalAmount), margin + contentWidth - 4, y + 7.5, { align: "right" });

  y += 20;

  // 5. Notes & Terms
  if (devis.notes) {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("REMARQUES SPECIFIQUES :", margin, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    const noteLines = doc.splitTextToSize(devis.notes, contentWidth);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 4 + 4;
  }

  // 6. Signatures & QR Code Section (Bottom)
  const footerY = pageHeight - 34;

  doc.setDrawColor(203, 213, 225);
  doc.line(margin, footerY - 8, margin + contentWidth, footerY - 8);

  // QR Code Image
  const qrUrl = await generateQrCode(`https://allotechno.africa/devis?ref=${devis.reference}`);
  doc.addImage(qrUrl, "PNG", margin, footerY - 6, 22, 22);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("VÉRIFICATION EN LIGNE", margin + 25, footerY - 2);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Scannez ce QR Code pour consulter ou accepter votre devis en ligne.", margin + 25, footerY + 3);
  doc.text("Ce devis est une estimation sous réserve de démontage d'atelier.", margin + 25, footerY + 8);

  // Signature Box
  doc.setDrawColor(203, 213, 225);
  doc.rect(pageWidth - margin - 60, footerY - 6, 60, 20, "D");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("BON POUR ACCORD (CLIENT)", pageWidth - margin - 56, footerY - 2);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("Date & Signature :", pageWidth - margin - 56, footerY + 12);

  return doc.output("blob");
}

export async function downloadDevisPdf(devis: DevisData) {
  const blob = await generateDevisPdf(devis);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `devis-allotechno-${devis.reference}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
