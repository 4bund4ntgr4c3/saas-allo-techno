// Catalogue Allô Techno — données de démonstration (marques, appareils, pannes,
// tarifs, accessoires, blog, FAQ, avis). Source unique pour tout le site.

// Types
import type { Brand, Device } from "./types";
export type { Fault, Device, Brand } from "./types";

export const COMPANY = {
  name: "Allô Techno",
  city: "Abomey-Calavi",
  country: "Bénin",
  address: "Quartier Zogbadjè, Rue de l'Université, Abomey-Calavi, Bénin",
  phone: "+229 01 43 67 97 67",
  whatsapp: "+229 01 43 67 97 67",
  email: "contact@allotechno.bj",
  lat: 6.4489,
  lng: 2.3553,
  hours: [
    { d: "Lundi — Vendredi", h: "08:30 — 20:30" },
    { d: "Samedi", h: "08:30 — 20:30" },
    { d: "Dimanche", h: "Fermé" },
  ],
};

export const BRANDS: Brand[] = [
  { slug: "apple", name: "Apple", tag: "iPhone · iPad · MacBook · iMac · Watch", devices: ["iPhone", "iPad", "MacBook", "Mac mini", "iMac", "Apple Watch"] },
  { slug: "samsung", name: "Samsung", tag: "Galaxy S26 · A56 · Z Fold 7", devices: ["Galaxy S", "Galaxy Note", "Galaxy Z", "Galaxy A", "Galaxy J", "Galaxy M", "Galaxy F", "Galaxy Xcover", "Galaxy Tab", "Galaxy Watch", "Galaxy Book"] },
  { slug: "xiaomi", name: "Xiaomi", tag: "Xiaomi 15 · Redmi Note 14", devices: ["Xiaomi Série", "Redmi Note", "Redmi", "Poco"] },
  { slug: "huawei", name: "Huawei", tag: "Pura · Mate · Nova", devices: ["Pura", "Mate", "Nova"] },
  { slug: "oppo", name: "Oppo", tag: "Reno 13 · A Series", devices: ["Reno", "A Series", "Find"] },
  { slug: "google", name: "Google Pixel", tag: "Pixel 6 à 10", devices: ["Pixel"] },
  { slug: "oneplus", name: "OnePlus", tag: "Nord · Série 13", devices: ["Nord", "Série 13"] },
  { slug: "tecno", name: "Tecno", tag: "Camon 50 · Spark 40 · Phantom", devices: ["Camon", "Spark", "Phantom", "Pova", "Pop"] },
  { slug: "infinix", name: "Infinix", tag: "Note 60 · Hot 70 · Zero 40", devices: ["Note", "Hot", "Zero", "Smart", "GT"] },
  { slug: "itel", name: "Itel", tag: "A · S · P Series", devices: ["A Series", "S Series", "P Series"] },
  { slug: "nokia", name: "Nokia", tag: "G · X · C Series", devices: ["G Series", "C Series"] },
  { slug: "motorola", name: "Motorola", tag: "Moto G · Edge 50", devices: ["Moto G", "Edge"] },
  { slug: "honor", name: "Honor", tag: "Magic 7 · X Series", devices: ["Magic", "X Series"] },
  { slug: "sony", name: "Sony", tag: "PlayStation 4 · 5 · Xperia", devices: ["PlayStation", "Xperia"] },
  { slug: "nintendo", name: "Nintendo", tag: "Switch · Switch 2", devices: ["Switch"] },
  { slug: "microsoft", name: "Microsoft", tag: "Xbox Series X|S · Surface", devices: ["Xbox", "Surface"] },
  { slug: "hp", name: "HP", tag: "EliteBook · ProBook · Pavilion", devices: ["EliteBook", "ProBook", "Pavilion", "Spectre", "Envy", "OMEN", "Victus", "HP Laptop", "HP 200/300"] },
  { slug: "lenovo", name: "Lenovo", tag: "IdeaPad · ThinkPad · Tab", devices: ["IdeaPad", "ThinkPad"] },
  { slug: "dell", name: "Dell", tag: "XPS · Latitude · Inspiron", devices: ["XPS", "Latitude"] },
  { slug: "realme", name: "Realme", tag: "Realme 12 · GT 6 · C Series", devices: ["Realme numbered", "C Series", "GT", "Narzo"] },
  { slug: "lg", name: "LG", tag: "TV OLED · Frigo Inverter · Son", devices: ["LG TV", "LG Réfrigérateur", "LG Machine à laver", "LG Climatiseur"] },
  { slug: "philips", name: "Philips", tag: "Petit électro · Ampoules · Micro-ondes", devices: ["Philips Petit électro"] },
  { slug: "hisense", name: "Hisense", tag: "TV 4K · Frigo · Clim", devices: ["Hisense TV", "Hisense Réfrigérateur", "Hisense Climatiseur"] },
  { slug: "tcl", name: "TCL", tag: "TV HD/4K · Petit électro", devices: ["TCL TV", "TCL Petit électro"] },
  { slug: "bosch", name: "Bosch", tag: "Électro · Outillage · Électroménager", devices: ["Bosch Électroménager", "Bosch Outillage"] },
  { slug: "jbl", name: "JBL", tag: "Enceintes · Casques · Son", devices: ["JBL Audio"] },
  { slug: "bose", name: "Bose", tag: "Casques · Enceintes premium", devices: ["Bose Audio"] },
  { slug: "whirlpool", name: "Whirlpool", tag: "Frigo · Lave-linge · Four", devices: ["Whirlpool Électroménager"] },
];

