// ============================================================================
// Allô Techno — Registre Métrologique & Étalonnage Atelier (Norme ISO 9001)
// Contrôle de précision des stations JBC, alimentations DC et caméras thermiques.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { rateLimit } from "@/lib/security";

export interface CalibrationRecord {
  equipmentId: string;
  instrumentName: string;
  brandModel: string;
  measuredTolerance: string;
  lastCalibrationDate: string;
  nextCalibrationDueDate: string;
  calibratedBy: string;
  certificateRef: string;
  status: "conforme_certifié" | "recalibration_requise";
}

export const MOCK_CALIBRATIONS: CalibrationRecord[] = [
  {
    equipmentId: "METRO-01",
    instrumentName: "Station de Soudage & Dessoudage Haute Fréquence",
    brandModel: "JBC CD-2BQF (Précision Température ± 1.5°C)",
    measuredTolerance: "ΔT = +0.4°C (Tolérance max admissible : ± 2.0°C)",
    lastCalibrationDate: "10 Juillet 2026",
    nextCalibrationDueDate: "10 Janvier 2027",
    calibratedBy: "Laboratoire National de Métrologie (Bénin)",
    certificateRef: "CERT-METRO-BJ-2026-892",
    status: "conforme_certifié",
  },
  {
    equipmentId: "METRO-02",
    instrumentName: "Caméra Thermique Infrarouge Diagnostic Carte Mère",
    brandModel: "FLIR E8-XT (Résolution 320x240 / Sensibilité 0.05°C)",
    measuredTolerance: "Écart de mesure corps noir : 0.02°C",
    lastCalibrationDate: "14 Juin 2026",
    nextCalibrationDueDate: "14 Décembre 2026",
    calibratedBy: "Bureau Veritas Bénin",
    certificateRef: "CERT-BV-2026-10492",
    status: "conforme_certifié",
  },
  {
    equipmentId: "METRO-03",
    instrumentName: "Alimentation Stabilisée de Laboratoire 0-30V / 5A",
    brandModel: "Rigol DP832A (Ondulation résiduelle < 350uVrms)",
    measuredTolerance: "Dérive en tension : 0.003 V",
    lastCalibrationDate: "05 Août 2026",
    nextCalibrationDueDate: "05 Février 2027",
    calibratedBy: "Ingénieur Qualité Allô Techno",
    certificateRef: "CERT-AT-QA-2026-441",
    status: "conforme_certifié",
  },
];

export const getMetrologyRecordsFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ records: CalibrationRecord[]; overallCompliancePercent: number }> => {
    if (!(await rateLimit("get-metrology-records", 60))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    return {
      records: MOCK_CALIBRATIONS,
      overallCompliancePercent: 100,
    };
  },
);
