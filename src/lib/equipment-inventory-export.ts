// ============================================================================
// Allô Techno — Export d'Inventaire de Flotte Informatique (Excel XLSX)
// Téléchargement pour DSI, audits fiscaux et inventaires comptables annuels.
// ============================================================================

import * as XLSX from "xlsx";

export interface FleetDeviceExportItem {
  id: string;
  brand: string;
  model: string;
  serialNumber: string;
  assignedUser: string;
  department: string;
  acquisitionDate: string;
  healthScorePercent: number;
  slaStatus: "Protégé SLA Platine" | "Protégé SLA Gold" | "Hors Contrat" | "En Atelier";
  estimatedValueFcfa: number;
}

export function exportFleetInventoryToExcel(companyName: string, devices: FleetDeviceExportItem[]) {
  const rows = devices.map((d) => ({
    "ID Actif": d.id,
    Marque: d.brand,
    Modèle: d.model,
    "N° de Série (S/N)": d.serialNumber,
    "Utilisateur / Poste": d.assignedUser,
    Département: d.department,
    "Date Acquisition": d.acquisitionDate,
    "Score Santé (%)": `${d.healthScorePercent}%`,
    "Statut SLA": d.slaStatus,
    "Valeur Vénale (FCFA)": d.estimatedValueFcfa,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventaire Flotte IT");

  // Ajustement largeur des colonnes
  worksheet["!cols"] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 22 },
    { wch: 20 },
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 20 },
    { wch: 18 },
  ];

  XLSX.writeFile(
    workbook,
    `Inventaire_Flotte_${companyName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}
