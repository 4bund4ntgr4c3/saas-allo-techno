// Données statiques légères (marques, catégories, articles, FAQ, avis, étapes).
// Isolées du gros DEVICES pour que la page d'accueil et __root ne chargent pas
// tout le catalogue d'appareils (~500 Ko) au premier rendu.

import type { Brand } from "./types";
import { BRAND_ICONS } from "./brand-icons";

export { type Brand } from "./types";

function brandIcon(slug: string): string | undefined {
  return BRAND_ICONS[slug];
}

export const BRANDS: Brand[] = [
  {
    slug: "apple",
    name: "Apple",
    tag: "iPhone · iPad · MacBook · iMac · Watch",
    devices: ["iPhone", "iPad", "MacBook", "Mac mini", "iMac", "Apple Watch"],
    icon: brandIcon("apple"),
  },
  {
    slug: "samsung",
    name: "Samsung",
    tag: "Galaxy S26 · A56 · Z Fold 7",
    devices: [
      "Galaxy S",
      "Galaxy Note",
      "Galaxy Z",
      "Galaxy A",
      "Galaxy J",
      "Galaxy M",
      "Galaxy F",
      "Galaxy Xcover",
      "Galaxy Tab",
      "Galaxy Watch",
      "Galaxy Book",
    ],
    icon: brandIcon("samsung"),
  },
  {
    slug: "xiaomi",
    name: "Xiaomi",
    tag: "Xiaomi 15 · Redmi Note 14",
    devices: ["Xiaomi Série", "Redmi Note", "Redmi", "Poco"],
    icon: brandIcon("xiaomi"),
  },
  { slug: "huawei", name: "Huawei", tag: "Pura · Mate · Nova", devices: ["Pura", "Mate", "Nova"], icon: brandIcon("huawei") },
  { slug: "oppo", name: "Oppo", tag: "Reno 13 · A Series", devices: ["Reno", "A Series", "Find"], icon: brandIcon("oppo") },
  { slug: "google", name: "Google Pixel", tag: "Pixel 6 à 10", devices: ["Pixel"], icon: brandIcon("google") },
  { slug: "oneplus", name: "OnePlus", tag: "Nord · Série 13", devices: ["Nord", "Série 13"], icon: brandIcon("oneplus") },
  {
    slug: "tecno",
    name: "Tecno",
    tag: "Camon 50 · Spark 40 · Phantom",
    devices: ["Camon", "Spark", "Phantom", "Pova", "Pop"],
    icon: brandIcon("tecno"),
  },
  {
    slug: "infinix",
    name: "Infinix",
    tag: "Note 60 · Hot 70 · Zero 40",
    devices: ["Note", "Hot", "Zero", "Smart", "GT"],
    icon: brandIcon("infinix"),
  },
  {
    slug: "itel",
    name: "Itel",
    tag: "A · S · P Series",
    devices: ["A Series", "S Series", "P Series"],
    icon: brandIcon("itel"),
  },
  { slug: "nokia", name: "Nokia", tag: "G · X · C Series", devices: ["G Series", "C Series"], icon: brandIcon("nokia") },
  { slug: "motorola", name: "Motorola", tag: "Moto G · Edge 50", devices: ["Moto G", "Edge"], icon: brandIcon("motorola") },
  { slug: "honor", name: "Honor", tag: "Magic 7 · X Series", devices: ["Magic", "X Series"], icon: brandIcon("honor") },
  {
    slug: "sony",
    name: "Sony",
    tag: "PlayStation 4 · 5 · Xperia",
    devices: ["PlayStation", "Xperia"],
    icon: brandIcon("sony"),
  },
  { slug: "nintendo", name: "Nintendo", tag: "Switch · Switch 2", devices: ["Switch"], icon: brandIcon("nintendo") },
  {
    slug: "microsoft",
    name: "Microsoft",
    tag: "Xbox Series X|S · Surface",
    devices: ["Xbox", "Surface"],
    icon: brandIcon("microsoft"),
  },
  {
    slug: "hp",
    name: "HP",
    tag: "EliteBook · ProBook · Pavilion",
    devices: [
      "EliteBook",
      "ProBook",
      "Pavilion",
      "Spectre",
      "Envy",
      "OMEN",
      "Victus",
      "HP Laptop",
      "HP 200/300",
    ],
    icon: brandIcon("hp"),
  },
  {
    slug: "lenovo",
    name: "Lenovo",
    tag: "IdeaPad · ThinkPad · Tab",
    devices: ["IdeaPad", "ThinkPad"],
    icon: brandIcon("lenovo"),
  },
  { slug: "dell", name: "Dell", tag: "XPS · Latitude · Inspiron", devices: ["XPS", "Latitude"], icon: brandIcon("dell") },
  {
    slug: "realme",
    name: "Realme",
    tag: "Realme 12 · GT 6 · C Series",
    devices: ["Realme numbered", "C Series", "GT", "Narzo"],
  },
  {
    slug: "lg",
    name: "LG",
    tag: "TV OLED · Frigo Inverter · Son",
    devices: ["LG TV", "LG Réfrigérateur", "LG Machine à laver", "LG Climatiseur"],
  },
  {
    slug: "philips",
    name: "Philips",
    tag: "Petit électro · Ampoules · Micro-ondes",
    devices: ["Philips Petit électro"],
  },
  {
    slug: "hisense",
    name: "Hisense",
    tag: "TV 4K · Frigo · Clim",
    devices: ["Hisense TV", "Hisense Réfrigérateur", "Hisense Climatiseur"],
  },
  {
    slug: "tcl",
    name: "TCL",
    tag: "TV HD/4K · Petit électro",
    devices: ["TCL TV", "TCL Petit électro"],
  },
  {
    slug: "bosch",
    name: "Bosch",
    tag: "Électro · Outillage · Électroménager",
    devices: ["Bosch Électroménager", "Bosch Outillage"],
  },
  { slug: "jbl", name: "JBL", tag: "Enceintes · Casques · Son", devices: ["JBL Audio"] },
  { slug: "bose", name: "Bose", tag: "Casques · Enceintes premium", devices: ["Bose Audio"] },
  {
    slug: "whirlpool",
    name: "Whirlpool",
    tag: "Frigo · Lave-linge · Four",
    devices: ["Whirlpool Électroménager"],
  },
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
    excerpt:
      "Poussière, pâte thermique sèche, ventilation obstruée : le protocole d'entretien complet de votre console.",
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
  {
    slug: "faire-sauvegarde-avant-reparation",
    title: "Faire une bonne sauvegarde avant réparation : photos, WhatsApp, 2FA",
    excerpt:
      "Écran cassé, batterie fatiguée ? Vous pouvez déposer votre appareil avec sérénité : photos, WhatsApp, contacts au sec en 10 minutes, avant l'atelier.",
    date: "2026-08-06",
    category: "Guides",
    readingTime: "5 min",
    body: [
      "Une réparation sur dix se conclut par un client qui réalise, au mauvais moment, qu'il n'a jamais sauvegardé son téléphone. Dix minutes suffisent pour éviter cette mauvaise surprise avant de déposer l'appareil.",
      "Activez la sauvegarde automatique quelques heures avant le dépôt : photos sur Google Photos ou iCloud, contacts, SMS. La copie se fait d'abord sur le réseau Wi-Fi de la maison et se termine la nuit — vérifiez simplement qu'elle affiche zéro erreur.",
      "WhatsApp mérite une attention particulière : Paramètres > Réglages > Chats > Sauvegarde. Gardez le « inclure les vidéos » quand vous voulez tout garder, et sachez qu'elle est liée à votre numéro de ligne, pas à l'appareil.",
      "Notez les codes de double authentification (2FA) et les mots de passe par e-mail : ils sont souvent liés à l'ancien appareil. Un papier plié dans le portefeuille fait très bien le travail — et évite de verrouiller un compte au moment du transfert.",
      "Enfin, sachez-le : chez Allô Techno, les écrans comme les batteries ne touchent jamais vos données. Mais avant une intervention sur carte mère ou un transfert, la copie vous protège. Pas préparé avant de venir ? Nous le faisons avec vous à l'accueil, avant toute intervention.",
    ],
  },
  {
    slug: "transferer-donnees-vers-nouveau-telephone",
    title: "Changer de téléphone : transférer ses données sans rien perdre",
    excerpt:
      "Android ou iPhone, photos, WhatsApp et contacts : le transfert sans casse quand on passe à un appareil neuf ou d'occasion, avant même de déposer l'ancien.",
    date: "2026-08-02",
    category: "Guides",
    readingTime: "6 min",
    body: [
      "Nouveau téléphone, occasion repérée sur le marché, ou remplacement d'un écran massacré : quelle que soit la raison, une bonne préparation fait gagner une heure et éviter bien des tracas.",
      "Premier geste : branchez les deux appareils sur le secteur et connectez-les au même Wi-Fi. Un transfert interrompu par une batterie déchargée est la première cause de photos perdues en route.",
      "Sur Android, chaque marque a son outil : Smart Switch sur Samsung, l'assistant d'installation des Tecno, Infinix et Itel, ou encore Clone sur les marques chinoises. Tous déplacent les photos, les contacts et vos applications d'une seule fois.",
      "Sur iPhone, la migration côté Apple (Démarrage rapide) fonctionne sans câble entre deux iPhones. Si vous changez d'univers — Android vers iPhone ou l'inverse — l'application « Passer à iOS » ou vos guides officiels transfèrent l'essentiel, WhatsApp compris.",
      "La dernière étape oubliée : vérifiez que la carte SIM est bien lue et qu'un appel arrive sur le nouveau numéro, surtout si un écran cassé empêche encore d'utiliser l'ancien appareil.",
      "Pas de prise de tête ? Notre atelier assure le clonage complet en une trentaine de minutes, données et applications comprises, pendant que vous attendez à l'abri.",
    ],
  },
  {
    slug: "verifier-sante-batterie-astuces",
    title: "Vérifier la santé de sa batterie soi-même : nos astuces",
    excerpt:
      "Autonomie en chute, recharge qui traîne ? Apprenez à mesurer la santé réelle de sa batterie, avec le bon réflexe face aux coupures de courant du Bénin.",
    date: "2026-07-22",
    category: "Guides",
    readingTime: "4 min",
    body: [
      "Votre téléphone s'éteint à 20 % ou met une nuit à se recharger ? La batterie vieillit sûrement — mais encore faut-il le mesurer avec des valeurs réelles plutôt qu'à vue de nez.",
      "Sur iPhone, c'est intégré : Réglages > Batterie > Santé de la batterie. La capacité maximale s'affiche en pourcentage, et son évolution s'observe en douceur au fil des semaines.",
      "Sur Android, la commande *#*#4636#*#* ouvre le menu de diagnostic sur la plupart des marques ; sinon, une application comme AccuBattery mesure la capacité réelle après quelques jours d'utilisation classique.",
      "La règle d'atelier : quand la capacité passe sous 85 %, chaque déchargement compte double. Un redémarrage aléatoire ou un renflement du dos justifie un remplacement immédiat — la batterie gonflée est le seul danger vraiment sérieux.",
      "Un mot sur les coupures de courant, si fréquentes au Bénin : une tension instable surcharge les cellules et fausse les mesures. Rebranchez après stabilisation du réseau, ou nourrissez le chargeur via un onduleur.",
      "Notre banc de test mesure capacité réelle, résistance interne et nombre de cycles en deux minutes. Et si la batterie est encore saine, nous vous le disons franchement — parfois la panne vient du circuit de charge, pas de la cellule.",
    ],
  },
  {
    slug: "nettoyer-port-charge-harmattan",
    title: "Port de charge bloqué par le harmattan : le nettoyage maison",
    excerpt:
      "Câble qui ne tient plus, charge en dents de scie ? La poussière sèche a encroûté le port USB. Voici le geste sûr avant de passer au connecteur neuf.",
    date: "2026-07-14",
    category: "Guides",
    readingTime: "5 min",
    body: [
      "Pendant la saison sèche, la poussière fine du harmattan s'infiltre partout — et votre port de charge joue le rôle d'un entonnoir. Quelques semaines au fond d'une poche suffisent à compacter un tampon de poussière.",
      "Premier symptôme : le câble ne s'enfonce plus et la charge s'interrompt au moindre mouvement. Dans neuf cas sur dix, il n'y a aucune panne électronique — juste un connecteur encrassé.",
      "Ce qu'il ne faut jamais faire : souffler directement dans le port (l'humidité colle la poussière encore plus) ni y enfoncer un trombone ou une épingle métallique — un court-circuit sur le connecteur de charge est une des pannes les plus coûteuses.",
      "La méthode douce : câble débranché et appareil éteint, passez une brosse en nylon très fine ou un cure-dent en bois le long d'un côté du port, sans forcer. Terminez par un léger coup d'air comprimé (type souffle pour clavier) si vous en possédez un.",
      "Si le port reste colmaté ou trop encrassé, confiez-le-nous : désencastrage par air, nettoyage, contrôle et test de charge — comptez 20 minutes pour sauver le connecteur.",
      "En prévention : une coque avec cache-port, le téléphone rangé hors des poches poussiéreuses en saison sèche, et un passage à l'atelier en début d'harmattan pour un dépoussiérage préventif.",
    ],
  },
];

