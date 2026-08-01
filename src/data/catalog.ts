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
  { slug: "apple", name: "Apple", tag: "iPhone · iPad · MacBook · iMac", devices: ["iPhone", "iPad", "MacBook", "iMac", "Apple Watch"] },
  { slug: "samsung", name: "Samsung", tag: "Galaxy S · A · Tab · Watch", devices: ["Galaxy S", "Galaxy A", "Galaxy Tab"] },
  { slug: "xiaomi", name: "Xiaomi", tag: "Redmi · Note · Mi", devices: ["Redmi Note", "Redmi", "Mi"] },
  { slug: "huawei", name: "Huawei", tag: "P · Mate · Nova", devices: ["P Series", "Mate", "Nova"] },
  { slug: "oppo", name: "Oppo", tag: "Reno · A Series", devices: ["Reno", "A Series"] },
  { slug: "google", name: "Google Pixel", tag: "Pixel 6 à 9", devices: ["Pixel"] },
  { slug: "oneplus", name: "OnePlus", tag: "Nord · Série 1x", devices: ["Nord", "Série 1x"] },
  { slug: "tecno", name: "Tecno", tag: "Camon · Spark · Phantom", devices: ["Camon", "Spark", "Phantom"] },
  { slug: "infinix", name: "Infinix", tag: "Note · Hot · Zero", devices: ["Note", "Hot", "Zero"] },
  { slug: "itel", name: "Itel", tag: "A · S · P Series", devices: ["A Series", "S Series"] },
  { slug: "nokia", name: "Nokia", tag: "G · X · C Series", devices: ["G Series", "C Series"] },
  { slug: "motorola", name: "Motorola", tag: "Moto G · Edge", devices: ["Moto G", "Edge"] },
  { slug: "honor", name: "Honor", tag: "Magic · X Series", devices: ["Magic", "X Series"] },
  { slug: "sony", name: "Sony", tag: "PlayStation 4 · 5 · Xperia", devices: ["PlayStation", "Xperia"] },
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
