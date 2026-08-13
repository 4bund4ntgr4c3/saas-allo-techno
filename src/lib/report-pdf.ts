import jsPDF from "jspdf";
import QRCode from "qrcode";
import { COMPANY, formatFcfa } from "@/data/catalog/company";

export interface MonthlyReportData {
  month: string;
  year: number;
  totalReservations: number;
  completedRepairs: number;
  totalRevenue: number;
  topBrands: { brand: string; count: number; revenue: number }[];
  statusBreakdown: Record<string, number>;
  paymentMethods: Record<string, number>;
  averageRepairTime: number;
  customerSatisfaction: number;
}

async function generateQrCode(url: string): Promise<string> {
  return QRCode.toDataURL(url, { width: 120, margin: 1, color: { dark: "#0f172a" } });
}

export async function generateMonthlyReportPdf(data: MonthlyReportData): Promise<Blob> {
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
  doc.text("RAPPORT D'ACTIVITÉ MENSUEL & ANALYTICS", margin, 23);
  doc.text(`${COMPANY.address} · Abomey-Calavi, Bénin`, margin, 29);

  // Company Contact (Right aligned)
  doc.text(`Tél: ${COMPANY.phone}`, pageWidth - margin, 16, { align: "right" });
  doc.text(`Email: ${COMPANY.email}`, pageWidth - margin, 22, { align: "right" });
  doc.text(`Periode: ${data.month.toUpperCase()} ${data.year}`, pageWidth - margin, 28, {
    align: "right",
  });

  y = 46;

  // 2. Title Section
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`RAPPORT D'ACTIVITÉ — ${data.month.toUpperCase()} ${data.year}`, margin, y);
  y += 8;

  // 3. KPIs Cards Grid
  const kpis = [
    { label: "RÉSERVATIONS", value: String(data.totalReservations) },
    { label: "RÉPARATIONS EFFECTUÉES", value: String(data.completedRepairs) },
    { label: "CHIFFRE D'AFFAIRES", value: formatFcfa(data.totalRevenue) },
    { label: "DURÉE MOYENNE", value: `${data.averageRepairTime} min` },
  ];

  const colWidth = (contentWidth - 9) / kpis.length;
  for (let i = 0; i < kpis.length; i++) {
    const kpi = kpis[i];
    if (!kpi) continue;
    const x = margin + i * (colWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(x, y, colWidth, 20, "FD");

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 4, y + 6);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.value, x + 4, y + 15);
  }
  y += 28;

  // 4. Top Brands Table
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("TOP MARQUES INTERVENUES", margin, y);
  y += 4;

  // Table Header
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 7, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Marque Constructeur", margin + 4, y + 5);
  doc.text("Nombre d'Interventions", margin + contentWidth * 0.55, y + 5, { align: "center" });
  doc.text("Revenu Généré (FCFA)", margin + contentWidth - 4, y + 5, { align: "right" });
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  data.topBrands.slice(0, 5).forEach((brand, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 6.5, "F");
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 6.5, margin + contentWidth, y + 6.5);

    doc.text(brand.brand, margin + 4, y + 4.5);
    doc.text(String(brand.count), margin + contentWidth * 0.55, y + 4.5, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text(formatFcfa(brand.revenue), margin + contentWidth - 4, y + 4.5, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 6.5;
  });

  y += 10;

  // 5. Footer & Authenticity Stamp
  const footerY = pageHeight - 34;

  doc.setDrawColor(203, 213, 225);
  doc.line(margin, footerY - 8, margin + contentWidth, footerY - 8);

  const qrUrl = await generateQrCode(`https://allotechno.africa/admin/stats`);
  doc.addImage(qrUrl, "PNG", margin, footerY - 6, 22, 22);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("CONTRÔLE ANALYTICS INTERNE", margin + 25, footerY - 2);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Rapport mensuel généré automatiquement le ${new Date().toLocaleDateString("fr-FR")}.`,
    margin + 25,
    footerY + 3,
  );
  doc.text(
    "Données certifiées conformes aux journaux de caisse POS et réservations en ligne.",
    margin + 25,
    footerY + 8,
  );

  // Stamp Box
  doc.setDrawColor(203, 213, 225);
  doc.rect(pageWidth - margin - 55, footerY - 6, 55, 20, "D");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("VALIDE PAR DIRECTION ATELIER", pageWidth - margin - 51, footerY - 2);

  return doc.output("blob");
}

export async function downloadMonthlyReportPdf(data: MonthlyReportData) {
  const blob = await generateMonthlyReportPdf(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rapport-allotechno-${data.year}-${data.month.toLowerCase()}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
