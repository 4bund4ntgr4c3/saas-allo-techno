// Services complémentaires de l'atelier (hors réparation matérielle).
// Bilingue FR/EN : le label, le court descriptif et les points forts sont
// choisis selon la langue dans la page d'affichage.
export type CatalogService = {
  slug: string;
  icon: string;
  label_fr: string;
  label_en: string;
  short_fr: string;
  short_en: string;
  price: number;
  duration: string;
  bullet_fr: string[];
  bullet_en: string[];
};

export const SERVICES: CatalogService[] = [
  {
    slug: "nettoyage",
    icon: "spray",
    label_fr: "Nettoyage d'appareil",
    label_en: "Device cleaning",
    short_fr: "Nettoyage complet intérieur et extérieur (contacts, connecteurs).",
    short_en: "Full internal and external cleaning (contacts, connectors).",
    price: 5000,
    duration: "1 h",
    bullet_fr: [
      "Contacts et connecteurs nettoyés",
      "Dépoussiérage extérieur",
      "Conseils d'entretien",
    ],
    bullet_en: ["Cleaned contacts and connectors", "External dusting", "Care tips"],
  },
  {
    slug: "transfert-donnees",
    icon: "transfer",
    label_fr: "Transfert de données",
    label_en: "Data transfer",
    short_fr: "Transfert de vos photos, contacts, applications et fichiers.",
    short_en: "Transfer of your photos, contacts, apps and files.",
    price: 3000,
    duration: "30 min",
    bullet_fr: ["Contacts, SMS et photos", "D'un appareil à l'autre", "Sécurité de vos fichiers"],
    bullet_en: ["Contacts, SMS and photos", "From one device to another", "Your files kept safe"],
  },
  {
    slug: "sauvegarde-recuperation",
    icon: "backup",
    label_fr: "Sauvegarde & récupération de données",
    label_en: "Data backup & recovery",
    short_fr: "Sauvegarde sécurisée ou récupération de données perdues.",
    short_en: "Secure backup or recovery of lost data.",
    price: 15000,
    duration: "Selon volume",
    bullet_fr: [
      "Récupération après perte",
      "Sauvegarde sur support",
      "Données sensibles protégées",
    ],
    bullet_en: ["Recovery after loss", "Backup on a support", "Sensitive data protected"],
  },
  {
    slug: "reset-usine",
    icon: "reset",
    label_fr: "Reset usine sécurisé",
    label_en: "Secure factory reset",
    short_fr: "Réinitialisation complète avec sauvegarde préalable de vos données.",
    short_en: "Full reset with a prior backup of your data.",
    price: 3000,
    duration: "30 min",
    bullet_fr: [
      "Sauvegarde avant reset",
      "Réactivation propre du système",
      "Appareil remis en état d'usine",
    ],
    bullet_en: [
      "Backup before reset",
      "Clean system reinstall",
      "Device restored to factory state",
    ],
  },
  {
    slug: "pc-tune-up",
    icon: "cpu",
    label_fr: "PC tune-up (nettoyage & performance)",
    label_en: "PC tune-up (cleaning & performance)",
    short_fr: "Accélération de votre PC : nettoyage, mise à jour, optimisation.",
    short_en: "Speed up your PC: cleaning, updates, optimization.",
    price: 8000,
    duration: "1 h 30",
    bullet_fr: ["Nettoyage du disque", "Mise à jour des pilotes", "Optimisation du démarrage"],
    bullet_en: ["Disk cleanup", "Driver updates", "Startup optimization"],
  },
  {
    slug: "antivirus-logiciel",
    icon: "shield",
    label_fr: "Antivirus & installation logiciel",
    label_en: "Virus removal & software install",
    short_fr: "Suppression de virus et installation de vos logiciels.",
    short_en: "Virus removal and installation of your software.",
    price: 7000,
    duration: "1 h",
    bullet_fr: [
      "Suppression de malwares",
      "Installation d'un antivirus",
      "Installation de vos logiciels",
    ],
    bullet_en: ["Malware removal", "Antivirus installation", "Installation of your software"],
  },
];
