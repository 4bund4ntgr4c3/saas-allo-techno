// Catalogue Allô Techno — données de démonstration (marques, appareils, pannes,
// tarifs, accessoires, blog, FAQ, avis). Source unique pour tout le site.

export const COMPANY = {
  name: "Allô Techno",
  city: "Abomey-Calavi",
  country: "Bénin",
  address: "Quartier Zogbadjè, Rue de l'Université, Abomey-Calavi, Bénin",
  phone: "+229 01 97 00 00 00",
  whatsapp: "+229 01 97 00 00 00",
  email: "contact@allotechno.bj",
  lat: 6.4489,
  lng: 2.3553,
  hours: [
    { d: "Lundi — Vendredi", h: "08:00 — 19:00" },
    { d: "Samedi", h: "09:00 — 17:00" },
    { d: "Dimanche", h: "Fermé" },
  ],
};

export type Fault = {
  slug: string;
  label: string;
  price: number;
  duration: string;
  warranty: string;
  part: string;
};

export type Device = {
  slug: string;
  name: string;
  brand: string;
  category: string;
  year: number;
  faults: Fault[];
};

export type Brand = {
  slug: string;
  name: string;
  tag: string;
  devices: string[];
};

export const BRANDS: Brand[] = [
  { slug: "apple", name: "Apple", tag: "iPhone 17 · iPad · MacBook · Watch", devices: ["iPhone", "iPad", "MacBook", "iMac", "Apple Watch"] },
  { slug: "samsung", name: "Samsung", tag: "Galaxy S25/S26 · A · Z Fold · Tab", devices: ["Galaxy S", "Galaxy A", "Galaxy Z", "Galaxy Tab", "Galaxy Watch"] },
  { slug: "xiaomi", name: "Xiaomi", tag: "Xiaomi 15 · Redmi Note 14", devices: ["Xiaomi Série", "Redmi Note", "Redmi", "Poco"] },
  { slug: "huawei", name: "Huawei", tag: "Pura · Mate · Nova", devices: ["Pura", "Mate", "Nova"] },
  { slug: "oppo", name: "Oppo", tag: "Reno 13 · A Series", devices: ["Reno", "A Series", "Find"] },
  { slug: "google", name: "Google Pixel", tag: "Pixel 6 à 10", devices: ["Pixel"] },
  { slug: "oneplus", name: "OnePlus", tag: "Nord · Série 13", devices: ["Nord", "Série 13"] },
  { slug: "tecno", name: "Tecno", tag: "Camon 40 · Spark 30 · Phantom", devices: ["Camon", "Spark", "Phantom", "Pova"] },
  { slug: "infinix", name: "Infinix", tag: "Note 50 · Hot 60 · Zero", devices: ["Note", "Hot", "Zero", "Smart"] },
  { slug: "itel", name: "Itel", tag: "A · S · P Series", devices: ["A Series", "S Series", "P Series"] },
  { slug: "nokia", name: "Nokia", tag: "G · X · C Series", devices: ["G Series", "C Series"] },
  { slug: "motorola", name: "Motorola", tag: "Moto G · Edge 50", devices: ["Moto G", "Edge"] },
  { slug: "honor", name: "Honor", tag: "Magic 7 · X Series", devices: ["Magic", "X Series"] },
  { slug: "sony", name: "Sony", tag: "PlayStation 4 · 5 · Xperia", devices: ["PlayStation", "Xperia"] },
  { slug: "nintendo", name: "Nintendo", tag: "Switch · Switch 2", devices: ["Switch"] },
  { slug: "microsoft", name: "Microsoft", tag: "Xbox Series X|S · Surface", devices: ["Xbox", "Surface"] },
  { slug: "hp", name: "HP", tag: "Pavilion · EliteBook · Envy", devices: ["Pavilion", "EliteBook"] },
  { slug: "lenovo", name: "Lenovo", tag: "IdeaPad · ThinkPad · Tab", devices: ["IdeaPad", "ThinkPad"] },
  { slug: "dell", name: "Dell", tag: "XPS · Latitude · Inspiron", devices: ["XPS", "Latitude"] },
];

const f = (
  slug: string,
  label: string,
  price: number,
  duration: string,
  warranty: string,
  part: string,
): Fault => ({ slug, label, price, duration, warranty, part });

