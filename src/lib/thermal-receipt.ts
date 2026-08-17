// ============================================================================
// Allô Techno — Générateur d'Impression de Ticket de Caisse Thermique (58mm/80mm)
// Compatible imprimantes thermiques ESC/POS (Epson, Xprinter, Sunmi, etc.)
// ============================================================================

import { COMPANY, formatFcfa } from "@/data/catalog/company";
import QRCode from "qrcode";

export interface ThermalReceiptItem {
  name: string;
  qty: number;
  price: number;
  total: number;
}

export interface ThermalReceiptData {
  reference: string;
  date?: string;
  customerName?: string;
  customerPhone?: string;
  device?: string;
  issue?: string;
  items?: ThermalReceiptItem[];
  totalAmount: number;
  paidAmount: number;
  paymentMethod?: string;
  cashierName?: string;
  warrantyInfo?: string;
}

/**
 * Génère et lance l'impression d'un ticket de caisse thermique (format 80mm/58mm).
 */
export async function printThermalReceipt(
  data: ThermalReceiptData,
  format: "80mm" | "58mm" = "80mm",
) {
  const qrDataUrl = await QRCode.toDataURL(
    `https://allotechno.africa/fr/suivi?ref=${encodeURIComponent(data.reference)}`,
    { width: 140, margin: 1 },
  ).catch(() => "");

  const receiptHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Ticket - ${data.reference}</title>
        <style>
          @page {
            size: ${format === "58mm" ? "58mm" : "80mm"} auto;
            margin: 0;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: ${format === "58mm" ? "48mm" : "72mm"};
            margin: 0 auto;
            padding: 8px 4px;
            color: #000000;
            background: #ffffff;
            font-size: 11px;
            line-height: 1.3;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .divider {
            border-top: 1px dashed #000000;
            margin: 6px 0;
          }
          .double-divider {
            border-top: 2px dashed #000000;
            margin: 8px 0;
          }
          .item-row {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
          }
          .qr-container {
            text-align: center;
            margin: 8px 0;
          }
          .qr-container img {
            width: 100px;
            height: 100px;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="font-bold" style="font-size: 14px;">${COMPANY.name.toUpperCase()}</div>
          <div>${COMPANY.address}</div>
          <div>Tél : ${COMPANY.phone}</div>
          <div>${COMPANY.city}, Bénin</div>
        </div>

        <div class="divider"></div>

        <div>
          <div><strong>RÉF :</strong> ${data.reference}</div>
          <div><strong>DATE :</strong> ${data.date || new Date().toLocaleString("fr-FR")}</div>
          ${data.customerName ? `<div><strong>CLIENT :</strong> ${data.customerName}</div>` : ""}
          ${data.customerPhone ? `<div><strong>TÉL :</strong> ${data.customerPhone}</div>` : ""}
          ${data.cashierName ? `<div><strong>CAISSIER :</strong> ${data.cashierName}</div>` : ""}
        </div>

        ${
          data.device
            ? `
          <div class="divider"></div>
          <div><strong>APPAREIL :</strong> ${data.device}</div>
          ${data.issue ? `<div><strong>PANNE :</strong> ${data.issue}</div>` : ""}
        `
            : ""
        }

        ${
          data.items && data.items.length > 0
            ? `
          <div class="divider"></div>
          <div class="font-bold">DÉSIGNATION / QTÉ / TOTAL</div>
          ${data.items
            .map(
              (item) => `
            <div class="item-row">
              <span style="max-width: 60%;">${item.name} (x${item.qty})</span>
              <span>${formatFcfa(item.total)}</span>
            </div>
          `,
            )
            .join("")}
        `
            : ""
        }

        <div class="double-divider"></div>

        <div class="item-row font-bold" style="font-size: 13px;">
          <span>TOTAL :</span>
          <span>${formatFcfa(data.totalAmount)}</span>
        </div>

        <div class="item-row">
          <span>RÉGLÉ :</span>
          <span>${formatFcfa(data.paidAmount)}</span>
        </div>

        ${
          data.totalAmount - data.paidAmount > 0
            ? `
          <div class="item-row font-bold">
            <span>RESTE À PAYER :</span>
            <span>${formatFcfa(data.totalAmount - data.paidAmount)}</span>
          </div>
        `
            : ""
        }

        ${data.paymentMethod ? `<div><strong>MODE :</strong> ${data.paymentMethod.toUpperCase()}</div>` : ""}

        <div class="divider"></div>

        ${
          qrDataUrl
            ? `
          <div class="qr-container">
            <img src="${qrDataUrl}" alt="QR Suivi" />
            <div style="font-size: 9px;">Scannez pour suivre votre dossier en direct</div>
          </div>
        `
            : ""
        }

        <div class="text-center" style="font-size: 9px; margin-top: 6px;">
          <div>${data.warrantyInfo || "Garantie 6 mois pièces & main-d'œuvre."}</div>
          <div style="margin-top: 4px;">Merci pour votre confiance !</div>
          <div>www.allotechno.africa</div>
        </div>
      </body>
    </html>
  `;

  const printWindow = window.open("", "_blank", "width=380,height=600");
  if (!printWindow) {
    alert("Veuillez autoriser les fenêtres pop-up pour imprimer le ticket thermique.");
    return;
  }

  printWindow.document.write(receiptHtml);
  printWindow.document.close();
  printWindow.focus();

  // Déclenchement de l'impression automatique après chargement du DOM
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 400);
}
