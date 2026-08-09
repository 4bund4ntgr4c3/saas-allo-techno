import type { Fault } from "@/data/catalog";

export const SERVICE_FEE = 2000; // diagnostic + nettoyage + test complet
export const WARRANTY_RATE = 0.05; // garantie 6 mois pièces & main-d'œuvre
const PARTS_RATE = 0.68;

export type EstimateLine = {
  key: string;
  label: string;
  detail: string;
  amount: number;
};

export type Estimate = {
  lines: EstimateLine[];
  parts: number;
  labor: number;
  service: number;
  warranty: number;
  total: number;
};

/** Décompose le prix catalogue des pannes sélectionnées en pièces / main-d'œuvre / service / garantie. */
export function computeEstimate(faults: Fault[]): Estimate {
  const base = faults.reduce((sum, f) => sum + f.price, 0);
  const parts = Math.round((base * PARTS_RATE) / 100) * 100;
  const labor = base - parts;
  const service = base > 0 ? SERVICE_FEE : 0;
  const warranty = Math.round((base * WARRANTY_RATE) / 100) * 100;

  return {
    parts,
    labor,
    service,
    warranty,
    total: base + service + warranty,
    lines: [
      {
        key: "parts",
        label: "Pièces détachées",
        detail: faults.length
          ? faults.map((f) => f.label).join(" · ")
          : "Aucune panne sélectionnée",
        amount: parts,
      },
      {
        key: "labor",
        label: "Main-d'œuvre",
        detail: `${faults.length} intervention(s) · atelier Abomey-Calavi`,
        amount: labor,
      },
      {
        key: "service",
        label: "Service atelier",
        detail: "Diagnostic, nettoyage interne et tests de sortie",
        amount: service,
      },
      {
        key: "warranty",
        label: "Garantie 6 mois",
        detail: "Pièces et main-d'œuvre couvertes",
        amount: warranty,
      },
    ],
  };
}