export const DEVICES: Device[] = [
  {
    slug: "iphone-13-pro",
    name: "iPhone 13 Pro",
    brand: "apple",
    category: "Smartphone",
    year: 2021,
    faults: [
      f("ecran", "Remplacement écran OLED", 95000, "25 min", "6 mois", "Écran OLED grade A+"),
      f("batterie", "Remplacement batterie", 32000, "30 min", "6 mois", "Batterie 3095 mAh certifiée"),
      f("connecteur", "Connecteur de charge Lightning", 18000, "45 min", "3 mois", "Nappe de charge d'origine"),
      f("camera", "Bloc caméra arrière", 55000, "60 min", "6 mois", "Module triple capteur"),
      f("desoxydation", "Désoxydation carte mère", 20000, "48 h", "1 mois", "Bain ultrasons + reflow"),
    ],
  },
  {
    slug: "iphone-15-pro-max",
    name: "iPhone 15 Pro Max",
    brand: "apple",
    category: "Smartphone",
    year: 2023,
    faults: [
      f("ecran", "Remplacement écran Super Retina XDR", 165000, "35 min", "6 mois", "Écran OLED grade A+"),
      f("batterie", "Remplacement batterie", 45000, "30 min", "6 mois", "Batterie 4441 mAh certifiée"),
      f("connecteur", "Port USB-C", 28000, "50 min", "3 mois", "Nappe USB-C d'origine"),
      f("vitre-arriere", "Vitre arrière", 60000, "90 min", "3 mois", "Verre trempé laminé"),
    ],
  },
  {
    slug: "macbook-air-m1",
    name: "MacBook Air M1",
    brand: "apple",
    category: "Ordinateur portable",
    year: 2020,
    faults: [
      f("clavier", "Clavier complet (topcase)", 115000, "24 h", "1 an", "Topcase AZERTY d'origine"),
      f("ecran", "Dalle Retina 13\"", 195000, "48 h", "6 mois", "Dalle LCD complète"),
      f("batterie", "Batterie 49,9 Wh", 65000, "3 h", "1 an", "Batterie certifiée"),
      f("carte-mere", "Réparation carte mère (micro-soudure)", 85000, "72 h", "3 mois", "Composants CMS"),
    ],
  },
  {
    slug: "imac-24-m1",
    name: "iMac 24\" M1",
    brand: "apple",
    category: "Ordinateur de bureau",
    year: 2021,
    faults: [
      f("alimentation", "Bloc d'alimentation", 78000, "48 h", "6 mois", "Alimentation interne"),
      f("ssd", "Upgrade / remplacement SSD", 95000, "24 h", "1 an", "SSD NVMe 512 Go"),
      f("nettoyage", "Nettoyage complet + pâte thermique", 22000, "6 h", "1 mois", "Pâte thermique premium"),
    ],
  },
  {
    slug: "ipad-air-5",
    name: "iPad Air 5",
    brand: "apple",
    category: "Tablette",
    year: 2022,
    faults: [
      f("ecran", "Vitre tactile + LCD", 105000, "3 h", "6 mois", "Ensemble écran laminé"),
      f("batterie", "Batterie 28,6 Wh", 48000, "4 h", "6 mois", "Batterie certifiée"),
    ],
  },
  {
    slug: "apple-watch-se",
    name: "Apple Watch SE",
    brand: "apple",
    category: "Montre connectée",
    year: 2022,
    faults: [
      f("ecran", "Vitre + écran OLED", 58000, "24 h", "3 mois", "Ensemble écran OLED"),
      f("batterie", "Batterie", 28000, "24 h", "3 mois", "Batterie certifiée"),
    ],
  },
  {
    slug: "galaxy-s21",
    name: "Samsung Galaxy S21",
    brand: "samsung",
    category: "Smartphone",
    year: 2021,
    faults: [
      f("ecran", "Écran Dynamic AMOLED complet", 78000, "45 min", "6 mois", "Écran service pack Samsung"),
      f("batterie", "Batterie 4000 mAh", 35000, "40 min", "3 mois", "Batterie service pack"),
      f("connecteur", "Port USB-C", 14000, "45 min", "3 mois", "Nappe de charge"),
      f("vitre-arriere", "Vitre arrière", 22000, "60 min", "1 mois", "Verre + adhésif"),
    ],
  },
  {
    slug: "galaxy-a54",
    name: "Samsung Galaxy A54",
    brand: "samsung",
    category: "Smartphone",
    year: 2023,
    faults: [
      f("ecran", "Écran Super AMOLED", 52000, "40 min", "6 mois", "Écran service pack"),
      f("batterie", "Batterie 5000 mAh", 25000, "35 min", "3 mois", "Batterie service pack"),
      f("haut-parleur", "Haut-parleur / écouteur", 12000, "45 min", "3 mois", "Module audio"),
    ],
  },
  {
    slug: "redmi-note-12",
    name: "Xiaomi Redmi Note 12",
    brand: "xiaomi",
    category: "Smartphone",
    year: 2022,
    faults: [
      f("ecran", "Écran AMOLED complet", 38000, "40 min", "6 mois", "Écran compatible grade A"),
      f("batterie", "Batterie 5000 mAh", 18000, "30 min", "3 mois", "Batterie compatible"),
      f("connecteur", "Connecteur de charge", 9000, "40 min", "1 mois", "Nappe de charge"),
    ],
  },
  {
    slug: "tecno-camon-20",
    name: "Tecno Camon 20",
    brand: "tecno",
    category: "Smartphone",
    year: 2023,
    faults: [
      f("ecran", "Écran complet", 32000, "40 min", "3 mois", "Écran compatible grade A"),
      f("batterie", "Batterie 5000 mAh", 15000, "30 min", "3 mois", "Batterie compatible"),
      f("connecteur", "Connecteur de charge", 12500, "60 min", "1 mois", "Nappe de charge"),
      f("desoxydation", "Désoxydation", 15000, "48 h", "—", "Bain ultrasons"),
    ],
  },
  {
    slug: "infinix-note-30",
    name: "Infinix Note 30",
    brand: "infinix",
    category: "Smartphone",
    year: 2023,
    faults: [
      f("ecran", "Écran complet", 30000, "40 min", "3 mois", "Écran compatible grade A"),
      f("batterie", "Batterie 5000 mAh", 14000, "30 min", "3 mois", "Batterie compatible"),
      f("connecteur", "Connecteur de charge", 11000, "50 min", "1 mois", "Nappe de charge"),
    ],
  },
  {
    slug: "pixel-7",
    name: "Google Pixel 7",
    brand: "google",
    category: "Smartphone",
    year: 2022,
    faults: [
      f("ecran", "Écran OLED complet", 88000, "50 min", "6 mois", "Écran d'origine Google"),
      f("batterie", "Batterie 4355 mAh", 38000, "40 min", "6 mois", "Batterie certifiée"),
    ],
  },
  {
    slug: "playstation-5",
    name: "Sony PlayStation 5",
    brand: "sony",
    category: "Console de jeux",
    year: 2020,
    faults: [
      f("hdmi", "Port HDMI (micro-soudure)", 45000, "48 h", "3 mois", "Port HDMI + reflow"),
      f("ventilation", "Nettoyage + pâte thermique liquide", 25000, "24 h", "1 mois", "Metal thermal compound"),
      f("lecteur", "Lecteur Blu-ray", 65000, "48 h", "3 mois", "Bloc optique"),
      f("manette", "Réparation drift manette DualSense", 12000, "6 h", "3 mois", "Joystick neuf"),
    ],
  },
  {
    slug: "huawei-p40",
    name: "Huawei P40",
    brand: "huawei",
    category: "Smartphone",
    year: 2020,
    faults: [
      f("ecran", "Écran OLED complet", 62000, "50 min", "6 mois", "Écran compatible grade A+"),
      f("batterie", "Batterie 3800 mAh", 26000, "35 min", "3 mois", "Batterie compatible"),
    ],
  },
  {
    slug: "iphone-17-pro-max",
    name: "iPhone 17 Pro Max",
    brand: "apple",
    category: "Smartphone",
    year: 2025,
    faults: [
      f("ecran", "Écran Super Retina XDR", 215000, "40 min", "6 mois", "Écran OLED grade A+"),
      f("batterie", "Remplacement batterie", 58000, "35 min", "6 mois", "Batterie certifiée"),
      f("connecteur", "Port USB-C", 32000, "50 min", "3 mois", "Nappe USB-C d'origine"),
      f("camera", "Bloc caméra arrière", 92000, "70 min", "6 mois", "Module triple capteur"),
      f("vitre-arriere", "Vitre arrière", 72000, "90 min", "3 mois", "Verre trempé laminé"),
    ],
  },
  {
    slug: "iphone-16",
    name: "iPhone 16",
    brand: "apple",
    category: "Smartphone",
    year: 2024,
    faults: [
      f("ecran", "Écran OLED complet", 145000, "35 min", "6 mois", "Écran OLED grade A+"),
      f("batterie", "Remplacement batterie", 48000, "30 min", "6 mois", "Batterie certifiée"),
      f("connecteur", "Port USB-C", 28000, "50 min", "3 mois", "Nappe USB-C"),
      f("desoxydation", "Désoxydation carte mère", 22000, "48 h", "1 mois", "Bain ultrasons + reflow"),
    ],
  },
  {
    slug: "ipad-pro-m4",
    name: "iPad Pro M4 11\"",
    brand: "apple",
    category: "Tablette",
    year: 2024,
    faults: [
      f("ecran", "Dalle Tandem OLED", 185000, "24 h", "6 mois", "Ensemble écran laminé"),
      f("batterie", "Batterie 31 Wh", 62000, "6 h", "6 mois", "Batterie certifiée"),
      f("connecteur", "Port USB-C", 32000, "6 h", "3 mois", "Nappe de charge"),
    ],
  },
  {
    slug: "macbook-pro-m4",
    name: "MacBook Pro 14\" M4",
    brand: "apple",
    category: "Ordinateur portable",
    year: 2024,
    faults: [
      f("ecran", "Dalle Liquid Retina XDR", 320000, "72 h", "6 mois", "Dalle complète"),
      f("clavier", "Clavier complet (topcase)", 145000, "24 h", "1 an", "Topcase AZERTY"),
      f("batterie", "Batterie 72,4 Wh", 88000, "4 h", "1 an", "Batterie certifiée"),
      f("carte-mere", "Micro-soudure carte mère", 110000, "72 h", "3 mois", "Composants CMS"),
    ],
  },
  {
    slug: "apple-watch-series-10",
    name: "Apple Watch Series 10",
    brand: "apple",
    category: "Montre connectée",
    year: 2024,
    faults: [
      f("ecran", "Vitre + écran LTPO OLED", 78000, "24 h", "3 mois", "Ensemble écran OLED"),
      f("batterie", "Batterie", 34000, "24 h", "3 mois", "Batterie certifiée"),
    ],
  },
  {
    slug: "galaxy-s25-ultra",
    name: "Samsung Galaxy S25 Ultra",
    brand: "samsung",
    category: "Smartphone",
    year: 2025,
    faults: [
      f("ecran", "Écran Dynamic AMOLED 2X", 168000, "50 min", "6 mois", "Écran service pack Samsung"),
      f("batterie", "Batterie 5000 mAh", 45000, "40 min", "6 mois", "Batterie service pack"),
      f("connecteur", "Port USB-C", 18000, "45 min", "3 mois", "Nappe de charge"),
      f("vitre-arriere", "Vitre arrière", 38000, "60 min", "1 mois", "Verre + adhésif"),
      f("camera", "Bloc caméra arrière", 78000, "70 min", "6 mois", "Module capteur"),
    ],
  },
  {
    slug: "galaxy-a56",
    name: "Samsung Galaxy A56",
    brand: "samsung",
    category: "Smartphone",
    year: 2025,
    faults: [
      f("ecran", "Écran Super AMOLED", 62000, "40 min", "6 mois", "Écran service pack"),
      f("batterie", "Batterie 5000 mAh", 28000, "35 min", "3 mois", "Batterie service pack"),
      f("connecteur", "Port USB-C", 13000, "45 min", "3 mois", "Nappe de charge"),
      f("haut-parleur", "Haut-parleur / écouteur", 13000, "45 min", "3 mois", "Module audio"),
    ],
  },
  {
    slug: "galaxy-z-fold-6",
    name: "Samsung Galaxy Z Fold 6",
    brand: "samsung",
    category: "Smartphone",
    year: 2024,
    faults: [
      f("ecran", "Écran pliable interne", 385000, "48 h", "6 mois", "Écran service pack Samsung"),
      f("ecran-externe", "Écran de couverture", 95000, "24 h", "6 mois", "Écran service pack"),
      f("charniere", "Charnière complète", 120000, "48 h", "3 mois", "Charnière d'origine"),
      f("batterie", "Batterie 4400 mAh", 48000, "3 h", "3 mois", "Batterie service pack"),
    ],
  },
  {
    slug: "galaxy-tab-s10",
    name: "Samsung Galaxy Tab S10",
    brand: "samsung",
    category: "Tablette",
    year: 2024,
    faults: [
      f("ecran", "Écran AMOLED complet", 145000, "24 h", "6 mois", "Écran service pack"),
      f("batterie", "Batterie 8400 mAh", 52000, "5 h", "6 mois", "Batterie service pack"),
    ],
  },
  {
    slug: "xiaomi-15",
    name: "Xiaomi 15",
    brand: "xiaomi",
    category: "Smartphone",
    year: 2025,
    faults: [
      f("ecran", "Écran AMOLED LTPO", 92000, "45 min", "6 mois", "Écran grade A+"),
      f("batterie", "Batterie 5240 mAh", 28000, "35 min", "3 mois", "Batterie compatible"),
      f("connecteur", "Port USB-C", 12000, "45 min", "1 mois", "Nappe de charge"),
    ],
  },
  {
    slug: "redmi-note-14-pro",
    name: "Xiaomi Redmi Note 14 Pro",
    brand: "xiaomi",
    category: "Smartphone",
    year: 2025,
    faults: [
      f("ecran", "Écran AMOLED complet", 46000, "40 min", "6 mois", "Écran compatible grade A"),
      f("batterie", "Batterie 5500 mAh", 20000, "30 min", "3 mois", "Batterie compatible"),
      f("connecteur", "Connecteur de charge", 10000, "40 min", "1 mois", "Nappe de charge"),
      f("desoxydation", "Désoxydation", 15000, "48 h", "—", "Bain ultrasons"),
    ],
  },
  {
    slug: "tecno-camon-40-pro",
    name: "Tecno Camon 40 Pro",
    brand: "tecno",
    category: "Smartphone",
    year: 2025,
    faults: [
      f("ecran", "Écran AMOLED complet", 42000, "40 min", "6 mois", "Écran compatible grade A"),
      f("batterie", "Batterie 5200 mAh", 17000, "30 min", "3 mois", "Batterie compatible"),
      f("connecteur", "Connecteur de charge", 12500, "60 min", "1 mois", "Nappe de charge"),
      f("camera", "Bloc caméra arrière", 28000, "60 min", "3 mois", "Module capteur"),
    ],
  },
  {
    slug: "tecno-spark-30",
    name: "Tecno Spark 30",
    brand: "tecno",
    category: "Smartphone",
    year: 2024,
    faults: [
      f("ecran", "Écran complet", 26000, "40 min", "3 mois", "Écran compatible"),
      f("batterie", "Batterie 5000 mAh", 13000, "30 min", "3 mois", "Batterie compatible"),
      f("connecteur", "Connecteur de charge", 9500, "45 min", "1 mois", "Nappe de charge"),
    ],
  },
  {
    slug: "infinix-note-50-pro",
    name: "Infinix Note 50 Pro",
    brand: "infinix",
    category: "Smartphone",
    year: 2025,
    faults: [
      f("ecran", "Écran AMOLED complet", 38000, "40 min", "6 mois", "Écran compatible grade A"),
      f("batterie", "Batterie 5200 mAh", 16000, "30 min", "3 mois", "Batterie compatible"),
      f("connecteur", "Connecteur de charge", 11000, "50 min", "1 mois", "Nappe de charge"),
    ],
  },
  {
    slug: "infinix-hot-60",
    name: "Infinix Hot 60",
    brand: "infinix",
    category: "Smartphone",
    year: 2025,
    faults: [
      f("ecran", "Écran complet", 24000, "40 min", "3 mois", "Écran compatible"),
      f("batterie", "Batterie 5000 mAh", 12500, "30 min", "3 mois", "Batterie compatible"),
    ],
  },
  {
    slug: "itel-s25",
    name: "Itel S25",
    brand: "itel",
    category: "Smartphone",
    year: 2025,
    faults: [
      f("ecran", "Écran complet", 21000, "40 min", "3 mois", "Écran compatible"),
      f("batterie", "Batterie 5000 mAh", 11000, "30 min", "3 mois", "Batterie compatible"),
      f("connecteur", "Connecteur de charge", 8000, "45 min", "1 mois", "Nappe de charge"),
    ],
  },
  {
    slug: "pixel-10-pro",
    name: "Google Pixel 10 Pro",
    brand: "google",
    category: "Smartphone",
    year: 2025,
    faults: [
      f("ecran", "Écran Super Actua OLED", 135000, "50 min", "6 mois", "Écran d'origine Google"),
      f("batterie", "Batterie 4870 mAh", 46000, "40 min", "6 mois", "Batterie certifiée"),
      f("vitre-arriere", "Vitre arrière", 48000, "90 min", "3 mois", "Verre + adhésif"),
    ],
  },
  {
    slug: "oppo-reno-13",
    name: "Oppo Reno 13",
    brand: "oppo",
    category: "Smartphone",
    year: 2025,
    faults: [
      f("ecran", "Écran AMOLED complet", 68000, "45 min", "6 mois", "Écran grade A+"),
      f("batterie", "Batterie 5600 mAh", 24000, "35 min", "3 mois", "Batterie compatible"),
    ],
  },
  {
    slug: "honor-magic-7",
    name: "Honor Magic 7",
    brand: "honor",
    category: "Smartphone",
    year: 2025,
    faults: [
      f("ecran", "Écran OLED LTPO", 105000, "50 min", "6 mois", "Écran grade A+"),
      f("batterie", "Batterie 5650 mAh", 32000, "40 min", "3 mois", "Batterie compatible"),
    ],
  },
  {
    slug: "huawei-pura-70",
    name: "Huawei Pura 70",
    brand: "huawei",
    category: "Smartphone",
    year: 2024,
    faults: [
      f("ecran", "Écran OLED complet", 98000, "50 min", "6 mois", "Écran grade A+"),
      f("batterie", "Batterie 4900 mAh", 34000, "35 min", "3 mois", "Batterie compatible"),
    ],
  },
  {
    slug: "motorola-edge-50",
    name: "Motorola Edge 50",
    brand: "motorola",
    category: "Smartphone",
    year: 2024,
    faults: [
      f("ecran", "Écran pOLED complet", 72000, "45 min", "6 mois", "Écran grade A+"),
      f("batterie", "Batterie 5000 mAh", 26000, "35 min", "3 mois", "Batterie compatible"),
    ],
  },
  {
    slug: "oneplus-13",
    name: "OnePlus 13",
    brand: "oneplus",
    category: "Smartphone",
    year: 2025,
    faults: [
      f("ecran", "Écran AMOLED 2K", 112000, "50 min", "6 mois", "Écran grade A+"),
      f("batterie", "Batterie 6000 mAh", 35000, "40 min", "3 mois", "Batterie compatible"),
    ],
  },
  {
    slug: "nintendo-switch-2",
    name: "Nintendo Switch 2",
    brand: "nintendo",
    category: "Console de jeux",
    year: 2025,
    faults: [
      f("ecran", "Dalle LCD complète", 88000, "24 h", "3 mois", "Dalle + vitre tactile"),
      f("joycon", "Réparation drift Joy-Con", 14000, "6 h", "3 mois", "Joystick neuf"),
      f("connecteur", "Port USB-C de charge", 22000, "24 h", "3 mois", "Carte fille USB-C"),
      f("ventilation", "Nettoyage + pâte thermique", 18000, "12 h", "1 mois", "Pâte thermique premium"),
    ],
  },
  {
    slug: "playstation-5-slim",
    name: "Sony PlayStation 5 Slim",
    brand: "sony",
    category: "Console de jeux",
    year: 2023,
    faults: [
      f("hdmi", "Port HDMI (micro-soudure)", 48000, "48 h", "3 mois", "Port HDMI + reflow"),
      f("ventilation", "Nettoyage + pâte thermique liquide", 25000, "24 h", "1 mois", "Metal thermal compound"),
      f("ssd", "Upgrade SSD NVMe 1 To", 105000, "6 h", "1 an", "SSD NVMe Gen4"),
      f("manette", "Réparation drift DualSense", 12000, "6 h", "3 mois", "Joystick neuf"),
    ],
  },
  {
    slug: "xbox-series-x",
    name: "Microsoft Xbox Series X",
    brand: "microsoft",
    category: "Console de jeux",
    year: 2020,
    faults: [
      f("hdmi", "Port HDMI (micro-soudure)", 45000, "48 h", "3 mois", "Port HDMI + reflow"),
      f("lecteur", "Lecteur Blu-ray 4K", 62000, "48 h", "3 mois", "Bloc optique"),
      f("ventilation", "Nettoyage + pâte thermique", 22000, "24 h", "1 mois", "Pâte thermique premium"),
    ],
  },
  {
    slug: "hp-pavilion-15",
    name: "HP Pavilion 15",
    brand: "hp",
    category: "Ordinateur portable",
    year: 2024,
    faults: [
      f("ecran", "Dalle 15,6\" FHD", 78000, "24 h", "6 mois", "Dalle IPS neuve"),
      f("clavier", "Clavier AZERTY", 32000, "6 h", "6 mois", "Clavier compatible"),
      f("batterie", "Batterie interne", 45000, "3 h", "6 mois", "Batterie compatible"),
      f("ssd", "Upgrade SSD NVMe 512 Go", 55000, "3 h", "1 an", "SSD NVMe"),
    ],
  },
  {
    slug: "lenovo-ideapad-slim-5",
    name: "Lenovo IdeaPad Slim 5",
    brand: "lenovo",
    category: "Ordinateur portable",
    year: 2024,
    faults: [
      f("ecran", "Dalle 14\" FHD", 82000, "24 h", "6 mois", "Dalle IPS neuve"),
      f("clavier", "Clavier AZERTY", 30000, "6 h", "6 mois", "Clavier compatible"),
      f("carte-mere", "Micro-soudure carte mère", 75000, "72 h", "3 mois", "Composants CMS"),
    ],
  },
  {
    slug: "dell-xps-13",
    name: "Dell XPS 13",
    brand: "dell",
    category: "Ordinateur portable",
    year: 2024,
    faults: [
      f("ecran", "Dalle 13,4\" InfinityEdge", 165000, "48 h", "6 mois", "Dalle complète"),
      f("batterie", "Batterie 55 Wh", 68000, "3 h", "1 an", "Batterie certifiée"),
      f("nettoyage", "Nettoyage + pâte thermique", 20000, "6 h", "1 mois", "Pâte thermique premium"),
    ],
  },
  {
    slug: "imac-24-m4",
    name: "iMac 24\" M4",
    brand: "apple",
    category: "Ordinateur de bureau",
    year: 2024,
    faults: [
      f("alimentation", "Bloc d'alimentation", 88000, "48 h", "6 mois", "Alimentation interne"),
      f("ecran", "Dalle Retina 4,5K", 295000, "72 h", "6 mois", "Dalle complète"),
      f("nettoyage", "Nettoyage complet + pâte thermique", 24000, "6 h", "1 mois", "Pâte thermique premium"),
    ],
  },
  {
    slug: "galaxy-watch-7",
    name: "Samsung Galaxy Watch 7",
    brand: "samsung",
    category: "Montre connectée",
    year: 2024,
    faults: [
      f("ecran", "Vitre + écran AMOLED", 62000, "24 h", "3 mois", "Ensemble écran"),
      f("batterie", "Batterie", 26000, "24 h", "3 mois", "Batterie compatible"),
    ],
  },
];

