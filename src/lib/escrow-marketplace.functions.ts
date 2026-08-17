// ============================================================================
// Allô Techno — Marketplace d'Occasion Certifiée & Compte Séquestre (Escrow)
// Tiers de confiance avec contrôle technique atelier en 45 points et garantie 6 mois.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";

export interface EscrowListing {
  listingId: string;
  sellerType: "Entreprise (Flotte Déclassée)" | "Particulier";
  deviceTitle: string;
  specsSummary: string;
  askingPriceFcfa: number;
  marketEstimatedPriceFcfa: number;
  inspectionPassedPoints: number; // ex: 45/45 points
  escrowStatus: "disponible_sequestre" | "fonds_bloques" | "en_expertise_atelier" | "livre_garanti";
  warrantyMonths: number;
}

export const MOCK_ESCROW_LISTINGS: EscrowListing[] = [
  {
    listingId: "ESC-8921",
    sellerType: "Entreprise (Flotte Déclassée)",
    deviceTitle: "Dell Latitude 5420 (Intel Core i5-1145G7 / 16 Go RAM / 512 Go NVMe)",
    specsSummary: "Écran FHD IPS 14'', Batterie neuve d'origine, Clavier rétroéclairé, Windows 11 Pro légal",
    askingPriceFcfa: 245000,
    marketEstimatedPriceFcfa: 280000,
    inspectionPassedPoints: 45,
    escrowStatus: "disponible_sequestre",
    warrantyMonths: 6,
  },
  {
    listingId: "ESC-7740",
    sellerType: "Particulier",
    deviceTitle: "Apple MacBook Pro 13'' M1 (16 Go RAM Unifiée / 256 Go SSD)",
    specsSummary: "Gris Sidéral, Batterie 92% de santé (142 cycles), Bloc chargeur Apple 61W d'origine",
    askingPriceFcfa: 490000,
    marketEstimatedPriceFcfa: 560000,
    inspectionPassedPoints: 45,
    escrowStatus: "disponible_sequestre",
    warrantyMonths: 6,
  },
  {
    listingId: "ESC-6310",
    sellerType: "Entreprise (Flotte Déclassée)",
    deviceTitle: "Lenovo ThinkPad T14 Gen 2 (AMD Ryzen 5 Pro / 16 Go / 256 Go SSD)",
    specsSummary: "Châssis magnésium renforcé, Port RJ45 Gigabit natif, TrackPoint précis, Webcam Cache Privacy",
    askingPriceFcfa: 260000,
    marketEstimatedPriceFcfa: 310000,
    inspectionPassedPoints: 45,
    escrowStatus: "disponible_sequestre",
    warrantyMonths: 6,
  },
];

export const getEscrowListingsFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ listings: EscrowListing[]; totalVerifiedCount: number }> => {
    return {
      listings: MOCK_ESCROW_LISTINGS,
      totalVerifiedCount: MOCK_ESCROW_LISTINGS.length,
    };
  },
);
