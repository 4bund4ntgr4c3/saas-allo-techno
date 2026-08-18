// ============================================================================
// Allô Techno — Pass Coupe-File & Conciergerie VIP Express 45 Minutes
// Prise en charge sans attente et dépannage prioritaire pour dirigeants et pros.
// ============================================================================

export interface FastTrackOption {
  optionId: "fast_track_atelier" | "fast_track_sur_site_vip";
  title: string;
  delayMinutes: number;
  priceFcfa: number;
  perks: string[];
}

export const FAST_TRACK_OPTIONS: FastTrackOption[] = [
  {
    optionId: "fast_track_atelier",
    title: "Pass Coupe-File Atelier (45 Minutes)",
    delayMinutes: 45,
    priceFcfa: 15000,
    perks: [
      "Prise en charge immédiate au comptoir sans file d'attente",
      "Banc technique dédié et technicien affecté instantanément",
      "Remplacement écran ou batterie effectué sous vos yeux en salon VIP",
      "Café Nespresso & Wi-Fi très haut débit fibre offert",
    ],
  },
  {
    optionId: "fast_track_sur_site_vip",
    title: "Conciergerie VIP Déplacement d'Urgence",
    delayMinutes: 60,
    priceFcfa: 35000,
    perks: [
      "Dépêche d'un ingénieur senior directement à votre bureau ou domicile",
      "Mallette d'intervention complète avec pièces neuves d'origine",
      "Prêt immédiat d'un MacBook ou Dell de secours pendant l'intervention",
      "Disponible 7j/7 jusqu'à 22h sur Grand Cotonou et Calavi",
    ],
  },
];
