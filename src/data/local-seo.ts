// Contenu local SEO — Abomey-Calavi & agglomération de Cotonou.
import type { Brand } from "./catalog";

export const QUARTIERS = [
  "Zogbadjè",
  "Godomey",
  "Akassato",
  "Tankpè",
  "Cocotomey",
  "Womey",
  "Calavi Kpota",
  "Hêvié",
];

/** Copie SEO localisée (fr/en) d'un quartier d'Abomey-Calavi. */
export type QuartierLocalCopy = {
  /** Paragraphe d'introduction avec mots-clés réparation (écran, batterie…). */
  intro: string;
  /** Repères locaux (carrefours, marchés, institutions) pour ancrer le contenu. */
  landmarks: string;
};

export type QuartierInfo = {
  slug: string;
  name: string;
  local: Record<"fr" | "en", QuartierLocalCopy>;
};

const QUARTIER_INFO_FR: Pick<QuartierInfo, "slug" | "name" | "local">[] = [
  {
    slug: "zogbadje",
    name: "Zogbadjè",
    local: {
      fr: {
        intro:
          "À Zogbadjè, notre atelier est installé à deux pas de la voie pavée de l'Université. Écran de smartphone cassé, batterie fatiguée par la chaleur, port de charge encrassé : diagnostic gratuit, réparation le jour même et enlèvement à domicile dans tout le quartier.",
        landmarks: "Voie pavée de l'Université, carrefour Zogbadjè, Champs de foire",
      },
      en: {
        intro:
          "In Zogbadjè, our workshop sits right next to the paved university road. Cracked smartphone screen, heat-worn battery, clogged charging port: free diagnosis, same-day repair and home pickup across the area.",
        landmarks: "Paved University Road, Zogbadjè crossroads, Champs de foire",
      },
    },
  },
  {
    slug: "godomey",
    name: "Godomey",
    local: {
      fr: {
        intro:
          "Sur l'axe Godomey, entre Calavi et Cotonou, les téléphones s'abîment à force de circuler : écrans fêlés, connecteurs encrassés par la poussière de la route. Nous récupérons votre appareil à domicile ou en boutique, et la plupart des réparations sont terminées le jour même.",
        landmarks: "Marché de Godomey, carrefour Godomey, route des Pêches",
      },
      en: {
        intro:
          "On the Godomey axis between Calavi and Cotonou, phones wear out from constant commuting: cracked screens, dust-clogged charging ports. We collect your device at home or in store, and most repairs are finished the same day.",
        landmarks: "Godomey market, Godomey crossroads, route des Pêches",
      },
    },
  },
  {
    slug: "akassato",
    name: "Akassato",
    local: {
      fr: {
        intro:
          "À Akassato, carrefour stratégique de l'axe Calavi–Cotonou, nous prenons en charge écrans, batteries et connecteurs de charge de toutes les marques du marché béninois. Diagnostic gratuit, prix fermes avant intervention, garantie écrite sur chaque pièce.",
        landmarks: "Carrefour Akassato, marché d'Akassato, axe RNIE2",
      },
      en: {
        intro:
          "In Akassato, a strategic junction on the Calavi–Cotonou axis, we handle screens, batteries and charging ports for every brand on the Beninese market. Free diagnosis, fixed prices before work starts, written warranty on every part.",
        landmarks: "Akassato crossroads, Akassato market, RNIE2 road",
      },
    },
  },
  {
    slug: "tankpe",
    name: "Tankpè",
    local: {
      fr: {
        intro:
          "Tankpè, à la porte de l'Université d'Abomey-Calavi : étudiants et riverains nous confient leurs téléphones pour un écran brisé ou une batterie qui ne tient plus la journée. Réparation pendant que vous attendez et tarifs étudiants.",
        landmarks: "Entrée de l'Université d'Abomey-Calavi, gare de Tankpè",
      },
      en: {
        intro:
          "Tankpè, at the gates of the University of Abomey-Calavi: students and residents trust us with their phones for cracked screens or batteries that die by midday. Repair while you wait and student pricing.",
        landmarks: "University of Abomey-Calavi entrance, Tankpè station",
      },
    },
  },
  {
    slug: "cocotomey",
    name: "Cocotomey",
    local: {
      fr: {
        intro:
          "Quartier résidentiel aux portes de Cotonou, Cocotomey nous envoie chaque semaine des téléphones victimes de la chaleur et de l'humidité : batterie gonflée, écran qui se décolle, micro-soudure à refaire. Enlèvement le matin, restitution réparée et garantie le soir.",
        landmarks: "Marché de Cocotomey, à 10 min de l'aéroport de Cotonou",
      },
      en: {
        intro:
          "A residential area at the gates of Cotonou, Cocotomey sends us phones hit by heat and humidity every week: swollen batteries, lifting screens, micro-soldering to redo. Pickup in the morning, repaired and guaranteed return in the evening.",
        landmarks: "Cocotomey market, 10 min from Cotonou airport",
      },
    },
  },
  {
    slug: "womey",
    name: "Womey",
    local: {
      fr: {
        intro:
          "Au bord du lac Nokoué, à Womey, la moiteur ambiante use les téléphones : connecteurs oxydés, haut-parleurs étouffés, écrans qui jaunissent. Nos techniciens nettoient, désoxydent et remplacent les pièces fatiguées, souvent le jour même.",
        landmarks: "Bord du lac Nokoué, école primaire de Womey",
      },
      en: {
        intro:
          "On the shores of Lake Nokoué in Womey, the ambient humidity wears phones down: oxidized connectors, muffled speakers, yellowing screens. Our technicians clean, deoxidize and replace tired parts, often the same day.",
        landmarks: "Lake Nokoué shore, Womey primary school",
      },
    },
  },
  {
    slug: "calavi-kpota",
    name: "Calavi Kpota",
    local: {
      fr: {
        intro:
          "Cœur historique d'Abomey-Calavi, Calavi Kpota concentre commerces et ateliers. Écran, batterie, port de charge ou console en panne : déposez votre appareil le matin, récupérez-le réparé et garanti le soir même.",
        landmarks: "Place de l'indépendance, gare de Calavi Kpota",
      },
      en: {
        intro:
          "The historic heart of Abomey-Calavi, Calavi Kpota is packed with shops and workshops. Screen, battery, charging port or console: drop your device off in the morning and pick it up repaired and guaranteed the same evening.",
        landmarks: "Place de l'indépendance, Calavi Kpota station",
      },
    },
  },
  {
    slug: "hevie",
    name: "Hêvié",
    local: {
      fr: {
        intro:
          "Plus au nord, sur la route d'Allada, Hêvié est desservi par notre service d'enlèvement : un technicien vient chercher votre téléphone à domicile, la réparation (écran, batterie, désoxydation) est réalisée en atelier et l'appareil vous est rapporté sous 48 h.",
        landmarks: "Route d'Allada, marché de Hêvié",
      },
      en: {
        intro:
          "Further north on the Allada road, Hêvié is covered by our pickup service: a technician collects your phone at home, the repair (screen, battery, deoxidation) is done in the workshop and the device is returned within 48 hours.",
        landmarks: "Allada road, Hêvié market",
      },
    },
  },
];

