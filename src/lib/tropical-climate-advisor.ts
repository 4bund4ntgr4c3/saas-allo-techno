// ============================================================================
// Allô Techno Pro — Conseiller Préventif Climat Tropical Bénin & Afrique de l'Ouest
// Analyse de la saisonnalité climatique (Harmattan, Mousson, Humidité côtière)
// et génération de recommandations proactives pour la protection du parc informatique.
// ============================================================================

export type ClimateSeason = "harmattan" | "mousson_pluie" | "chaleur_transition";

export interface ClimateAdvisory {
  seasonKey: ClimateSeason;
  title: string;
  seasonLabel: string;
  weatherIndicator: string;
  riskFactor: "Élevé" | "Moyen" | "Critique";
  mainThreats: string[];
  recommendedActions: string[];
  suggestedService: string;
}

export function getCurrentTropicalClimateAdvisory(currentMonth = new Date().getMonth() + 1): ClimateAdvisory {
  // Mois 11, 12, 1, 2 : Harmattan (Poussière fine & Air sec)
  if ([11, 12, 1, 2].includes(currentMonth)) {
    return {
      seasonKey: "harmattan",
      title: "Vigilance Poussière & Harmattan",
      seasonLabel: "Saison de l'Harmattan (Nov — Fév)",
      weatherIndicator: "Poussière saharienne fine · Air sec",
      riskFactor: "Élevé",
      mainThreats: [
        "Encrassement critique des radiateurs et ventilateurs de laptops et serveurs",
        "Dessèchement accéléré de la pâte thermique CPU/GPU",
        "Surchauffe silencieuse et arrêt brutal par sécurité thermique",
      ],
      recommendedActions: [
        "Planifier un dépoussiérage intégral sous air comprimé des machines de bureau",
        "Remplacer la pâte thermique sur les ordinateurs de plus de 18 mois",
        "Éviter de poser les ordinateurs portables sur des surfaces textiles",
      ],
      suggestedService: "Maintenance Préventive Dépoussiérage & Repasting Pro",
    };
  }

  // Mois 4, 5, 6, 7, 9, 10 : Saison des Pluies & Forte Humidité Côtière
  if ([4, 5, 6, 7, 9, 10].includes(currentMonth)) {
    return {
      seasonKey: "mousson_pluie",
      title: "Vigilance Humidité Côtière & Orages",
      seasonLabel: "Saison des Pluies & Mousson (Avr — Juil / Sep — Oct)",
      weatherIndicator: "Humidité relative > 85% · Risque de foudre",
      riskFactor: "Critique",
      mainThreats: [
        "Micro-oxydation des connecteurs USB, RAM et circuits imprimés",
        "Surtensions électriques destructrices dues aux orages violents",
        "Moisissures et corrosion saline accélérée près du littoral (Cotonou / Calavi)",
      ],
      recommendedActions: [
        "Vérifier le bon fonctionnement des régulateurs de tension et onduleurs (UPS)",
        "Installer des sachets déshydratants dans les baies serveurs et armoires réseau",
        "Débrancher les chargeurs et prises RJ45 lors d'orages intenses",
      ],
      suggestedService: "Audit Électrique, Onduleurs & Désoxydation Cartes Mères",
    };
  }

  // Mois 3, 8 : Périodes de transition & Fortes Chaleurs
  return {
    seasonKey: "chaleur_transition",
    title: "Vigilance Forte Chaleur & Batteries Lithium",
    seasonLabel: "Période Chaude & Transition",
    weatherIndicator: "Températures > 34°C à l'ombre",
    riskFactor: "Moyen",
    mainThreats: [
      "Gonflement des batteries lithium sous l'effet de la chaleur ambiante",
      "Dégradation prématurée de l'autonomie et risque de déformation du châssis",
      "Ralentissement thermique (thermal throttling) lors des tâches lourdes",
    ],
    recommendedActions: [
      "Inspecter les claviers et trackpads pour détecter tout gonflement de batterie",
      "Favoriser un environnement de travail ventilé ou climatisé",
      "Éviter de laisser des appareils dans un véhicule fermé au soleil",
    ],
    suggestedService: "Diagnostic Santé Batteries & Remplacement Certifié Allô Techno",
  };
}