export const CATEGORIES = [
  "Smartphone",
  "Tablette",
  "Ordinateur portable",
  "Ordinateur de bureau",
  "Console de jeux",
  "Montre connectée",
];

export const brandBySlug = (slug: string) => BRANDS.find((b) => b.slug === slug);
export const devicesOfBrand = (slug: string) => DEVICES.filter((d) => d.brand === slug);
export const deviceBySlug = (slug: string) => DEVICES.find((d) => d.slug === slug);
export const brandName = (slug: string) => brandBySlug(slug)?.name ?? slug;

export const formatFcfa = (n: number) =>
  `${n.toLocaleString("fr-FR").replace(/\u202f|\s/g, ".")} FCFA`;

export type Accessory = {
  slug: string;
  name: string;
  category: string;
  price: number;
  stock: number;
};

export const ACCESSORIES: Accessory[] = [
  { slug: "coque-silicone-iphone", name: "Coque silicone renforcée iPhone", category: "Coques", price: 6500, stock: 42 },
  { slug: "coque-antichoc-samsung", name: "Coque antichoc Galaxy A/S", category: "Coques", price: 5500, stock: 31 },
  { slug: "verre-trempe-9h", name: "Protection écran verre trempé 9H", category: "Protections d'écran", price: 3500, stock: 120 },
  { slug: "chargeur-20w-usbc", name: "Chargeur rapide 20W USB-C", category: "Chargeurs", price: 9000, stock: 55 },
  { slug: "chargeur-65w-gan", name: "Chargeur GaN 65W multi-ports", category: "Chargeurs", price: 24000, stock: 12 },
  { slug: "cable-usbc-lightning", name: "Câble USB-C vers Lightning 1 m", category: "Câbles", price: 7000, stock: 64 },
  { slug: "cable-usbc-usbc-2m", name: "Câble USB-C vers USB-C 2 m tressé", category: "Câbles", price: 6000, stock: 48 },
  { slug: "batterie-externe-20000", name: "Batterie externe 20 000 mAh", category: "Batteries", price: 22000, stock: 18 },
  { slug: "batterie-iphone-12", name: "Batterie de remplacement iPhone 12", category: "Batteries", price: 19000, stock: 9 },
  { slug: "ecouteurs-tws", name: "Écouteurs TWS réduction de bruit", category: "Écouteurs", price: 17500, stock: 26 },
  { slug: "ecouteurs-filaires", name: "Écouteurs filaires USB-C", category: "Écouteurs", price: 4500, stock: 73 },
  { slug: "support-voiture", name: "Support téléphone voiture magnétique", category: "Accessoires", price: 5000, stock: 37 },
];

