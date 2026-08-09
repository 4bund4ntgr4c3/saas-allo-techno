import { registerSegments } from "@/lib/i18n/dictionaries";

const fr = {
  // Mon compte — onglets
  "mc.tab.dossiers": "Mes dossiers",
  "mc.tab.devis": "Mes devis",
  "mc.tab.fidelite": "Fidélité",
  "mc.tab.parrainer": "Parrainer",
  "mc.tab.avis": "Mes avis",
  "mc.tab.paiements": "Mes paiements",
  "mc.tab.profil": "Profil",

  // Mon compte — devis
  "mc.devis.title": "Mes devis",
  "mc.devis.intro": "Historique de tous les devis reçus pour vos réparations.",
  "mc.devis.empty": "Vous n'avez pas encore reçu de devis.",
  "mc.devis.amount": "Montant",
  "mc.devis.warranty": "Garantie",
  "mc.devis.warrantyStandard": "Standard (6 mois)",
  "mc.devis.warrantyMonths": "Étendue : {0} mois",
  "mc.devis.date": "Date",
  "mc.devis.status.none": "En attente",
  "mc.devis.status.sent": "Envoyé",
  "mc.devis.status.approved": "Approuvé",
  "mc.devis.status.declined": "Refusé",

  // Mon compte — en-tête
  "mc.header.eyebrow": "Espace client",
  "mc.header.title": "Mon compte",
  "mc.header.new": "Nouvelle réservation",
  "mc.header.admin": "Administration",
  "mc.header.logout": "Se déconnecter",

  // Mon compte — dossiers
  "mc.dossiers.active": "{0} intervention en cours · {1} au total",
  "mc.dossiers.empty.title": "Aucune réservation pour le moment.",
  "mc.dossiers.empty.text":
    "Réservez un créneau et retrouvez ici l'avancement de votre réparation.",
  "mc.dossiers.empty.cta": "Réserver une réparation",
  "mc.dossiers.reference": "Dossier {0}",
  "mc.dossiers.date": "Date",
  "mc.dossiers.slot": "Créneau",
  "mc.dossiers.mode": "Mode",
  "mc.dossiers.mode.domicile": "Enlèvement à domicile",
  "mc.dossiers.mode.boutique": "Dépôt en boutique",
  "mc.dossiers.reschedule": "Reprogrammer",
  "mc.dossiers.reschedule.hide": "Masquer",
  "mc.dossiers.cancel": "Annuler cette réservation",
  "mc.dossiers.pdf": "Reçu PDF du dossier {0}",
  "mc.dossiers.paid": "Payé en ligne",

  // Mon compte — fidélité
  "mc.loyalty.title": "Programme fidélité",
  "mc.loyalty.points": "points",
  "mc.loyalty.hint":
    "Gagnez 100 points par réparation terminée. Parrainez un proche : +100 points, et il reçoit +50 points à son inscription.",
  "mc.loyalty.tier.bronze": "Bronze",
  "mc.loyalty.tier.argent": "Argent",
  "mc.loyalty.tier.or": "Or",
  "mc.loyalty.tier.advantages": "Avantages",
  "mc.loyalty.tier.next": "Prochain palier",
  "mc.loyalty.tier.progress": "{0} points vers {1}",
  "mc.loyalty.history.title": "Historique",
  "mc.loyalty.history.reason.referral": "Parrainage",
  "mc.loyalty.history.reason.repair": "Réparation",
  "mc.loyalty.history.reason.bonus": "Bonus",
  "mc.loyalty.history.empty": "Aucune opération pour le moment.",

  // Mon compte — parrainer
  "mc.referral.title": "Parrainer un proche",
  "mc.referral.subtitle": "+100 points pour vous, +50 points pour lui à son inscription.",
  "mc.referral.code.label": "Mon code de parrainage",
  "mc.referral.code.copy": "Copier",
  "mc.referral.code.copied": "Lien de parrainage copié",
  "mc.referral.code.generate": "Générer mon code de parrainage",
  "mc.referral.stats.invited": "Personnes parrainées",
  "mc.referral.stats.bonus": "Bonus gagnés",
  "mc.referral.apply.label": "Utiliser un code de parrainage",
  "mc.referral.apply.placeholder": "ALLO-XXXX",
  "mc.referral.apply.submit": "Appliquer le code",
  "mc.referral.apply.success": "Code appliqué : +{0} points",
  "mc.referral.already": "Vous avez déjà été parrainé.",

  // Mon compte — avis
  "mc.reviews.title": "Mes avis",
  "mc.reviews.empty": "Vous n'avez pas encore laissé d'avis.",
  "mc.reviews.pending": "En attente de validation",
  "mc.reviews.published": "Publié",
  "mc.reviews.hidden": "Masqué",
  "mc.reviews.stars": "{0} étoiles",

  // Mon compte — paiements
  "mc.payments.title": "Mes paiements",
  "mc.payments.total": "Total payé : {0} FCFA",
  "mc.payments.empty": "Aucun paiement enregistré pour le moment.",
  "mc.payments.method": "Méthode",
  "mc.payments.amount": "Montant",
  "mc.payments.status.paid": "Payé",
  "mc.payments.status.pending": "En attente",
  "mc.payments.status.failed": "Échoué",
  "mc.payments.status.refunded": "Remboursé",

  // Mon compte — profil
  "mc.profile.title": "Mes informations",
  "mc.profile.name": "Nom complet",
  "mc.profile.phone": "Téléphone / WhatsApp",
  "mc.profile.save": "Enregistrer",
  "mc.profile.saved": "Profil mis à jour",
};