// Import brand device arrays
import { DEVICES as infinixDevices } from "./infinix";
import { DEVICES as tecnoDevices } from "./tecno";
import { DEVICES as samsungDevices } from "./samsung";
import { DEVICES as appleDevices } from "./apple";
import { DEVICES as miscDevices } from "./misc";
import { DEVICES as huaweiDevices } from "./huawei";
import { DEVICES as googleDevices } from "./google";
import { DEVICES as oneplusDevices } from "./oneplus";
import { DEVICES as honorDevices } from "./honor";
import { DEVICES as sonyDevices } from "./sony";
import { DEVICES as realmeDevices } from "./realme";
import { DEVICES as itelDevices } from "./itel";
import { DEVICES as oppoDevices } from "./oppo";
import { DEVICES as xiaomiDevices } from "./xiaomi";
import { DEVICES as hpDevices } from "./hp";
import { DEVICES as appliancesDevices } from "./appliances";

// Combined DEVICES array
export const DEVICES: Device[] = [
  ...infinixDevices,
  ...tecnoDevices,
  ...samsungDevices,
  ...appleDevices,
  ...miscDevices,
  ...huaweiDevices,
  ...googleDevices,
  ...oneplusDevices,
  ...honorDevices,
  ...sonyDevices,
  ...realmeDevices,
  ...itelDevices,
  ...oppoDevices,
  ...xiaomiDevices,
  ...hpDevices,
  ...appliancesDevices,
];
export const CATEGORIES = [
  "Smartphone",
  "Tablette",
  "Ordinateur portable",
  "Ordinateur de bureau",
  "Console de jeux",
  "Montre connectée",
  "Électroménager",
  "Petit électroménager",
  "Audio & Hi-Fi",
  "TV & Vidéo",
  "Outillage & Bricolage",
];

export const brandBySlug = (slug: string) => BRANDS.find((b) => b.slug === slug);
export const devicesOfBrand = (slug: string) => DEVICES.filter((d) => d.brand === slug);
export const deviceBySlug = (slug: string) => DEVICES.find((d) => d.slug === slug);
export const brandName = (slug: string) => brandBySlug(slug)?.name ?? slug;

/**
 * Famille de modèles (génération) déduite du nom commercial :
 * « Samsung Galaxy A56 5G » → « Galaxy A5x », « iPhone 17 Air » → « iPhone 17 »,
 * « Samsung Galaxy S25+ » → « Galaxy S25 », « Tecno Camon 40 Pro » → « Camon 40 »,
 * « HP Laptop 14 (2022) » → « Laptop 14 », « HP EliteBook 820 G4 » → « EliteBook 820 ».
 */
export function familyOf(name: string): string {
  const words = name.replace(/″/g, "").split(" ");
  const PREFIXES = new Set([
    "Samsung",
    "Tecno",
    "Infinix",
    "Google",
    "Xiaomi",
    "Huawei",
    "Oppo",
    "Motorola",
    "Nintendo",
    "Sony",
    "Microsoft",
    "HP",
    "Lenovo",
    "Dell",
    "Itel",
    "Honor",
    "LG",
    "Philips",
    "Hisense",
    "TCL",
    "Bosch",
    "JBL",
    "Bose",
    "Whirlpool",
  ]);
  while (words.length && PREFIXES.has(words[0] ?? "")) words.shift();
  const isWatchUltra =
    words[0] === "Galaxy" && words[1] === "Watch" && words[words.length - 1] === "Ultra";
  const VARIANTS = /^(Pro\+?|Max|Plus|Ultra|FE|Mini|5G|Slim|HD|Neo|Premier|Curve|Air|i|e)$/i;
  while (words.length && VARIANTS.test(words[words.length - 1] ?? "")) words.pop();
  // « HP Laptop 14 (2022) » → « HP Laptop 14 », « HP EliteBook 820 G4 » → « HP EliteBook 820 »
  while (words.length && /^\(\d{4}\)$/.test(words[words.length - 1] ?? "")) words.pop();
  while (words.length && /^G\d{1,2}$/i.test(words[words.length - 1] ?? "")) words.pop();
  if (isWatchUltra) words.push("Ultra");
  const last = words[words.length - 1] ?? "";
  // « S25+ » → « S25 », « Note 50x » → « Note 50 », « Spark 30C » → « Spark 30 », « Hot 50i » → « Hot 50 », « Laptop 15s » → « Laptop 15 »
  if (words.length && !/^m\d+$/i.test(last) && /\d+[A-Za-z+]+$/.test(last)) {
    words[words.length - 1] = last.replace(/(\d+)[A-Za-z+]*$/, "$1");
  }
  if (words[0] === "Galaxy" && /^A\d{2,3}$/.test(words[1] ?? "")) {
    words[1] = words[1]!.replace(/^A(\d).*$/, "A$1x");
    return words.slice(0, 2).join(" ");
  }
  return words.join(" ");
}

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
  { cat: "Paiement", q: "Quels moyens de paiement acceptez-vous ?", a: "MTN Mobile Money, Moov Money, Celtiis, espèces et virement pour les entreprises. Le paiement s'effectue après validation de la réparation." },
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

