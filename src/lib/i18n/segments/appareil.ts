import { registerSegments } from "@/lib/i18n/dictionaries";

const fr = {
  // Appareil — meta
  "appareil.meta.notfound.title": "Appareil introuvable — Allô Techno",
  "appareil.meta.title": "Réparation {0} — tarifs & délais | Allô Techno",
  "appareil.meta.description":
    "Réparation {0} à Abomey-Calavi : {1}. À partir de {2}, garantie incluse.",
  "appareil.meta.og.title": "Réparation {0} — Allô Techno",
  "appareil.meta.og.description":
    "{0} pannes prises en charge, pièces certifiées, garantie jusqu'à 12 mois.",
  "appareil.serviceType": "Réparation {0}",
  "appareil.eyebrow": "Fiche appareil",

  // Appareil — chrome
  "appareil.breadcrumb.reparations": "Réparations",
  "appareil.reserve": "Réserver cette réparation",
  "appareil.quote": "Devis instantané",
  "appareil.from": "Interventions à partir de",
  "appareil.faults.eyebrow": "Pannes disponibles",
  "appareil.faults.title": "Tarifs, délais, garanties & pièces",
  "appareil.faults.text":
    "Prix indicatifs incluant la pièce et la main-d'œuvre. Devis ferme après diagnostic gratuit.",
  "appareil.col.intervention": "Intervention",
  "appareil.col.delay": "Délai",
  "appareil.col.warranty": "Garantie",
  "appareil.col.part": "Pièce",
  "appareil.col.price": "Prix",
  "appareil.points.one": "Diagnostic gratuit avant toute intervention",
  "appareil.points.two": "Facture PDF et garantie remises à la restitution",
  "appareil.points.three": "Paiement MTN MoMo, Moov Money, Celtiis ou espèces",

  // Appareil — FAQ
  "appareil.faq.eyebrow": "Questions fréquentes",
  "appareil.faq.title": "{0} — vos questions",
  "appareil.faq.q1": "Mes données sont-elles conservées ?",
  "appareil.faq.a1":
    "Un remplacement d'écran, de batterie ou de connecteur ne touche pas vos données. Pour les interventions sur carte mère, une sauvegarde préalable est recommandée.",
  "appareil.faq.q2": "Quelles pièces utilisez-vous sur ce modèle ?",
  "appareil.faq.a2":
    "La catégorie exacte est indiquée dans la colonne « Pièce » ci-dessus et rappelée sur votre devis : service pack, grade A+ ou compatible selon la disponibilité.",
  "appareil.faq.q3": "Puis-je attendre sur place ?",
  "appareil.faq.a3":
    "Oui pour les interventions de moins d'une heure. Un espace d'attente est disponible à l'atelier d'Abomey-Calavi.",
  "appareil.faq.q4": "Que couvre la garantie ?",
  "appareil.faq.a4":
    "Les défauts de pièce et de main-d'œuvre. Les chutes, l'oxydation et les interventions par un tiers ne sont pas couvertes.",

  // Appareil — modèles apparentés
  "appareil.siblings.eyebrow": "Même marque",
  "appareil.siblings.title": "Autres modèles {0}",
  "appareil.siblings.from": "dès {0}",
};

const en = {
  // Appareil — meta
  "appareil.meta.notfound.title": "Device not found — Allô Techno",
  "appareil.meta.title": "{0} repair — prices & turnaround | Allô Techno",
  "appareil.meta.description": "{0} repair in Abomey-Calavi: {1}. From {2}, warranty included.",
  "appareil.meta.og.title": "{0} repair — Allô Techno",
  "appareil.meta.og.description": "{0} faults covered, certified parts, warranty up to 12 months.",
  "appareil.serviceType": "{0} repair",
  "appareil.eyebrow": "Device sheet",

  // Appareil — chrome
  "appareil.breadcrumb.reparations": "Repairs",
  "appareil.reserve": "Book this repair",
  "appareil.quote": "Instant quote",
  "appareil.from": "Interventions from",
  "appareil.faults.eyebrow": "Available faults",
  "appareil.faults.title": "Prices, turnaround, warranty & parts",
  "appareil.faults.text":
    "Indicative prices including parts and labor. Firm quote after a free diagnosis.",
  "appareil.col.intervention": "Intervention",
  "appareil.col.delay": "Turnaround",
  "appareil.col.warranty": "Warranty",
  "appareil.col.part": "Part",
  "appareil.col.price": "Price",
  "appareil.points.one": "Free diagnosis before any intervention",
  "appareil.points.two": "PDF invoice and warranty handed over on pickup",
  "appareil.points.three": "Payment via MTN MoMo, Moov Money, Celtiis or cash",

  // Appareil — FAQ
  "appareil.faq.eyebrow": "Frequently asked questions",
  "appareil.faq.title": "{0} — your questions",
  "appareil.faq.q1": "Are my data preserved?",
  "appareil.faq.a1":
    "A screen, battery or connector replacement does not touch your data. For motherboard work, a prior backup is recommended.",
  "appareil.faq.q2": "Which parts do you use on this model?",
  "appareil.faq.a2":
    'The exact grade is shown in the "Part" column above and on your quote: service pack, grade A+ or compatible depending on availability.',
  "appareil.faq.q3": "Can I wait on site?",
  "appareil.faq.a3":
    "Yes, for interventions that take less than an hour. A waiting area is available at the Abomey-Calavi workshop.",
  "appareil.faq.q4": "What does the warranty cover?",
  "appareil.faq.a4":
    "Defects in the part and the workmanship. Drops, oxidation and interventions by a third party are not covered.",

  // Appareil — related models
  "appareil.siblings.eyebrow": "Same brand",
  "appareil.siblings.title": "Other {0} models",
  "appareil.siblings.from": "from {0}",
};

registerSegments({ fr, en });
