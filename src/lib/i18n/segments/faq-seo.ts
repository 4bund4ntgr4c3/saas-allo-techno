import { registerSegments } from "@/lib/i18n/dictionaries";

// Contenus des blocs FAQPage (JSON-LD schema.org) injectés dans le head des
// pages publiques. Clés qN / aN (question / réponse), localisées fr/en.

const fr = {
  // Réparations — FAQ
  "faq.reparations.q1": "Comment se déroule une réparation ?",
  "faq.reparations.a1":
    "Choisissez votre appareil et votre panne en ligne, réservez un créneau (en boutique à Zogbadjè ou avec enlèvement à domicile sur Cotonou & Calavi), déposez l'appareil, validez le devis après le diagnostic gratuit, puis récupérez-le une fois la réparation terminée et testée.",
  "faq.reparations.q2": "Le diagnostic est-il vraiment gratuit ?",
  "faq.reparations.a2":
    "Oui, le diagnostic est toujours gratuit et sans engagement, même si vous refusez le devis.",
  "faq.reparations.q3": "Quelle est la durée d'une réparation ?",
  "faq.reparations.a3":
    "La plupart des pannes smartphone sont réparées le jour même — réparation express dès 25 minutes selon la panne et la pièce. Les interventions plus lourdes (carte mère, pièces à commander) prennent en général 24 à 72 heures.",
  "faq.reparations.q4": "Quelle garantie est offerte sur la réparation ?",
  "faq.reparations.a4":
    "Chaque réparation est garantie 3 à 12 mois selon la pièce : 6 mois pour les écrans et batteries premium, 3 mois pour les pièces compatibles et la micro-soudure, jusqu'à 12 mois pour les pièces Apple d'origine.",
  "faq.reparations.q5": "Proposez-vous un enlèvement à domicile ?",
  "faq.reparations.a5":
    "Oui, un technicien se déplace sur Cotonou & Calavi. L'enlèvement à domicile est gratuit à partir d'un certain montant de réparation.",
  "faq.reparations.q6": "Puis-je suivre l'avancement de mon dossier ?",
  "faq.reparations.a6":
    "Oui, chaque dépôt génère un numéro de dossier et un code de suivi. Suivez chaque étape en temps réel sur la page Suivi, du diagnostic à la restitution.",

  // Tarifs — FAQ
  "faq.tarifs.q1": "Les prix affichés sont-ils définitifs ?",
  "faq.tarifs.a1":
    "Oui, chaque prix affiché inclut la pièce et la main-d'œuvre. Le devis est confirmé après le diagnostic gratuit, avant toute intervention.",
  "faq.tarifs.q2": "Que comprend le prix d'une réparation ?",
  "faq.tarifs.a2":
    "Le prix comprend la pièce indiquée sur le devis, sa pose, les tests en atelier et la garantie. Aucun frais caché.",
  "faq.tarifs.q3": "Quels moyens de paiement acceptez-vous ?",
  "faq.tarifs.a3":
    "MTN Mobile Money, Moov Money, Celtiis, espèces et virement B2B pour les entreprises.",
  "faq.tarifs.q4": "Pourquoi certains appareils sont-ils facturés sur devis ?",
  "faq.tarifs.a4":
    "Les modèles hors catalogue ou les pannes nécessitant une pièce non référencée font l'objet d'un devis personnalisé sous 15 minutes ouvrées, toujours gratuit et validé avant intervention.",

  // Catalogue — FAQ
  "faq.catalogue.q1": "Quels appareils réparez-vous ?",
  "faq.catalogue.a1":
    "Smartphones, tablettes, ordinateurs (MacBook, iMac), consoles de jeux et montres connectées. Le catalogue liste les modèles pris en charge avec leurs tarifs.",
  "faq.catalogue.q2": "Mon appareil n'est pas dans le catalogue, que faire ?",
  "faq.catalogue.a2":
    "Demandez un devis personnalisé : décrivez la panne et nous vous rappelons sous 15 minutes ouvrées avec une estimation.",
  "faq.catalogue.q3": "Comment sont fixés les prix du catalogue ?",
  "faq.catalogue.a3":
    "Chaque intervention affiche un tarif ferme, pièce et main-d'œuvre incluses, avec le délai et la garantie appliqués en atelier.",
  "faq.all": "Toutes",
  "faq.cat.repair": "Réparation",
  "faq.cat.warranty": "Garantie",
  "faq.cat.payment": "Paiement",
  "faq.cat.data": "Données",
  "faq.cat.tracking": "Suivi",
};

