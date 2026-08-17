// ============================================================================
// Allô Techno — Réseau de Points Relais Partenaires (Dépôt & Retrait Express)
// Lieux de collecte partenaires sécurisés à Cotonou, Calavi, Porto-Novo, Parakou.
// ============================================================================

export interface DropOffPoint {
  id: string;
  name: string;
  type: "coworking" | "librairie" | "boutique_tech" | "campus";
  city: "Cotonou" | "Abomey-Calavi" | "Porto-Novo" | "Parakou";
  neighborhood: string;
  address: string;
  openingHours: string;
  phone: string;
  shuttlePickupTime: string;
  hasFreeWifi: boolean;
}

export const DROP_OFF_POINTS: DropOffPoint[] = [
  {
    id: "relay-cot-01",
    name: "Espace Coworking Le Hub",
    type: "coworking",
    city: "Cotonou",
    neighborhood: "Haie Vive / Cocotiers",
    address: "Rue 340, derrière Restaurant Le Living",
    openingHours: "Lun - Sam : 08h00 - 20h00",
    phone: "+229 97 00 11 22",
    shuttlePickupTime: "11h00 & 16h30 quotidiennes",
    hasFreeWifi: true,
  },
  {
    id: "relay-cot-02",
    name: "TechStore Ganhi",
    type: "boutique_tech",
    city: "Cotonou",
    neighborhood: "Ganhi / Centre des Affaires",
    address: "Avenue Clozel, face Immeuble BOA",
    openingHours: "Lun - Ven : 08h30 - 18h30",
    phone: "+229 95 22 33 44",
    shuttlePickupTime: "12h00 quotidienne",
    hasFreeWifi: false,
  },
  {
    id: "relay-cal-01",
    name: "Campus Hub Zogbadjè",
    type: "campus",
    city: "Abomey-Calavi",
    neighborhood: "Zogbadjè / UAC",
    address: "Carrefour Débarcadère, en face entrée UAC",
    openingHours: "Lun - Sam : 07h30 - 21h00",
    phone: "+229 61 44 55 66",
    shuttlePickupTime: "10h00 & 15h00 quotidiennes",
    hasFreeWifi: true,
  },
  {
    id: "relay-pnv-01",
    name: "Cyber Espace Ouando",
    type: "boutique_tech",
    city: "Porto-Novo",
    neighborhood: "Ouando / Marché",
    address: "Boulevard Lagunaire, face Pharmacie Ouando",
    openingHours: "Lun - Sam : 08h00 - 19h00",
    phone: "+229 96 77 88 99",
    shuttlePickupTime: "14h00 (du Lundi au Vendredi)",
    hasFreeWifi: true,
  },
];
