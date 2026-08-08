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
  "avis.list.empty": "Aucun avis publié pour le moment — revenez bientôt.",

  // Avis — formulaire (lien d'invitation)
  "avis.form.eyebrow": "Votre avis compte",
  "avis.form.title": "Comment s'est passée votre réparation ?",
  "avis.form.intro":
    "Dossier {0} — {1}. Merci de prendre 2 minutes pour noter notre intervention : cela nous aide à progresser.",
  "avis.form.rating.label": "Votre note",
  "avis.form.rating.hint": "Cliquez sur une étoile pour noter de 1 à 5.",
  "avis.form.comment.label": "Votre commentaire",
  "avis.form.comment.placeholder": "Qualité de la réparation, délais, accueil, suivi du dossier…",
  "avis.form.comment.error": "Votre commentaire doit contenir au moins 3 caractères.",
  "avis.form.rating.error": "Choisissez une note avant d'envoyer.",
  "avis.form.submit": "Envoyer mon avis",
  "avis.form.sending": "Envoi…",
  "avis.form.invalid": "Ce lien d'invitation n'est pas valide.",
  "avis.form.used": "Vous avez déjà laissé un avis pour ce dossier.",
  "avis.form.loading": "Vérification de votre invitation…",
  "avis.thanks.title": "Merci pour votre avis !",
  "avis.thanks.text":
    "Votre retour a bien été enregistré. Il sera publié sur cette page après validation par notre équipe.",
};

const en = {
  // Reviews — meta
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
  "avis.list.empty": "No published reviews yet — check back soon.",

  // Reviews — form (invitation link)
  "avis.form.eyebrow": "Your feedback matters",
  "avis.form.title": "How did your repair go?",
  "avis.form.intro":
    "Case {0} — {1}. Thank you for taking 2 minutes to rate our service: it helps us improve.",
  "avis.form.rating.label": "Your rating",
  "avis.form.rating.hint": "Click a star to rate from 1 to 5.",
  "avis.form.comment.label": "Your comment",
  "avis.form.comment.placeholder": "Repair quality, turnaround time, welcome, case tracking…",
  "avis.form.comment.error": "Your comment must be at least 3 characters long.",
  "avis.form.rating.error": "Choose a rating before submitting.",
  "avis.form.submit": "Send my review",
  "avis.form.sending": "Sending…",
  "avis.form.invalid": "This invitation link is not valid.",
  "avis.form.used": "You already left a review for this case.",
  "avis.form.loading": "Checking your invitation…",
  "avis.thanks.title": "Thank you for your review!",
  "avis.thanks.text":
    "Your feedback has been recorded. It will be published on this page once validated by our team.",
};

registerSegments({ fr, en });
