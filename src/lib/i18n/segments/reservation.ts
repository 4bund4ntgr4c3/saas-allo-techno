import { registerSegments } from "@/lib/i18n/dictionaries";

const fr = {
  "reservation.meta.title": "Réserver une réparation — Allô Techno Abomey-Calavi",
  "reservation.meta.description":
    "Réservez votre créneau de réparation à Abomey-Calavi : disponibilités en temps réel, dépôt en boutique ou enlèvement à domicile.",

  // Assistant de réservation — étapes
  "wizard.step.type": "Type",
  "wizard.step.marque": "Marque",
  "wizard.step.serie": "Série",
  "wizard.step.famille": "Famille",
  "wizard.step.modele": "Modèle",
  "wizard.step.panne": "Panne",
  "wizard.step.creneau": "Créneau",
  "wizard.step.photos": "Photos",
  "wizard.step.coordonnees": "Coordonnées",
  "wizard.step.recapitulatif": "Récapitulatif",

  // Assistant de réservation — sélection / recherche
  "wizard.select.device": "Choisissez un appareil",
  "wizard.selection": "Votre sélection",
  "wizard.search.aria": "Rechercher un appareil",
  "wizard.search.placeholder": "Rechercher un appareil (ex : iPhone 17 Pro, Camon 40, Switch 2)",
  "wizard.search.results.single": "{0} appareil trouvé",
  "wizard.search.results.plural": "{0} appareils trouvés",
  "wizard.nav.aria": "Étapes de l'assistant de diagnostic",

  // Assistant de réservation — brouillon
  "wizard.draft.resume.title": "Reprendre votre dossier ?",
  "wizard.draft.resume.text": "Votre progression a été sauvegardée.",
  "wizard.draft.resume": "Reprendre",
  "wizard.draft.restart": "Recommencer",

  // Assistant de réservation — navigation
  "wizard.back": "Retour",
  "wizard.cancel": "Annuler",

  // Assistant de réservation — titres d'étapes
  "wizard.step0.title": "01. Quel type d'appareil ?",
  "wizard.step1.title": "02. Marque",
  "wizard.step2.title": "03. Série",
  "wizard.step3.title": "04. Famille de modèles",
  "wizard.step4.title": "05. Modèle",
  "wizard.step5.title": "06. Pannes constatées",
  "wizard.step6.title": "07. Date & heure du rendez-vous",
  "wizard.step7.title": "08. Photos de l'appareil (optionnel)",

  // Assistant de réservation — marque / série / modèle
  "wizard.brand.missing": "Marque absente ?",
  "wizard.requestQuote": "Demander un devis",
  "wizard.models.onrequest": "Modèles sur demande —",
  "wizard.models.single": "{0} modèle",
  "wizard.models.plural": "{0} modèles",

  // Assistant de réservation — pannes
  "wizard.faults.hint": "Sélectionnez une ou plusieurs pannes, puis décrivez le problème.",
  "wizard.description.label": "Description de la panne",
  "wizard.description.placeholder":
    "Ex : l'écran s'allume mais le tactile ne répond plus depuis une chute.",
  "wizard.fault.count": "{0} panne(s)",
  "wizard.estimate": "Estimation {0}",
  "wizard.estimate.title": "Devis en direct",
  "wizard.estimate.subtitle": "Mis à jour instantanément",
  "wizard.estimate.total": "Total estimé",
  "wizard.estimate.free": "Diagnostic gratuit",
  "wizard.estimate.note":
    "Estimation indicative — le devis définitif est confirmé après diagnostic en atelier.",
  "wizard.free.diagnosis": "Diagnostic gratuit",
  "wizard.view.product": "Voir la fiche",
  "wizard.choose.slot": "Choisir un créneau",

  // Assistant de réservation — créneau
  "wizard.step6.hint":
    "Choisissez un mode de dépôt, un jour puis une heure. Seuls les créneaux à venir, réellement disponibles pour ce mode, sont affichés.",
  "wizard.deposit.mode": "Mode de dépôt",
  "wizard.mode.boutique": "Dépôt en boutique",
  "wizard.mode.domicile": "Enlèvement à domicile",
  "wizard.domicile.hours": "Enlèvement à domicile — lundi — samedi, 10:00 — 15:00",
  "wizard.day": "Jour",
  "wizard.day.choose": "Choisissez un jour",
  "wizard.day.first": "Choisissez d'abord un jour",
  "wizard.availability.loading": "Chargement des disponibilités…",
  "wizard.availability.empty":
    "Aucun créneau libre sur les 10 prochains jours — appelez-nous directement.",
  "wizard.availability.remaining.single": "{0} place restante",
  "wizard.availability.remaining.plural": "{0} places restantes",
  "wizard.availability.full": "Complet",
  "wizard.period.matin": "Matin (08:30 — 12:00)",
  "wizard.period.apres-midi": "Après-midi (13:00 — 20:30)",

  // Assistant de réservation — venir maintenant
  "wizard.come.now": "Venez maintenant",
  "wizard.come.now.hint":
    "Déposez l'appareil aujourd'hui sans créneau horaire — priorité boutique.",
  "wizard.come.now.immediate": "Venir maintenant — dépôt immédiat aujourd'hui",
  "wizard.come.now.opennow":
    "Vous passez directement en boutique aujourd'hui ({0}). Votre dossier sera préparé à l'avance.",
  "wizard.opennow.label": "Lundi — vendredi 08:30 — 20:30 · samedi 09:00 — 17:00",

  // Assistant de réservation — heure
  "wizard.hour": "Heure",
  "wizard.hour.aria": "Heure du rendez-vous",
  "wizard.hour.taken": "Déjà réservé",
  "wizard.hour.select.day.first": "Sélectionnez d'abord un jour.",
  "wizard.hour.none.left": "Plus aucune heure libre ce jour-là — choisissez un autre jour",
  "wizard.hour.none.comeNow": " ou venez maintenant",

  // Assistant de réservation — récapitulatif de créneau
  "wizard.slot.selected": "Créneau sélectionné",
  "wizard.slot.none": "Aucun créneau sélectionné",
  "wizard.slot.book": "Réserver ce créneau",
  "wizard.slot.today": "Aujourd'hui · Venir maintenant",

  // Assistant de réservation — coordonnées / après
  "wizard.summary.see": "Voir le récapitulatif",
  "wizard.after.eyebrow": "Après la réservation",
  "wizard.after.title": "Ce qui se passe ensuite",

  // Assistant de réservation — formulaire coordonnées
  "wizard.contact.eyebrow": "09. Vos coordonnées",
  "wizard.contact.title": "Votre dossier",
  "wizard.contact.hint":
    "Ces informations servent à confirmer le rendez-vous (WhatsApp / e-mail) et à préparer votre dossier.",
  "wizard.contact.nom": "Nom complet *",
  "wizard.contact.telephone": "Téléphone / WhatsApp *",
  "wizard.contact.email": "E-mail (recommandé — confirmation écrite)",
  "wizard.contact.payment": "Paiement souhaité *",
  "wizard.contact.payment.cash": "Espèces",
  "wizard.contact.precision": "Précisions (optionnel)",

  // Assistant de réservation — confirmation
  "wizard.success.created": "Dossier {0} créé.",
  "wizard.success.tracking.code": "Code de suivi",
  "wizard.success.hint": "Conservez ce numéro et ce code. Suivez l'avancement dans votre",
  "wizard.success.account": "espace client",
  "wizard.success.or": " ou sur la page",
  "wizard.success.restart": ". Pour un nouveau dossier, reprenez l'assistant ci-dessus.",
  "wizard.success.qr.label": "Suivi du dossier {0}",
  "wizard.success.qr.caption": "QR code de suivi du dossier",
  "wizard.success.toast": "Réservation enregistrée — dossier {0}",
  "wizard.success.toast.email": "Confirmation envoyée à {0} et par WhatsApp au {1}.",
  "wizard.success.toast.phone": "Confirmation envoyée par WhatsApp au {0}.",

  // Assistant de réservation — photos
  "wizard.photos.title": "Photos de l'appareil (facultatif)",
  "wizard.photos.hint": "Envoyez une ou plusieurs photos pour accélérer le diagnostic.",
  "wizard.photos.add": "Ajouter des photos",
  "wizard.photos.alt": "Photo {0}",
  "wizard.photos.remove": "Retirer la photo {0}",
  "wizard.photos.uploading": "Envoi…",
  "wizard.photos.send": "Envoyer {0} photo(s)",
  "wizard.photos.upload.success": "{0} photo(s) envoyée(s)",
  "wizard.photos.sent.success": "✓ {0} photo(s) envoyée(s) avec succès.",
  "wizard.photos.upload.error.file": "Impossible d'envoyer « {0} »",
  "wizard.photos.upload.error": "Erreur lors de l'envoi des photos",

  // Assistant de réservation — étape photos
  "wizard.photos.optional":
    "Ajoutez jusqu'à 3 photos de l'appareil pour accélérer le diagnostic. Cette étape est facultative : vous pouvez continuer sans photo.",
  "wizard.photos.select": "Sélectionner des photos",
  "wizard.photos.max": "Chaque photo doit faire 5 Mo maximum (JPG, PNG, WebP, HEIC).",
  "wizard.photos.count": "{0} photo(s) sélectionnée(s)",
  "wizard.photos.uploaded": "{0} photo(s) envoyée(s) avec succès — visibles dans votre suivi.",
  "wizard.photos.failed":
    "Certaines photos n'ont pas pu être envoyées. La réservation est confirmée — vous pouvez réessayer ci-dessous.",
  "wizard.photos.continue": "Continuer",
  "wizard.photos.restored":
    "Vous aviez sélectionné {0} photo(s) lors de votre dernière session — re-sélectionnez-les si besoin.",

  // Assistant de réservation — erreurs
  "wizard.error.no.slot": "Choisissez une date et une heure pour votre rendez-vous.",
  "wizard.error.taken": "Ce créneau vient d'être réservé. Choisissez une autre heure.",
  "wizard.error.closed": "La boutique est fermée maintenant — choisissez un créneau.",
  "wizard.error.generic": "Réservation impossible",

  // Récapitulatif — étiquettes
  "wizard.summary.eyebrow": "Récapitulatif avant validation",
  "wizard.summary.title": "Vérifiez votre rendez-vous",
  "wizard.summary.hint": "Rien n'est encore enregistré. Contrôlez les informations puis confirmez.",
  "wizard.summary.appointment": "Rendez-vous",
  "wizard.summary.immediate": "Venir maintenant — dépôt immédiat",
  "wizard.summary.type": "Type d'appareil",
  "wizard.summary.brand": "Marque",
  "wizard.summary.model": "Modèle",
  "wizard.summary.deposit": "Mode de dépôt",
  "wizard.summary.payment": "Paiement",
  "wizard.summary.other": "Autre appareil",
  "wizard.summary.tbd": "À préciser",
  "wizard.summary.mode.shop": "Dépôt en boutique — Zogbadjè, Abomey-Calavi",
  "wizard.summary.payment.cash": "Espèces",
  "wizard.summary.faults.title": "Pannes déclarées",
  "wizard.summary.faults.none": "Aucune panne catalogue sélectionnée.",
  "wizard.summary.estimate.title": "Estimation du devis",
  "wizard.summary.estimate.subtitle": "Pièces, main-d'œuvre et garantie",
  "wizard.summary.client": "Client",
  "wizard.summary.phone": "Téléphone",
  "wizard.summary.email": "E-mail",
  "wizard.summary.cost": "Coût estimé",
  "wizard.summary.free.after.exam": "Diagnostic gratuit — devis après examen",
  "wizard.summary.edit": "Modifier",
  "wizard.summary.saving": "Enregistrement…",
  "wizard.summary.confirm": "Confirmer la réservation",

  // Paiement — acompte / total
  "reservation.pay.deposit": "Payer l'acompte (50 %)",
  "reservation.pay.full": "Payer le total",
  "reservation.pay.deposit.note":
    "L'acompte lance la réparation. Le solde sera à régler à la récupération.",
  "reservation.pay.deposit.amount": "Acompte : {0} FCFA",

  // Garantie
  "reservation.warranty.standard": "Garantie standard (6 mois)",
  "reservation.warranty.extended": "Garantie étendue (12 mois)",
  "reservation.warranty.extended.price": "+{0} FCFA",

  // Recherche full-text
  "search.group.devices": "Appareils",
  "search.group.blog": "Blog",
  "search.group.pages": "Pages",
  "search.type.device": "Appareil",
  "search.type.blog": "Article",
  "search.type.page": "Page",
};

