import { registerSegments } from "@/lib/i18n/dictionaries";

const fr = {
  // Blog — meta
  "blog.meta.title": "Blog & guides réparation — Allô Techno Bénin",
  "blog.meta.description":
    "Conseils d'atelier sur la batterie, l'écran cassé, les pièces détachées et l'entretien des consoles, adaptés au climat et au réseau béninois.",
  "blog.og.title": "Blog & guides — Allô Techno",
  "blog.og.description": "Nos techniciens partagent leurs guides d'entretien et de dépannage.",
  "blog.meta.notfound.title": "Article introuvable — Allô Techno",

  // Blog — listing
  "blog.eyebrow": "Journal d'atelier",
  "blog.title": "Blog & guides",
  "blog.subtitle":
    "Ce que nos techniciens voient tous les jours, transformé en conseils pratiques.",
  "blog.read": "Lire l'article",

  // Blog — article
  "blog.all": "Tous les articles",
  "blog.readalso": "À lire aussi",
  "blog.notfound.title": "Article introuvable",
  "blog.notfound.back": "Retour au blog",
  "blog.error": "Une erreur est survenue",
};

const en = {
  // Blog — meta
  "blog.meta.title": "Blog & repair guides — Allô Techno Benin",
  "blog.meta.description":
    "Workshop tips on battery life, cracked screens, spare parts and console maintenance, adapted to the Beninese climate and network.",
  "blog.og.title": "Blog & guides — Allô Techno",
  "blog.og.description": "Our technicians share their maintenance and troubleshooting guides.",
  "blog.meta.notfound.title": "Article not found — Allô Techno",

  // Blog — listing
  "blog.eyebrow": "Workshop journal",
  "blog.title": "Blog & guides",
  "blog.subtitle": "What our technicians see every day, turned into practical tips.",
  "blog.read": "Read the article",

  // Blog — article
  "blog.all": "All articles",
  "blog.readalso": "Also read",
  "blog.notfound.title": "Article not found",
  "blog.notfound.back": "Back to blog",
  "blog.error": "An error occurred",
};

registerSegments({ fr, en });
