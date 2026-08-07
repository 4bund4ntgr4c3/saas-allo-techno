import { registerSegments } from "@/lib/i18n/dictionaries";

const fr = {
  "reservation.meta.title": "Réserver une réparation — Allô Techno Abomey-Calavi",
  "reservation.meta.description":
    "Réservez votre créneau de réparation à Abomey-Calavi : disponibilités en temps réel, dépôt en boutique ou enlèvement à domicile.",
};

const en = {
  "reservation.meta.title": "Book a repair — Allô Techno Abomey-Calavi",
  "reservation.meta.description":
    "Book your repair slot in Abomey-Calavi: real-time availability, in-store drop-off or home pickup.",
};

registerSegments({ fr, en });