export const ACCESSORY_CATEGORIES = [
  "Coques",
  "Protections d'écran",
  "Chargeurs",
  "Câbles",
  "Batteries",
  "Écouteurs",
  "Accessoires",
];

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readingTime: string;
  body: string[];
};

export const POSTS: Post[] = [
  {
    slug: "prolonger-batterie-smartphone-benin",
    title: "7 gestes pour prolonger la batterie de votre smartphone au Bénin",
    excerpt:
      "Chaleur, coupures de courant, chargeurs bas de gamme : voici comment préserver la santé de votre batterie à Cotonou et Abomey-Calavi.",
    date: "2026-06-18",
    category: "Guides",
    readingTime: "6 min",
    body: [
      "La chaleur est le premier ennemi d'une batterie lithium-ion. Au Bénin, laisser son téléphone en plein soleil ou dans une voiture fermée accélère fortement le vieillissement des cellules.",
      "Évitez les charges complètes à 100 % en continu : la plage idéale se situe entre 20 % et 80 %. Activez la charge optimisée si votre appareil le propose.",
      "Utilisez un chargeur certifié adapté à la puissance de votre appareil. Les chargeurs bas de gamme délivrent une tension instable qui abîme le circuit de charge, une panne que nous voyons quotidiennement en atelier.",
      "Après une coupure de courant, attendez la stabilisation du réseau avant de rebrancher, ou passez par un onduleur / une batterie externe de qualité.",
      "Si votre autonomie chute brutalement, faites contrôler la santé de la batterie : un diagnostic est gratuit chez Allô Techno.",
    ],
  },
  {
    slug: "ecran-casse-que-faire",
    title: "Écran cassé : que faire dans les premières heures ?",
    excerpt:
      "Vitre fissurée, tactile mort, taches d'encre : les bons réflexes avant d'apporter votre appareil en atelier.",
    date: "2026-05-30",
    category: "Guides",
    readingTime: "4 min",
    body: [
      "Coupez l'appareil si l'affichage présente des taches noires qui s'étendent : la dalle fuit et la pression aggrave les dégâts.",
      "Posez un film adhésif transparent sur la vitre pour éviter la dispersion des éclats et protéger vos doigts.",
      "Sauvegardez vos données pendant que le tactile fonctionne encore, même partiellement.",
      "Ne tentez pas de démonter vous-même : les nappes tactiles sont extrêmement fragiles et une nappe déchirée fait grimper la facture.",
      "Chez Allô Techno, la plupart des remplacements d'écran sont réalisés en moins d'une heure avec garantie de 6 mois.",
    ],
  },
  {
    slug: "reconnaitre-vraie-piece-detachee",
    title: "Comment reconnaître une vraie pièce détachée d'un faux ?",
    excerpt:
      "Grade A+, service pack, compatible : décryptage des catégories de pièces et de leur impact sur la durée de vie.",
    date: "2026-04-22",
    category: "Qualité",
    readingTime: "5 min",
    body: [
      "Une pièce « service pack » provient directement du fabricant : c'est le plus haut niveau de qualité, avec un prix en conséquence.",
      "Une pièce « grade A+ » est un équivalent haut de gamme : luminosité, colorimétrie et réactivité tactile très proches de l'origine.",
      "Les pièces « compatibles » économiques conviennent aux appareils d'entrée de gamme, mais leur durée de vie est plus courte.",
      "Chez Allô Techno, la catégorie de pièce est indiquée sur chaque devis et sur votre facture : vous savez exactement ce qui est installé.",
    ],
  },
  {
    slug: "reparation-telephone-abomey-calavi-guide",
    title: "Faire réparer son téléphone à Abomey-Calavi : le guide complet 2026",
    excerpt:
      "Prix moyens, délais, quartiers desservis et questions à poser avant de confier votre smartphone à un atelier d'Abomey-Calavi.",
    date: "2026-07-28",
    category: "Local",
    readingTime: "7 min",
    body: [
      "Abomey-Calavi concentre aujourd'hui une grande partie des réparations de smartphones de l'agglomération de Cotonou. Entre Zogbadjè, Tankpè, Akassato et Godomey, l'offre est large mais très inégale : certains ateliers posent des pièces non testées et ne délivrent aucune facture.",
      "Premier réflexe : exiger un diagnostic écrit et gratuit. Un atelier sérieux vous annonce la panne réelle, la pièce utilisée (origine, compatible grade A+, reconditionnée) et la durée de garantie avant de démonter quoi que ce soit.",
      "Les fourchettes de prix observées à Abomey-Calavi en 2026 : écran d'entrée de gamme 25 000 à 45 000 FCFA, écran OLED haut de gamme 60 000 à 150 000 FCFA, batterie 15 000 à 35 000 FCFA, connecteur de charge 12 000 à 25 000 FCFA. Un prix très en dessous du marché cache presque toujours une pièce de qualité douteuse.",
      "Deuxième réflexe : la traçabilité. Un numéro de dossier permet de suivre l'avancement de la réparation et de prouver le dépôt de l'appareil. Chez Allô Techno, chaque dépôt génère une référence consultable en ligne sur la page de suivi.",
      "Troisième réflexe : les délais. Un écran ou une batterie se remplace en moins d'une heure. Une désoxydation ou une micro-soudure demande 24 à 72 h, le temps de sécher, nettoyer et tester la carte mère.",
      "Enfin, pensez à la sauvegarde. Avant tout dépôt, sauvegardez vos photos et désactivez la localisation si l'appareil doit être réinitialisé. Notre atelier de Zogbadjè peut vous accompagner sur cette étape gratuitement.",
    ],
  },
  {
    slug: "ecran-casse-abomey-calavi-prix-delais",
    title: "Écran cassé à Abomey-Calavi : prix, délais et pièces en 2026",
    excerpt:
      "Combien coûte un remplacement d'écran à Calavi selon la marque, quels délais espérer et comment reconnaître une bonne dalle.",
    date: "2026-07-14",
    category: "Local",
    readingTime: "5 min",
    body: [
      "L'écran reste la première réparation demandée dans notre atelier d'Abomey-Calavi : chutes sur les pavés, choc en zémidjan, écran écrasé au fond d'un sac.",
      "Sur les Tecno, Infinix et Itel, le bloc écran complet se remplace généralement entre 25 000 et 45 000 FCFA, en moins de 45 minutes, pièces en stock.",
      "Sur Samsung Galaxy A et S, comptez 45 000 à 110 000 FCFA selon la dalle AMOLED. Sur iPhone, de 55 000 FCFA pour les modèles LCD à plus de 150 000 FCFA pour les Pro Max récents.",
      "Une bonne dalle se reconnaît à trois choses : la luminosité maximale identique à l'origine, la sensibilité tactile sur les bords, et l'absence de reflet laiteux en plein soleil — un test à faire dehors avant de quitter l'atelier.",
      "Demandez systématiquement la garantie écrite. Nous couvrons nos écrans 6 mois contre le défaut de pièce, hors nouvelle casse et hors dégât des eaux.",
      "Vous êtes à Godomey, Akassato, Tankpè ou Cocotomey ? L'enlèvement de l'appareil est gratuit dès 50 000 FCFA de réparation.",
    ],
  },
  {
    slug: "harmattan-poussiere-smartphone-calavi",
    title: "Harmattan et poussière : protéger son téléphone à Calavi",
    excerpt:
      "Port de charge encrassé, micro étouffé, console qui surchauffe : la saison sèche fait des dégâts. Voici comment les éviter.",
    date: "2026-06-30",
    category: "Local",
    readingTime: "5 min",
    body: [
      "Pendant l'harmattan, la poussière fine s'infiltre partout : port de charge, grilles de micro, ventilateurs de console et d'ordinateur portable.",
      "Symptôme n°1 : le câble ne tient plus ou charge par intermittence. Neuf fois sur dix, il ne s'agit pas d'une panne électronique mais d'un tampon de poussière compacté au fond du port. Un nettoyage suffit — n'insérez jamais d'objet métallique vous-même.",
      "Symptôme n°2 : vos correspondants ne vous entendent plus. La grille du micro est colmatée. Un nettoyage à sec en atelier restaure le niveau sonore sans changer de pièce.",
      "Symptôme n°3 : la PlayStation ou le PC portable devient bruyant et s'éteint seul. Le radiateur est saturé. Un dépoussiérage annuel avec changement de pâte thermique évite la panne de carte graphique.",
      "En prévention : une coque avec cache-port, un chiffon microfibre chaque semaine, et un dépoussiérage professionnel en début et fin de saison sèche.",
      "Notre atelier d'Abomey-Calavi propose ce nettoyage préventif en moins de 30 minutes.",
    ],
  },
  {
    slug: "payer-reparation-mobile-money-benin",
    title: "Payer sa réparation en Mobile Money au Bénin : ce qu'il faut savoir",
    excerpt:
      "MoMo, Celtiis Cash, espèces ou virement : comment sécuriser le paiement de votre réparation et obtenir une vraie facture.",
    date: "2026-06-05",
    category: "Local",
    readingTime: "4 min",
    body: [
      "À Abomey-Calavi, la majorité des réparations se règlent aujourd'hui en Mobile Money. C'est pratique, mais quelques précautions évitent les mauvaises surprises.",
      "Ne payez jamais l'intégralité avant le diagnostic. Un acompte sur pièce commandée est normal ; un paiement complet à l'avance ne l'est pas.",
      "Vérifiez que le numéro Mobile Money correspond bien au nom commercial de l'atelier. Un compte personnel anonyme complique tout recours.",
      "Exigez une facture mentionnant le modèle, la panne, la pièce posée et la durée de garantie. C'est ce document qui fait foi en cas de retour SAV.",
      "Conservez le SMS de confirmation de transaction : associé à votre numéro de dossier, il permet de retrouver l'historique complet de l'intervention.",
      "Chez Allô Techno, le paiement s'effectue à la restitution, en Mobile Money ou en espèces, avec facture systématique.",
    ],
  },
  {
    slug: "console-ps5-surchauffe",
    title: "PS5 qui surchauffe : diagnostic et entretien",
    excerpt: "Poussière, pâte thermique sèche, ventilation obstruée : le protocole d'entretien complet de votre console.",
    date: "2026-03-15",
    category: "Consoles",
    readingTime: "7 min",
    body: [
      "Une console qui souffle fort et s'éteint seule signale presque toujours un problème de dissipation thermique.",
      "La poussière fine du harmattan s'accumule dans le radiateur et bloque le flux d'air en quelques mois.",
      "L'entretien complet comprend le démontage, le nettoyage du radiateur, le remplacement de la pâte thermique liquide et un test de charge de 2 heures.",
      "Comptez 24 h en atelier. Après intervention, les températures redescendent en moyenne de 12 à 18 °C.",
    ],
  },
];

