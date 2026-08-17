// ============================================================================
// Allô Techno — Suivi Logistique des Pièces Détachées & Commandes Fournisseurs
// Traçabilité des composants en transit international et en dédouanement à Cotonou.
// ============================================================================

export type PartTransitStatus =
  "commande_validee" | "en_transit_aerien" | "en_douane_cotonou" | "arrive_atelier" | "installe";

export interface TrackedPart {
  id: string;
  ticketReference: string;
  partName: string;
  deviceTarget: string;
  originHub: "Dubaï" | "Shenzhen" | "Paris Roissy" | "Stock Local Cotonou";
  carrier: "DHL Express" | "FedEx" | "Fret Aérien Cadjèhoun" | "Coursier Interne";
  trackingNumber: string;
  status: PartTransitStatus;
  estimatedArrivalDays: number;
  updatedAt: string;
}

export const MOCK_TRACKED_PARTS: TrackedPart[] = [
  {
    id: "part-001",
    ticketReference: "SAV-8492",
    partName: 'Dalle Écran Retina Liquid 14.2" (A2442)',
    deviceTarget: "MacBook Pro 14 M1 Pro",
    originHub: "Dubaï",
    carrier: "DHL Express",
    trackingNumber: "DHL-984210948",
    status: "en_douane_cotonou",
    estimatedArrivalDays: 1,
    updatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    id: "part-002",
    ticketReference: "SAV-8501",
    partName: "Batterie Originale 86Wh Dell XPS 15 (9500)",
    deviceTarget: "Dell XPS 15 9500",
    originHub: "Paris Roissy",
    carrier: "FedEx",
    trackingNumber: "FDX-773419082",
    status: "en_transit_aerien",
    estimatedArrivalDays: 2,
    updatedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
  {
    id: "part-003",
    ticketReference: "SAV-8514",
    partName: "Clavier Rétroéclairé Azerty ThinkPad T14 Gen 3",
    deviceTarget: "Lenovo ThinkPad T14",
    originHub: "Shenzhen",
    carrier: "DHL Express",
    trackingNumber: "DHL-339014881",
    status: "commande_validee",
    estimatedArrivalDays: 5,
    updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "part-004",
    ticketReference: "SAV-8470",
    partName: "Module Connecteur USB-C / MagSafe 3",
    deviceTarget: "MacBook Air M2",
    originHub: "Stock Local Cotonou",
    carrier: "Coursier Interne",
    trackingNumber: "LOC-COO-012",
    status: "arrive_atelier",
    estimatedArrivalDays: 0,
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
];
