import jsPDF from "jspdf";
import QRCode from "qrcode";

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

  // Background Header Bar (Technical Dark)
  doc.setFillColor(15, 23, 42); // Slate-900 / Dark
  doc.rect(0, 0, 210, 38, "F");

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("ALLÔ TECHNO — CERTIFICAT DE GARANTIE", 14, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Service de Réparation & Maintenance High-Tech — Abomey-Calavi, Bénin", 14, 26);
  doc.text("Support Client: +229 01 97 00 00 00 | contact@allotechno.africa", 14, 32);

  // Reference Banner
  doc.setFillColor(241, 245, 249); // Slate-100
  doc.rect(14, 46, 182, 16, "F");
  doc.setLineWidth(0.5);
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, 46, 182, 16, "S");

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`RÉFÉRENCE GARANTIE : ${data.reference}`, 20, 56);

  // Information Section
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("1. INFORMATIONS DU CLIENT & APPAREIL", 14, 74);
  doc.setLineWidth(0.3);
  doc.setDrawColor(15, 23, 42);
  doc.line(14, 76, 196, 76);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Nom du Client : ${data.clientName}`, 14, 84);
  doc.text(`Téléphone : ${data.phone}`, 14, 91);
  doc.text(`Modèle Appareil : ${data.deviceModel}`, 14, 98);
  if (data.serialOrImei) {
    doc.text(`N° Série / IMEI : ${data.serialOrImei}`, 14, 105);
  }

  // Guarantee Coverage Section
  const startY = data.serialOrImei ? 116 : 109;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("2. COUVERTURE & DURÉE DE GARANTIE", 14, startY);
  doc.line(14, startY + 2, 196, startY + 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Intervention Réalisée : ${data.repairType}`, 14, startY + 10);
  doc.text(`Durée de Garantie : ${data.guaranteeMonths} mois`, 14, startY + 17);
  doc.text(`Date de Début : ${data.startDate}`, 14, startY + 24);
  doc.text(`Date d'Échéance : ${data.endDate}`, 14, startY + 31);
  if (data.notes) {
    doc.text(`Notes d'Atelier : ${data.notes}`, 14, startY + 38);
  }

  // Generate QR Code for digital verification
  const qrDataUrl = await QRCode.toDataURL(
    `https://allotechno.africa/suivi?ref=${data.reference}`,
    {
      width: 120,
      margin: 1,
    },
  );
  doc.addImage(qrDataUrl, "PNG", 148, startY + 5, 38, 38);
  doc.setFontSize(8);
  doc.text("Scan pour vérification", 150, startY + 47);

  // Terms and Conditions Section
  const termsY = startY + 54;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("3. CONDITIONS D'APPLICATION DE LA GARANTIE", 14, termsY);
  doc.line(14, termsY + 2, 196, termsY + 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const terms = [
    "• La garantie couvre exclusivement le composant réparé ou remplacé et les défauts de main-d'œuvre associés.",
    "• Sont exclus de la garantie : les dommages liquides (oxydation), les chocs physiques, la casse d'écran ultérieure et les interventions d'un tiers.",
    "• En cas de réclamation validée, Allô Techno procédera au remplacement gratuit de la pièce défectueuse sous 48h.",
  ];
  let tY = termsY + 8;
  terms.forEach((t) => {
    doc.text(t, 14, tY);
    tY += 5.5;
  });

  // Footer Signature Lines
  doc.setLineWidth(0.2);
  doc.setDrawColor(203, 213, 225);
  doc.line(14, 255, 80, 255);
  doc.line(130, 255, 196, 255);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Signature & Cachet Atelier Allô Techno", 14, 260);
  doc.text("Signature du Client", 130, 260);

  return doc.output("blob");
}