export const FAQ: { q: string; a: string; cat: string }[] = [
  {
    cat: "Réparation",
    q: "Combien de temps prend une réparation d'écran ?",
    a: "La majorité des remplacements d'écran smartphone se font en 25 à 50 minutes sur place. Les tablettes et ordinateurs demandent entre 3 h et 48 h selon la pièce.",
  },
  {
    cat: "Réparation",
    q: "Le diagnostic est-il payant ?",
    a: "Non. Le diagnostic est gratuit et sans engagement. Vous recevez un devis détaillé avant toute intervention.",
  },
  {
    cat: "Garantie",
    q: "Quelle est la durée de la garantie ?",
    a: "6 mois sur les écrans et batteries premium, 3 mois sur les pièces compatibles et les interventions de micro-soudure, 1 an sur certaines pièces Apple d'origine.",
  },
  {
    cat: "Garantie",
    q: "La garantie couvre-t-elle une nouvelle chute ?",
    a: "Non. La garantie couvre les défauts de pièce et de main-d'œuvre, pas les dommages accidentels, l'oxydation ou une intervention par un tiers.",
  },
  {
    cat: "Paiement",
    q: "Quels moyens de paiement acceptez-vous ?",
    a: "MTN Mobile Money, Moov Money, Celtiis, espèces et virement pour les entreprises. Le paiement s'effectue après validation de la réparation.",
  },
  {
    cat: "Paiement",
    q: "Puis-je payer en plusieurs fois ?",
    a: "Un acompte de 50 % est possible sur les réparations supérieures à 100 000 FCFA, le solde à la restitution de l'appareil.",
  },
  {
    cat: "Données",
    q: "Mes données sont-elles conservées ?",
    a: "Un remplacement d'écran ou de batterie ne touche pas vos données. Pour toute intervention sur la carte mère, nous recommandons une sauvegarde préalable.",
  },
  {
    cat: "Données",
    q: "Dois-je fournir mon code de déverrouillage ?",
    a: "Oui, pour tester l'ensemble des fonctions après réparation. Vous pouvez aussi le saisir vous-même à la restitution.",
  },
  {
    cat: "Suivi",
    q: "Comment suivre ma réparation ?",
    a: "Chaque dépôt génère un numéro de dossier (format AT-2026-XXX). Saisissez-le dans la page Suivi ou recevez les notifications par WhatsApp.",
  },
  {
    cat: "Suivi",
    q: "Proposez-vous l'enlèvement à domicile ?",
    a: "Oui, à Abomey-Calavi, Cotonou et Godomey. L'enlèvement est gratuit dès 50 000 FCFA de réparation.",
  },
];

