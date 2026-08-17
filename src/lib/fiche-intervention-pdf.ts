// ============================================================================
// Allô Techno Africa — Générateur de Fiche d'Intervention & Rapport de Maintenance
// Supporte : Maintenance Préventive, Curative / Urgence, Upgrade, Audit de Parc
// ============================================================================

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import type { MaintenanceType } from "@/components/b2b/maintenance/preset-tasks";
import { drawEyeCatchingHeader, drawEyeCatchingFooter, drawSectionTitle } from "./pdf-theme";

export interface FicheInterventionInput {
  ficheNumber: string;
  maintenanceType: MaintenanceType;
  orgName: string;
  clientContact: {
    name: string;
    phone?: string;
    email?: string;
    role?: string;
  };
  siteLocation: string;
  equipment: {
    name: string;
    categoryLabel?: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    assignedUser?: string;
  };
  interventionDate: string;
  durationMinutes: number;
  technicianName: string;
  initialObservations: string;
  workPerformed: string;
  partsReplaced?: {
    name: string;
    quantity: number;
    status: "neuf" | "garantie" | "reconditionne";
  }[];
  checkpoints: {
    task: string;
    status: "conforme" | "corrige" | "a_surveiller" | "na";
    note?: string;
  }[];
  finalStatus: "operationnel" | "observation" | "materiel_pret" | "devis_requis";
  recommendations: string;
  warrantyMonths: number;
}

const TYPE_CONFIG: Record<
  MaintenanceType,
  {
    label: string;
    subLabel: string;
    bgBadge: [number, number, number];
    textBadge: [number, number, number];
    border: [number, number, number];
  }
> = {
  preventive: {
    label: "FICHE DE MAINTENANCE PRÉVENTIVE",
    subLabel: "CYCLE PÉRIODIQUE D'ENTRETIEN, DÉPOUSSIÉRAGE & CONTRÔLE TECHNIQUE",
    bgBadge: [236, 253, 245],
    textBadge: [5, 150, 105],
    border: [16, 185, 129],
  },
  curative: {
    label: "FICHE D'INTERVENTION CURATIVE / DÉPANNAGE",
    subLabel: "RÉSOLUTION DE PANNE MATÉRIELLE OU ÉLECTRONIQUE SUR SITE / ATELIER",
    bgBadge: [254, 243, 199],
    textBadge: [180, 83, 9],
    border: [245, 158, 11],
  },
  upgrade: {
    label: "FICHE D'ÉVOLUTION & UPGRADE MATÉRIEL",
    subLabel: "AUGMENTATION DES CAPACITÉS MATÉRIELLES (SSD, RAM, COMPOSANTS)",
    bgBadge: [239, 246, 255],
    textBadge: [29, 78, 216],
    border: [59, 130, 246],
  },
  audit: {
    label: "FICHE D'AUDIT & BILAN DE SANTÉ DU MATÉRIEL",
    subLabel: "INSPECTION EXHAUSTIVE, HEALTH SCORE & PRÉCONISATIONS TECHNIQUES",
    bgBadge: [245, 243, 255],
    textBadge: [109, 40, 217],
    border: [139, 92, 246],
  },
};

const FINAL_STATUS_LABELS: Record<
  FicheInterventionInput["finalStatus"],
  { label: string; desc: string }
> = {
  operationnel: {
    label: "OPÉRATIONNEL (100% FONCTIONNEL)",
    desc: "Équipement entièrement testé et conforme aux spécifications constructeur.",
  },
  observation: {
    label: "FONCTIONNEL SOUS OBSERVATION",
    desc: "Équipement remis en service avec surveillance recommandée.",
  },
  materiel_pret: {
    label: "MATÉRIEL DE SECOURS DÉPLOYÉ",
    desc: "Équipement pris en atelier avec mise à disposition d'un appareil de prêt.",
  },
  devis_requis: {
    label: "DEVIS COMPLÉMENTAIRE REQUIS",
    desc: "Remplacement de pièce majeure nécessaire avant remise en service définitive.",
  },
};

