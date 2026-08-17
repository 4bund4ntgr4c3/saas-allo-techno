// ============================================================================
// Allô Techno — Hub des Pilotes & Utilitaires Utiles (Allô Toolbox)
// Sélection d'outils certifiés sans malwares ni publicités pour clients et pros.
// ============================================================================

export interface ToolItem {
  id: string;
  name: string;
  category: "diagnostic" | "pilotes" | "securite" | "clonage_ssd";
  description: string;
  os: "Windows & Mac" | "Windows" | "macOS" | "Multiplateforme";
  version: string;
  fileSize: string;
  downloadUrl: string;
  isOfficial: boolean;
}

export const USEFUL_TOOLS: ToolItem[] = [
  {
    id: "tool-crystaldisk",
    name: "CrystalDiskInfo Standard",
    category: "diagnostic",
    description: "Vérifie la santé de votre disque dur ou SSD (S.M.A.R.T., température, secteurs défectueux).",
    os: "Windows",
    version: "v9.3.2",
    fileSize: "5.4 Mo",
    downloadUrl: "https://crystalmark.info/en/software/crystaldiskinfo/",
    isOfficial: true,
  },
  {
    id: "tool-coconut",
    name: "coconutBattery for Mac",
    category: "diagnostic",
    description: "Affiche le nombre exact de cycles de recharge, la capacité résiduelle en mAh et la santé de la batterie Mac/iPhone.",
    os: "macOS",
    version: "v3.9.12",
    fileSize: "12.8 Mo",
    downloadUrl: "https://www.coconut-flavour.com/coconutbattery/",
    isOfficial: true,
  },
  {
    id: "tool-adwcleaner",
    name: "Malwarebytes AdwCleaner",
    category: "securite",
    description: "Élimine les logiciels publicitaires (Adware), barres d'outils indésirables et pirates de navigateur.",
    os: "Windows",
    version: "v8.4.1",
    fileSize: "8.2 Mo",
    downloadUrl: "https://www.malwarebytes.com/adwcleaner",
    isOfficial: true,
  },
  {
    id: "tool-clonezilla",
    name: "Clonezilla Live ISO",
    category: "clonage_ssd",
    description: "Outil professionnel pour cloner un disque dur HDD vers un SSD ultra-rapide sans perdre ses données.",
    os: "Multiplateforme",
    version: "v3.1.2",
    fileSize: "380 Mo",
    downloadUrl: "https://clonezilla.org/downloads.php",
    isOfficial: true,
  },
  {
    id: "tool-anydesk",
    name: "AnyDesk Assistance à Distance",
    category: "securite",
    description: "Permet à notre atelier de prendre la main à distance sur votre PC/Mac pour un dépannage express.",
    os: "Windows & Mac",
    version: "v8.0.8",
    fileSize: "4.1 Mo",
    downloadUrl: "https://anydesk.com/fr/downloads",
    isOfficial: true,
  },
];