/** Données des 8 quartiers d'Abomey-Calavi (slug, nom, copie SEO fr/en). */
export const QUARTIER_INFO: QuartierInfo[] = QUARTIER_INFO_FR;

export const QUARTIER_SLUGS: string[] = QUARTIER_INFO.map((q) => q.slug);

export const quartierBySlug = (slug: string): QuartierInfo | undefined =>
  QUARTIER_INFO.find((q) => q.slug === slug);

/** Copie SEO localisée d'un quartier (fr/en) ; undefined si slug inconnu. */
export const quartierLocal = (slug: string): Record<"fr" | "en", QuartierLocalCopy> | undefined =>
  quartierBySlug(slug)?.local;

export type BrandLocal = {
  intro: string;
  pannes: { title: string; text: string }[];
  faq: { q: string; a: string }[];
};

const SPECIFICS: Record<string, Partial<BrandLocal>> = {
  apple: {
    intro:
      "Les iPhone et MacBook réparés à Abomey-Calavi arrivent le plus souvent pour un écran brisé, une batterie fatiguée par la chaleur ou un connecteur Lightning encrassé par la poussière de la voie pavée. Nos techniciens travaillent sous binoculaire et conservent les nappes Face ID d'origine.",
    pannes: [
      {
        title: "Écran iPhone brisé",
        text: "Dalles OLED grade A+ posées en moins d'une heure, True Tone conservé quand la nappe d'origine est réutilisable.",
      },
      {
        title: "Batterie qui chute l'après-midi",
        text: "Cycle de charge dégradé par la chaleur : nous mesurons la santé réelle avant de proposer un remplacement.",
      },
      {
        title: "Port de charge instable",
        text: "Nettoyage ultrason ou remplacement de la nappe de charge, panne n°1 sur les iPhone circulant entre Calavi et Cotonou.",
      },
    ],
  },
  samsung: {
    intro:
      "Galaxy S et Galaxy A représentent une grande partie des réparations quotidiennes à Abomey-Calavi. Écran AMOLED fissuré, dos décollé par l'humidité, charge lente : nous stockons les pièces des modèles les plus vendus au Bénin pour réparer le jour même.",
    pannes: [
      {
        title: "Écran AMOLED fissuré",
        text: "Bloc complet collé sous presse, châssis nettoyé et étanchéité refaite.",
      },
      {
        title: "Charge lente ou intermittente",
        text: "Remplacement du connecteur USB-C et contrôle du circuit de charge.",
      },
      {
        title: "Appareil tombé dans l'eau",
        text: "Désoxydation en bac ultrason sous 24 h — n'allumez pas l'appareil avant de nous l'apporter.",
      },
    ],
  },
  tecno: {
    intro:
      "Tecno est l'une des marques les plus présentes à Abomey-Calavi. Camon, Spark et Phantom passent chez nous pour des écrans cassés, des batteries gonflées et des micros saturés par la poussière harmattan.",
    pannes: [
      {
        title: "Écran Camon / Spark",
        text: "Pièces compatibles disponibles en stock, remplacement pendant que vous attendez.",
      },
      {
        title: "Batterie gonflée",
        text: "Remplacement immédiat : une batterie gonflée déforme l'écran et devient dangereuse.",
      },
      {
        title: "Micro ou haut-parleur étouffé",
        text: "Nettoyage des grilles et remplacement du module audio quand la poussière a fait son œuvre.",
      },
    ],
  },
  infinix: {
    intro:
      "Les Infinix Note, Hot et Zero sont réparés en flux tendu dans notre atelier de Zogbadjè, avec un stock d'écrans et de batteries pour les références les plus courantes au Bénin.",
  },
  itel: {
    intro:
      "Sur les Itel, l'essentiel des passages en atelier concerne l'écran, le connecteur de charge et la batterie. Interventions rapides et tarifs adaptés au marché local d'Abomey-Calavi.",
  },
  sony: {
    intro:
      "PlayStation 4, PlayStation 5 et Xperia : surchauffe liée à la poussière, lecteur qui n'éjecte plus, manette qui dérive. Notre atelier d'Abomey-Calavi remet les consoles à niveau avec pâte thermique de qualité et test de charge de deux heures.",
    pannes: [
      {
        title: "Console bruyante ou en surchauffe",
        text: "Démontage complet, dépoussiérage et changement de pâte thermique.",
      },
      {
        title: "Manette qui dérive (drift)",
        text: "Remplacement des joysticks, calibrage et test manette en jeu.",
      },
      {
        title: "HDMI sans image",
        text: "Micro-soudure du port HDMI en atelier, sans changement de carte mère.",
      },
    ],
  },
  microsoft: {
    intro:
      "Xbox 360, One et Series X|S : HDMI en micro-soudure, lecteur capricieux, RROD des premières Xbox 360 et ventilation encrassée. Notre atelier d'Abomey-Calavi traite chaque génération avec pièces d'origine ou compatibles certifiées.",
    pannes: [
      {
        title: "RROD (anneau rouge)",
        text: "Réparation du défaut de refroidissement des premières Xbox 360 : kit X-clamp, refusion et pâte thermique premium.",
      },
      {
        title: "Lecteur DVD ou Blu-ray qui ne lit plus",
        text: "Remplacement du bloc optique et mise à niveau de la lentille.",
      },
      {
        title: "HDMI sans image",
        text: "Micro-soudure du port HDMI en atelier, sans changement de carte mère.",
      },
    ],
  },
  nintendo: {
    intro:
      "Switch et Switch 2 : drift des Joy-Con, écran cassé, batterie fatiguée et port de charge USB-C endommagé. Nous réparons les consoles Nintendo à Abomey-Calavi avec des pièces compatibles et une garantie écrite.",
    pannes: [
      {
        title: "Drift des Joy-Con",
        text: "Remplacement des joysticks, calibrage et test complet des deux manettes.",
      },
      {
        title: "Écran Switch cassé",
        text: "Dalle LCD et vitre tactile remplacées, assemblage propre sous lame chauffée.",
      },
      {
        title: "Batterie ou connecteur de charge",
        text: "Remplacement de la batterie 4310 mAh ou du port USB-C de charge.",
      },
    ],
  },
};