const en = {
  // Repairs — FAQ
  "faq.reparations.q1": "How does a repair work?",
  "faq.reparations.a1":
    "Choose your device and fault online, book a time slot (at the Zogbadjè workshop or with home pickup across Cotonou & Calavi), drop off the device, validate the quote after the free diagnosis, then collect it once the repair is finished and tested.",
  "faq.reparations.q2": "Is the diagnosis really free?",
  "faq.reparations.a2":
    "Yes, the diagnosis is always free and without obligation, even if you decline the quote.",
  "faq.reparations.q3": "How long does a repair take?",
  "faq.reparations.a3":
    "Most smartphone faults are fixed the same day — express repair from 25 minutes depending on the fault and the part. Heavier interventions (motherboard, parts to order) usually take 24 to 72 hours.",
  "faq.reparations.q4": "What warranty is offered on the repair?",
  "faq.reparations.a4":
    "Every repair is warranted for 3 to 12 months depending on the part: 6 months for premium screens and batteries, 3 months for compatible parts and micro-soldering, up to 12 months for genuine Apple parts.",
  "faq.reparations.q5": "Do you offer home pickup?",
  "faq.reparations.a5":
    "Yes, a technician travels across Cotonou & Calavi. Home pickup is free from a certain repair amount.",
  "faq.reparations.q6": "Can I track the progress of my case?",
  "faq.reparations.a6":
    "Yes, each drop-off generates a case number and a tracking code. Follow every step in real time on the Tracking page, from diagnosis to pickup.",

  // Pricing — FAQ
  "faq.tarifs.q1": "Are the displayed prices final?",
  "faq.tarifs.a1":
    "Yes, every displayed price includes the part and labor. The quote is confirmed after the free diagnosis, before any work begins.",
  "faq.tarifs.q2": "What does the repair price include?",
  "faq.tarifs.a2":
    "The price includes the part shown on the quote, its fitting, workshop testing and the warranty. No hidden fees.",
  "faq.tarifs.q3": "Which payment methods do you accept?",
  "faq.tarifs.a3": "MTN Mobile Money, Moov Money, Celtiis, cash and B2B transfer for businesses.",
  "faq.tarifs.q4": "Why are some devices billed on quote?",
  "faq.tarifs.a4":
    "Models outside the catalogue or faults requiring a non-referenced part get a custom quote within 15 working minutes, always free and validated before any work.",

  // Catalogue — FAQ
  "faq.catalogue.q1": "Which devices do you repair?",
  "faq.catalogue.a1":
    "Smartphones, tablets, computers (MacBook, iMac), game consoles and smartwatches. The catalogue lists the supported models with their prices.",
  "faq.catalogue.q2": "My device is not in the catalogue, what should I do?",
  "faq.catalogue.a2":
    "Request a custom quote: describe the fault and we will call you back within 15 working minutes with an estimate.",
  "faq.catalogue.q3": "How are the catalogue prices set?",
  "faq.catalogue.a3":
    "Each service shows a fixed price, parts and labor included, with the turnaround time and warranty applied at the workshop.",
  "faq.cat.repair": "Repair",
  "faq.cat.warranty": "Warranty",
  "faq.cat.payment": "Payment",
  "faq.cat.data": "Data",
  "faq.cat.tracking": "Tracking",
};

registerSegments({ fr, en });
