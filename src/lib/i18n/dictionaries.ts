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
  "nav.services": "Services",
  "nav.promotions": "Promotions",
  "nav.magasins": "Magasins",
  "nav.suivi": "Suivi",
  "nav.entreprises": "Entreprises",
  "nav.about": "À propos",
  "nav.work-at": "Rejoindre l'équipe",
  "nav.blog": "Blog",
  "nav.store": "Boutique",
  "nav.track": "Suivi",
  "nav.panier": "Panier",
  "nav.reservation": "Réserver",
  "nav.mon-compte": "Mon compte",
  "nav.connexion": "Connexion",
  "nav.devis": "Devis instantané",
  "nav.garantie": "Garantie",
  "nav.reprise": "Reprise",
  "nav.avis": "Avis clients",
  "nav.faq": "FAQ",
  "nav.changelog": "Changelog",
  "nav.contact": "Contact",
  "nav.engagements": "Engagements",
  "nav.guides": "Guides & conseils",
  "nav.reclamation": "Réclamation",
  "nav.reconditionnes": "Reconditionnés",
  "nav.quartiers": "Quartiers",

  // Cart widget
  "cart.widget.added": "Ajouté au panier",
  "cart.widget.checkout": "Voir le panier",
  "cart.widget.continue": "Continuer",

  // Shop filters
  "shop.filter.title": "Filtres",
  "shop.filter.open": "Filtres",
  "shop.filter.category": "Catégorie",
  "shop.filter.all": "Toutes",
  "shop.filter.price": "Prix",
  "shop.filter.availability": "Disponibilité",
  "shop.filter.in-stock-only": "En stock uniquement",
  "shop.filter.free-delivery": "Livraison gratuite",
  "shop.filter.free-delivery.hint": "Dès 50 000 FCFA d'achat",

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
  "footer.repairs": "Réparations & Devis",
  "footer.nos-reparations": "Nos réparations",
  "footer.grille-tarifaire": "Grille tarifaire",
  "footer.prendre-rendez-vous": "Prendre rendez-vous",
  "footer.reprise-appareils": "Reprise d'appareils",
  "footer.entreprises": "Entreprises & Info",
  "footer.solutions-b2b": "Solutions B2B",
  "footer.suivre-reparation": "Suivre une réparation",
  "footer.questions-frequentes": "Questions fréquentes",
  "footer.blog-conseils": "Blog & conseils",
  "footer.localisation": "Localisation",
  "footer.contact": "Contact",
  "footer.rights": "Allô Techno Bénin. Tous droits réservés.",
  "footer.garanties": "Garanties",
  "footer.mentions-legales": "Mentions légales",

  // Newsletter
  "footer.newsletter.title": "Restez informé",
  "footer.newsletter.description": "Nouveautés boutique, guides techniques et offres promotionnelles — max 2 mails/mois.",
  "footer.newsletter.placeholder": "votre@email.com",
  "footer.newsletter.cta": "S'inscrire",
  "footer.newsletter.success": "Merci ! Vous recevrez nos prochaines nouveautés.",
  "footer.newsletter.error": "Une erreur est survenue. Réessayez.",

  // Cookie consent
  "cookie.title": "Cookies & confidentialité",
  "cookie.text": "Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu. En poursuivant votre navigation, vous acceptez l'utilisation des cookies.",
  "cookie.accept": "Tout accepter",
  "cookie.refuse": "Tout refuser",

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
  pannes: "pannes",
  panne: "panne",
  "common.error": "Une erreur est survenue.",
  "error.title": "Une erreur est survenue",
  "error.text": "Nous n'avons pas pu charger cette page.",
  "error.retry": "Réessayer",
  "error.home": "Retour à l'accueil",

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

  // Modal de recherche
  "search.aria.label": "Rechercher sur le site",
  "search.dialog.title": "Recherche sur le site",
  "search.title": "Recherche Allô Techno",
  "search.placeholder": "Rechercher un appareil, une marque, un article…",
  "search.empty.title": "Aucun résultat",
  "search.empty.text": "Rien trouvé pour « {0} » — essayez « iPhone », « écran », « batterie »…",
  "search.category.repair": "Réparer un {0}",
  "search.category.hint": "Commencer un diagnostic",
  "search.group.pages": "Pages",
  "search.group.diagnostic": "Diagnostic",
  "search.group.brands": "Marques",
  "search.group.devices": "Appareils",
  "search.group.shop": "Boutique",
  "search.group.blog": "Blog",
  "search.group.faq": "FAQ",
  "search.badge.shop": "Boutique",
  "search.badge.blog": "Blog",
  "search.badge.faq": "FAQ",
  "search.count.single": "{0} résultat",
  "search.count.plural": "{0} résultats",
  "search.kbd.navigate": "naviguer",
  "search.kbd.open": "ouvrir",
  "search.kbd.close": "fermer",
  "search.page.reservation": "Réserver un créneau",
  "search.page.reservation.hint": "Prise de rendez-vous atelier",
  "search.page.reparations.hint": "Diagnostic en ligne",
  "search.page.catalogue": "Catalogue des appareils",
  "search.page.catalogue.hint": "Tous les modèles, recherche et filtres",
  "search.page.suivi": "Suivi de réparation",
  "search.page.suivi.hint": "État de votre dossier",
  "search.page.tarifs.hint": "Prix des réparations",
  "search.page.devis.hint": "Estimation sans engagement",
  "search.page.reprise.hint": "Nous rachetons votre appareil",
  "search.page.garantie.hint": "Nos garanties atelier",
  "search.page.boutique.hint": "Accessoires et pièces détachées",
  "search.page.blog.hint": "Guides et astuces",
  "search.page.faq.hint": "Questions fréquentes",
  "search.page.avis.hint": "Témoignages de nos clients",
  "search.page.entreprises.hint": "Prestations professionnelles",
  "search.page.contact.hint": "Atelier Abomey-Calavi",
  "search.page.panier.hint": "Votre commande boutique",
  "search.clearHistory": "Effacer l'historique",

  // Auth
  "auth.session.expired": "Votre session a expiré. Veuillez vous reconnecter.",
};

