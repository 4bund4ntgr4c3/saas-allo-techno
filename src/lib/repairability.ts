// ============================================================================
// Allô Techno — Indice de Réparabilité & Économie Circulaire RSE
// Calcul normalisé de l'indice de réparabilité sur 10.
// ============================================================================

export interface RepairabilityScore {
  score: number; // sur 10, ex: 8.4
  grade: "A" | "B" | "C" | "D" | "E";
  colorClass: string;
  disassemblyRating: number; // sur 20
  partsAvailabilityRating: number; // sur 20
  documentationRating: number; // sur 20
  modularComponents: boolean;
  notes: string;
}

export function getDeviceRepairability(modelIdOrBrand: string): RepairabilityScore {
  const query = modelIdOrBrand.toLowerCase();

  if (query.includes("thinkpad") || query.includes("dell latitude") || query.includes("hp elitebook")) {
    return {
      score: 8.8,
      grade: "A",
      colorClass: "bg-emerald-600 text-white border-emerald-700",
      disassemblyRating: 18.5,
      partsAvailabilityRating: 18.0,
      documentationRating: 19.0,
      modularComponents: true,
      notes: "Excellente démontabilité avec vis cruciformes standard, RAM et SSD amovibles, manuels de maintenance officiels publics.",
    };
  }

  if (query.includes("macbook")) {
    return {
      score: 6.5,
      grade: "C",
      colorClass: "bg-amber-500 text-white border-amber-600",
      disassemblyRating: 11.5,
      partsAvailabilityRating: 14.0,
      documentationRating: 12.0,
      modularComponents: false,
      notes: "Composants RAM et SSD soudés sur la carte logique Apple Silicon. Nécessite des compétences avancées de micro-soudure.",
    };
  }

  if (query.includes("iphone") || query.includes("samsung galaxy")) {
    return {
      score: 7.6,
      grade: "B",
      colorClass: "bg-lime-600 text-white border-lime-700",
      disassemblyRating: 14.0,
      partsAvailabilityRating: 17.5,
      documentationRating: 15.0,
      modularComponents: true,
      notes: "Pièces d'origine disponibles sous 24h, écrans et batteries remplaçables avec outillage de précision.",
    };
  }

  // Score moyen par défaut
  return {
    score: 7.5,
    grade: "B",
    colorClass: "bg-emerald-600 text-white border-emerald-700",
    disassemblyRating: 15.0,
    partsAvailabilityRating: 15.0,
    documentationRating: 15.0,
    modularComponents: true,
    notes: "Appareil réparable avec pièces détachées courantes en atelier.",
  };
}
