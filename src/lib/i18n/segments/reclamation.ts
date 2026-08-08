import { registerSegments } from "@/lib/i18n/dictionaries";

const fr = {
  // Réclamation de garantie — meta
  "reclamation.meta.title": "Réclamation de garantie — Allô Techno Abomey-Calavi",
  "reclamation.meta.description":
    "Déclarez en ligne un problème sous garantie après une réparation ou un accessoire Allô Techno à Abomey-Calavi. Traitement rapide par WhatsApp.",
  "reclamation.meta.og.title": "Réclamation de garantie — Allô Techno",
  "reclamation.meta.og.description":
    "Soumettez votre réclamation de garantie en ligne : l'atelier vous répond par WhatsApp.",
  "reclamation.eyebrow": "Garantie · prise en charge en ligne",
  "reclamation.title": "Réclamation de garantie",
  "reclamation.hero":
    "Un problème après une réparation ou l'achat d'un accessoire ? Déclarez-le en ligne : nous examinons votre dossier et vous recontactons par WhatsApp.",
  "reclamation.form.label.name": "Votre nom complet",
  "reclamation.form.placeholder.name": "Ex. Jean-Marc Hounsou",
  "reclamation.form.label.phone": "Téléphone (WhatsApp)",
  "reclamation.form.placeholder.phone": "01 23 45 67 89",
  "reclamation.form.label.email": "E-mail",
  "reclamation.form.optional": "(facultatif)",
  "reclamation.form.label.reservation_reference": "Référence du dossier de réparation",
  "reclamation.form.hint.reservation_reference":
    "Seulement si vous la connaissez — ex. AT-2026-0034",
  "reclamation.form.label.device": "Appareil concerné",
  "reclamation.form.placeholder.device": "Ex. iPhone 15 Pro — écran",
  "reclamation.form.label.message": "Décrivez le problème",
  "reclamation.form.placeholder.message":
    "Quel est le souci, depuis quand, et dans quelles conditions apparaît-il ?",
  "reclamation.submit": "Envoyer ma réclamation",
  "reclamation.pending": "Envoi en cours…",
  "reclamation.success.title": "Réclamation enregistrée",
  "reclamation.success.paragraph":
    "Votre réclamation {0} a bien été enregistrée. L'atelier l'examine et vous confirme la prise en charge par WhatsApp.",
  "reclamation.success.whatsapp":
    "Vous recevrez une confirmation WhatsApp sur le numéro indiqué. Gardez la référence ci-dessus pour échanger avec nous.",
  "reclamation.error.generic": "La réclamation n'a pas pu être envoyée. Réessayez.",
  "reclamation.what.title": "Qu'est-ce qui est couvert ?",
  "reclamation.what.standard":
    "Chaque réparation est garantie 6 mois en standard (pièce et main-d'œuvre) contre les défauts apparus après l'intervention. La garantie étendue peut aller jusqu'à 12 mois selon la pièce.",
  "reclamation.what.contact":
    "Après réception de votre réclamation, l'atelier vous recontacte par WhatsApp pour convenir d'un diagnostic gratuit de contrôle.",
  "reclamation.what.noise": "Le formulaire de suivi est réservé aux dossiers en cours.",
};

const en = {
  // Warranty claim — meta
  "reclamation.meta.title": "Warranty claim — Allô Techno Abomey-Calavi",
  "reclamation.meta.description":
    "Report an issue covered by warranty after an Allô Techno repair or accessory installation in Abomey-Calavi. Fast handling via WhatsApp.",
  "reclamation.meta.og.title": "Warranty claim — Allô Techno",
  "reclamation.meta.og.description":
    "Submit your warranty claim online: the workshop will get back to you on WhatsApp.",
  "reclamation.eyebrow": "Warranty · handled online",
  "reclamation.title": "Warranty claim",
  "reclamation.hero":
    "A problem after your repair or accessory purchase? Report it online: we check your device and confirm on WhatsApp.",
  "reclamation.form.label.name": "Your full name",
  "reclamation.form.placeholder.name": "e.g. John Doe",
  "reclamation.form.label.phone": "Phone (WhatsApp)",
  "reclamation.form.placeholder.phone": "01 23 45 67 89",
  "reclamation.form.label.email": "Email",
  "reclamation.form.optional": "(optional)",
  "reclamation.form.label.reservation_reference": "Repair case reference",
  "reclamation.form.hint.reservation_reference": "Only if you know it (e.g. AT-2026-0034)",
  "reclamation.form.label.device": "Device concerned",
  "reclamation.form.placeholder.device": "e.g. iPhone 15 Pro screen",
  "reclamation.form.label.message": "Describe the problem",
  "reclamation.form.placeholder.message":
    "What is wrong, since when, and in which situations does it happen?",
  "reclamation.submit": "Send my claim",
  "reclamation.pending": "Sending…",
  "reclamation.success.title": "Claim recorded",
  "reclamation.success.paragraph":
    "Your claim {0} has been recorded. The workshop will review it and confirm next steps on WhatsApp.",
  "reclamation.success.whatsapp":
    "You will receive a WhatsApp confirmation on the number provided. Keep the reference above to get in touch with us.",
  "reclamation.error.generic": "Your claim could not be sent. Please try again.",
  "reclamation.what.title": "What is covered?",
  "reclamation.what.standard":
    "Every repair is warranted for 6 months (parts and labour) against issues appearing after the job. Extended warranty can reach up to 12 months depending on the part.",
  "reclamation.what.contact":
    "Once we receive your claim, the workshop will get back to you on WhatsApp to arrange a quick check-in of your device.",
  "reclamation.what.noise": "This claim form is reserved for occurring after an intervention.",
};

registerSegments({ fr, en });
