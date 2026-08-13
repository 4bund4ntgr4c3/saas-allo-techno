import jsPDF from "jspdf";

export type PvRestitutionInput = {
  pvNumber: string;
  orgName: string;
  clientContactName: string;
  equipmentName: string;
  serialNumber: string;
  interventionSummary: string;
  warrantyPeriodMonths: number;
  restitutionDate: string;
  technicianName: string;
};

export function generatePvRestitutionPdf(input: PvRestitutionInput): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pw = 210;

  // Header Banner
  doc.setFillColor(20, 20, 20);
  doc.rect(0, 0, pw, 28, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("ALLÔ TECHNO — PROCÈS-VERBAL DE RESTITUTION", 14, 15);

  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text("CERTIFICAT DE GARANTIE & LIVRAISON DE MATÉRIEL RÉPARÉ", 14, 22);

  // PV Ref & Date
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`RÉFÉRENCE PV : ${input.pvNumber}`, 14, 38);
  doc.text(`DATE DE RESTITUTION : ${input.restitutionDate}`, pw - 75, 38);

  // Horizontal divider
  doc.setLineWidth(0.5);
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 42, pw - 14, 42);

  // Section 1: Organisation & Client
  doc.setFillColor(245, 245, 245);
  doc.rect(14, 46, pw - 28, 22, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("ENTREPRISE BÉNÉFICIAIRE :", 18, 53);
  doc.setFont("helvetica", "normal");
  doc.text(input.orgName, 68, 53);

  doc.setFont("helvetica", "bold");
  doc.text("RESPONSABLE / DESTINATAIRE :", 18, 61);
  doc.setFont("helvetica", "normal");
  doc.text(input.clientContactName, 68, 61);

  // Section 2: Matériel & Travaux Effectués
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("1. DÉSIGNATION DU MATÉRIEL & TRAVAUX EFFECTUÉS", 14, 76);

  doc.setFontSize(9);
  doc.text("Désignation Équipement :", 14, 84);
  doc.setFont("helvetica", "normal");
  doc.text(input.equipmentName, 60, 84);

  doc.setFont("helvetica", "bold");
  doc.text("N° de Série / IMEI :", 14, 91);
  doc.setFont("helvetica", "normal");
  doc.text(input.serialNumber || "Non spécifié", 60, 91);

  doc.setFont("helvetica", "bold");
  doc.text("Synthèse des Réparations :", 14, 98);
  doc.setFont("helvetica", "normal");
  const splitText = doc.splitTextToSize(input.interventionSummary, pw - 75);
  doc.text(splitText, 60, 98);

  // Section 3: Certificat de Garantie Allô Techno
  const guaranteeY = 125;
  doc.setFillColor(235, 248, 240); // Soft emerald green
  doc.rect(14, guaranteeY, pw - 28, 28, "F");
  doc.setDrawColor(40, 160, 90);
  doc.setLineWidth(0.4);
  doc.rect(14, guaranteeY, pw - 28, 28, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20, 100, 50);
  doc.text("🛡️ COUVERTURE DE GARANTIE APRES-VENTE", 18, guaranteeY + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 40);
  doc.text(
    `Cet équipement bénéficie d'une garantie pièces et main d'œuvre de ${input.warrantyPeriodMonths} mois à compter de ce jour.`,
    18,
    guaranteeY + 15
  );
  doc.text(
    "Toute réintervention sous garantie sera prise en charge sous 2h conformément aux engagements SLA.",
    18,
    guaranteeY + 21
  );

  // Signatures Area
  const sigY = 175;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("POUR L'ATELIER ALLÔ TECHNO", 14, sigY);
  doc.text("POUR L'ENTREPRISE (BON POUR RECEPT)", pw - 85, sigY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Technicien : ${input.technicianName}`, 14, sigY + 6);
  doc.text("Signature & Cachet :", 14, sigY + 12);

  doc.text(`Nom : ${input.clientContactName}`, pw - 85, sigY + 6);
  doc.text("Signature & Cachet :", pw - 85, sigY + 12);

  // Signature Boxes
  doc.setDrawColor(180, 180, 180);
  doc.rect(14, sigY + 16, 75, 30);
  doc.rect(pw - 89, sigY + 16, 75, 30);

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.text(
    "Allô Techno Africa — Services Informatiques B2B — Abomey-Calavi & Cotonou, Bénin — www.allotechno.africa",
    14,
    285
  );

  doc.save(`PV-Restitution-${input.pvNumber}.pdf`);
}