export const REVIEWS = [
  {
    name: "Koffi S.",
    city: "Abomey-Calavi",
    rating: 2,
    text: "Service impeccable à Calavi. Mon iPhone 15 Pro Max a été réparé en moins d'une heure.",
    device: "iPhone 15 Pro Max",
  },
  {
    name: "Mariam A.",
    city: "Cotonou",
    rating: 2,
    text: "Devis clair, prix respecté, facture fournie. Ma batterie tient à nouveau deux jours.",
    device: "Galaxy A54",
  },
  {
    name: "Yves D.",
    city: "Godomey",
    rating: 2,
    text: "Micro-soudure sur mon MacBook que deux autres ateliers avaient refusée. Machine sauvée.",
    device: "MacBook Air M1",
  },
  {
    name: "Rachida B.",
    city: "Abomey-Calavi",
    rating: 2,
    text: "Bon suivi WhatsApp du dossier. Une journée de plus que prévu mais résultat parfait.",
    device: "PlayStation 5",
  },
  {
    name: "Serge H.",
    city: "Calavi Zogbadjè",
    rating: 2,
    text: "Écran Tecno changé pendant que j'attendais. Paiement MoMo, très pratique.",
    device: "Tecno Camon 20",
  },
  {
    name: "Aline T.",
    city: "Cotonou",
    rating: 2,
    text: "Notre société fait entretenir 20 postes ici. Sérieux et factures en règle.",
    device: "Parc informatique",
  },
];

export const STEPS = [
  {
    n: "01",
    title: "Diagnostic gratuit",
    text: "Sur place ou à distance. Nous identifions la panne réelle et sa cause, sans frais.",
  },
  {
    n: "02",
    title: "Devis & validation",
    text: "Prix ferme, délai, catégorie de pièce et garantie. Rien ne démarre sans votre accord.",
  },
  {
    n: "03",
    title: "Réparation & contrôle",
    text: "Intervention en atelier, tests complets, restitution avec facture et garantie.",
  },
];
