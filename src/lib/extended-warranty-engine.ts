// ============================================================================
// Allô Techno — Extension de Garantie & Assurance Sinistres (« Allô Care+ »)
// Couverture tout-inclus casse écran, liquide renversé et surtension orage SBEE.
// ============================================================================

export interface CarePlusPlan {
  planId: "care_plus_12m" | "care_plus_24m";
  durationMonths: number;
  pricePerYearFcfa: number;
  coverageFeatures: string[];
  deductibleFcfa: number;
  freeScreenReplacementsPerYear: number;
}

export const CARE_PLUS_PLANS: CarePlusPlan[] = [
  {
    planId: "care_plus_12m",
    durationMonths: 12,
    pricePerYearFcfa: 29000,
    coverageFeatures: [
      "1 Remplacement d'Écran ou Dalle Retina sans franchise par an",
      "Désoxydation Ultrasons & Sauvetage Carte Mère (Liquide renversé)",
      "Prise en charge directe des pannes dues aux surtensions électriques SBEE",
      "Prêt prioritaire d'un ordinateur de secours sous 2h",
    ],
    deductibleFcfa: 0,
    freeScreenReplacementsPerYear: 1,
  },
  {
    planId: "care_plus_24m",
    durationMonths: 24,
    pricePerYearFcfa: 49000,
    coverageFeatures: [
      "2 Remplacements d'Écran ou Dalle Retina sans franchise (1/an)",
      "Protection Totale Liquide, Chutes et Surtensions SBEE",
      "Remplacement gratuit de la batterie si santé < 80%",
      "Assistance VIP Prioritaire 7j/7 avec coursier dédié",
    ],
    deductibleFcfa: 0,
    freeScreenReplacementsPerYear: 2,
  },
];
