import type { Locale } from "./locales";

/**
 * Dictionnaire de langue de l'interface.
 * La clé est un identifiant stable ; le français est la langue source.
 */
export type Dictionary = Record<string, string>;

const fr: Dictionary = {
  // Navigation
  "nav.reparations": "Réparations",
  "nav.catalogue": "Catalogue",
  "nav.tarifs": "Tarifs",
  "nav.boutique": "Boutique",
  "nav.suivi": "Suivi",
  "nav.entreprises": "Entreprises",
  "nav.blog": "Blog",
  "nav.panier": "Panier",
  "nav.reservation": "Réserver",
  "nav.mon-compte": "Mon compte",
  "nav.connexion": "Connexion",
  "nav.devis": "Devis instantané",
  "nav.garantie": "Garantie",
  "nav.reprise": "Reprise",
  "nav.avis": "Avis clients",
  "nav.faq": "FAQ",
  "nav.contact": "Contact",

  // Actions / liens génériques
  "action.explorer": "Explorer",
  "action.retour-accueil": "Retour à l'accueil",
  "action.accueil": "Accueil",
  "action.ressayer": "Réessayer",
  "action.ouvrir-carte": "Ouvrir la carte",
  "action.en-savoir-plus": "En savoir plus",

  // Header
  "header.menu": "Menu",
  "header.desktop-nav": "Navigation principale",
  "header.mobile-nav": "Navigation mobile",
  "header.search": "Rechercher sur le site (Ctrl+K)",
  "header.open-menu": "Ouvrir le menu",
  "header.theme-dark": "Activer le mode sombre",
  "header.theme-light": "Activer le mode clair",
  "header.language": "Changer de langue",

  // Footer
  "footer.description":
    "Expertise technique certifiée à Abomey-Calavi. Nous redonnons vie à vos outils de travail et de divertissement : smartphones, tablettes, MacBook, iMac, consoles et montres connectées.",
  "footer.services": "Services",
  "footer.nous-reparations": "Nos réparations",
  "footer.grille-tarifaire": "Grille tarifaire",
  "footer.prendre-rendez-vous": "Prendre rendez-vous",
  "footer.reprise-appareils": "Reprise d'appareils",
  "footer.entreprises": "Entreprises",
  "footer.solutions-b2b": "Solutions B2B",
  "footer.suivre-reparation": "Suivre une réparation",
  "footer.questions-frequentes": "Questions fréquentes",
  "footer.blog-conseils": "Blog & conseils",
  "footer.contact": "Contact",
  "footer.rights": "Allô Techno Bénin. Tous droits réservés.",
  "footer.garanties": "Garanties",
  "footer.mentions-legales": "Mentions légales",

  // Status atelier
  "status.open": "Ouvert",
  "status.closed": "Fermé",
  "status.close-at": "Fermeture {0}",
  "status.open-at": "Ouverture {0}",
  "status.reopens-monday": "Rouvre lundi 08:30",

  // Common
  "pagination.retour": "Précédent",
  "pagination.suivant": "Suivant",
  "common.loading": "Chargement…",
  "common.error": "Une erreur est survenue.",

  // Home — hero
  "home.meta.title": "Allô Techno — Réparation smartphone & ordinateur à Abomey-Calavi",
  "home.meta.description":
    "Réparation experte de smartphones, tablettes, MacBook, iMac, consoles et montres connectées à Abomey-Calavi. Diagnostic gratuit, pièces certifiées, garantie 6 mois.",
  "home.og.title": "Allô Techno — Réparation d'appareils électroniques au Bénin",
  "home.og.description":
    "Diagnostic gratuit, devis en 15 minutes, réparation express à Abomey-Calavi.",
  "home.hero.badge": "Atelier certifié · {0}",
  "home.hero.h1.a": "Votre appareil réparé",
  "home.hero.h1.highlight": "aujourd'hui",
  "home.hero.h1.b": ", pas la semaine prochaine.",
  "home.hero.text":
    "Smartphones, tablettes, ordinateurs, MacBook, consoles et montres connectées. Prix affiché avant démontage, garantie jusqu'à 6 mois, paiement Mobile Money.",
  "home.hero.f1": "Diagnostic gratuit",
  "home.hero.f2": "Express dès 25 min",
  "home.hero.f3": "Garantie jusqu'à 12 mois",
  "home.hero.rating": "avis vérifiés",
  "home.hero.techs": "3 techniciens",
  "home.hero.techs.sub": "dont 1 microsoudure",
  "home.hero.tracking.ref": "Prêt",
  "home.hero.step1": "Reçu à l'atelier",
  "home.hero.step2": "Diagnostic terminé",
  "home.hero.step3": "Écran remplacé",
  "home.hero.step4": "Contrôle qualité",
  "home.hero.step5": "Prêt à récupérer",
  "home.hero.summary.label": "iPhone 13 · Écran",
  "home.hero.summary.total": "1 h 51 au total",
  "home.hero.summary.warranty": "Garanti 6 mois",
  "home.hero.fault": "Écran complet",
  "home.hero.warranty-short": "3 mois",
  "home.hero.part": "Écran compatible",

  // Home — catégories
  "home.cats.eyebrow": "Choisissez par catégorie",
  "home.cats.hint":
    "Vous continuerez sur la page réparation pour choisir la marque, le modèle et le créneau.",

  // Home — marques
  "home.brands.eyebrow": "Catalogue",
  "home.brands.title": "Réparation par marque",
  "home.brands.text":
    "Toutes les marques majeures du marché béninois, des flagships Apple aux modèles Tecno, Infinix et Itel.",
  "home.brands.cta": "Voir toutes les marques",

  // Home — tarifs
  "home.prices.eyebrow": "Transparence",
  "home.prices.title": "Tarifs transparents",
  "home.prices.text":
    "Aucun frais caché. Nos prix incluent la main-d'œuvre et la pièce. Devis ferme après diagnostic.",
  "home.prices.stock": "Stock disponible",
  "home.prices.warranty": "Garantie {0}",
  "home.prices.cta": "Grille tarifaire complète",

  // Home — process
  "home.process.eyebrow": "Méthode",
  "home.process.title": "Trois étapes, zéro surprise",

  // Home — suivi
  "home.suivi.title": "Suivre mon dossier",
  "home.suivi.text":
    "Chaque dépôt génère un numéro de dossier. Suivez chaque étape en temps réel, du diagnostic à la restitution.",
  "home.suivi.cta": "Vérifier le statut",
  "home.suivi.payments": "Paiements acceptés",
  "home.suivi.eyebrow": "Atelier",
  "home.suivi.workshop-title": "Un atelier, pas un dépannage",
  "home.suivi.workshop-text":
    "Station de micro-soudure, bain à ultrasons, alimentation de laboratoire, presse à écran et testeurs de batterie. Nos techniciens sont formés sur chaque famille d'appareils.",

  // Home — avis
  "home.reviews.eyebrow": "Avis clients",
  "home.reviews.title": "Ils nous confient leurs appareils",
  "home.reviews.cta": "Tous les avis",

  // Blocs partagés
  "blocks.stars": "{0} étoiles sur 5",
  "blocks.money.payments": "Paiements acceptés",
  "blocks.money.cash": "Espèces",
  "blocks.money.b2b": "Virement B2B",
  "blocks.cta.title": "Un appareil en panne aujourd'hui ?",
  "blocks.cta.text":
    "Diagnostic gratuit, devis en 15 minutes, réparation express à {0}. Enlèvement gratuit dès {1} de réparation.",
  "blocks.cta.reserve": "Réserver une réparation",
  "blocks.cta.devis": "Devis instantané",
  "blocks.stats.repaired": "Appareils réparés",
  "blocks.stats.delay": "Délai moyen smartphone",
  "blocks.stats.parts": "Pièces en stock",
  "blocks.stats.satisfaction": "Satisfaction client",
};

