import jsPDF from "jspdf";
import QRCode from "qrcode";
import { COMPANY } from "@/data/catalog/company";

export type RepairGuaranteeData = {
  reference: string;
  clientName: string;
  phone: string;
  deviceModel: string;
  serialOrImei?: string;
  repairType: string;
  guaranteeMonths: number;
  startDate: string;
  endDate: string;
  notes?: string;
};

export async function generateGuaranteePDF(data: RepairGuaranteeData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
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
  doc.text("CERTIFICAT DE GARANTIE DE RÉPARATION OFFICIEL", margin, 23);
  doc.text(`${COMPANY.address} · Abomey-Calavi, Bénin`, margin, 29);

  // Company Contact (Right aligned)
  doc.text(`Tél: ${COMPANY.phone}`, pageWidth - margin, 16, { align: "right" });
  doc.text(`Email: ${COMPANY.email}`, pageWidth - margin, 22, { align: "right" });
  doc.text(`Web: allotechno.africa`, pageWidth - margin, 28, { align: "right" });

  y = 46;

  // 2. Title & Document Meta Card
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("CERTIFICAT DE GARANTIE ATELIER", margin, y);

  // Status Badge
  doc.setFillColor(220, 252, 231);
  doc.setDrawColor(134, 239, 172);
  doc.rect(pageWidth - margin - 42, y - 6, 42, 8, "FD");
  doc.setFontSize(8.5);
  doc.setTextColor(22, 101, 52);
  doc.setFont("helvetica", "bold");
  doc.text(`GARANTIE ${data.guaranteeMonths} MOIS`, pageWidth - margin - 21, y - 0.5, { align: "center" });

  y += 7;

  // Meta Box (Gray #f8fafc)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 18, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`CODE DOSSIER :`, margin + 4, y + 6);
  doc.setFont("courier", "bold");
  doc.text(data.reference, margin + 30, y + 6);

  doc.setFont("helvetica", "bold");
  doc.text(`DATE DÉBUT :`, margin + 4, y + 13);
  doc.setFont("helvetica", "normal");
  doc.text(data.startDate, margin + 28, y + 13);

  doc.setFont("helvetica", "bold");
  doc.text(`DATE EXPIRATION :`, margin + 100, y + 6);
  doc.setFont("helvetica", "normal");
  doc.text(data.endDate, margin + 135, y + 6);

  doc.setFont("helvetica", "bold");
  doc.text(`COUVERTURE :`, margin + 100, y + 13);
  doc.setFont("helvetica", "normal");
  doc.text("Pièces & Main-d'œuvre", margin + 126, y + 13);

  y += 24;

  // 3. Information Grid (Client & Appareil)
  const colWidth = (contentWidth - 6) / 2;

  // Client Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, colWidth, 34, "D");
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, colWidth, 7, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("1. TITULAIRE DE LA GARANTIE", margin + 4, y + 5);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text(`Nom Client :`, margin + 4, y + 13);
  doc.setFont("helvetica", "normal");
  doc.text(data.clientName, margin + 25, y + 13);

  doc.setFont("helvetica", "bold");
  doc.text(`Téléphone :`, margin + 4, y + 20);
  doc.setFont("helvetica", "normal");
  doc.text(data.phone, margin + 24, y + 20);

  doc.setFont("helvetica", "bold");
  doc.text(`Lieu Dépôt :`, margin + 4, y + 27);
  doc.setFont("helvetica", "normal");
  doc.text("Atelier Allô Techno (Abomey-Calavi)", margin + 24, y + 27);

  // Appareil Box
  doc.rect(margin + colWidth + 6, y, colWidth, 34, "D");
  doc.setFillColor(241, 245, 249);
  doc.rect(margin + colWidth + 6, y, colWidth, 7, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("2. ÉQUIPEMENT COUVERT", margin + colWidth + 10, y + 5);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text(`Modèle :`, margin + colWidth + 10, y + 13);
  doc.setFont("helvetica", "normal");
  doc.text(data.deviceModel, margin + colWidth + 26, y + 13);

  doc.setFont("helvetica", "bold");
  doc.text(`N° Série / IMEI :`, margin + colWidth + 10, y + 20);
  doc.setFont("helvetica", "normal");
  doc.text(data.serialOrImei || "Enregistré au dossier", margin + colWidth + 37, y + 20);

  doc.setFont("helvetica", "bold");
  doc.text(`Intervention :`, margin + colWidth + 10, y + 27);
  doc.setFont("helvetica", "normal");
  doc.text(data.repairType, margin + colWidth + 32, y + 27);

  y += 40;

  // 4. Conditions d'Application Card
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("3. CONDITIONS GENERALES ET EXCLUSIONS", margin, y);
  y += 4;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 38, "FD");

  doc.setFontSize(8.2);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  const termsLines = [
    "• La présente garantie couvre exclusivement la pièce remplacée ainsi que les défauts de montage liés à l'intervention.",
    "• Exclusions formelles : les dommages causés par choc physique, fissure ultérieure, contact avec tout liquide (oxydation),",
    "  ou toute ouverture / tentative de réparation effectuée par un tiers ou par le client sans accord d'Allô Techno.",
    "• En cas de panne couverte validée par nos techniciens, l'échange du composant est effectué sans frais supplémentaires.",
    "• Ce certificat doit être présenté en boutique avec l'appareil pour tout exercice du droit de garantie.",
  ];

  let lineY = y + 6;
  termsLines.forEach((l) => {
    doc.text(l, margin + 4, lineY);
    lineY += 6.5;
  });

  y += 44;

  // 5. Verification QR Code & Signature Section
  const footerY = pageHeight - 34;

  doc.setDrawColor(203, 213, 225);
  doc.line(margin, footerY - 8, margin + contentWidth, footerY - 8);

  // QR Code Image
  const qrUrl = await QRCode.toDataURL(
    `https://allotechno.africa/suivi?ref=${data.reference}`,
    { width: 120, margin: 1, color: { dark: "#0f172a" } }
  );
  doc.addImage(qrUrl, "PNG", margin, footerY - 6, 22, 22);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("AUTHENTIFICATION NUMÉRIQUE", margin + 25, footerY - 2);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Scannez ce QR Code pour vérifier l'authenticité du certificat de garantie.", margin + 25, footerY + 3);
  doc.text("Support technique direct : contact@allotechno.africa | +229 01 97 00 00 00", margin + 25, footerY + 8);

  // Signature Box
  doc.setDrawColor(203, 213, 225);
  doc.rect(pageWidth - margin - 55, footerY - 6, 55, 20, "D");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("CACHE / SIGNATURE ATELIER", pageWidth - margin - 51, footerY - 2);

  return doc.output("blob");
}

