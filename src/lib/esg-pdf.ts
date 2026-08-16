import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { COMPANY, formatFcfa } from "@/data/catalog/company";
import type { EsgMetrics } from "@/lib/esg.functions";
import type { Organization } from "@/lib/org.functions";

export function generateEsgReportPdf(org: Organization, metrics: EsgMetrics) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 16;

  // ── Header Dark Slate ──
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 36, "F");

  // Ligne accent orange
  doc.setFillColor(216, 49, 0); // #d83100
  doc.rect(0, 36, pageW, 2.5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY.name.toUpperCase(), margin, 14);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225);
  doc.text("BILAN D'IMPACT ENVIRONNEMENTAL & RSE MATÉRIEL IT", margin, 20);
  doc.text(`${COMPANY.address} · ${COMPANY.phone} · ${COMPANY.email}`, margin, 27);

  // Badge Période
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(pageW - margin - 45, 10, 45, 16, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("RAPPORT OFFICIEL", pageW - margin - 42, 16);
  doc.setFontSize(10);
  doc.setTextColor(216, 49, 0);
  doc.text(metrics.reportPeriod, pageW - margin - 42, 22);

  // ── Section Bénéficiaire ──
  let y = 48;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("ORGANISATION BÉNÉFICIAIRE :", margin, y);

  y += 6;
  doc.setFontSize(14);
  doc.setTextColor(216, 49, 0);
  doc.text(org.name, margin, y);

  y += 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  const trade = org.trade_name ? ` · ${org.trade_name}` : "";
  const reg = org.registration_number ? ` · RCCM : ${org.registration_number}` : "";
  doc.text(`${org.sector ?? "Entreprise"} · ${org.address ?? "Cotonou, Bénin"}${trade}${reg}`, margin, y);

  // ── Tableau des Métriques ESG ──
  y += 12;
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Indicateur Clé RSE / Durabilité", "Valeur Réalisée", "Impact Positif & Bénéfice"]],
    body: [
      [
        "Équipements Maintenus & Prolongés",
        `${metrics.repairedUnitsCount} unités`,
        "Cycle de vie prolongé de +24 à +36 mois",
      ],
      [
        "Déchets Électroniques Évités (DEEE)",
        `${metrics.electronicWasteSavedKg.toLocaleString("fr-FR")} kg`,
        "Détournés des décharges et filières sauvages",
      ],
      [
        "Émissions de CO2 Évitées",
        `${metrics.co2EmissionsAvoidedKg.toLocaleString("fr-FR")} kg CO2 eq`,
        `Équivaut à ~${Math.round(metrics.co2EmissionsAvoidedKg / 22)} arbres plantés / an`,
      ],
      [
        "Économies Financières Réalisées",
        formatFcfa(metrics.financialSavingsFcfa),
        "Par rapport au rachat de matériel neuf",
      ],
      [
        "Score d'Économie Circulaire",
        `${metrics.circularEconomyScorePercent}%`,
        "Taux de reconditionnement & réemploi du parc",
      ],
    ],
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      textColor: [15, 23, 42],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  y = doc.lastAutoTable.finalY + 12;

  // ── Boîte d'Engagement Environnemental ──
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageW - 2 * margin, 32, "F");
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, pageW - 2 * margin, 32, "S");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("MÉTHODOLOGIE D'ÉVALUATION & CONFORMITÉ RSE", margin + 4, y + 7);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(
    "Les calculs d'émissions carbone et de détournement des DEEE sont établis selon les standards internationaux de l'ADEME\net des analyses de cycle de vie (ACV) applicables au matériel informatique professionnel en Afrique de l'Ouest.\nAllô Techno certifie que l'ensemble des pièces remplacées font l'objet d'un tri sélectif et d'une valorisation responsable.",
    margin + 4,
    y + 14,
  );

  // ── Signature & Cachet ──
  y += 44;
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("Pour le compte de l'Organisation :", margin, y);
  doc.text("Certifié par la Direction Allô Techno :", pageW - margin - 60, y);

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Fait à Cotonou, le ${new Date().toLocaleDateString("fr-FR")}`, margin, y);
  doc.text("Pôle RSE & Ingénierie Matériel", pageW - margin - 60, y);

  // Footer discret
  const footerY = 285;
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Document généré le ${new Date().toLocaleString("fr-FR")} · Identifiant Unique RSE: RSE-${org.id.slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`,
    margin,
    footerY,
  );

  // Téléchargement du fichier PDF
  const filename = `Bilan_RSE_ESG_${org.name.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().getFullYear()}.pdf`;
  doc.save(filename);
}