const en: Dictionary = {
  // Navigation
  "nav.reparations": "Repairs",
  "nav.catalogue": "Catalogue",
  "nav.tarifs": "Pricing",
  "nav.boutique": "Shop",
  "nav.services": "Services",
  "nav.promotions": "Deals",
  "nav.magasins": "Stores",
  "nav.suivi": "Track",
  "nav.entreprises": "Business",
  "nav.about": "About",
  "nav.work-at": "Work at",
  "nav.blog": "Blog",
  "nav.store": "Store",
  "nav.track": "Track",
  "nav.panier": "Cart",
  "nav.reservation": "Book now",
  "nav.mon-compte": "My account",
  "nav.connexion": "Sign in",
  "nav.devis": "Instant quote",
  "nav.garantie": "Warranty",
  "nav.reprise": "Trade-in",
  "nav.avis": "Reviews",
  "nav.faq": "FAQ",
  "nav.changelog": "Changelog",
  "nav.contact": "Contact",
  "nav.engagements": "Commitments",
  "nav.guides": "Guides & tips",
  "nav.reclamation": "Warranty claim",
  "nav.reconditionnes": "Refurbished",
  "nav.quartiers": "Areas",

  // Cart widget
  "cart.widget.added": "Added to cart",
  "cart.widget.checkout": "View cart",
  "cart.widget.continue": "Continue shopping",

  // Shop filters
  "shop.filter.title": "Filters",
  "shop.filter.open": "Filters",
  "shop.filter.category": "Category",
  "shop.filter.all": "All",
  "shop.filter.price": "Price",
  "shop.filter.availability": "Availability",
  "shop.filter.in-stock-only": "In stock only",
  "shop.filter.free-delivery": "Free delivery",
  "shop.filter.free-delivery.hint": "From 50,000 FCFA purchase",

  // Actions
  "action.explorer": "Explore",
  "action.retour-accueil": "Back to home",
  "action.accueil": "Home",
  "action.ressayer": "Retry",
  "action.ouvrir-carte": "Open map",
  "action.en-savoir-plus": "Learn more",

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
  "footer.repairs": "Repairs & Quote",
  "footer.nos-reparations": "Our repairs",
  "footer.grille-tarifaire": "Price list",
  "footer.prendre-rendez-vous": "Book an appointment",
  "footer.reprise-appareils": "Device trade-in",
  "footer.entreprises": "Business & Info",
  "footer.solutions-b2b": "B2B solutions",
  "footer.suivre-reparation": "Track a repair",
  "footer.questions-frequentes": "Frequently asked questions",
  "footer.blog-conseils": "Blog & tips",
  "footer.localisation": "Location",
  "footer.contact": "Contact",
  "footer.rights": "Allô Techno Benin. All rights reserved.",
  "footer.garanties": "Warranties",
  "footer.mentions-legales": "Legal notice",

  // Newsletter
  "footer.newsletter.title": "Stay updated",
  "footer.newsletter.description": "Shop arrivals, tech guides and deals — max 2 emails/month.",
  "footer.newsletter.placeholder": "your@email.com",
  "footer.newsletter.cta": "Subscribe",
  "footer.newsletter.success": "Thanks! You'll receive our next updates.",
  "footer.newsletter.error": "Something went wrong. Please try again.",

  // Cookie consent
  "cookie.title": "Cookies & privacy",
  "cookie.text": "We use cookies to improve your experience, analyze traffic and personalize content. By continuing to browse, you accept the use of cookies.",
  "cookie.accept": "Accept all",
  "cookie.refuse": "Refuse all",

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
  "error.title": "Something went wrong",
  "error.text": "We couldn't load this page.",
  "error.retry": "Try again",
  "error.home": "Back to home",
  pannes: "faults",
  panne: "fault",

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

  // Search modal
  "search.aria.label": "Search the site",
  "search.dialog.title": "Search the site",
  "search.title": "Allô Techno search",
  "search.placeholder": "Search a device, a brand, an article…",
  "search.empty.title": "No results",
  "search.empty.text": "Nothing found for “{0}” — try “iPhone”, “screen”, “battery”…",
  "search.category.repair": "Repair a {0}",
  "search.category.hint": "Start a diagnosis",
  "search.group.pages": "Pages",
  "search.group.diagnostic": "Diagnosis",
  "search.group.brands": "Brands",
  "search.group.devices": "Devices",
  "search.group.shop": "Shop",
  "search.group.blog": "Blog",
  "search.group.faq": "FAQ",
  "search.badge.shop": "Shop",
  "search.badge.blog": "Blog",
  "search.badge.faq": "FAQ",
  "search.count.single": "{0} result",
  "search.count.plural": "{0} results",
  "search.kbd.navigate": "navigate",
  "search.kbd.open": "open",
  "search.kbd.close": "close",
  "search.page.reservation": "Book a slot",
  "search.page.reservation.hint": "Workshop appointment booking",
  "search.page.reparations.hint": "Online diagnosis",
  "search.page.catalogue": "Device catalogue",
  "search.page.catalogue.hint": "All models, search and filters",
  "search.page.suivi": "Repair tracking",
  "search.page.suivi.hint": "Status of your case",
  "search.page.tarifs.hint": "Repair prices",
  "search.page.devis.hint": "No-commitment estimate",
  "search.page.reprise.hint": "We buy back your device",
  "search.page.garantie.hint": "Our workshop warranties",
  "search.page.boutique.hint": "Accessories and spare parts",
  "search.page.blog.hint": "Guides and tips",
  "search.page.faq.hint": "Frequently asked questions",
  "search.page.avis.hint": "Customer testimonials",
  "search.page.entreprises.hint": "Professional services",
  "search.page.contact.hint": "Abomey-Calavi workshop",
  "search.page.panier.hint": "Your shop order",
  "search.clearHistory": "Clear history",

  // Auth
  "auth.session.expired": "Your session has expired. Please sign in again.",
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
