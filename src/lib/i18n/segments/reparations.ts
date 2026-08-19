import { registerSegments } from "@/lib/i18n/dictionaries";

const fr = {
  // Réparations — meta
  "reparations.meta.title": "Réparations par marque & appareil — Allô Techno",
  "reparations.meta.description":
    "Apple, Samsung, Xiaomi, Tecno, Infinix, Huawei, Pixel, Sony… Choisissez votre marque et découvrez les pannes prises en charge, tarifs et délais.",
  "reparations.meta.ogTitle": "Réparations par marque — Allô Techno",
  "reparations.meta.ogDescription":
    "Toutes les marques et tous les types d'appareils réparés à Abomey-Calavi.",

  // Réparations — index
  "reparations.index.eyebrow": "Prendre rendez-vous",
  "reparations.index.title": "Réparation en 5 étapes. Créneau et devis avant intervention.",
  "reparations.index.hero":
    "Dites-nous quel appareil est en panne : nous affichons immédiatement les tarifs, le délai et les créneaux disponibles à Abomey-Calavi. {0} modèles référencés, {1} marques prises en charge.",
  "reparations.index.featureExpress.t": "Réparation express",
  "reparations.index.featureExpress.d": "La plupart des pannes en moins de 2 h",
  "reparations.index.featureGarantee.t": "Garantie 6 mois",
  "reparations.index.featureGarantee.d": "Pièces et main-d'œuvre incluses",
  "reparations.index.featurePrice.t": "Prix affiché",
  "reparations.index.featurePrice.d": "Aucun frais surprise, diagnostic gratuit",
  "reparations.index.featureCertified.t": "Techniciens certifiés",
  "reparations.index.featureCertified.d": "Pièces d'origine ou premium",
  "reparations.index.store.t": "En boutique",
  "reparations.index.store.d": "Zogbadjè, Abomey-Calavi — sans rendez-vous possible",
  "reparations.index.home.t": "À domicile",
  "reparations.index.home.d": "Un technicien se déplace sur Cotonou & Calavi",
  "reparations.index.brandsEyebrow": "Marques",
  "reparations.index.brandsTitle": "Toutes les marques",
  "reparations.index.brandsLink": "Voir tout le catalogue →",
  "reparations.index.brandCount": "{0} modèle(s) référencé(s) →",
  "reparations.index.categoriesEyebrow": "Familles d'appareils",
  "reparations.index.categoriesTitle": "Par type d'appareil",
  "reparations.index.categoriesText":
    "Du smartphone d'entrée de gamme à l'iMac, en passant par les consoles et les montres connectées.",
  "reparations.index.quote": "Sur devis",

  // Réparations — marque
  "reparations.brand.fallback": "Marque",
  "reparations.brand.eyebrow": "Réparation {0}",

  "reparations.brand.notFoundTitle": "Marque introuvable — Allô Techno",
  "reparations.brand.title": "Réparation {0} à Abomey-Calavi",
  "reparations.brand.meta.title": "Réparation {0} Abomey-Calavi — Écran & batterie",
  "reparations.brand.meta.description":
    "Réparation {0} à Abomey-Calavi : écran, batterie, connecteur de charge, désoxydation. Diagnostic gratuit, prix fermes, garantie jusqu'à 12 mois.",
  "reparations.brand.meta.ogTitle": "Réparation {0} à Abomey-Calavi — Allô Techno",
  "reparations.brand.meta.ogDescription":
    "Modèles {0} pris en charge à Abomey-Calavi, pièces certifiées et garantie jusqu'à 12 mois.",
  "reparations.brand.service": "Réparation {0}",
  "reparations.brand.hero":
    "Diagnostic gratuit à Zogbadjè, pièces sélectionnées selon le modèle et garantie détaillée sur chaque intervention.",
  "reparations.brand.breadcrumb": "Réparations",
  "reparations.brand.breadcrumbCatalog": "Catalogue",
  "reparations.brand.freqEyebrow": "Pannes les plus fréquentes",
  "reparations.brand.freqTitle": "Ce que nous réparons sur {0} à Calavi",
  "reparations.brand.modelsEyebrow": "Modèles référencés",
  "reparations.brand.modelsTitle": "Modèles {0}",
  "reparations.brand.modelsText":
    "Sélectionnez votre modèle pour voir les pannes, tarifs, délais et pièces utilisées.",
  "reparations.brand.modelsEmptyText":
    "Ce modèle n'est pas encore dans notre grille publique — demandez un devis, nous répondons en 15 minutes.",
  "reparations.brand.faultsCount": "{0} pannes prises en charge →",
  "reparations.brand.devisEmpty": "Nous réparons les modèles {0} sur devis : {1}.",
  "reparations.brand.devisCta": "Demander un devis",
  "reparations.brand.faqEyebrow": "Questions fréquentes",
  "reparations.brand.faqTitle": "Réparation {0} à Abomey-Calavi : vos questions",
  "reparations.brand.guidesEyebrow": "Guides locaux",
  "reparations.brand.guidesTitle": "À lire avant de déposer votre appareil",
  "reparations.brand.othersEyebrow": "Autres marques",
  "reparations.brand.othersTitle": "Continuer la navigation",

  // Catalogue
  "catalogue.meta.title": "Catalogue complet — {0} appareils référencés | Allô Techno",
  "catalogue.meta.description":
    "Catalogue des {0} appareils réparés par Allô Techno à Abomey-Calavi : smartphones, tablettes, ordinateurs, consoles, montres. Recherche et filtres par marque, type et série.",
  "catalogue.meta.ogTitle": "Catalogue des appareils — Allô Techno",
  "catalogue.meta.ogDescription": "Tous les modèles référencés, avec tarifs de réparation.",
  "catalogue.eyebrow": "Catalogue · {0} appareils",
  "catalogue.title": "Tous les appareils, une seule grille de tarifs.",
  "catalogue.intro":
    "Recherchez un modèle, filtrez par marque, type d'appareil ou génération. Chaque fiche affiche les pannes prises en charge, le tarif ferme et le délai de réparation.",
  "catalogue.searchPlaceholder": "Rechercher : « iPhone 17 », « ecran », « galaxy s25 »…",
  "catalogue.searchAria": "Rechercher un appareil",
  "catalogue.allBrands": "Toutes les marques",
  "catalogue.reset": "Réinitialiser",
  "catalogue.type": "Type",
  "catalogue.generation": "Génération",
  "catalogue.appareil": "appareil",
  "catalogue.appareils": "appareils",
  "catalogue.searchInfo": "Recherche : « {0} »",
  "catalogue.pannes": "{0} pannes prises en charge →",
  "catalogue.noResultEyebrow": "Aucun résultat",
  "catalogue.noResultTitle": "Aucun appareil ne correspond",
  "catalogue.noResultText":
    "Essayez un autre terme, ou réinitialisez les filtres pour voir l'ensemble du catalogue.",
  "catalogue.noResultCta": "Voir tout le catalogue",
};

