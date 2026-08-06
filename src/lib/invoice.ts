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
>;

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
  doc.text(`Reçu de dépôt — dossier ${r.reference}`, margin, 44);
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

  doc.save(`allotechno-${r.reference}.pdf`);
}

function todayLabel(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Export CSV des dossiers (administration). */
export function downloadReservationsCsv(rows: InvoiceRow[]) {
  const header = [
    "Reference",
    "Client",
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
    head: [["Réf.", "Client", "Tél.", "Appareil", "Panne", "Mode", "Paiement", "RDV", "Statut"]],
    body: rows.map((r) => [
      r.reference,
      r.customer_name,
      r.phone,
      r.device,
      r.issue,
      r.mode === "domicile" ? "Domicile" : "Boutique",
      r.payment.toUpperCase(),
      `${formatDateFr(r.slot_date)}${r.slot_hour ? ` ${r.slot_hour}` : ""}`,
      STATUS_LABEL[r.status] ?? r.status,
    ]),
    foot: [["", "", "", "", "", "", "", `Total`, String(rows.length)]],
    footStyles: { fontStyle: "bold", fillColor: [241, 245, 249], textColor: [15, 23, 42] },
  });

  doc.save(`dossiers-allotechno-${todayLabel()}.pdf`);
}
