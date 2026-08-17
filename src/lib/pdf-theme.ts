// ============================================================================
// Allô Techno Africa — Moteur de Thème Graphique & Design PDF Haute Précision
// Génère des en-têtes et pieds de page ultra professionnels, logos vectoriels et badges.
// ============================================================================

import type { jsPDF } from "jspdf";
import { COMPANY } from "@/data/catalog/company";

export interface PdfHeaderOptions {
  title: string;
  subTitle?: string;
  docRef: string;
  dateStr: string;
  extraMeta?: string;
  accentColor?: [number, number, number]; // Default Orange [249, 115, 22]
}

export interface PdfFooterOptions {
  docRef: string;
  pageNumber?: number;
  totalPages?: number;
  notice?: string;
}

/**
 * Dessine le Logo officiel vectoriel Allô Techno (Haute Précision & Sans pixellisation)
 */
export function drawAlloTechnoLogo(doc: jsPDF, x: number, y: number, scale: number = 1) {
  doc.saveGraphicsState();

  // Badge Fond du Logo (Hexagone / Carré arrondi sombre)
  const size = 18 * scale;
  doc.setFillColor(15, 23, 42); // Dark Slate #0f172a
  doc.setDrawColor(249, 115, 22); // Orange #f97316
  doc.setLineWidth(0.4 * scale);
  doc.roundedRect(x, y, size, size, 3 * scale, 3 * scale, "FD");

  // Éclair / Circuit électronique stylisé Allô Techno (Orange & Blanc)
  doc.setFillColor(249, 115, 22);
  const cx = x + size / 2;
  const cy = y + size / 2;

  // Lignes de circuit imprimé
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.3 * scale);
  doc.circle(cx - 4 * scale, cy - 4 * scale, 0.8 * scale, "F");
  doc.circle(cx + 4 * scale, cy + 4 * scale, 0.8 * scale, "F");
  doc.line(cx - 4 * scale, cy - 4 * scale, cx - 1 * scale, cy - 4 * scale);
  doc.line(cx + 1 * scale, cy + 4 * scale, cx + 4 * scale, cy + 4 * scale);

  // Éclair central dynamique
  doc.setFillColor(249, 115, 22);
  doc.setDrawColor(249, 115, 22);
  doc.triangle(
    cx + 1.5 * scale,
    cy - 6 * scale,
    cx - 3.5 * scale,
    cy + 0.5 * scale,
    cx + 0.5 * scale,
    cy + 0.5 * scale,
    "FD",
  );
  doc.triangle(
    cx - 0.5 * scale,
    cy - 0.5 * scale,
    cx + 3.5 * scale,
    cy - 0.5 * scale,
    cx - 1.5 * scale,
    cy + 6 * scale,
    "FD",
  );

  doc.restoreGraphicsState();
}

/**
 * Génère un en-tête graphique saisissant et moderne (Dark Slate & Orange Tech)
 */
export function drawEyeCatchingHeader(doc: jsPDF, options: PdfHeaderOptions): number {
  const pw = doc.internal.pageSize.getWidth();
  const margin = 14;
  const accent = options.accentColor || [249, 115, 22]; // Orange Allô Techno

  // 1. Fond Sombre Principal (Slate-950 / Deep Charcoal)
  doc.setFillColor(11, 15, 25);
  doc.rect(0, 0, pw, 34, "F");

  // Motif géométrique d'ingénierie subtil (Lignes technologiques d'arrière-plan)
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.2);
  for (let i = 0; i < pw; i += 18) {
    doc.line(i, 0, i + 10, 34);
  }

  // 2. Double Liseré Technologique Lumineux (Orange & Cyan)
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, 34, pw, 1.8, "F");

  doc.setFillColor(56, 189, 248); // Sky-400 accent
  doc.rect(0, 35.8, pw * 0.35, 0.6, "F");

  // 3. Logo Vectoriel Allô Techno
  drawAlloTechnoLogo(doc, margin, 7.5, 1.05);

  // 4. Titre de Marque & Coordonnées
  const textLeft = margin + 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text("ALLÔ TECHNO AFRICA", textLeft, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    options.subTitle || "SERVICES INFORMATIQUES B2B & INFOGÉRANCE CERTIFIÉE",
    textLeft,
    19.5,
  );
  doc.setTextColor(148, 163, 184);
  doc.text(
    `${COMPANY.address} · Calavi & Cotonou · Tél : ${COMPANY.phone} · support@allotechno.africa`,
    textLeft,
    25,
  );

  // 5. Cartouche Document Référence (Design Badge Métallique à droite)
  const badgeW = 60;
  const badgeX = pw - margin - badgeW;

  doc.setFillColor(24, 33, 53);
  doc.setDrawColor(accent[0], accent[1], accent[2]);
  doc.setLineWidth(0.35);
  doc.roundedRect(badgeX, 6.5, badgeW, 21, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text(`RÉF : ${options.docRef}`, badgeX + badgeW / 2, 12, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(226, 232, 240);
  doc.text(`Date : ${options.dateStr}`, badgeX + badgeW / 2, 17.5, { align: "center" });

  if (options.extraMeta) {
    doc.setFontSize(6.8);
    doc.setTextColor(148, 163, 184);
    doc.text(options.extraMeta, badgeX + badgeW / 2, 23, { align: "center" });
  }

  return 42; // Y de départ pour le contenu sous l'en-tête
}

/**
 * Génère un pied de page officiel sécurisé avec sceau, pagination et mentions légales
 */
export function drawEyeCatchingFooter(doc: jsPDF, options: PdfFooterOptions) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Liseré supérieur du pied de page
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, ph - 13, pw - margin, ph - 13);

  // Liseré orange d'accentuation à gauche
  doc.setFillColor(249, 115, 22);
  doc.rect(margin, ph - 13, 20, 0.6, "F");

  // Mentions Légales
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    options.notice ||
      "Allô Techno Africa — Infogérance & Maintenance Informatique Pro — Document certifié conforme.",
    margin,
    ph - 7,
  );

  // Badge Numérotation de page & Référence
  const pageStr = `Page ${options.pageNumber ?? 1} / ${options.totalPages ?? 1}`;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(15, 23, 42);
  doc.text(`${options.docRef}  ·  ${pageStr}`, pw - margin, ph - 7, { align: "right" });
}

/**
 * Dessine un en-tête de section technique avec puce numérotée
 */
export function drawSectionTitle(doc: jsPDF, y: number, number: string, title: string): number {
  const margin = 14;

  // Puce carrée Orange
  doc.setFillColor(249, 115, 22);
  doc.rect(margin, y - 3.2, 4, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${number}. ${title.toUpperCase()}`, margin + 6.5, y);

  return y + 3;
}