export const FAQ: { q: string; a: string; cat: string }[] = [
  { cat: "Réparation", q: "Combien de temps prend une réparation d'écran ?", a: "La majorité des remplacements d'écran smartphone se font en 25 à 50 minutes sur place. Les tablettes et ordinateurs demandent entre 3 h et 48 h selon la pièce." },
  { cat: "Réparation", q: "Le diagnostic est-il payant ?", a: "Non. Le diagnostic est gratuit et sans engagement. Vous recevez un devis détaillé avant toute intervention." },
  { cat: "Garantie", q: "Quelle est la durée de la garantie ?", a: "6 mois sur les écrans et batteries premium, 3 mois sur les pièces compatibles et les interventions de micro-soudure, 1 an sur certaines pièces Apple d'origine." },
  { cat: "Garantie", q: "La garantie couvre-t-elle une nouvelle chute ?", a: "Non. La garantie couvre les défauts de pièce et de main-d'œuvre, pas les dommages accidentels, l'oxydation ou une intervention par un tiers." },
  { cat: "Paiement", q: "Quels moyens de paiement acceptez-vous ?", a: "MTN Mobile Money, Moov Money, espèces et virement pour les entreprises. Le paiement s'effectue après validation de la réparation." },
  { cat: "Paiement", q: "Puis-je payer en plusieurs fois ?", a: "Un acompte de 50 % est possible sur les réparations supérieures à 100 000 FCFA, le solde à la restitution de l'appareil." },
  { cat: "Données", q: "Mes données sont-elles conservées ?", a: "Un remplacement d'écran ou de batterie ne touche pas vos données. Pour toute intervention sur la carte mère, nous recommandons une sauvegarde préalable." },
  { cat: "Données", q: "Dois-je fournir mon code de déverrouillage ?", a: "Oui, pour tester l'ensemble des fonctions après réparation. Vous pouvez aussi le saisir vous-même à la restitution." },
  { cat: "Suivi", q: "Comment suivre ma réparation ?", a: "Chaque dépôt génère un numéro de dossier (format AT-2026-XXX). Saisissez-le dans la page Suivi ou recevez les notifications par WhatsApp." },
  { cat: "Suivi", q: "Proposez-vous l'enlèvement à domicile ?", a: "Oui, à Abomey-Calavi, Cotonou et Godomey. L'enlèvement est gratuit dès 50 000 FCFA de réparation." },
];