const en = {
  // My account — tabs
  "mc.tab.dossiers": "My cases",
  "mc.tab.devis": "My quotes",
  "mc.tab.fidelite": "Loyalty",
  "mc.tab.parrainer": "Refer",
  "mc.tab.avis": "My reviews",
  "mc.tab.paiements": "My payments",
  "mc.tab.profil": "Profile",

  // My account — devis
  "mc.devis.title": "My quotes",
  "mc.devis.intro": "History of all quotes received for your repairs.",
  "mc.devis.empty": "You have not received any quotes yet.",
  "mc.devis.amount": "Amount",
  "mc.devis.warranty": "Warranty",
  "mc.devis.warrantyStandard": "Standard (6 months)",
  "mc.devis.warrantyMonths": "Extended: {0} months",
  "mc.devis.date": "Date",
  "mc.devis.status.none": "Pending",
  "mc.devis.status.sent": "Sent",
  "mc.devis.status.approved": "Approved",
  "mc.devis.status.declined": "Declined",

  // My account — header
  "mc.header.eyebrow": "Customer area",
  "mc.header.title": "My account",
  "mc.header.new": "New booking",
  "mc.header.admin": "Administration",
  "mc.header.logout": "Sign out",

  // My account — cases
  "mc.dossiers.active": "{0} active intervention · {1} total",
  "mc.dossiers.empty.title": "No bookings yet.",
  "mc.dossiers.empty.text": "Book a time slot and track your repair progress here.",
  "mc.dossiers.empty.cta": "Book a repair",
  "mc.dossiers.reference": "Case {0}",
  "mc.dossiers.date": "Date",
  "mc.dossiers.slot": "Time slot",
  "mc.dossiers.mode": "Mode",
  "mc.dossiers.mode.domicile": "Home pickup",
  "mc.dossiers.mode.boutique": "Drop off at workshop",
  "mc.dossiers.reschedule": "Reschedule",
  "mc.dossiers.reschedule.hide": "Hide",
  "mc.dossiers.cancel": "Cancel this booking",
  "mc.dossiers.pdf": "Invoice PDF for case {0}",
  "mc.dossiers.paid": "Paid online",

  // My account — loyalty
  "mc.loyalty.title": "Loyalty program",
  "mc.loyalty.points": "points",
  "mc.loyalty.hint":
    "Earn 100 points per completed repair. Refer a friend: +100 points for you, +50 for them on signup.",
  "mc.loyalty.tier.bronze": "Bronze",
  "mc.loyalty.tier.argent": "Silver",
  "mc.loyalty.tier.or": "Gold",
  "mc.loyalty.tier.advantages": "Benefits",
  "mc.loyalty.tier.next": "Next tier",
  "mc.loyalty.tier.progress": "{0} points towards {1}",
  "mc.loyalty.history.title": "History",
  "mc.loyalty.history.reason.referral": "Referral",
  "mc.loyalty.history.reason.repair": "Repair",
  "mc.loyalty.history.reason.bonus": "Bonus",
  "mc.loyalty.history.empty": "No transactions yet.",

  // My account — referral
  "mc.referral.title": "Refer a friend",
  "mc.referral.subtitle": "+100 points for you, +50 for them on signup.",
  "mc.referral.code.label": "My referral code",
  "mc.referral.code.copy": "Copy",
  "mc.referral.code.copied": "Referral link copied",
  "mc.referral.code.generate": "Generate my referral code",
  "mc.referral.stats.invited": "Friends referred",
  "mc.referral.stats.bonus": "Bonuses earned",
  "mc.referral.apply.label": "Use a referral code",
  "mc.referral.apply.placeholder": "ALLO-XXXX",
  "mc.referral.apply.submit": "Apply code",
  "mc.referral.apply.success": "Code applied: +{0} points",
  "mc.referral.already": "You have already been referred.",

  // My account — reviews
  "mc.reviews.title": "My reviews",
  "mc.reviews.empty": "You haven't left any reviews yet.",
  "mc.reviews.pending": "Awaiting validation",
  "mc.reviews.published": "Published",
  "mc.reviews.hidden": "Hidden",
  "mc.reviews.stars": "{0} stars",

  // My account — payments
  "mc.payments.title": "My payments",
  "mc.payments.total": "Total paid: {0} FCFA",
  "mc.payments.empty": "No payments recorded yet.",
  "mc.payments.method": "Method",
  "mc.payments.amount": "Amount",
  "mc.payments.status.paid": "Paid",
  "mc.payments.status.pending": "Pending",
  "mc.payments.status.failed": "Failed",
  "mc.payments.status.refunded": "Refunded",

  // My account — profile
  "mc.profile.title": "My information",
  "mc.profile.name": "Full name",
  "mc.profile.phone": "Phone / WhatsApp",
  "mc.profile.save": "Save",
  "mc.profile.saved": "Profile updated",
};

registerSegments({ fr, en });