const genericPannes = (b: Brand) => [
  {
    title: `Écran ${b.name} cassé`,
    text: "Remplacement avec pièce sélectionnée selon le modèle, test tactile et luminosité avant restitution.",
  },
  {
    title: `Batterie ${b.name}`,
    text: "Mesure de la santé réelle, remplacement et contrôle de charge sur banc.",
  },
  {
    title: "Connecteur de charge",
    text: "Nettoyage ou remplacement du port : la panne la plus fréquente en saison sèche à Abomey-Calavi.",
  },
];

export const brandLocal = (b: Brand): BrandLocal => {
  const s = SPECIFICS[b.slug] ?? {};
  return {
    intro:
      s.intro ??
      `Nous réparons les appareils ${b.name} à Abomey-Calavi et dans toute l'agglomération de Cotonou : diagnostic gratuit, devis ferme avant intervention et garantie écrite sur chaque pièce posée.`,
    pannes: s.pannes ?? genericPannes(b),
    faq: s.faq ?? [
      {
        q: `Combien coûte une réparation ${b.name} à Abomey-Calavi ?`,
        a: `Le prix dépend du modèle et de la panne. Le diagnostic est gratuit et le devis ${b.name} est communiqué avant toute intervention, pièce et garantie détaillées.`,
      },
      {
        q: `Combien de temps dure une réparation ${b.name} ?`,
        a: "La majorité des écrans et batteries sont remplacés en moins d'une heure. Les micro-soudures et désoxydations demandent 24 à 72 h.",
      },
      {
        q: `Où faire réparer un ${b.name} à Abomey-Calavi ?`,
        a: `Notre atelier est situé quartier Zogbadjè, rue de l'Université, Abomey-Calavi. Nous intervenons aussi à ${QUARTIERS.slice(1, 5).join(", ")} avec enlèvement possible.`,
      },
    ],
  };
};