export const REVIEWS = [
  { name: "Koffi S.", city: "Abomey-Calavi", rating: 5, text: "Service impeccable à Calavi. Mon iPhone 15 Pro Max a été réparé en moins d'une heure.", device: "iPhone 15 Pro Max" },
  { name: "Mariam A.", city: "Cotonou", rating: 5, text: "Devis clair, prix respecté, facture fournie. Ma batterie tient à nouveau deux jours.", device: "Galaxy A54" },
  { name: "Yves D.", city: "Godomey", rating: 5, text: "Micro-soudure sur mon MacBook que deux autres ateliers avaient refusée. Machine sauvée.", device: "MacBook Air M1" },
  { name: "Rachida B.", city: "Abomey-Calavi", rating: 4, text: "Bon suivi WhatsApp du dossier. Une journée de plus que prévu mais résultat parfait.", device: "PlayStation 5" },
  { name: "Serge H.", city: "Calavi Zogbadjè", rating: 5, text: "Écran Tecno changé pendant que j'attendais. Paiement MoMo, très pratique.", device: "Tecno Camon 20" },
  { name: "Aline T.", city: "Cotonou", rating: 5, text: "Notre société fait entretenir 20 postes ici. Sérieux et factures en règle.", device: "Parc informatique" },
];

export type TrackingStep = { label: string; detail: string; done: boolean; current?: boolean };

