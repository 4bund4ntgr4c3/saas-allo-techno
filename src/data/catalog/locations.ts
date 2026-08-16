// ============================================================================
// Allô Techno — Base des Zones de Couverture & Délais d'Intervention
// Communes et quartiers du Grand Cotonou, Abomey-Calavi et Porto-Novo.
// ============================================================================

export interface CoverageZone {
  id: string;
  commune: string;
  quartier: string;
  estimatedArrivalMinutes: number;
  expressAvailable: boolean;
  baseDeliveryFeeFcfa: number;
}

export const COVERAGE_ZONES: CoverageZone[] = [
  // ── Abomey-Calavi (Zone Atelier & Proximité Immédiate) ──
  { id: "calavi-zogbadje", commune: "Abomey-Calavi", quartier: "Zogbadjè / UAC", estimatedArrivalMinutes: 15, expressAvailable: true, baseDeliveryFeeFcfa: 1000 },
  { id: "calavi-centre", commune: "Abomey-Calavi", quartier: "Calavi Centre / Kpota", estimatedArrivalMinutes: 20, expressAvailable: true, baseDeliveryFeeFcfa: 1000 },
  { id: "calavi-tankpe", commune: "Abomey-Calavi", quartier: "Tankpè / Parana", estimatedArrivalMinutes: 20, expressAvailable: true, baseDeliveryFeeFcfa: 1000 },
  { id: "calavi-arconville", commune: "Abomey-Calavi", quartier: "Arconville / Zoundja", estimatedArrivalMinutes: 25, expressAvailable: true, baseDeliveryFeeFcfa: 1500 },
  { id: "calavi-godomey", commune: "Abomey-Calavi", quartier: "Godomey / Togoudo", estimatedArrivalMinutes: 25, expressAvailable: true, baseDeliveryFeeFcfa: 1500 },

  // ── Cotonou (Centre d'Affaires & Quartiers Résidentiels) ──
  { id: "cotonou-haie-vive", commune: "Cotonou", quartier: "Haie Vive / Les Cocotiers", estimatedArrivalMinutes: 30, expressAvailable: true, baseDeliveryFeeFcfa: 2000 },
  { id: "cotonou-ganhi", commune: "Cotonou", quartier: "Ganhi / Marina / Zone Commerciale", estimatedArrivalMinutes: 35, expressAvailable: true, baseDeliveryFeeFcfa: 2000 },
  { id: "cotonou-cadjehoun", commune: "Cotonou", quartier: "Cadjèhoun / Patte d'Oie", estimatedArrivalMinutes: 30, expressAvailable: true, baseDeliveryFeeFcfa: 2000 },
  { id: "cotonou-saint-michel", commune: "Cotonou", quartier: "Saint-Michel / Gbégamey", estimatedArrivalMinutes: 30, expressAvailable: true, baseDeliveryFeeFcfa: 2000 },
  { id: "cotonou-menontin", commune: "Cotonou", quartier: "Ménontin / Sainte Rita", estimatedArrivalMinutes: 25, expressAvailable: true, baseDeliveryFeeFcfa: 1500 },
  { id: "cotonou-vedoko", commune: "Cotonou", quartier: "Vèdoko / Kouhounou (Stade)", estimatedArrivalMinutes: 25, expressAvailable: true, baseDeliveryFeeFcfa: 1500 },
  { id: "cotonou-akpakpa", commune: "Cotonou", quartier: "Akpakpa / PK3 / Avotrou", estimatedArrivalMinutes: 45, expressAvailable: true, baseDeliveryFeeFcfa: 2500 },
  { id: "cotonou-agla", commune: "Cotonou", quartier: "Agla / Fidjrossè / Plage", estimatedArrivalMinutes: 30, expressAvailable: true, baseDeliveryFeeFcfa: 2000 },

  // ── Ouidah & Porto-Novo ──
  { id: "porto-novo-centre", commune: "Porto-Novo", quartier: "Porto-Novo Centre / Ouando", estimatedArrivalMinutes: 60, expressAvailable: false, baseDeliveryFeeFcfa: 3500 },
  { id: "ouidah-centre", commune: "Ouidah", quartier: "Ouidah Centre / Kpassè", estimatedArrivalMinutes: 60, expressAvailable: false, baseDeliveryFeeFcfa: 3500 },
];

export function findCoverageByQuartier(query: string): CoverageZone[] {
  const q = query.toLowerCase().trim();
  if (!q) return COVERAGE_ZONES;
  return COVERAGE_ZONES.filter(
    (z) =>
      z.quartier.toLowerCase().includes(q) ||
      z.commune.toLowerCase().includes(q),
  );
}