const en: Dictionary = {
  // Navigation
  "nav.reparations": "Repairs",
  "nav.catalogue": "Catalogue",
  "nav.tarifs": "Pricing",
  "nav.boutique": "Shop",
  "nav.suivi": "Track",
  "nav.entreprises": "Business",
  "nav.blog": "Blog",
  "nav.panier": "Cart",
  "nav.reservation": "Book now",
  "nav.mon-compte": "My account",
  "nav.connexion": "Sign in",
  "nav.devis": "Instant quote",
  "nav.garantie": "Warranty",
  "nav.reprise": "Trade-in",
  "nav.avis": "Reviews",
  "nav.faq": "FAQ",
  "nav.contact": "Contact",

  // Actions
  "action.explorer": "Explore",
  "action.retour-accueil": "Back to home",
  "action.accueil": "Home",
  "action.ressayer": "Retry",
  "action.ouvrir-carte": "Open map",
  "action.en-plus-savoir": "Learn more",

  // Header
  "header.menu": "Menu",
  "header.desktop-nav": "Main navigation",
  "header.mobile-nav": "Mobile navigation",
  "header.search": "Search the site (Ctrl+K)",
  "header.open-menu": "Open the menu",
  "header.theme-dark": "Enable dark mode",
  "header.theme-light": "Enable light mode",
  "header.language-switch": "Switch language",
  "header.language": "Language",

  // Footer
  "footer.description":
    "Certified technical expertise in Abomey-Calavi. We bring your work and entertainment tools back to life: smartphones, tablets, computers, consoles and smartwatches.",
  "footer.services": "Services",
  "footer.nos-reparations": "Our repairs",
  "footer.grille-tarifaire": "Price list",
  "footer.prendre-rendez-vous": "Book an appointment",
  "footer.reprise-appareils": "Device trade-in",
  "footer.entreprises": "Business",
  "footer.solutions-b2b": "B2B solutions",
  "footer.suivre-reparation": "Track a repair",
  "footer.questions-frequentes": "Frequently asked questions",
  "footer.blog-conseils": "Blog & tips",
  "footer.contact": "Contact",
  "footer.rights": "Allô Techno Benin. All rights reserved.",
  "footer.garanties": "Warranties",
  "footer.mentions-legales": "Legal notice",

  // Status atelier
  "status.open": "Open",
  "status.closed": "Closed",
  "status.close-at": "Closes at {0}",
  "status.open-at": "Opens at {0}",
  "status.reopens-monday": "Reopens Monday 08:30",

  // Common
  "pagination.précédent": "Previous",
  "pagination.suivant": "Next",
  "common.loading": "Loading…",
  "common.error": "An error occurred.",

  // Home — hero
  "home.meta.title": "Allô Techno — Smartphone & computer repair in Abomey-Calavi",
  "home.meta.description":
    "Expert repair of smartphones, tablets, MacBook, iMac, consoles and smartwatches in Abomey-Calavi. Free diagnosis, certified parts, 6-month warranty.",
  "home.og.title": "Allô Techno — Electronics repair in Benin",
  "home.og.description": "Free diagnosis, quote in 15 minutes, express repair in Abomey-Calavi.",
  "home.hero.badge": "Certified workshop · {0}",
  "home.hero.h1.a": "Your device repaired",
  "home.hero.h1.highlight": "today",
  "home.hero.h1.b": ", not next week.",
  "home.hero.text":
    "Smartphones, tablets, computers, MacBook, consoles and smartwatches. Price shown before disassembly, warranty up to 6 months, Mobile Money payment.",
  "home.hero.f1": "Free diagnosis",
  "home.hero.f2": "Express from 25 min",
  "home.hero.f3": "Warranty up to 12 months",
  "home.hero.rating": "verified reviews",
  "home.hero.techs": "3 technicians",
  "home.hero.techs.sub": "including 1 microsoldering",
  "home.hero.tracking.ref": "Ready",
  "home.hero.step1": "Received at workshop",
  "home.hero.step2": "Diagnosis complete",
  "home.hero.step3": "Screen replaced",
  "home.hero.step4": "Quality check",
  "home.hero.step5": "Ready for pickup",
  "home.hero.summary.label": "iPhone 13 · Screen",
  "home.hero.summary.total": "1 h 51 total",
  "home.hero.summary.warranty": "6-month warranty",
  "home.hero.fault": "Full screen",
  "home.hero.warranty-short": "3 months",
  "home.hero.part": "Compatible screen",

  // Home — categories
  "home.cats.eyebrow": "Choose by category",
  "home.cats.hint":
    "You will continue on the repair page to choose the brand, model and time slot.",

  // Home — brands
  "home.brands.eyebrow": "Catalogue",
  "home.brands.title": "Repair by brand",
  "home.brands.text":
    "All major brands of the Beninese market, from Apple flagships to Tecno, Infinix and Itel models.",
  "home.brands.cta": "See all brands",

  // Home — prices
  "home.prices.eyebrow": "Transparency",
  "home.prices.title": "Transparent pricing",
  "home.prices.text":
    "No hidden fees. Our prices include labor and parts. Firm quote after diagnosis.",
  "home.prices.stock": "In stock",
  "home.prices.warranty": "Warranty {0}",
  "home.prices.cta": "Full price list",

  // Home — process
  "home.process.eyebrow": "Method",
  "home.process.title": "Three steps, zero surprises",

  // Home — tracking
  "home.suivi.title": "Track my case",
  "home.suivi.text":
    "Each drop-off generates a case number. Track every step in real time, from diagnosis to pickup.",
  "home.suivi.cta": "Check status",
  "home.suivi.payments": "Accepted payments",
  "home.suivi.eyebrow": "Workshop",
  "home.suivi.workshop-title": "A workshop, not a patch-up job",
  "home.suivi.workshop-text":
    "Micro-soldering station, ultrasonic bath, laboratory power supply, screen press and battery testers. Our technicians are trained on every device family.",

  // Home — reviews
  "home.reviews.eyebrow": "Customer reviews",
  "home.reviews.title": "They trust us with their devices",
  "home.reviews.cta": "All reviews",

  // Shared blocks
  "blocks.stars": "{0} out of 5 stars",
  "blocks.money.payments": "Accepted payments",
  "blocks.money.cash": "Cash",
  "blocks.money.b2b": "B2B transfer",
  "blocks.cta.title": "Device broken today?",
  "blocks.cta.text":
    "Free diagnosis, quote in 15 minutes, express repair in {0}. Free pickup from {1} in repairs.",
  "blocks.cta.reserve": "Book a repair",
  "blocks.cta.devis": "Instant quote",
  "blocks.stats.repaired": "Devices repaired",
  "blocks.stats.delay": "Avg smartphone turnaround",
  "blocks.stats.parts": "Parts in stock",
  "blocks.stats.satisfaction": "Customer satisfaction",
};

const dictionaries: Record<Locale, Dictionary> = { fr, en };

export type LocaleSegments = { fr: Dictionary; en: Dictionary };
export function registerSegments(...segments: LocaleSegments[]) {
  for (const seg of segments) {
    Object.assign(dictionaries.fr, seg.fr);
    Object.assign(dictionaries.en, seg.en);
  }
}

/** Retourne la valeur traduite, avec repli sur le français puis sur la clé. */
export function translate(locale: Locale, key: string, params?: (string | number)[]): string {
  const dict = dictionaries[locale];
  let value = dict?.[key];
  if (value === undefined) value = dictionaries.fr[key] ?? key;
  if (params && params.length) {
    value = value.replace(/\{(\d+)\}/g, (_, i: string) => String(params[Number(i)] ?? ""));
  }
  return value;
}