const en = {
  // Repairs — meta
  "reparations.meta.title": "Repairs by brand & device — Allô Techno",
  "reparations.meta.description":
    "Apple, Samsung, Xiaomi, Tecno, Infinix, Huawei, Pixel, Sony… Choose your brand and discover the covered faults, prices and turnaround times.",
  "reparations.meta.ogTitle": "Repairs by brand — Allô Techno",
  "reparations.meta.ogDescription": "All brands and device types only repaired in Abomey-Calavi.",

  // Repairs — index
  "reparations.index.eyebrow": "Book an appointment",
  "reparations.index.title": "Repair in 5 steps. Time slot and quote before the intervention.",
  "reparations.index.hero":
    "Tell us which device is broken: we instantly show the prices, turnaround time and available slots in Abomey-Calavi. {0} models referenced, {1} supported brands.",
  "reparations.index.featureExpress.t": "Express repair",
  "reparations.index.featureExpress.d": "Most faults fixed in under 2 hours",
  "reparations.index.featureGarantee.t": "6-month guarantee",
  "reparations.index.featureGarantee.d": "Parts and labour included",
  "reparations.index.featurePrice.t": "Displayed price",
  "reparations.index.featurePrice.d": "No surprise fees, free diagnosis",
  "reparations.index.featureCertified.t": "Certified technicians",
  "reparations.index.featureCertified.d": "Original or premium parts",
  "reparations.index.store.t": "In store",
  "reparations.index.store.d": "Zogbadjè, Abomey-Calavi — walk-in welcome",
  "reparations.index.home.t": "At home",
  "reparations.index.home.d": "A technician travels across Cotonou & Calavi",
  "reparations.index.brandsEyebrow": "Brands",
  "reparations.index.brandsTitle": "All brands",
  "reparations.index.brandsLink": "See the full catalogue →",
  "reparations.index.brandCount": "{0} model(s) referenced →",
  "reparations.index.categoriesEyebrow": "Device families",
  "reparations.index.categoriesTitle": "By device type",
  "reparations.index.categoriesText":
    "From entry-level smartphones to the iMac, including consoles and smartwatches.",
  "reparations.index.quote": "On quote",

  // Repairs — brand
  "reparations.brand.fallback": "Brand",
  "reparations.brand.eyebrow": "{0} repair",

  "reparations.brand.notFoundTitle": "Brand not found — Allô Techno",
  "reparations.brand.title": "{0} repair in Abomey-Calavi",
  "reparations.brand.meta.title": "{0} repair Abomey-Calavi — Screen & battery",
  "reparations.brand.meta.description":
    "{0} repair in Abomey-Calavi: screen, battery, charging port, oxidation cleaning. Free diagnosis, fixed prices, guarantee up to 12 months.",
  "reparations.brand.meta.ogTitle": "{0} repair in Abomey-Calavi — Allô Techno",
  "reparations.brand.meta.ogDescription":
    "{0} models supported in Abomey-Calavi, certified parts and guarantee up to 12 months.",
  "reparations.brand.service": "{0} repair",
  "reparations.brand.hero":
    "Free diagnosis at Zogbadjè, parts selected according to the model and a detailed guarantee on every intervention.",
  "reparations.brand.breadcrumb": "Repairs",
  "reparations.brand.breadcrumbCatalog": "Catalogue",
  "reparations.brand.freqEyebrow": "Most common faults",
  "reparations.brand.freqTitle": "What we repair on {0} in Calavi",
  "reparations.brand.modelsEyebrow": "Referenced models",
  "reparations.brand.modelsTitle": "{0} models",
  "reparations.brand.modelsText":
    "Select your model to see the faults, prices, turnaround times and parts used.",
  "reparations.brand.modelsEmptyText":
    "This model is not yet in our public grid — request a quote, we reply within 15 minutes.",
  "reparations.brand.faultsCount": "{0} handled faults →",
  "reparations.brand.devisEmpty": "We repair {0} models on quote: {1}.",
  "reparations.brand.devisCta": "Request a quote",
  "reparations.brand.faqEyebrow": "Frequently asked questions",
  "reparations.brand.faqTitle": "{0} repair in Abomey-Calavi: your questions",
  "reparations.brand.guidesEyebrow": "Local guides",
  "reparations.brand.guidesTitle": "Read before dropping off your device",
  "reparations.brand.othersEyebrow": "Other brands",
  "reparations.brand.othersTitle": "Keep browsing",

  // Catalogue
  "catalogue.meta.title": "Complete catalogue — {0} referenced devices | Allô Techno",
  "catalogue.meta.description":
    "Catalogue of the {0} devices repaired by Allô Techno in Abomey-Calavi: smartphones, tablets, computers, consoles, smartwatches. Search and filters by brand, type and series.",
  "catalogue.meta.ogTitle": "Device catalogue — Allô Techno",
  "catalogue.meta.ogDescription": "All referenced models, with repair prices.",
  "catalogue.eyebrow": "Catalogue · {0} devices",
  "catalogue.title": "Every device, a single price grid.",
  "catalogue.intro":
    "Search for a model, filter by brand, device type or generation. Each card shows the covered faults, the fixed price and the repair turnaround time.",
  "catalogue.searchPlaceholder": "Search: « iPhone 17 », « screen », « galaxy s25 »…",
  "catalogue.searchAria": "Search for a device",
  "catalogue.allBrands": "All brands",
  "catalogue.reset": "Reset",
  "catalogue.type": "Type",
  "catalogue.generation": "Generation",
  "catalogue.appareil": "device",
  "catalogue.appareils": "devices",
  "catalogue.searchInfo": "Search: « {0} »",
  "catalogue.pannes": "{0} handled faults →",
  "catalogue.noResultEyebrow": "No results",
  "catalogue.noResultTitle": "No device matches",
  "catalogue.noResultText": "Try another term, or reset the filters to see the whole catalogue.",
  "catalogue.noResultCta": "See the full catalogue",
};

registerSegments({ fr, en });
