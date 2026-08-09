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
  return QRCode.toDataURL(url, { width: 80, margin: 1, color: { dark: "#18181b" } });
}

export async function generateMonthlyReportPdf(data: MonthlyReportData): Promise<Blob> {
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
  doc.text("Rapport mensuel", margin, 25);
  doc.text(`${data.month} ${data.year}`, margin, 30);

  const qrUrl = await generateQrCode(`https://allotechno.africa/admin/stats`);
  doc.addImage(qrUrl, "PNG", pageWidth - margin - 20, 5, 20, 20);

  y = 45;

  // KPIs
  doc.setTextColor(24, 24, 27);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Indicateurs clés", margin, y);
  y += 10;

  const kpis = [
    { label: "Réservations", value: String(data.totalReservations) },
    { label: "Réparations terminées", value: String(data.completedRepairs) },
    { label: "Chiffre d'affaires", value: formatFcfa(data.totalRevenue) },
    { label: "Temps moyen", value: `${data.averageRepairTime} min` },
  ];

  const colWidth = contentWidth / kpis.length;
  for (let i = 0; i < kpis.length; i++) {
    const kpi = kpis[i];
    if (!kpi) continue;
    const x = margin + i * colWidth;
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(x, y - 5, colWidth - 4, 20, 3, 3, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(113, 113, 122);
    doc.text(kpi.label, x + 4, y);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(24, 24, 27);
    doc.text(kpi.value, x + 4, y + 10);
  }
  y += 30;

  // Top brands
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Top marques", margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(249, 250, 251);
  doc.rect(margin, y - 4, contentWidth, 7, "F");
  doc.text("Marque", margin + 2, y);
  doc.text("Réparations", margin + contentWidth * 0.5, y);
  doc.text("CA", margin + contentWidth * 0.75, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  for (const brand of data.topBrands.slice(0, 5)) {
    doc.text(brand.brand, margin + 2, y);
    doc.text(String(brand.count), margin + contentWidth * 0.5, y);
    doc.text(formatFcfa(brand.revenue), margin + contentWidth * 0.75, y);
    y += 5;
  }
  y += 8;

  // Status breakdown
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Répartition par statut", margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  for (const [status, count] of Object.entries(data.statusBreakdown)) {
    doc.text(`${status}: ${count}`, margin + 2, y);
    y += 5;
  }
  y += 8;

  // Payment methods
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Méthodes de paiement", margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  for (const [method, count] of Object.entries(data.paymentMethods)) {
    doc.text(`${method}: ${count}`, margin + 2, y);
    y += 5;
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(228, 228, 231);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(161, 161, 170);
  doc.text(
    `${COMPANY.name} — Rapport généré le ${new Date().toLocaleDateString("fr-BJ")}`,
    margin,
    footerY,
  );

  return doc.output("blob");
}

export async function downloadMonthlyReportPdf(data: MonthlyReportData) {
  const blob = await generateMonthlyReportPdf(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rapport-${data.year}-${data.month.toLowerCase()}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
