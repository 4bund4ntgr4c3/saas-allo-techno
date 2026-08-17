// ============================================================================
// Allô Techno — Bilan RSE & Rapport d'Impact Environnemental ESG Annuel
// Document officiel certifié pour comités de direction et audits RSE.
// ============================================================================

import jsPDF from "jspdf";
import QRCode from "qrcode";
import { COMPANY } from "@/data/catalog/company";

export interface RseReportData {
  reportNumber: string;
  clientCompanyName: string;
  periodYear: string;
  repairedDevicesCount: number;
  extendedLifespanYearsAverage: number;
  eWasteAvoidedKg: number;
  co2SavedTons: number;
  waterSavedLiters: number;
  circularityScorePercent: number;
  issuedDate: string;
}

export async function downloadRseAnnualReportPdf(data: RseReportData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const verifyUrl = `https://allotechno.africa/fr/entreprises?rse=${data.reportNumber}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 150, margin: 1 }).catch(() => "");

  // ─── En-tête RSE Éco-Conception ───
  doc.setFillColor(6, 78, 59); // Emerald-900
  doc.rect(0, 0, 210, 42, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text("BILAN D'IMPACT ENVIRONNEMENTAL & RSE", 15, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(209, 250, 229);
  doc.text("Attestation d'Économie Circulaire & Réduction de l'Empreinte Carbone IT", 15, 26);
  doc.text(`Certifié par ${COMPANY.name} · Conformité Objectifs ODD / ESG Bénin`, 15, 32);

  // Badge Rapport
  doc.setFillColor(16, 185, 129); // Emerald-500
  doc.roundedRect(138, 10, 57, 22, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("RAPPORT RSE N°", 143, 17);
  doc.setFontSize(10.5);
  doc.text(data.reportNumber, 143, 26);

  let y = 56;
  doc.setTextColor(15, 23, 42);

  // ─── Section Entreprise Bénéficiaire ───
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("1. BÉNÉFICIAIRE & PÉRIODE DU BILAN", 15, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Entreprise Partenaire : ${data.clientCompanyName}`, 20, y);
  doc.text(`Exercice d'Audit : Année ${data.periodYear}`, 120, y);

  y += 6;
  doc.text(`Matériels pris en charge : ${data.repairedDevicesCount} postes de travail`, 20, y);
  doc.text(`Prolongation moyenne : +${data.extendedLifespanYearsAverage} ans`, 120, y);

  // ─── Section Indicateurs Clés (KPIs verts) ───
  y += 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("2. INDICATEURS D'IMPACT ÉCOLOGIQUE CERTIFIÉS", 15, y);

  y += 8;
  // Boîte 1 : Déchets évités
  doc.setFillColor(240, 253, 244); // Emerald-50
  doc.rect(15, y, 85, 22, "F");
  doc.rect(15, y, 85, 22, "S");
  doc.setFontSize(8.5);
  doc.setTextColor(6, 95, 70);
  doc.text("DÉCHETS ÉLECTRONIQUES (DEEE) ÉVITÉS", 20, y + 6);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`${data.eWasteAvoidedKg.toLocaleString()} kg épargnés`, 20, y + 15);

  // Boîte 2 : CO2 Évité
  doc.rect(110, y, 85, 22, "F");
  doc.rect(110, y, 85, 22, "S");
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text("ÉMISSIONS DE CO2 ÉVITÉES (FABRICATION NEUF)", 115, y + 6);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`${data.co2SavedTons.toFixed(1)} Tonnes CO2 eq`, 115, y + 15);

  y += 26;
  // Boîte 3 : Eau préservée
  doc.setFillColor(239, 246, 255); // Blue-50
  doc.rect(15, y, 85, 22, "F");
  doc.rect(15, y, 85, 22, "S");
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 64, 175);
  doc.text("EAU PURE PRÉSERVÉE (EXTRACTION MINIÈRE)", 20, y + 6);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`${data.waterSavedLiters.toLocaleString()} Litres`, 20, y + 15);

  // Boîte 4 : Score Circularité
  doc.rect(110, y, 85, 22, "F");
  doc.rect(110, y, 85, 22, "S");
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text("INDICE DE CIRCULARITÉ DU PARC", 115, y + 6);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`${data.circularityScorePercent}% Conforme ESG`, 115, y + 15);

  // ─── Clause méthodologique ───
  y += 30;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("3. MÉTHODOLOGIE DE CALCUL & OPPOSABILITÉ AUDIT", 15, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "Les calculs reposent sur les bases d'Analyse de Cycle de Vie (ACV) de l'ADEME et les standards Scope 3 GHG Protocol.",
    20,
    y,
  );
  y += 4.5;
  doc.text(
    "La prolongation d'usage de 12 à 24 mois réduit de 65% l'empreinte environnementale globale du poste de travail.",
    20,
    y,
  );

  // ─── Sceau et QR Code ───
  y += 10;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, y, 180, 36, 2, 2, "F");
  doc.rect(15, y, 180, 36, "S");

  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, "PNG", 18, y + 3, 30, 30);
    } catch {
      /* ignore */
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("Attestation d'Intégrité RSE & Audit Décentralisé", 54, y + 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Certifié conforme et délivré à Cotonou le ${data.issuedDate}.`, 54, y + 16);
  doc.text("Document certifié pour les rapports intégrés RSE et comités d'audit.", 54, y + 22);

  // Signatures
  y += 46;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Direction RSE Allô Techno Labs :", 20, y);
  doc.text(`Pour ${data.clientCompanyName} (DSI / RSE) :`, 120, y);

  doc.save(`Bilan_RSE_${data.clientCompanyName.replace(/\s+/g, "_")}_${data.periodYear}.pdf`);
}
