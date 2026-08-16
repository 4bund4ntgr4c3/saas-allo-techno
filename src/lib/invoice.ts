// Génération de documents côté client : reçu/facture PDF (jsPDF), export CSV
// et PDF des dossiers (administration).

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { COMPANY, formatFcfa } from "@/data/catalog/company";
import { computeEstimate } from "@/lib/estimate";
import { PERIOD_LABEL, STATUS_LABEL, formatDateFr } from "@/lib/reservation-schema";
import type { ReservationEvent } from "@/lib/notifications";

export type InvoiceRow = Pick<
  ReservationEvent,
  | "reference"
  | "customer_name"
  | "phone"
  | "email"
  | "device"
  | "issue"
  | "mode"
  | "payment"
  | "slot_date"
  | "slot_period"
  | "slot_hour"
  | "status"
> & {
  org_id?: string | null;
  org_name?: string | null;
  signature_base64?: string | null;
  signer_name?: string | null;
  signed_at?: string | null;
};

export type TimelineRow = {
  old_status: string | null;
  new_status: string;
  note: string | null;
  created_at: string;
};

async function invoiceEstimate(deviceName: string, issueLabel: string) {
  const { searchDevices } = await import("@/lib/catalog-search");
  const device = searchDevices(deviceName)[0]?.device;
  const fault = device?.faults.find(
    (f) => f.label.toLowerCase() === issueLabel.trim().toLowerCase(),
  );
  return { estimate: computeEstimate(fault ? [fault] : []), found: Boolean(fault) };
}

