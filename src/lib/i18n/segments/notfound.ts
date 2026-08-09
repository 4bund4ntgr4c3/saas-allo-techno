import { registerSegments } from "@/lib/i18n/dictionaries";

const fr = {
  "notfound.title": "404",
  "notfound.heading": "Page introuvable",
  "notfound.body": "Cette page n'existe pas ou a été déplacée.",
  "notfound.back": "Retour à l'accueil",
  "notfound.retry": "Réessayer",
  "notfound.home": "Accueil",
  "notfound.error": "Cette page n'a pas pu se charger",
  "notfound.error.body": "Une erreur est survenue. Vous pouvez réessayer ou revenir à l'accueil.",
};

const en = {
  "notfound.title": "404",
  "notfound.heading": "Page not found",
  "notfound.body": "This page doesn't exist or has been moved.",
  "notfound.back": "Back to home",
  "notfound.retry": "Retry",
  "notfound.home": "Home",
  "notfound.error": "This page could not be loaded",
  "notfound.error.body": "An error occurred. You can try again or go back to the homepage.",
};

registerSegments({ fr, en });