const en = {
  "reservation.meta.title": "Book a repair — Allô Techno Abomey-Calavi",
  "reservation.meta.description":
    "Book your repair slot in Abomey-Calavi: real-time availability, in-store drop-off or home pickup.",

  // Booking wizard — steps
  "wizard.step.type": "Type",
  "wizard.step.marque": "Brand",
  "wizard.step.serie": "Series",
  "wizard.step.famille": "Family",
  "wizard.step.modele": "Model",
  "wizard.step.panne": "Fault",
  "wizard.step.creneau": "Slot",
  "wizard.step.photos": "Photos",
  "wizard.step.coordonnees": "Details",
  "wizard.step.recapitulatif": "Summary",

  // Booking wizard — selection / search
  "wizard.select.device": "Choose a device",
  "wizard.selection": "Your selection",
  "wizard.search.aria": "Search for a device",
  "wizard.search.placeholder": "Search for a device (e.g. iPhone 17 Pro, Camon 40, Switch 2)",
  "wizard.search.results.single": "{0} device found",
  "wizard.search.results.plural": "{0} devices found",
  "wizard.nav.aria": "Diagnostic wizard steps",

  // Booking wizard — draft
  "wizard.draft.resume.title": "Resume your case?",
  "wizard.draft.resume.text": "Your progress has been saved.",
  "wizard.draft.resume": "Resume",
  "wizard.draft.restart": "Restart",

  // Booking wizard — navigation
  "wizard.back": "Back",
  "wizard.cancel": "Cancel",

  // Booking wizard — step titles
  "wizard.step0.title": "01. What type of device?",
  "wizard.step1.title": "02. Brand",
  "wizard.step2.title": "03. Series",
  "wizard.step3.title": "04. Model family",
  "wizard.step4.title": "05. Model",
  "wizard.step5.title": "06. Reported faults",
  "wizard.step6.title": "07. Appointment date & time",
  "wizard.step7.title": "08. Device photos (optional)",

  // Booking wizard — brand / series / model
  "wizard.brand.missing": "Brand missing?",
  "wizard.requestQuote": "Request a quote",
  "wizard.models.onrequest": "Models on request —",
  "wizard.models.single": "{0} model",
  "wizard.models.plural": "{0} models",

  // Booking wizard — faults
  "wizard.faults.hint": "Select one or more faults, then describe the problem.",
  "wizard.description.label": "Fault description",
  "wizard.description.placeholder":
    "E.g. the screen turns on but the touchscreen stopped responding after a drop.",
  "wizard.fault.count": "{0} fault(s)",
  "wizard.estimate": "Estimate {0}",
  "wizard.estimate.title": "Live estimate",
  "wizard.estimate.subtitle": "Updated instantly",
  "wizard.estimate.total": "Estimated total",
  "wizard.estimate.free": "Free diagnosis",
  "wizard.estimate.note":
    "Indicative estimate — the final quote is confirmed after the in-store diagnosis.",
  "wizard.free.diagnosis": "Free diagnosis",
  "wizard.view.product": "View product",
  "wizard.choose.slot": "Choose a slot",

  // Booking wizard — slot
  "wizard.step6.hint":
    "Choose a drop-off mode, then a day and a time. Only upcoming slots actually available for this mode are shown.",
  "wizard.deposit.mode": "Drop-off mode",
  "wizard.mode.boutique": "In-store drop-off",
  "wizard.mode.domicile": "Home pickup",
  "wizard.domicile.hours": "Home pickup — Monday — Saturday, 10:00 — 15:00",
  "wizard.day": "Day",
  "wizard.day.choose": "Choose a day",
  "wizard.day.first": "Choose a day first",
  "wizard.availability.loading": "Loading availability…",
  "wizard.availability.empty": "No free slots in the next 10 days — call us directly.",
  "wizard.availability.remaining.single": "{0} spot left",
  "wizard.availability.remaining.plural": "{0} spots left",
  "wizard.availability.full": "Full",
  "wizard.period.matin": "Morning (08:30 — 12:00)",
  "wizard.period.apres-midi": "Afternoon (13:00 — 20:30)",

  // Booking wizard — come now
  "wizard.come.now": "Come now",
  "wizard.come.now.hint": "Drop off the device today without a time slot — store priority.",
  "wizard.come.now.immediate": "Come now — immediate drop-off today",
  "wizard.come.now.opennow":
    "You go straight to the store today ({0}). Your case will be prepared in advance.",
  "wizard.opennow.label": "Monday — Friday 08:30 — 20:30 · Saturday 09:00 — 17:00",

  // Booking wizard — time
  "wizard.hour": "Time",
  "wizard.hour.aria": "Appointment time",
  "wizard.hour.taken": "Already booked",
  "wizard.hour.select.day.first": "Select a day first.",
  "wizard.hour.none.left": "No more free times that day — choose another day",
  "wizard.hour.none.comeNow": " or come now",

  // Booking wizard — slot summary
  "wizard.slot.selected": "Selected slot",
  "wizard.slot.none": "No slot selected",
  "wizard.slot.book": "Book this slot",
  "wizard.slot.today": "Today · Coming now",

  // Booking wizard — details / after
  "wizard.summary.see": "View summary",
  "wizard.after.eyebrow": "After booking",
  "wizard.after.title": "What happens next",

  // Booking wizard — contact form
  "wizard.contact.eyebrow": "09. Your details",
  "wizard.contact.title": "Your case",
  "wizard.contact.hint":
    "This information is used to confirm the appointment (WhatsApp / email) and prepare your case.",
  "wizard.contact.nom": "Full name *",
  "wizard.contact.telephone": "Phone / WhatsApp *",
  "wizard.contact.email": "Email (recommended — written confirmation)",
  "wizard.contact.payment": "Preferred payment *",
  "wizard.contact.payment.cash": "Cash",
  "wizard.contact.precision": "Details (optional)",

  // Booking wizard — confirmation
  "wizard.success.created": "Case {0} created.",
  "wizard.success.tracking.code": "Tracking code",
  "wizard.success.hint": "Keep this number and code. Track the progress in your",
  "wizard.success.account": "customer area",
  "wizard.success.or": " or on the",
  "wizard.success.restart": ". For a new case, restart the wizard above.",
  "wizard.success.qr.label": "Case tracking {0}",
  "wizard.success.qr.caption": "Case tracking QR code",
  "wizard.success.toast": "Booking saved — case {0}",
  "wizard.success.toast.email": "Confirmation sent to {0} and by WhatsApp to {1}.",
  "wizard.success.toast.phone": "Confirmation sent by WhatsApp to {0}.",

  // Booking wizard — photos
  "wizard.photos.title": "Device photos (optional)",
  "wizard.photos.hint": "Send one or more photos to speed up the diagnosis.",
  "wizard.photos.add": "Add photos",
  "wizard.photos.alt": "Photo {0}",
  "wizard.photos.remove": "Remove photo {0}",
  "wizard.photos.uploading": "Uploading…",
  "wizard.photos.send": "Send {0} photo(s)",
  "wizard.photos.upload.success": "{0} photo(s) sent",
  "wizard.photos.sent.success": "✓ {0} photo(s) sent successfully.",
  "wizard.photos.upload.error.file": "Could not upload « {0} »",
  "wizard.photos.upload.error": "An error occurred while sending the photos",

  // Booking wizard — photos step
  "wizard.photos.optional":
    "Add up to 3 photos of the device to speed up the diagnosis. This step is optional: you can continue without photos.",
  "wizard.photos.select": "Select photos",
  "wizard.photos.max": "Each photo must be 5 MB max (JPG, PNG, WebP, HEIC).",
  "wizard.photos.count": "{0} photo(s) selected",
  "wizard.photos.uploaded": "{0} photo(s) sent successfully — visible in your tracking.",
  "wizard.photos.failed":
    "Some photos could not be sent. Your booking is confirmed — you can retry below.",
  "wizard.photos.continue": "Continue",
  "wizard.photos.restored":
    "You had selected {0} photo(s) in your last session — re-select them if needed.",

  // Booking wizard — errors
  "wizard.error.no.slot": "Choose a date and time for your appointment.",
  "wizard.error.taken": "This slot was just booked. Choose another time.",
  "wizard.error.closed": "The store is closed now — choose a slot.",
  "wizard.error.generic": "Booking failed",

  // Summary — labels
  "wizard.summary.eyebrow": "Summary before confirmation",
  "wizard.summary.title": "Review your appointment",
  "wizard.summary.hint": "Nothing has been saved yet. Check the details then confirm.",
  "wizard.summary.appointment": "Appointment",
  "wizard.summary.immediate": "Coming now — immediate drop-off",
  "wizard.summary.type": "Device type",
  "wizard.summary.brand": "Brand",
  "wizard.summary.model": "Model",
  "wizard.summary.deposit": "Drop-off mode",
  "wizard.summary.payment": "Payment",
  "wizard.summary.other": "Other device",
  "wizard.summary.tbd": "To be specified",
  "wizard.summary.mode.shop": "In-store drop-off — Zogbadjè, Abomey-Calavi",
  "wizard.summary.payment.cash": "Cash",
  "wizard.summary.faults.title": "Declared faults",
  "wizard.summary.faults.none": "No catalogue fault selected.",
  "wizard.summary.estimate.title": "Quote estimate",
  "wizard.summary.estimate.subtitle": "Parts, labour and warranty",
  "wizard.summary.client": "Client",
  "wizard.summary.phone": "Phone",
  "wizard.summary.email": "Email",
  "wizard.summary.cost": "Estimated cost",
  "wizard.summary.free.after.exam": "Free diagnosis — quote after inspection",
  "wizard.summary.edit": "Edit",
  "wizard.summary.saving": "Saving…",
  "wizard.summary.confirm": "Confirm booking",

  // Payment — deposit / full
  "reservation.pay.deposit": "Pay deposit (50%)",
  "reservation.pay.full": "Pay full amount",
  "reservation.pay.deposit.note": "The deposit starts the repair. Balance due at pickup.",
  "reservation.pay.deposit.amount": "Deposit: {0} FCFA",

  // Warranty
  "reservation.warranty.standard": "Standard warranty (6 months)",
  "reservation.warranty.extended": "Extended warranty (12 months)",
  "reservation.warranty.extended.price": "+{0} FCFA",

  // Full-text search
  "search.group.devices": "Devices",
  "search.group.blog": "Blog",
  "search.group.pages": "Pages",
  "search.type.device": "Device",
  "search.type.blog": "Article",
  "search.type.page": "Page",
};

registerSegments({ fr, en });
