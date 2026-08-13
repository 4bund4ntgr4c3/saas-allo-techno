import jsPDF from "jspdf";
import QRCode from "qrcode";
import type { EquipmentItem } from "./org.functions";

export async function generateQrLabelSheetPdf(
  items: EquipmentItem[],
  orgName: string = "Allô Techno B2B",
): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;

  // 3 columns x 8 rows = 24 labels per A4 page
  const cols = 3;
  const rows = 8;
  const labelsPerPage = cols * rows;

  const labelWidth = 60; // mm
  const labelHeight = 32; // mm
  const marginX = (pageWidth - cols * labelWidth) / (cols + 1); // ~ 7.5 mm
  const marginY = (pageHeight - rows * labelHeight) / (rows + 1); // ~ 6.5 mm

  for (let i = 0; i < items.length; i++) {
    if (i > 0 && i % labelsPerPage === 0) {
      doc.addPage();
    }

    const pageIdx = i % labelsPerPage;
    const col = pageIdx % cols;
    const row = Math.floor(pageIdx / cols);

    const x = marginX + col * (labelWidth + marginX);
    const y = marginY + row * (labelHeight + marginY);

    const item = items[i]!;

    // Outer Label Border (Precision Engineering Style)
    doc.setLineWidth(0.3);
    doc.setDrawColor(20, 20, 20); // Dark border
    doc.rect(x, y, labelWidth, labelHeight);

    // Top Header Bar
    doc.setFillColor(20, 20, 20);
    doc.rect(x, y, labelWidth, 5.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(orgName.toUpperCase().slice(0, 28), x + 2, y + 3.8);

    // Asset Tag & Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(item.asset_tag ?? `ID: ${item.id.slice(0, 10)}`, x + 2, y + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(60, 60, 60);
    const truncatedName = item.name.length > 24 ? item.name.slice(0, 22) + "..." : item.name;
    doc.text(truncatedName, x + 2, y + 14);

    // Category / Brand
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    const brandModel = [item.brand, item.model].filter(Boolean).join(" ");
    if (brandModel) {
      doc.text(brandModel.slice(0, 26), x + 2, y + 18);
    }

    // Emergency Hotline
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.5);
    doc.setTextColor(180, 40, 40); // Accent red
    doc.text("SCAN QR POUR PANNE / TICKET ATELIER", x + 2, y + 27);

    // Generate & Draw QR Code Image (18x18 mm)
    try {
      const qrDataUrl = await QRCode.toDataURL(
        `https://allotechno.africa/app/scan?qr=${encodeURIComponent(item.qr_id || item.id)}`,
        { margin: 0, width: 200 },
      );
      doc.addImage(qrDataUrl, "PNG", x + labelWidth - 21, y + 7.5, 18, 18);
    } catch {
      // Fallback text if QR generation fails
      doc.setFontSize(6);
      doc.text("QR ERR", x + labelWidth - 15, y + 15);
    }
  }

  doc.save(`etiquettes-parc-qr-${new Date().toISOString().slice(0, 10)}.pdf`);
}