/** Reçu / facture PDF d'un dossier (remis au client à la restitution). */
export async function downloadInvoicePdf(r: InvoiceRow) {
  const { estimate, found } = await invoiceEstimate(r.device, r.issue);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 16;

  // Header Dark Slate #0f172a
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 34, "F");

  // Orange Accent Line #f97316
  doc.setFillColor(249, 115, 22);
  doc.rect(0, 34, pageW, 2.5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY.name.toUpperCase(), margin, 15);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text(
    [COMPANY.address, `Tél. ${COMPANY.phone} — ${COMPANY.email}`, COMPANY.city + ", Bénin"],
    pageW - margin,
    14,
    { align: "right" },
  );

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`REÇU DE DÉPÔT — DOSSIER ${r.reference}`, margin, 45);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Édité le ${new Date().toLocaleDateString("fr-FR")} · ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
    margin,
    51,
  );

  autoTable(doc, {
    startY: 57,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 2.5 },
    head: [["Dossier", "Client", "Téléphone", "E-mail"]],
    body: [[r.reference, r.customer_name, r.phone, r.email ?? "—"]],
  });

  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4,
    margin: { left: margin, right: margin },
    theme: "grid",
    styles: { fontSize: 9.5, cellPadding: 2.5 },
    head: [["Appareil", "Panne déclarée", "Statut", "Rendez-vous"]],
    body: [
      [
        r.device,
        r.issue,
        STATUS_LABEL[r.status] ?? r.status,
        `${formatDateFr(r.slot_date)} · ${PERIOD_LABEL[r.slot_period]}${r.slot_hour ? ` à ${r.slot_hour}` : ""}`,
      ],
    ],
  });

  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6,
    margin: { left: margin, right: margin },
    theme: "striped",
    styles: { fontSize: 9.5, cellPadding: 2.5 },
    head: [["Désignation", "Détail", "Montant (FCFA)"]],
    body: found
      ? [
          ...estimate.lines.map((l) => [l.label, l.detail, formatFcfa(l.amount) ?? ""]),
          ["", "TOTAL ESTIMATIF", formatFcfa(estimate.total) ?? ""],
        ]
      : [["Estimation", "Montant confirmé après diagnostic", "—"]],
    footStyles: { fontStyle: "bold", fillColor: [241, 245, 249], textColor: [15, 23, 42] },
    didParseCell: (data) => {
      if (
        found &&
        data.section === "body" &&
        data.column.index === 2 &&
        data.row.index === estimate.lines.length
      ) {
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  const noteY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(8.5);
  doc.setTextColor(90, 90, 90);
  doc.text(
    [
      "Le montant total est confirmé après diagnostic. Le paiement s'effectue à la restitution de l'appareil.",
      `Mode de paiement retenu : ${r.payment.toUpperCase()} · Garantie 6 mois pièces & main-d'œuvre.`,
      "Présentez ce reçu lors de la restitution.",
    ],
    margin,
    noteY,
  );

  if (r.signature_base64) {
    const sigY = noteY + 16;
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(`Signature Électronique Certifiée :`, margin, sigY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Signataire : ${r.signer_name ?? r.customer_name} · Le ${new Date(r.signed_at ?? Date.now()).toLocaleString("fr-FR")}`,
      margin,
      sigY + 5,
    );
    try {
      doc.addImage(r.signature_base64, "PNG", margin, sigY + 8, 45, 20);
    } catch {
      // Ignore format error silently
    }
  }

  doc.save(`allotechno-${r.reference}.pdf`);
}

/** Timeline PDF d'un dossier (suivi client) : dossier, estimation et journal. */
export async function downloadTimelinePdf(
  r: InvoiceRow & { warranty_months?: number; history: TimelineRow[] },
) {
  const { estimate, found } = await invoiceEstimate(r.device, r.issue);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY.name, margin, 15);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    [COMPANY.address, `Tél. ${COMPANY.phone} — ${COMPANY.email}`, COMPANY.city + ", Bénin"],
    pageW - margin,
    15,
    { align: "right" },
  );

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(`Timeline du dossier ${r.reference}`, margin, 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    `Édité le ${new Date().toLocaleDateString("fr-FR")} · ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
    margin,
    50,
  );

  autoTable(doc, {
    startY: 58,
    margin: { left: margin, right: margin },
    theme: "grid",
    styles: { fontSize: 9.5, cellPadding: 2.5 },
    head: [["Dossier", "Client", "Téléphone", "E-mail"]],
    body: [[r.reference, r.customer_name, r.phone, r.email ?? "—"]],
  });

  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4,
    margin: { left: margin, right: margin },
    theme: "grid",
    styles: { fontSize: 9.5, cellPadding: 2.5 },
    head: [["Appareil", "Panne déclarée", "Statut", "Rendez-vous"]],
    body: [
      [
        r.device,
        r.issue,
        STATUS_LABEL[r.status] ?? r.status,
        `${formatDateFr(r.slot_date)} · ${PERIOD_LABEL[r.slot_period]}${r.slot_hour ? ` à ${r.slot_hour}` : ""}`,
      ],
    ],
  });

  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6,
    margin: { left: margin, right: margin },
    theme: "striped",
    styles: { fontSize: 9.5, cellPadding: 2.5 },
    head: [["Désignation", "Détail", "Montant (FCFA)"]],
    body: found
      ? [
          ...estimate.lines.map((l) => [l.label, l.detail, formatFcfa(l.amount) ?? ""]),
          ["", "TOTAL ESTIMATIF", formatFcfa(estimate.total) ?? ""],
        ]
      : [["Estimation", "Montant confirmé après diagnostic", "—"]],
    footStyles: { fontStyle: "bold", fillColor: [241, 245, 249], textColor: [15, 23, 42] },
    didParseCell: (data) => {
      if (
        found &&
        data.section === "body" &&
        data.column.index === 2 &&
        data.row.index === estimate.lines.length
      ) {
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  const history = [...r.history].reverse();
  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6,
    margin: { left: margin, right: margin },
    theme: "grid",
    styles: { fontSize: 9.5, cellPadding: 2.5 },
    head: [["Date", "Événement", "Note"]],
    body:
      history.length > 0
        ? history.map((h) => [
            new Date(h.created_at).toLocaleString("fr-FR", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }),
            h.old_status
              ? `${STATUS_LABEL[h.old_status] ?? h.old_status} → ${STATUS_LABEL[h.new_status] ?? h.new_status}`
              : `Dossier créé — ${STATUS_LABEL[h.new_status] ?? h.new_status}`,
            h.note ?? "",
          ])
        : [["—", "Aucun événement enregistré", ""]],
  });

  const noteY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(8.5);
  doc.setTextColor(90, 90, 90);
  doc.text(
    [
      r.warranty_months && r.warranty_months > 0
        ? `Garantie pièces & main-d'œuvre : ${r.warranty_months} mois.`
        : "Garantie standard pièces & main-d'œuvre incluse.",
      `Mode de paiement retenu : ${r.payment.toUpperCase()} · Suivi en ligne : ${COMPANY.url}/suivi?ref=${r.reference}`,
    ],
    margin,
    noteY,
  );

  doc.save(`allotechno-timeline-${r.reference}.pdf`);
}

