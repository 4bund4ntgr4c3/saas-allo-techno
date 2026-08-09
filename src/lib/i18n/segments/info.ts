import { registerSegments } from "@/lib/i18n/dictionaries";

const fr = {
  // Tarifs — meta
  "tarifs.meta.title": "Tarifs de réparation 2026 — Allô Techno Abomey-Calavi",
  "tarifs.meta.description":
    "Grille tarifaire complète : écrans, batteries, connecteurs de charge, cartes mères, consoles. Prix en FCFA, délais et garanties pour chaque intervention.",
  "tarifs.og.title": "Grille tarifaire — Allô Techno",
  "tarifs.og.description": "Prix transparents en FCFA, main-d'œuvre et pièce incluses.",
  "tarifs.eyebrow": "Grille 2026",
  "tarifs.title": "Tarifs transparents",
  "tarifs.intro":
    "Aucun frais caché : chaque prix inclut la pièce et la main-d'œuvre. Le devis final est confirmé après le diagnostic gratuit.",
  "tarifs.search": "Recherche",
  "tarifs.searchPlaceholder": "Écran, batterie, iPhone…",
  "tarifs.brand": "Marque",
  "tarifs.brandAll": "Toutes les marques",
  "tarifs.category": "Type d'appareil",
  "tarifs.categoryAll": "Tous les types",
  "tarifs.count": "{0} interventions listées",
  "tarifs.col.device": "Appareil",
  "tarifs.col.fault": "Intervention",
  "tarifs.col.delay": "Délai / Garantie",
  "tarifs.col.price": "Prix",
  "tarifs.empty": "Aucun résultat. Essayez une autre recherche ou",
  "tarifs.emptyQuote": "demandez un devis",
  "tarifs.know.eyebrow": "Bon à savoir",
  "tarifs.know.title": "Ce que le prix comprend",
  "tarifs.know.text":
    "Chaque intervention est facturée une seule fois, pièce et main-d'œuvre incluses.",
  "tarifs.know.diag.t": "Diagnostic",
  "tarifs.know.diag.d": "Toujours gratuit, y compris si vous refusez le devis.",
  "tarifs.know.part.t": "Pièce & pose",
  "tarifs.know.part.d": "La pièce indiquée sur le devis, posée et testée en atelier.",
  "tarifs.know.warranty.t": "Garantie",
  "tarifs.know.warranty.d": "3 à 12 mois selon la pièce, mentionnée sur la facture.",

  // Devis — meta
  "devis.meta.title": "Devis instantané réparation — Allô Techno Abomey-Calavi",
  "devis.meta.description":
    "Estimez en 30 secondes le prix et le délai de réparation de votre smartphone, tablette, ordinateur ou console à Abomey-Calavi.",
  "devis.og.title": "Devis instantané — Allô Techno",
  "devis.og.description":
    "Choisissez votre appareil et votre panne : prix, délai et garantie affichés immédiatement.",
  "devis.eyebrow": "Estimation gratuite",
  "devis.title": "Devis instantané",
  "devis.intro":
    "Trois clics suffisent : marque, appareil, panne. Vous obtenez immédiatement le prix, le délai et la garantie appliquée en atelier.",
  "devis.step1": "1 · Marque",
  "devis.step2": "2 · Appareil",
  "devis.step3": "3 · Panne",
  "devis.select": "Sélectionner…",
  "devis.estimation": "Estimation",
  "devis.priceAll": "Prix tout compris",
  "devis.delay": "Délai atelier",
  "devis.warranty": "Garantie",
  "devis.partNote":
    "Pièce utilisée : {0}. Le diagnostic reste gratuit et le prix est confirmé avant toute intervention.",
  "devis.reserve": "Réserver cette réparation",
  "devis.allFaults": "Voir toutes les pannes",
  "devis.emptyHint": "Complétez les trois champs pour afficher votre estimation.",
  "devis.cta.eyebrow": "Pas votre modèle ?",
  "devis.cta.title": "Nous réparons aussi les appareils hors catalogue",
  "devis.cta.text":
    "Décrivez votre panne lors de la réservation : nous vous rappelons avec un devis personnalisé sous 15 minutes ouvrées.",
  "devis.customQuote": "Demander un devis personnalisé",
  "devis.form.title": "Demande de devis personnalisé",
  "devis.form.messageLabel": "Appareil et panne",
  "devis.form.messagePlaceholder": "Ex. : iPhone 12 — l'écran ne répond plus après une chute…",
  "devis.form.success":
    "Votre demande est enregistrée. Nous vous rappelons sous 15 minutes ouvrées.",
  "devis.request": "Demander un devis",
  "devis.lead.success": "Demande de devis envoyée ! Nous vous recontacterons rapidement.",
  "devis.lead.error": "Impossible d'envoyer la demande. Réessayez.",
  "devis.lead.sent": "Demande envoyée",
  "devis.estimateLabel": "Estimation :",
  "devis.compare.empty": "Ajoutez au moins deux estimations pour les comparer.",
  "devis.compare.title": "Comparaison des devis",
  "devis.compare.hideDiffs": "Masquer les différences",
  "devis.compare.showDiffs": "Afficher les différences",
  "devis.compare.price": "Prix",
  "devis.compare.duration": "Délai",
  "devis.compare.warranty": "Garantie",
  "devis.compare.parts": "Pièces",
  "devis.compare.selected": "Sélectionné",
  "devis.compare.choose": "Choisir",
  "devis.compare.addTo": "Comparer",
  "devis.compare.added": "Ajouté à la comparaison",

  // Contact — meta
  "contact.meta.title": "Contact & atelier — Allô Techno Abomey-Calavi",
  "contact.meta.description":
    "Adresse, horaires, téléphone et WhatsApp de l'atelier Allô Techno à Zogbadjè, Abomey-Calavi. Diagnostic gratuit sans rendez-vous.",
  "contact.og.title": "Contact — Allô Techno Abomey-Calavi",
  "contact.og.description":
    "Venez à l'atelier de Zogbadjè ou écrivez-nous sur WhatsApp pour un diagnostic gratuit.",
  "contact.eyebrow": "Nous trouver",
  "contact.title": "Contact & atelier",
  "contact.intro":
    "Passez sans rendez-vous pour un diagnostic gratuit, ou contactez-nous avant de vous déplacer.",
  "contact.address": "Adresse",
  "contact.phone": "Téléphone",
  "contact.whatsapp": "WhatsApp",
  "contact.email": "E-mail",
  "contact.hours": "Horaires",
  "contact.hours.monfri": "Lundi — Vendredi",
  "contact.hours.sat": "Samedi",
  "contact.hours.sun": "Dimanche",
  "contact.hours.closed": "Fermé",
  "contact.startChat": "Démarrer une conversation",
  "contact.mapTitle": "Carte de l'atelier Allô Techno à Abomey-Calavi",
  "contact.form.eyebrow": "Écrivez-nous",
  "contact.form.title": "Envoyez un message",
  "contact.form.text":
    "Une question sur une réparation, un prix, un accessoire ? Nous répondons rapidement — généralement sous une heure ouvrée.",
  "contact.form.formTitle": "Contact direct",
  "contact.form.description": "Message envoyé directement à l'équipe de l'atelier.",
  "contact.form.success": "Merci ! Nous revenons vers vous rapidement.",

  // FAQ — meta
  "faq.meta.title": "Questions fréquentes — Allô Techno Abomey-Calavi",
  "faq.meta.description":
    "Délais, garanties, paiement Mobile Money, données personnelles, suivi de dossier : toutes les réponses sur la réparation chez Allô Techno.",
  "faq.og.title": "FAQ réparation — Allô Techno",
  "faq.og.description": "Les réponses aux questions les plus posées par nos clients au Bénin.",
  "faq.eyebrow": "Aide",
  "faq.title": "Questions fréquentes",
  "faq.intro":
    "Délais, garanties, paiement, confidentialité des données : l'essentiel avant de confier votre appareil.",
  "faq.searchPlaceholder": "Rechercher une question…",
  "faq.searchAria": "Rechercher dans la FAQ",
  "faq.all": "Toutes",
  "faq.noResult": "Aucune question ne correspond à votre recherche.",
  "faq.cta.eyebrow": "Encore une question ?",
  "faq.cta.title": "Notre atelier répond en moins de 15 minutes",
  "faq.cta.text":
    "Appelez-nous, écrivez sur WhatsApp ou passez directement à Zogbadjè pendant les heures d'ouverture.",

  // Garantie — meta
  "garantie.meta.title": "Garantie réparation 6 mois — Allô Techno Abomey-Calavi",
  "garantie.meta.description":
    "Écrans et batteries premium garantis 6 mois, micro-soudure 3 mois, pièces Apple d'origine jusqu'à 1 an. Conditions détaillées de la garantie Allô Techno.",
  "garantie.og.title": "Garantie réparation — Allô Techno",
  "garantie.og.description":
    "Ce que couvre notre garantie, sa durée, et comment la faire jouer en atelier.",
  "garantie.eyebrow": "Engagement atelier",
  "garantie.title": "Notre garantie",
  "garantie.intro":
    "Chaque réparation est couverte, tracée sur votre facture et rejouable en atelier sans frais tant que la garantie court.",
  "garantie.tier1.d": "6 mois",
  "garantie.tier1.t": "Écrans & batteries premium",
  "garantie.tier1.x": "Pièces grade A+ et service pack posées en atelier.",
  "garantie.tier2.d": "3 mois",
  "garantie.tier2.t": "Pièces compatibles & micro-soudure",
  "garantie.tier2.x": "Interventions carte mère, connecteurs de charge, nappes.",
  "garantie.tier3.d": "12 mois",
  "garantie.tier3.t": "Pièces Apple d'origine",
  "garantie.tier3.x": "Sur les modèles éligibles au programme pièces d'origine.",
  "garantie.covered": "Couvert",
  "garantie.notCovered": "Non couvert",
  "garantie.covered1": "Défaut de la pièce installée (dalle, batterie, connecteur…)",
  "garantie.covered2": "Défaut de main-d'œuvre ou de montage",
  "garantie.covered3": "Panne identique réapparaissant après intervention",
  "garantie.covered4": "Réglages et calibrations liés à la réparation",
  "garantie.notcovered1": "Nouvelle chute, choc ou pression sur l'écran",
  "garantie.notcovered2": "Oxydation, contact avec un liquide après réparation",
  "garantie.notcovered3": "Intervention réalisée par un tiers sur l'appareil",
  "garantie.notcovered4": "Usure normale de la batterie au-delà des cycles annoncés",
  "garantie.claim.eyebrow": "Faire jouer la garantie",
  "garantie.claim.title": "Trois étapes, sans frais",
  "garantie.claim.text":
    "Munissez-vous de votre facture ou de votre numéro de dossier AT-2026-XXXX.",
  "garantie.step1": "Vérifiez le statut de votre dossier en ligne",
  "garantie.step2": "Rapportez l'appareil à l'atelier de Zogbadjè",
  "garantie.step3": "Nous rediagnostiquons et réparons sans frais",
  "garantie.track": "Suivre mon dossier",
  "garantie.contact": "Contacter l'atelier",

  // Mentions légales — meta
  "mentions.meta.title": "Mentions légales — Allô Techno Abomey-Calavi",
  "mentions.meta.description":
    "Éditeur du site, hébergement, propriété intellectuelle, données personnelles et conditions de service d'Allô Techno à Abomey-Calavi.",
  "mentions.og.title": "Mentions légales — Allô Techno",
  "mentions.og.description": "Informations légales relatives au site et à l'atelier Allô Techno.",
  "mentions.eyebrow": "Informations légales",
  "mentions.title": "Mentions légales",
  "mentions.updated": "Dernière mise à jour : ",
  "mentions.editor.t": "Éditeur du site",
  "mentions.editor.p0": "{0}, atelier de réparation d'appareils électroniques.",
  "mentions.editor.p1": "Adresse : {0}.",
  "mentions.editor.p2": "Téléphone : {0} — E-mail : {1}.",
  "mentions.hosting.t": "Hébergement",
  "mentions.hosting.p0":
    "Le site est hébergé sur une infrastructure cloud gérée. Les données de réservation sont stockées sur une base de données sécurisée avec chiffrement en transit.",
  "mentions.ip.t": "Propriété intellectuelle",
  "mentions.ip.p0":
    "Les textes, visuels, grilles tarifaires et contenus du blog sont la propriété d'Allô Techno. Toute reproduction sans autorisation écrite est interdite.",
  "mentions.ip.p1":
    "Les marques citées (Apple, Samsung, Xiaomi, Sony…) appartiennent à leurs détenteurs respectifs. Allô Techno est un réparateur indépendant, non affilié à ces constructeurs.",
  "mentions.data.t": "Données personnelles",
  "mentions.data.p0":
    "Les informations collectées lors d'une réservation (nom, téléphone, e-mail, description de la panne) servent exclusivement au traitement du dossier de réparation et au suivi client.",
  "mentions.data.p1":
    "Elles ne sont ni vendues ni cédées à des tiers. Vous pouvez demander leur consultation, leur rectification ou leur suppression en écrivant à {0}.",
  "mentions.data.p2":
    "Un remplacement d'écran ou de batterie n'implique aucun accès au contenu de votre appareil. Pour les interventions carte mère, une sauvegarde préalable est recommandée.",
  "mentions.service.t": "Conditions de service",
  "mentions.service.p0":
    "Le diagnostic est gratuit et sans engagement. Aucune intervention n'est réalisée sans validation préalable du devis par le client.",
  "mentions.service.p1":
    "Les appareils non réclamés dans un délai de 90 jours après notification de fin de réparation peuvent faire l'objet de frais de gardiennage.",
  "mentions.service.p2":
    "La garantie s'applique dans les conditions décrites sur la page Garantie et ne couvre ni les dommages accidentels, ni l'oxydation, ni les interventions par un tiers.",

  // Reprise — meta
  "reprise.meta.title": "Reprise d'appareils — Allô Techno Abomey-Calavi",
  "reprise.meta.description":
    "Revendez votre ancien smartphone, tablette ou ordinateur à Abomey-Calavi. Estimation immédiate et paiement Mobile Money le jour même.",
  "reprise.og.title": "Reprise d'appareils — Allô Techno",
  "reprise.og.description":
    "Estimez la valeur de reprise de votre appareil et repartez payé le jour même.",
  "reprise.eyebrow": "Rachat & recyclage",
  "reprise.title": "Reprise d'appareils",
  "reprise.intro":
    "Fonctionnel ou en panne, votre ancien appareil a de la valeur. Nous le reprenons, le reconditionnons en atelier et vous payons en Mobile Money le jour même.",
  "reprise.brand": "Marque",
  "reprise.select": "Sélectionner…",
  "reprise.model": "Modèle",
  "reprise.state": "État",
  "reprise.cond.excellent": "Excellent — comme neuf",
  "reprise.cond.bon": "Bon — micro-rayures",
  "reprise.cond.usage": "Usagé — rayures visibles",
  "reprise.cond.hs": "En panne — écran ou batterie HS",
  "reprise.offer": "Offre de reprise estimée",
  "reprise.estimateNote":
    "Estimation indicative. Le montant définitif est confirmé après contrôle en atelier (état de la batterie, écran, connectique, verrouillage du compte).",
  "reprise.drop": "Déposer mon appareil",
  "reprise.question": "Poser une question",
  "reprise.cta.eyebrow": "Comment ça marche",
  "reprise.cta.title": "Trois étapes, paiement le jour même",
  "reprise.step1.t": "Estimation en ligne",
  "reprise.step1.x": "Sélectionnez modèle et état pour obtenir un fourchette immédiat.",
  "reprise.step2.t": "Contrôle atelier",
  "reprise.step2.x": "Test complet en 20 minutes : batterie, écran, ports, déverrouillage.",
  "reprise.step3.t": "Paiement immédiat",
  "reprise.step3.x": "MTN MoMo, Moov Money, Celtiis ou espèces, ou déduction sur une réparation.",
};