export async function generateFicheInterventionPdf(input: FicheInterventionInput): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pw - margin * 2;
  const typeCfg = TYPE_CONFIG[input.maintenanceType] || TYPE_CONFIG.preventive;

  // 1. En-tête Eye-Catching avec Logo Vectoriel
  let y = drawEyeCatchingHeader(doc, {
    title: "ALLÔ TECHNO AFRICA",
    subTitle: "SERVICES INFORMATIQUES B2B & INFOGÉRANCE CERTIFIÉE",
    docRef: input.ficheNumber,
    dateStr: input.interventionDate,
    extraMeta: `Durée : ${input.durationMinutes} min`,
    accentColor: [249, 115, 22],
  });

  // 2. Title & Type Badge
  doc.setFillColor(typeCfg.bgBadge[0], typeCfg.bgBadge[1], typeCfg.bgBadge[2]);
  doc.rect(margin, y, contentWidth, 13, "F");
  doc.setDrawColor(typeCfg.border[0], typeCfg.border[1], typeCfg.border[2]);
  doc.setLineWidth(0.35);
  doc.rect(margin, y, contentWidth, 13, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(typeCfg.textBadge[0], typeCfg.textBadge[1], typeCfg.textBadge[2]);
  doc.text(typeCfg.label, margin + 4, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  doc.text(typeCfg.subLabel, margin + 4, y + 10);

  y += 16;

  // 3. Grid: Client & Équipement (Cartouches structurés)
  const halfCol = (contentWidth - 4) / 2;

  // Box Client
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, halfCol, 29, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("1. CLIENT & SITE D'INTERVENTION", margin + 4, y + 5.5);

  doc.setFontSize(7.3);
  doc.setFont("helvetica", "bold");
  doc.text("Entreprise :", margin + 4, y + 11.5);
  doc.setFont("helvetica", "normal");
  doc.text(input.orgName, margin + 22, y + 11.5);

  doc.setFont("helvetica", "bold");
  doc.text("Contact IT :", margin + 4, y + 17);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${input.clientContact.name}${input.clientContact.role ? ` (${input.clientContact.role})` : ""}`,
    margin + 22,
    y + 17,
  );

  doc.setFont("helvetica", "bold");
  doc.text("Lieu / Tél :", margin + 4, y + 22.5);
  doc.setFont("helvetica", "normal");
  doc.text(`${input.siteLocation} · ${input.clientContact.phone || "—"}`, margin + 22, y + 22.5);

  // Box Équipement
  const xRight = margin + halfCol + 4;
  doc.setFillColor(248, 250, 252);
  doc.rect(xRight, y, halfCol, 29, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("2. ÉQUIPEMENT CONCERNÉ", xRight + 4, y + 5.5);

  doc.setFontSize(7.3);
  doc.setFont("helvetica", "bold");
  doc.text("Désignation :", xRight + 4, y + 11.5);
  doc.setFont("helvetica", "normal");
  doc.text(input.equipment.name, xRight + 24, y + 11.5);

  doc.setFont("helvetica", "bold");
  doc.text("Modèle / SN :", xRight + 4, y + 17);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${[input.equipment.brand, input.equipment.model].filter(Boolean).join(" ") || "Standard"} · ${input.equipment.serialNumber || "SN-2026"}`,
    xRight + 24,
    y + 17,
  );

  doc.setFont("helvetica", "bold");
  doc.text("Utilisateur :", xRight + 4, y + 22.5);
  doc.setFont("helvetica", "normal");
  doc.text(input.equipment.assignedUser || "Poste collaborateur", xRight + 24, y + 22.5);

  y += 33;

  // 4. Diagnostic & Travaux Réalisés
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 20, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("3. CONSTAT INITIAL & TRAVAUX EXÉCUTÉS", margin + 4, y + 5);

  doc.setFontSize(7.2);
  doc.setFont("helvetica", "bold");
  doc.text("Constat :", margin + 4, y + 10);
  doc.setFont("helvetica", "normal");
  doc.text(
    input.initialObservations || "Maintenance programmée conformément au contrat SLA.",
    margin + 18,
    y + 10,
  );

  doc.setFont("helvetica", "bold");
  doc.text("Opérations :", margin + 4, y + 15);
  doc.setFont("helvetica", "normal");
  const splitWork = doc.splitTextToSize(input.workPerformed, contentWidth - 26);
  doc.text(splitWork, margin + 20, y + 15);

  y += 23.5;

  // 5. Table des Points de Contrôle (Checklist)
  y = drawSectionTitle(doc, y, "4", "Grille des Points de Contrôle Technique");

  const tableBody = input.checkpoints.map((cp) => [
    cp.task,
    cp.status === "conforme"
      ? "CONFORME [OK]"
      : cp.status === "corrige"
        ? "CORRIGÉ [OK]"
        : cp.status === "a_surveiller"
          ? "À SURVEILLER"
          : "N/A",
    cp.note || "Vérifié conforme aux normes",
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Point de Contrôle / Tâche Exécutée", "Résultat", "Observations Techniques"]],
    body: tableBody,
    theme: "grid",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.2,
      fontStyle: "bold",
      cellPadding: 1.8,
    },
    bodyStyles: {
      fontSize: 6.8,
      cellPadding: 1.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 78, fontStyle: "bold" },
      1: { cellWidth: 30, halign: "center", fontStyle: "bold" },
      2: { cellWidth: "auto" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 1) {
        const txt = String(data.cell.raw);
        if (txt.includes("CONFORME") || txt.includes("CORRIGÉ")) {
          data.cell.styles.textColor = [5, 150, 105]; // Emerald
        } else if (txt.includes("SURVEILLER")) {
          data.cell.styles.textColor = [217, 119, 6]; // Amber
        }
      }
    },
  });

  const finalTableY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY;
  y = finalTableY + 3.5;

  // 6. Pièces remplacées (si existantes)
  if (input.partsReplaced && input.partsReplaced.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.3);
    doc.setTextColor(15, 23, 42);
    doc.text("5. PIÈCES & CONSOMMABLES REMPLACÉS :", margin, y);
    doc.setFont("helvetica", "normal");
    const partsStr = input.partsReplaced
      .map((p) => `${p.name} (Qté: ${p.quantity}, Statut: ${p.status.toUpperCase()})`)
      .join(" — ");
    doc.text(partsStr, margin + 58, y);
    y += 4.5;
  }

  // Check if bottom section fits on current page
  if (y + 42 > ph - 14) {
    doc.addPage();
    y = 15;
  }

  // 7. Statut Final & Recommandations
  const statusObj = FINAL_STATUS_LABELS[input.finalStatus] || FINAL_STATUS_LABELS.operationnel;

  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(16, 185, 129);
  doc.rect(margin, y, contentWidth, 14.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.6);
  doc.setTextColor(5, 150, 105);
  doc.text(`STATUT FINAL DU MATÉRIEL : ${statusObj.label}`, margin + 4, y + 4.2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Recommandations : ${input.recommendations || "Poursuivre l'utilisation. Prochaine révision recommandée dans 3 mois."}`,
    margin + 4,
    y + 8.5,
  );
  doc.text(
    `Garantie d'intervention : ${input.warrantyMonths} mois de garantie pièces & main-d'œuvre avec astreinte SLA Allô Techno.`,
    margin + 4,
    y + 12.5,
  );

  y += 17.5;

  // 8. Signatures & QR Code Validation
  const qrUrl = await QRCode.toDataURL(
    `https://allotechno.africa/fr/suivi?fiche=${input.ficheNumber}`,
    { width: 120, margin: 1, color: { dark: "#0f172a" } },
  ).catch(() => "");

  const sigBoxW = (contentWidth - 32) / 2;

  // Box Signature Technicien
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, sigBoxW, 24, "D");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text("POUR L'ATELIER ALLÔ TECHNO", margin + 3, y + 4.2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.6);
  doc.setTextColor(100, 116, 139);
  doc.text(`Technicien : ${input.technicianName}`, margin + 3, y + 8.5);
  doc.text("Signature & Cachet technique :", margin + 3, y + 13);

  // Box Signature Client
  const clientSigX = margin + sigBoxW + 4;
  doc.rect(clientSigX, y, sigBoxW, 24, "D");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text("BON POUR RÉCEPTION / ENTREPRISE", clientSigX + 3, y + 4.2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.6);
  doc.setTextColor(100, 116, 139);
  doc.text(`Nom : ${input.clientContact.name}`, clientSigX + 3, y + 8.5);
  doc.text("Date & Signature :", clientSigX + 3, y + 13);

  // QR Code Box
  if (qrUrl) {
    const qrX = pw - margin - 22;
    doc.addImage(qrUrl, "PNG", qrX, y, 22, 22);
    doc.setFontSize(5.2);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Authenticité QR", qrX + 11, y + 23.5, { align: "center" });
  }

  // 9. Pied de Page Eye-Catching
  drawEyeCatchingFooter(doc, {
    docRef: `Fiche N° ${input.ficheNumber}`,
    pageNumber: 1,
    totalPages: 1,
    notice:
      "Allô Techno Africa — Infogérance & Traçabilité Matérielle B2B — Conforme aux exigences qualité ISO/SLA.",
  });

  doc.save(`Fiche-Intervention-${input.ficheNumber}.pdf`);
}
