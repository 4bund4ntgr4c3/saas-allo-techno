import * as XLSX from "xlsx";

export type RawEquipmentImportRow = {
  type?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  imei?: string;
  purchase_date?: string;
  site_name?: string;
  notes?: string;
};

export type ValidatedEquipmentItem = {
  type: "smartphone" | "laptop" | "tablet" | "printer" | "desktop" | "server" | "other";
  brand: string;
  model: string;
  serial_number: string;
  imei?: string | null;
  purchase_date?: string | null;
  site_name?: string | null;
  status: "active" | "maintenance" | "decommissioned";
  notes?: string | null;
  isValid: boolean;
  errors: string[];
};

export type ImportSummary = {
  totalRows: number;
  validRows: ValidatedEquipmentItem[];
  invalidRows: ValidatedEquipmentItem[];
  duplicatesCount: number;
};

function normalizeType(input?: string): ValidatedEquipmentItem["type"] {
  if (!input) return "other";
  const val = input.toLowerCase().trim();
  if (val.includes("phone") || val.includes("mobile") || val.includes("smartphone")) return "smartphone";
  if (val.includes("portable") || val.includes("laptop") || val.includes("pc portable")) return "laptop";
  if (val.includes("tablette") || val.includes("ipad") || val.includes("tablet")) return "tablet";
  if (val.includes("imprimante") || val.includes("printer")) return "printer";
  if (val.includes("bureau") || val.includes("desktop") || val.includes("tour")) return "desktop";
  if (val.includes("serveur") || val.includes("server")) return "server";
  return "other";
}

export function parseEquipmentFile(fileBuffer: ArrayBuffer): ImportSummary {
  const workbook = XLSX.read(fileBuffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return { totalRows: 0, validRows: [], invalidRows: [], duplicatesCount: 0 };
  }

  const worksheet = workbook.Sheets[firstSheetName];
  if (!worksheet) {
    return { totalRows: 0, validRows: [], invalidRows: [], duplicatesCount: 0 };
  }
  const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

  const seenSerials = new Set<string>();
  let duplicatesCount = 0;

  const validRows: ValidatedEquipmentItem[] = [];
  const invalidRows: ValidatedEquipmentItem[] = [];

  jsonRows.forEach((row) => {
    // Map dynamic column names flexibly
    const rawType = String(row["Type"] || row["type"] || row["Catégorie"] || "");
    const rawBrand = String(row["Marque"] || row["brand"] || row["Constructeur"] || "");
    const rawModel = String(row["Modèle"] || row["model"] || row["Designation"] || "");
    const rawSerial = String(row["Série"] || row["serial_number"] || row["N° Série"] || row["Serial"] || "");
    const rawImei = row["IMEI"] || row["imei"] ? String(row["IMEI"] || row["imei"]) : undefined;
    const rawSite = row["Site"] || row["site_name"] ? String(row["Site"] || row["site_name"]) : undefined;
    const rawNotes = row["Notes"] || row["notes"] ? String(row["Notes"] || row["notes"]) : undefined;

    const errors: string[] = [];

    if (!rawBrand.trim()) errors.push("Marque manquante");
    if (!rawModel.trim()) errors.push("Modèle manquant");
    if (!rawSerial.trim()) errors.push("N° de série / Identifiant manquant");

    if (rawSerial && seenSerials.has(rawSerial.trim().toUpperCase())) {
      errors.push("Doublon détecté dans le fichier (N° Série identique)");
      duplicatesCount++;
    } else if (rawSerial) {
      seenSerials.add(rawSerial.trim().toUpperCase());
    }

    const item: ValidatedEquipmentItem = {
      type: normalizeType(rawType),
      brand: rawBrand.trim() || "Inconnue",
      model: rawModel.trim() || "Modèle Générique",
      serial_number: rawSerial.trim(),
      imei: rawImei?.trim() || null,
      site_name: rawSite?.trim() || null,
      status: "active",
      notes: rawNotes?.trim() || null,
      isValid: errors.length === 0,
      errors,
    };

    if (item.isValid) {
      validRows.push(item);
    } else {
      invalidRows.push(item);
    }
  });

  return {
    totalRows: jsonRows.length,
    validRows,
    invalidRows,
    duplicatesCount,
  };
}