const en = {
  // Tarifs — meta
  "tarifs.meta.title": "Repair prices 2026 — Allô Techno Abomey-Calavi",
  "tarifs.meta.description":
    "Full price list: screens, batteries, charging ports, motherboards, consoles. Prices in FCFA, turnaround times and warranties for each service.",
  "tarifs.og.title": "Price list — Allô Techno",
  "tarifs.og.description": "Transparent prices in FCFA, labor and parts included.",
  "tarifs.eyebrow": "2026 grid",
  "tarifs.title": "Transparent pricing",
  "tarifs.intro":
    "No hidden fees: every price includes the part and labor. The final quote is confirmed after the free diagnosis.",
  "tarifs.search": "Search",
  "tarifs.searchPlaceholder": "Screen, battery, iPhone…",
  "tarifs.brand": "Brand",
  "tarifs.brandAll": "All brands",
  "tarifs.category": "Device type",
  "tarifs.categoryAll": "All types",
  "tarifs.count": "{0} services listed",
  "tarifs.col.device": "Device",
  "tarifs.col.fault": "Service",
  "tarifs.col.delay": "Turnaround / Warranty",
  "tarifs.col.price": "Price",
  "tarifs.empty": "No results. Try another search or",
  "tarifs.emptyQuote": "request a quote",
  "tarifs.know.eyebrow": "Good to know",
  "tarifs.know.title": "What the price includes",
  "tarifs.know.text": "Each service is billed once, parts and labor included.",
  "tarifs.know.diag.t": "Diagnosis",
  "tarifs.know.diag.d": "Always free, even if you decline the quote.",
  "tarifs.know.part.t": "Part & fitting",
  "tarifs.know.part.d": "The part shown on the quote, fitted and tested at the workshop.",
  "tarifs.know.warranty.t": "Warranty",
  "tarifs.know.warranty.d": "3 to 12 months depending on the part, stated on the invoice.",

  // Devis — meta
  "devis.meta.title": "Instant repair quote — Allô Techno Abomey-Calavi",
  "devis.meta.description":
    "Estimate the price and turnaround for your smartphone, tablet, computer or console in Abomey-Calavi in 30 seconds.",
  "devis.og.title": "Instant quote — Allô Techno",
  "devis.og.description":
    "Choose your device and your fault: price, turnaround and warranty shown immediately.",
  "devis.eyebrow": "Free estimate",
  "devis.title": "Instant quote",
  "devis.intro":
    "Three clicks is all it takes: brand, device, fault. You instantly get the price, turnaround and warranty applied at the workshop.",
  "devis.step1": "1 · Brand",
  "devis.step2": "2 · Device",
  "devis.step3": "3 · Fault",
  "devis.select": "Select…",
  "devis.estimation": "Estimate",
  "devis.priceAll": "All-inclusive price",
  "devis.delay": "Workshop turnaround",
  "devis.warranty": "Warranty",
  "devis.partNote":
    "Part used: {0}. Diagnosis stays free and the price is confirmed before any work begins.",
  "devis.reserve": "Book this repair",
  "devis.allFaults": "See all faults",
  "devis.emptyHint": "Complete the three fields to display your estimate.",
  "devis.cta.eyebrow": "Not your model?",
  "devis.cta.title": "We also repair devices outside the catalogue",
  "devis.cta.text":
    "Describe your fault when booking: we will call you back with a custom quote within 15 working minutes.",
  "devis.customQuote": "Request a custom quote",
  "devis.form.title": "Custom quote request",
  "devis.form.messageLabel": "Device and fault",
  "devis.form.messagePlaceholder": "e.g. iPhone 12 — the screen stopped responding after a drop…",
  "devis.form.success":
    "Your request has been recorded. We will call you back within 15 working minutes.",
  "devis.request": "Request a quote",
  "devis.lead.success": "Quote request sent! We will contact you shortly.",
  "devis.lead.error": "Failed to send request. Please try again.",
  "devis.lead.sent": "Request sent",
  "devis.estimateLabel": "Estimate:",
  "devis.compare.empty": "Add at least two estimates to compare them.",
  "devis.compare.title": "Quote comparison",
  "devis.compare.hideDiffs": "Hide differences",
  "devis.compare.showDiffs": "Show differences",
  "devis.compare.price": "Price",
  "devis.compare.duration": "Turnaround",
  "devis.compare.warranty": "Warranty",
  "devis.compare.parts": "Parts",
  "devis.compare.selected": "Selected",
  "devis.compare.choose": "Choose",
  "devis.compare.addTo": "Compare",
  "devis.compare.added": "Added to comparison",

  // Contact — contact
  "contact.meta.title": "Contact & workshop — Allô Techno Abomey-Calavi",
  "contact.meta.description":
    "Address, opening hours, phone and WhatsApp of the Allô Techno workshop in Zogbadjè, Abomey-Calavi. Free diagnosis without an appointment.",
  "contact.og.title": "Contact — Allô Techno Abomey-Calavi",
  "contact.og.description":
    "Come to the Zogbadjè workshop or message us on WhatsApp for a free diagnosis.",
  "contact.eyebrow": "Find us",
  "contact.title": "Contact & workshop",
  "contact.intro":
    "Drop by without an appointment for a free diagnosis, or contact us before you travel.",
  "contact.address": "Address",
  "contact.phone": "Phone",
  "contact.whatsapp": "WhatsApp",
  "contact.email": "Email",
  "contact.hours": "Opening hours",
  "contact.hours.monfri": "Monday — Friday",
  "contact.hours.sat": "Saturday",
  "contact.hours.sun": "Sunday",
  "contact.hours.closed": "Closed",
  "contact.startChat": "Start a conversation",
  "contact.mapTitle": "Map of the Allô Techno workshop in Abomey-Calavi",
  "contact.form.eyebrow": "Write to us",
  "contact.form.title": "Send a message",
  "contact.form.text":
    "A question about a repair, a price or an accessory? We reply quickly — usually within one working hour.",
  "contact.form.formTitle": "Direct contact",
  "contact.form.description": "Message sent directly to the workshop team.",
  "contact.form.success": "Thank you! We will get back to you quickly.",

  // FAQ — meta
  "faq.meta.title": "Frequently asked questions — Allô Techno Abomey-Calavi",
  "faq.meta.description":
    "Turnaround times, warranties, Mobile Money payment, personal data, case tracking: all the answers about repairs at Allô Techno.",
  "faq.og.title": "Repair FAQ — Allô Techno",
  "faq.og.description": "Answers to the questions most asked by our customers in Benin.",
  "faq.eyebrow": "Help",
  "faq.title": "Frequently asked questions",
  "faq.intro":
    "Turnaround, warranties, payment, data privacy: the essentials before trusting us with your device.",
  "faq.searchPlaceholder": "Search for a question…",
  "faq.searchAria": "Search the FAQ",
  "faq.all": "All",
  "faq.noResult": "No question matches your search.",
  "faq.cta.eyebrow": "Still have a question?",
  "faq.cta.title": "Our workshop replies within 15 minutes",
  "faq.cta.text": "Call us, message us on WhatsApp or come to Zogbadjè during opening hours.",

  // Garantie — meta
  "garantie.meta.title": "6-month repair warranty — Allô Techno Abomey-Calavi",
  "garantie.meta.description":
    "Premium screens and batteries warranted for 6 months, micro-soldering 3 months, genuine Apple parts up to 1 year. Full details of the Allô Techno warranty.",
  "garantie.og.title": "Repair warranty — Allô Techno",
  "garantie.og.description":
    "What our warranty covers, how long it lasts, and how to claim it at the workshop.",
  "garantie.eyebrow": "Workshop commitment",
  "garantie.title": "Our warranty",
  "garantie.intro":
    "Every repair is covered, recorded on your invoice and actionable at the workshop free of charge while the warranty is running.",
  "garantie.tier1.d": "6 months",
  "garantie.tier1.t": "Premium screens & batteries",
  "garantie.tier1.x": "Grade A+ parts and service packs fitted at the workshop.",
  "garantie.tier2.d": "3 months",
  "garantie.tier2.t": "Compatible parts & micro-soldering",
  "garantie.tier2.x": "Motherboard work, charging connectors, flex cables.",
  "garantie.tier3.d": "12 months",
  "garantie.tier3.t": "Genuine Apple parts",
  "garantie.tier3.x": "On models eligible for the original parts programme.",
  "garantie.covered": "Covered",
  "garantie.notCovered": "Not covered",
  "garantie.covered1": "Defect in the installed part (panel, battery, connector…)",
  "garantie.covered2": "Defect in workmanship or fitting",
  "garantie.covered3": "The same fault recurring after the intervention",
  "garantie.covered4": "Adjustments and calibrations related to the repair",
  "garantie.notcovered1": "A new fall, impact or pressure on the screen",
  "garantie.notcovered2": "Oxidation or contact with a liquid after the repair",
  "garantie.notcovered3": "Work performed by a third party on the device",
  "garantie.notcovered4": "Normal battery wear beyond the stated cycles",
  "garantie.claim.eyebrow": "Claiming the warranty",
  "garantie.claim.title": "Three steps, without fees",
  "garantie.claim.text": "Bring your invoice or your case number AT-2026-XXXX.",
  "garantie.step1": "Check your case status online",
  "garantie.step2": "Bring the device back to the Zogbadjè workshop",
  "garantie.step3": "We re-diagnose and repair free of charge",
  "garantie.track": "Track my case",
  "garantie.contact": "Contact the workshop",

  // Mentions légales — meta
  "mentions.meta.title": "Legal notice — Allô Techno Abomey-Calavi",
  "mentions.meta.description":
    "Site publisher, hosting, intellectual property, personal data and service conditions of Allô Techno in Abomey-Calavi.",
  "mentions.og.title": "Legal notice — Allô Techno",
  "mentions.og.description": "Legal information relating to the site and the Allô Techno workshop.",
  "mentions.eyebrow": "Legal information",
  "mentions.title": "Legal notice",
  "mentions.updated": "Last updated: ",
  "mentions.editor.t": "Site publisher",
  "mentions.editor.p0": "{0}, a workshop repairing electronic devices.",
  "mentions.editor.p1": "Address: {0}.",
  "mentions.editor.p2": "Phone: {0} — Email: {1}.",
  "mentions.hosting.t": "Hosting",
  "mentions.hosting.p0":
    "The site is hosted on a managed cloud infrastructure. Booking data is stored on a secure database encrypted in transit.",
  "mentions.ip.t": "Intellectual property",
  "mentions.ip.p0":
    "The texts, visuals, price grids and blog content belong to Allô Techno. Any reproduction without written permission is prohibited.",
  "mentions.ip.p1":
    "The brands mentioned (Apple, Samsung, Xiaomi, Sony…) belong to their respective owners. Allô Techno is an independent repairer, not affiliated with these manufacturers.",
  "mentions.data.t": "Personal data",
  "mentions.data.p0":
    "The information collected during a booking (name, phone, email, fault description) is used exclusively to process the repair case and for customer follow-up.",
  "mentions.data.p1":
    "It is neither sold nor passed on to third parties. You can request to consult, correct or delete it by writing to {0}.",
  "mentions.data.p2":
    "A screen or battery replacement never involves access to the content of your device. For motherboard work, a prior backup is recommended.",
  "mentions.service.t": "Terms of service",
  "mentions.service.p0":
    "The diagnosis is free and without obligation. No work is carried out without the customer's prior validation of the quote.",
  "mentions.service.p1":
    "Devices not collected within 90 days after notification of the end of repair may be subject to storage fees.",
  "mentions.service.p2":
    "The warranty applies under the conditions described on the Warranty page and covers neither accidental damage, nor oxidation, nor third-party interventions.",

  // Reprise — meta
  "reprise.meta.title": "Device trade-in — Allô Techno Abomey-Calavi",
  "reprise.meta.description":
    "Sell your old smartphone, tablet or computer in Abomey-Calavi. Instant estimate and Mobile Money payment the same day.",
  "reprise.og.title": "Device trade-in — Allô Techno",
  "reprise.og.description":
    "Estimate the trade-in value of your device and leave paid the same day.",
  "reprise.eyebrow": "Buyback & recycling",
  "reprise.title": "Device trade-in",
  "reprise.intro":
    "Working or not, your old device has value. We take it in, refurbish it at the workshop and pay you on Mobile Money the same day.",
  "reprise.brand": "Brand",
  "reprise.select": "Select…",
  "reprise.model": "Model",
  "reprise.state": "Condition",
  "reprise.cond.excellent": "Excellent — like new",
  "reprise.cond.bon": "Good — micro-scratches",
  "reprise.cond.usage": "Used — visible scratches",
  "reprise.cond.hs": "Broken — screen or battery dead",
  "reprise.offer": "Estimated trade-in offer",
  "reprise.estimateNote":
    "Indicative estimate. The final amount is confirmed after a workshop check (battery health, screen, connectors, account lock state).",
  "reprise.drop": "Drop off my device",
  "reprise.question": "Ask a question",
  "reprise.cta.eyebrow": "How it works",
  "reprise.cta.title": "Three steps, paid the same day",
  "reprise.step1.t": "Online estimate",
  "reprise.step1.x": "Select the model and condition to get an immediate price range.",
  "reprise.step2.t": "Workshop check",
  "reprise.step2.x": "Full test in 20 minutes: battery, screen, ports, unlock.",
  "reprise.step3.t": "Immediate payment",
  "reprise.step3.x": "MTN MoMo, Moov Money, Celtiis or cash, or a deduction from your repair.",
};

registerSegments({ fr, en });
