import { registerSegments } from "@/lib/i18n/dictionaries";

const fr = {
  "changelog.meta.title": "Journal des modifications — Allô Techno",
  "changelog.meta.description":
    "Retrouvez toutes les améliorations, corrections et nouvelles fonctionnalités du site Allô Techno.",
  "changelog.meta.og.title": "Journal des modifications — Allô Techno",
  "changelog.meta.og.description": "Historique complet des mises à jour du site Allô Techno.",
  "changelog.eyebrow": "Mises à jour",
  "changelog.title": "Journal des modifications",
  "changelog.subtitle": "Toutes les améliorations, corrections et nouvelles fonctionnalités.",
  "changelog.added": "Ajouté",
  "changelog.changed": "Modifié",
  "changelog.fixed": "Corrigé",
  "changelog.removed": "Supprimé",
};

const en = {
  "changelog.meta.title": "Changelog — Allô Techno",
  "changelog.meta.description":
    "Find all improvements, bug fixes and new features on the Allô Techno website.",
  "changelog.meta.og.title": "Changelog — Allô Techno",
  "changelog.meta.og.description": "Full update history of the Allô Techno website.",
  "changelog.eyebrow": "Updates",
  "changelog.title": "Changelog",
  "changelog.subtitle": "All improvements, bug fixes and new features.",
  "changelog.added": "Added",
  "changelog.changed": "Changed",
  "changelog.fixed": "Fixed",
  "changelog.removed": "Removed",
};

registerSegments({ fr, en });