function todayLabel(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Export CSV des dossiers (administration). */
export function downloadReservationsCsv(rows: InvoiceRow[]) {
  const header = [
    "Reference",
    "Client",
    "Organisation",
    "Telephone",
    "Email",
    "Appareil",
    "Panne",
    "Mode",
    "Paiement",
    "Date",
    "Periode",
    "Heure",
    "Statut",
  ];
  const escape = (v: string | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    header.map(escape).join(","),
    ...rows.map((r) =>
      [
        r.reference,
        r.customer_name,
        r.org_name ?? "",
        r.phone,
        r.email,
        r.device,
        r.issue,
        r.mode,
        r.payment,
        r.slot_date,
        PERIOD_LABEL[r.slot_period],
        r.slot_hour ?? "",
        STATUS_LABEL[r.status],
      ]
        .map(escape)
        .join(","),
    ),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dossiers-allotechno-${todayLabel()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Export PDF des dossiers (administration) — tableau paginé. */
export function downloadReservationsPdf(rows: InvoiceRow[]) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 12;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`${COMPANY.name} — Dossiers de réparation`, margin, 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Export du ${todayLabel()} · ${rows.length} dossier(s)`, pageW - margin, 11, {
    align: "right",
  });

  autoTable(doc, {
    startY: 28,
    margin: { left: margin, right: margin },
    theme: "grid",
    styles: { fontSize: 7.5, cellPadding: 1.8 },
    head: [
      ["Réf.", "Client", "Org.", "Tél.", "Appareil", "Panne", "Mode", "Paiement", "RDV", "Statut"],
    ],
    body: rows.map((r) => [
      r.reference,
      r.customer_name,
      r.org_name ?? "",
      r.phone,
      r.device,
      r.issue,
      r.mode === "domicile" ? "Domicile" : "Boutique",
      r.payment.toUpperCase(),
      `${formatDateFr(r.slot_date)}${r.slot_hour ? ` ${r.slot_hour}` : ""}`,
      STATUS_LABEL[r.status] ?? r.status,
    ]),
    foot: [["", "", "", "", "", "", "", "", `Total`, String(rows.length)]],
    footStyles: { fontStyle: "bold", fillColor: [241, 245, 249], textColor: [15, 23, 42] },
  });

  doc.save(`dossiers-allotechno-${todayLabel()}.pdf`);
}

// ---------------------------------------------------------------------------
// Devis PDF
// ---------------------------------------------------------------------------

export type QuoteRow = {
  reference: string;
  customer_name: string;
  phone: string;
  email: string | null;
  device: string;
  issue: string;
  quote_amount: number;
  warranty_months: number;
  quote_token: string | null;
  created_at: string;
};

/** Devis PDF d'un dossier de réparation — remis au client ou téléchargeable. */
export function downloadQuotePdf(r: QuoteRow) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;

  // En-tête
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY.name, margin, 15);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    [COMPANY.address, `Tel. ${COMPANY.phone} - ${COMPANY.email}`, COMPANY.city + ", Benin"],
    pageW - margin,
    15,
    { align: "right" },
  );

  // Titre
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`DEVIS DE REPARATION`, margin, 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    `Dossier ${r.reference} · Edite le ${new Date(r.created_at).toLocaleDateString("fr-FR")}`,
    margin,
    51,
  );

  // Infos client
  autoTable(doc, {
    startY: 58,
    margin: { left: margin, right: margin },
    theme: "grid",
    styles: { fontSize: 9.5, cellPadding: 2.5 },
    head: [["Client", "Telephone", "E-mail"]],
    body: [[r.customer_name, r.phone, r.email ?? "-"]],
  });

  // Infos appareil
  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4,
    margin: { left: margin, right: margin },
    theme: "grid",
    styles: { fontSize: 9.5, cellPadding: 2.5 },
    head: [["Appareil", "Panne declaree"]],
    body: [[r.device, r.issue]],
  });

  // Montant du devis
  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6,
    margin: { left: margin, right: margin },
    theme: "striped",
    styles: { fontSize: 10, cellPadding: 3 },
    head: [["Designation", "Detail", "Montant (FCFA)"]],
    body: [
      ["Reparation", `${r.device} - ${r.issue}`, formatFcfa(r.quote_amount) ?? ""],
      ["", "TOTAL DEVIS", formatFcfa(r.quote_amount) ?? ""],
    ],
    footStyles: { fontStyle: "bold", fillColor: [241, 245, 249], textColor: [15, 23, 42] },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 2 && data.row.index === 1) {
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  // Infos garantie et validite
  const noteY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(
    [
      `Garantie : ${r.warranty_months} mois pieces et main-d'oeuvre.`,
      "Ce devis est valable 14 jours a compter de la date d'emission.",
      "Le paiement s'effectue apres approbation du devis, en ligne ou a l'atelier.",
    ],
    margin,
    noteY,
  );

  // Lien d'approbation
  if (r.quote_token) {
    const linkY = noteY + 16;
    doc.setFontSize(10);
    doc.setTextColor(22, 163, 74);
    doc.setFont("helvetica", "bold");
    const origin = typeof window !== "undefined" ? window.location.origin : COMPANY.url;
    const link = `${origin}/fr/suivi?token=${encodeURIComponent(r.quote_token)}`;
    doc.text("Approuver ou refuser ce devis en ligne :", margin, linkY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(22, 163, 74);
    doc.text(link, margin, linkY + 6);
  }

  // Pied de page
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text(`${COMPANY.name} - ${COMPANY.address} - ${COMPANY.phone}`, margin, footerY);
  doc.text(`Suivi en ligne : ${COMPANY.url}/suivi?ref=${r.reference}`, pageW - margin, footerY, {
    align: "right",
  });

  doc.save(`devis-allotechno-${r.reference}.pdf`);
}
