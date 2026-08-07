import { registerSegments } from "@/lib/i18n/dictionaries";

const fr = {
  // Avis — meta
  "avis.meta.title": "Avis clients — Allô Techno Bénin",
  "avis.meta.description":
    "Ce que nos clients disent de nos réparations à Abomey-Calavi : notes, témoignages et retours d'expérience.",
  "avis.eyebrow": "Avis clients",
  "avis.title": "Ils nous confient leurs appareils",
  "avis.subtitle":
    "Note moyenne calculée sur l'ensemble des avis vérifiés après une réparation à l'atelier.",
  "avis.verified": "avis vérifiés",
  "avis.based": "Basé sur {0} avis",
  "avis.cta": "Laisser un avis",
  "avis.all": "Tous les avis",
};

const en = {
  "avis.meta.title": "Customer reviews — Allô Techno Benin",
  "avis.meta.description":
    "What our customers say about our repairs in Abomey-Calavi: ratings, testimonials and experiences.",
  "avis.eyebrow": "Customer reviews",
  "avis.title": "They trust us with their devices",
  "avis.subtitle":
    "Average rating computed over all verified reviews after a repair at the workshop.",
  "avis.verified": "verified reviews",
  "avis.based": "Based on {0} reviews",
  "avis.cta": "Leave a review",
  "avis.all": "All reviews",
};

registerSegments({ fr, en });
