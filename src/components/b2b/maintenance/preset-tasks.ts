export type EquipmentCategory =
  "laptop" | "desktop" | "server" | "printer" | "smartphone" | "network_ups";

export type MaintenanceType = "preventive" | "curative" | "upgrade" | "audit";

export interface CheckpointTask {
  id: string;
  label: string;
  category: "hardware" | "thermal" | "storage_battery" | "software_security" | "network_tests";
  description?: string;
}

export interface MaintenanceCategoryConfig {
  id: EquipmentCategory;
  name: string;
  iconName: string;
  description: string;
  recommendedFrequencyMonths: number;
  tasks: CheckpointTask[];
}

export const MAINTENANCE_PROTOCOLS: Record<EquipmentCategory, MaintenanceCategoryConfig> = {
  laptop: {
    id: "laptop",
    name: "Ordinateurs Portables / Laptops",
    iconName: "Laptop",
    description: "Maintenance préventive complète des PC portables et MacBooks.",
    recommendedFrequencyMonths: 3,
    tasks: [
      {
        id: "lap_dust",
        label: "Dépoussiérage interne & nettoyage turbine / caloducs",
        category: "thermal",
        description: "Élimination des poussières et fibres bloquant l'évacuation thermique.",
      },
      {
        id: "lap_paste",
        label: "Remplacement pâte thermique CPU & GPU (haute conductivité)",
        category: "thermal",
        description:
          "Application pâte thermique neuve pour abaisser la température de fonctionnement.",
      },
      {
        id: "lap_battery",
        label: "Contrôle santé batterie, capacité résiduelle & cycles",
        category: "storage_battery",
        description: "Mesure de l'autonomie réelle et vérification d'absence de gonflement.",
      },
      {
        id: "lap_ssd",
        label: "Audit d'intégrité SSD / NVMe (SMART, secteurs & TBW)",
        category: "storage_battery",
        description: "Vérification de la durée de vie résiduelle du support de stockage.",
      },
      {
        id: "lap_hinges",
        label: "Contrôle serrage charnières & connecteur de charge DC-Jack",
        category: "hardware",
        description: "Prévention des casses mécaniques et faux contacts d'alimentation.",
      },
      {
        id: "lap_screen_kbd",
        label: "Nettoyage clavier, trackpad & traitement antistatique écran",
        category: "hardware",
        description: "Décontamination des surfaces de saisie et nettoyage de la dalle.",
      },
      {
        id: "lap_security",
        label: "Audit antivirus, suppression malwares & mises à jour de sécurité",
        category: "software_security",
        description: "Optimisation du démarrage et contrôle des correctifs système.",
      },
    ],
  },
  desktop: {
    id: "desktop",
    name: "Postes Fixes & Unités Centrales",
    iconName: "Monitor",
    description: "Maintenance des stations de travail, tours bureautiques et gaming.",
    recommendedFrequencyMonths: 4,
    tasks: [
      {
        id: "desk_dust",
        label: "Soufflage complet du boîtier, filtres anti-poussière & ventilation",
        category: "thermal",
        description: "Nettoyage à l'air sec comprimé antistatique.",
      },
      {
        id: "desk_paste",
        label: "Remplacement pâte thermique processeur & radiateur",
        category: "thermal",
        description: "Démontage du ventirad, dégraissage et application thermique neuve.",
      },
      {
        id: "desk_psu",
        label: "Contrôle des tensions de l'alimentation (12V, 5V, 3.3V)",
        category: "hardware",
        description: "Test de stabilité électrique et vérification des condensateurs.",
      },
      {
        id: "desk_ram",
        label: "Test de stabilité des barrettes mémoire RAM (MemTest)",
        category: "hardware",
        description: "Détection précoce d'erreurs mémoire causant des écrans bleus.",
      },
      {
        id: "desk_storage",
        label: "Analyse des disques de données & rapport d'usure SMART",
        category: "storage_battery",
        description: "Surveillance de l'état des disques durs internes et SSD.",
      },
      {
        id: "desk_cable",
        label: "Optimisation du câble management & flux d'air interne",
        category: "hardware",
        description: "Fixation des faisceaux pour améliorer le refroidissement passif.",
      },
      {
        id: "desk_software",
        label: "Nettoyage fichiers temporaires, registre & contrôle des pilotes",
        category: "software_security",
        description: "Allègement de la partition système pour regagner en réactivité.",
      },
    ],
  },
  server: {
    id: "server",
    name: "Serveurs & Baies d'Infrastructure",
    iconName: "Server",
    description: "Protocole haute disponibilité pour serveurs de fichiers, ERP et baies réseau.",
    recommendedFrequencyMonths: 2,
    tasks: [
      {
        id: "srv_raid",
        label: "Vérification statut grappe RAID & intégrité des volumes",
        category: "storage_battery",
        description: "Contrôle d'absence de disque dégradé et cohérence des grappes.",
      },
      {
        id: "srv_turbines",
        label: "Nettoyage des turbines de ventilation hot-swap & radiateurs",
        category: "thermal",
        description: "Dépoussiérage sans interruption de service des modules extractibles.",
      },
      {
        id: "srv_psu",
        label: "Test de bascule des alimentations redondantes (PSU 1 & 2)",
        category: "hardware",
        description: "Vérification de la redondance électrique active.",
      },
      {
        id: "srv_backup",
        label: "Audit des sauvegardes automatiques & simulation de restauration",
        category: "software_security",
        description: "Validation de l'intégrité des archives déportées et cloud.",
      },
      {
        id: "srv_ipmi",
        label: "Audit des journaux d'alertes matérielles (iLO / iDRAC / IPMI)",
        category: "software_security",
        description: "Analyse des avertissements température, mémoire et alimentation.",
      },
      {
        id: "srv_updates",
        label: "Application des correctifs de sécurité OS & microcodes critiques",
        category: "software_security",
        description: "Maintien de la conformité de sécurité de l'infrastructure.",
      },
    ],
  },
  printer: {
    id: "printer",
    name: "Imprimantes & Scanners Réseau",
    iconName: "Printer",
    description: "Entretien mécanique et optique des imprimantes laser, jet d'encre et copieurs.",
    recommendedFrequencyMonths: 3,
    tasks: [
      {
        id: "prn_rollers",
        label: "Nettoyage & dégommage des rouleaux d'entraînement (Pick-up)",
        category: "hardware",
        description: "Élimination des bourrages papier récurrents.",
      },
      {
        id: "prn_toner_waste",
        label: "Dépoussiérage bac de récupération toner & bloc optique laser",
        category: "hardware",
        description: "Nettoyage des résidus de poudre pour éviter les bavures d'impression.",
      },
      {
        id: "prn_glass",
        label: "Nettoyage de la vitre d'exposition & miroir du chargeur auto (ADF)",
        category: "hardware",
        description: "Suppression des lignes noires sur les numérisations et photocopies.",
      },
      {
        id: "prn_calibration",
        label: "Alignement des têtes d'impression & calibrage colorimétrique",
        category: "network_tests",
        description: "Ajustement de la netteté des textes et graphiques.",
      },
      {
        id: "prn_network",
        label: "Contrôle connectivité réseau (IP fixe, partage SMB/Scan to folder)",
        category: "network_tests",
        description: "Test de numérisation directe vers les dossiers partagés des collaborateurs.",
      },
    ],
  },
  smartphone: {
    id: "smartphone",
    name: "Smartphones & Flotte Mobile",
    iconName: "Smartphone",
    description: "Audit d'autonomie, diagnostic capteurs et nettoyage connectique de flotte.",
    recommendedFrequencyMonths: 6,
    tasks: [
      {
        id: "mob_battery",
        label: "Diagnostic de santé batterie (cycles réels & capacité résiduelle)",
        category: "storage_battery",
        description: "Vérification de la courbe de décharge et de l'état chimique.",
      },
      {
        id: "mob_port",
        label: "Nettoyage approfondi port de charge (USB-C / Lightning) & grilles",
        category: "hardware",
        description: "Extraction des peluches et poussières empêchant la charge rapide.",
      },
      {
        id: "mob_screen",
        label: "Contrôle dalle tactile, points de pression & intégrité châssis",
        category: "hardware",
        description: "Inspection visuelle et test multi-touch 10 points.",
      },
      {
        id: "mob_sensors",
        label: "Test capteurs (caméras, micros, haut-parleurs, FaceID / Empreinte)",
        category: "hardware",
        description: "Validation de l'ensemble des modules multimédia et biométrie.",
      },
      {
        id: "mob_security",
        label: "Contrôle espace de stockage, synchronisation Cloud & profil MDM",
        category: "software_security",
        description: "Libération d'espace et vérification du chiffrement de l'appareil.",
      },
    ],
  },
  network_ups: {
    id: "network_ups",
    name: "Onduleurs (UPS) & Réseau Local",
    iconName: "Wifi",
    description: "Protection électrique, armoires de brassage et points d'accès Wi-Fi.",
    recommendedFrequencyMonths: 3,
    tasks: [
      {
        id: "ups_battery",
        label: "Test d'autonomie et mesure de tension des batteries d'onduleur",
        category: "storage_battery",
        description: "Vérification de la capacité à maintenir la charge lors d'une coupure.",
      },
      {
        id: "ups_switch",
        label: "Test de bascule automatique secteur vers batterie sans micro-coupure",
        category: "hardware",
        description: "Contrôle du temps de commutation et des alarmes sonores.",
      },
      {
        id: "net_dust",
        label: "Dépoussiérage switchs, routeurs & baie de brassage",
        category: "thermal",
        description: "Refroidissement optimal des équipements réseau actifs.",
      },
      {
        id: "net_cables",
        label: "Test de continuité des câbles réseau RJ45 & vérification PoE",
        category: "network_tests",
        description: "Détection des câbles endommagés causant des pertes de paquets.",
      },
      {
        id: "net_wifi",
        label: "Audit de couverture Wi-Fi & mesure de bande passante",
        category: "network_tests",
        description: "Cartographie des zones d'ombre et optimisation des canaux radio.",
      },
    ],
  },
};

export const PRESET_TASKS = MAINTENANCE_PROTOCOLS.laptop.tasks.map((t) => t.label);

export const MAINTENANCE_TYPES_CONFIG = [
  {
    id: "preventive" as const,
    name: "Maintenance Préventive Périodique",
    badge: "Préventif Planifié",
    color: "emerald",
    desc: "Révision cyclique selon calendrier, nettoyage physique et audits de sécurité.",
  },
  {
    id: "curative" as const,
    name: "Maintenance Curative / Dépannage Urgence",
    badge: "Curatif Express",
    color: "amber",
    desc: "Intervention sur site ou en atelier pour résolution de panne bloquante.",
  },
  {
    id: "upgrade" as const,
    name: "Upgrade & Évolution Matérielle",
    badge: "Amélioration / Évolution",
    color: "blue",
    desc: "Extension de mémoire RAM, migration vers SSD haute vitesse, nouveau GPU.",
  },
  {
    id: "audit" as const,
    name: "Audit & Diagnostic de Parc",
    badge: "Audit / Bilan de Santé",
    color: "purple",
    desc: "Inventaire exhaustif, notation Health Score et préconisations de renouvellement.",
  },
];
