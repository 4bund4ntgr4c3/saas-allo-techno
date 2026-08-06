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
      { title: "Écran iPhone brisé", text: "Dalles OLED grade A+ posées en moins d'une heure, True Tone conservé quand la nappe d'origine est réutilisable." },
      { title: "Batterie qui chute l'après-midi", text: "Cycle de charge dégradé par la chaleur : nous mesurons la santé réelle avant de proposer un remplacement." },
      { title: "Port de charge instable", text: "Nettoyage ultrason ou remplacement de la nappe de charge, panne n°1 sur les iPhone circulant entre Calavi et Cotonou." },
    ],
  },
  samsung: {
    intro:
      "Galaxy S et Galaxy A représentent une grande partie des réparations quotidiennes à Abomey-Calavi. Écran AMOLED fissuré, dos décollé par l'humidité, charge lente : nous stockons les pièces des modèles les plus vendus au Bénin pour réparer le jour même.",
    pannes: [
      { title: "Écran AMOLED fissuré", text: "Bloc complet collé sous presse, châssis nettoyé et étanchéité refaite." },
      { title: "Charge lente ou intermittente", text: "Remplacement du connecteur USB-C et contrôle du circuit de charge." },
      { title: "Appareil tombé dans l'eau", text: "Désoxydation en bac ultrason sous 24 h — n'allumez pas l'appareil avant de nous l'apporter." },
    ],
  },
  tecno: {
    intro:
      "Tecno est l'une des marques les plus présentes à Abomey-Calavi. Camon, Spark et Phantom passent chez nous pour des écrans cassés, des batteries gonflées et des micros saturés par la poussière harmattan.",
    pannes: [
      { title: "Écran Camon / Spark", text: "Pièces compatibles disponibles en stock, remplacement pendant que vous attendez." },
      { title: "Batterie gonflée", text: "Remplacement immédiat : une batterie gonflée déforme l'écran et devient dangereuse." },
      { title: "Micro ou haut-parleur étouffé", text: "Nettoyage des grilles et remplacement du module audio quand la poussière a fait son œuvre." },
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
      { title: "Console bruyante ou en surchauffe", text: "Démontage complet, dépoussiérage et changement de pâte thermique." },
      { title: "Manette qui dérive (drift)", text: "Remplacement des joysticks, calibrage et test manette en jeu." },
      { title: "HDMI sans image", text: "Micro-soudure du port HDMI en atelier, sans changement de carte mère." },
    ],
  },
};

const genericPannes = (b: Brand) => [
  { title: `Écran ${b.name} cassé`, text: "Remplacement avec pièce sélectionnée selon le modèle, test tactile et luminosité avant restitution." },
  { title: `Batterie ${b.name}`, text: "Mesure de la santé réelle, remplacement et contrôle de charge sur banc." },
  { title: "Connecteur de charge", text: "Nettoyage ou remplacement du port : la panne la plus fréquente en saison sèche à Abomey-Calavi." },
];

export const brandLocal = (b: Brand): BrandLocal => {
  const s = SPECIFICS[b.slug] ?? {};
  return {
    intro:
      s.intro ??
      `Nous réparons les appareils ${b.name} à Abomey-Calavi et dans toute l'agglomération de Cotonou : diagnostic gratuit, devis ferme avant intervention et garantie écrite sur chaque pièce posée.`,
    pannes: s.pannes ?? genericPannes(b),
    faq:
      s.faq ?? [
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