export const DEMO_TRACKING: Record<
  string,
  { device: string; owner: string; status: string; total: number; steps: TrackingStep[] }
> = {
  "AT-2026-088": {
    device: "iPhone 13 Pro — Remplacement écran",
    owner: "Jean-Luc K.",
    status: "En cours",
    total: 95000,
    steps: [
      { label: "Réception & diagnostic", detail: "10:45 — Validé par Tech #02", done: true },
      { label: "Devis accepté", detail: "11:10 — Accepté par le client", done: true },
      { label: "Remplacement de l'écran", detail: "En cours par Tech #04", done: false, current: true },
      { label: "Contrôle qualité", detail: "Estimation 14:00", done: false },
      { label: "Prêt pour retrait", detail: "Estimation 14:30", done: false },
    ],
  },
  "AT-2026-091": {
    device: "PlayStation 5 — Entretien thermique",
    owner: "Rachida B.",
    status: "Prêt",
    total: 25000,
    steps: [
      { label: "Réception & diagnostic", detail: "09:20 — Validé par Tech #01", done: true },
      { label: "Devis accepté", detail: "09:40 — Accepté par le client", done: true },
      { label: "Nettoyage + pâte thermique", detail: "Terminé par Tech #01", done: true },
      { label: "Contrôle qualité", detail: "Test de charge 2 h — OK", done: true },
      { label: "Prêt pour retrait", detail: "Disponible en boutique", done: true, current: true },
    ],
  },
};

export const STEPS = [
  { n: "01", title: "Diagnostic gratuit", text: "Sur place ou à distance. Nous identifions la panne réelle et sa cause, sans frais." },
  { n: "02", title: "Devis & validation", text: "Prix ferme, délai, catégorie de pièce et garantie. Rien ne démarre sans votre accord." },
  { n: "03", title: "Réparation & contrôle", text: "Intervention en atelier, tests complets, restitution avec facture et garantie." },
];
