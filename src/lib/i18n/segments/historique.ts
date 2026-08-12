import { registerSegments } from "@/lib/i18n/dictionaries";

const fr = {
  "historique.meta.title": "Historique de vos appareils — Allô Techno",
  "historique.meta.description":
    "Recherchez l'historique de réparation de vos appareils par numéro de téléphone ou email.",
  "historique.eyebrow": "Historique appareils",
  "historique.title": "Vos appareils réparés",
  "historique.intro":
    "Entrez votre numéro de téléphone ou votre adresse email pour retrouver l'historique de toutes vos réparations Allô Techno.",
  "historique.byPhone": "Téléphone",
  "historique.byEmail": "Email",
  "historique.phonePlaceholder": "Ex. : +229 97 00 00 00",
  "historique.emailPlaceholder": "Ex. : jean@example.com",
  "historique.search": "Rechercher",
  "historique.searching": "Recherche…",
  "historique.empty": "Aucune réparation trouvée pour cette recherche.",
  "historique.error": "Une erreur est survenue. Réessayez.",
  "historique.totalRepairs": "Réparations totales",
  "historique.completedRepairs": "Terminées",
  "historique.completionRate": "Taux complétion",
  "historique.results": "Résultats",
  "historique.completed": "Terminé le",
  "historique.goToSuivi": "Suivre un dossier",
};

const en = {
  "historique.meta.title": "Your device repair history — Allô Techno",
  "historique.meta.description": "Search your device repair history by phone number or email.",
  "historique.eyebrow": "Device history",
  "historique.title": "Your repaired devices",
  "historique.intro":
    "Enter your phone number or email to find all your Allô Techno repair history.",
  "historique.byPhone": "Phone",
  "historique.byEmail": "Email",
  "historique.phonePlaceholder": "e.g. +229 97 00 00 00",
  "historique.emailPlaceholder": "e.g. jean@example.com",
  "historique.search": "Search",
  "historique.searching": "Searching…",
  "historique.empty": "No repairs found for this search.",
  "historique.error": "An error occurred. Please try again.",
  "historique.totalRepairs": "Total repairs",
  "historique.completedRepairs": "Completed",
  "historique.completionRate": "Completion rate",
  "historique.results": "Results",
  "historique.completed": "Completed on",
  "historique.goToSuivi": "Track a case",
};

registerSegments({ fr, en });
