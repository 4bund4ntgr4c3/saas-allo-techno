import { registerSegments } from "@/lib/i18n/dictionaries";

const fr = {
  // Admin — Statistiques
  "admin.stats.tab": "Statistiques",
  "admin.stats.eyebrow": "Activité de l'atelier",
  "admin.stats.title": "Statistiques",
  "admin.stats.intro":
    "Réparations, commandes boutique et revenus estimés sur les 12 derniers mois.",
  "admin.stats.month": "Ce mois-ci",
  "admin.stats.kpi.repairs": "Réparations",
  "admin.stats.kpi.boutiqueOrders": "Commandes boutique",
  "admin.stats.kpi.repairRevenue": "CA réparations (estimé)",
  "admin.stats.kpi.boutiqueRevenue": "CA boutique (estimé)",
  "admin.stats.unmatched": "{0} dossier(s) sans correspondance catalogue",
  "admin.stats.brand.title": "Réparations par marque",
  "admin.stats.brand.empty": "Aucune marque identifiée sur la période.",
  "admin.stats.funnel.title": "Tunnel des statuts",
  "admin.stats.peak.title": "Demande par jour et période",
  "admin.stats.peak.morning": "Matin",
  "admin.stats.peak.afternoon": "Après-midi",
  "admin.stats.payments.title": "Méthodes de paiement",
  "admin.stats.payment.mtn": "MTN MoMo",
  "admin.stats.payment.moov": "Moov Money",
  "admin.stats.payment.celtiis": "Celtiis",
  "admin.stats.payment.especes": "Espèces",
  "admin.stats.recent.title": "Activité récente",
  "admin.stats.recent.empty": "Aucune activité récente.",
  "admin.stats.recent.ref": "Réf.",
  "admin.stats.recent.client": "Client",
  "admin.stats.recent.device": "Appareil",
  "admin.stats.recent.status": "Statut",
  "admin.stats.recent.date": "Date",
  "admin.stats.empty": "Aucune donnée sur la période.",
  "admin.stats.status.en_attente": "En attente de confirmation",
  "admin.stats.status.confirmee": "Confirmée",
  "admin.stats.status.pieces": "En attente de pièces",
  "admin.stats.status.en_cours": "Réparation en cours",
  "admin.stats.status.pret": "Prêt à récupérer",
  "admin.stats.status.livre": "Livré",
  "admin.stats.status.terminee": "Terminée",
  "admin.stats.status.annulee": "Annulée",
  "admin.stats.revenue_monthly.title": "Revenus mensuels (6 mois)",
  "admin.stats.revenue_monthly.empty": "Aucun revenu sur la période.",
  "admin.stats.status_distribution.title": "Répartition par statut",
  "admin.stats.status_distribution.empty": "Aucune donnée de statut.",
  "admin.stats.day.0": "Dimanche",
  "admin.stats.day.1": "Lundi",
  "admin.stats.day.2": "Mardi",
  "admin.stats.day.3": "Mercredi",
  "admin.stats.day.4": "Jeudi",
  "admin.stats.day.5": "Vendredi",
  "admin.stats.day.6": "Samedi",

  // Admin — Export CSV
  "admin.export.dossiers": "Exporter CSV",
  "admin.export.leads": "Exporter CSV",
  "admin.export.error": "Export impossible",

  // Admin — Filtres avancés dossiers
  "admin.filters.status": "Filtrer par statut",
  "admin.filters.search": "Rechercher un dossier…",
  "admin.filters.date_from": "Du",
  "admin.filters.date_to": "Au",
  "admin.filters.clear": "Effacer les filtres",
  "admin.filters.all": "Tous les statuts",
  "admin.filters.results": "{0} résultat(s)",

  // Admin — Stock
  "admin.stock.low.title": "Stock faible",
  "admin.stock.low.remaining.one": "{0} restant",
  "admin.stock.low.remaining.other": "{0} restants",

  // Admin — Audit log
  "admin.audit.title": "Journal d'audit",
  "admin.audit.empty": "Aucune opération enregistrée",

  // Admin — View mode
  "admin.view.technician": "Vue technicien — vos dossiers uniquement",
  "admin.view.admin": "Vue complète — tous les dossiers",

  // Admin — Feature flags
  "admin.feature-flags": "Feature Flags",
  "admin.feature-flags.description": "Description (optionnel)",
  "admin.feature-flags.add": "Ajouter",

  // Admin — Webhooks
  "admin.webhooks": "Webhooks",
  "admin.webhooks.add": "Ajouter un webhook",
  "admin.webhooks.save": "Enregistrer",

  // Admin — Calendar
  "admin.calendar.title": "Calendrier des réservations",

  // Admin — Roles
  "admin.roles.title": "Gestion des rôles",

  // Admin — Notification center
  "admin.notifications.title": "Centre de notifications",

  // Admin — Workshops (multi-ateliers)
  "admin.workshops": "Ateliers",
  "admin.workshops.add": "Ajouter un atelier",

  // Admin — Suppliers
  "admin.suppliers": "Fournisseurs",

  // Admin — Referrals
  "admin.referrals": "Programme de parrainage",

  // Admin — Chat
  "admin.chat": "Messages clients",

  // Admin — Advanced reports
  "admin.reports": "Rapports avancés",

  // Admin — Batch 22
  "admin.inventory": "Inventaire pièces",
  "admin.sla": "Suivi SLA",
  "admin.satisfaction": "Satisfaction client",
  "admin.notifications": "Notifications internes",
  "admin.device-history": "Historique appareils",
  "admin.warranty": "Garantie étendue",
  "admin.scheduled-reports": "Rapports programmés",
  "admin.escalation": "Escalade automatique",
  "admin.kb": "Knowledge base",

  // Batch 28 — Multi-ateliers avancé
  "admin.atelier.filter.all": "Tous les ateliers",
  "admin.atelier.transfer": "Transférer…",
  "admin.atelier.transfer.success": "Dossier transféré vers {0}",
  "admin.atelier.transfer.error": "Transfert impossible",
  "admin.atelier.load.active": "actifs",
  "admin.atelier.load.progress": "en cours",
  "admin.atelier.load.pending": "en attente",
};

const en = {
  // Admin — Stats
  "admin.stats.tab": "Stats",
  "admin.stats.eyebrow": "Workshop activity",
  "admin.stats.title": "Stats",
  "admin.stats.intro": "Repairs, shop orders and estimated revenue over the last 12 months.",
  "admin.stats.month": "This month",
  "admin.stats.kpi.repairs": "Repairs",
  "admin.stats.kpi.boutiqueOrders": "Shop orders",
  "admin.stats.kpi.repairRevenue": "Repair revenue (est.)",
  "admin.stats.kpi.boutiqueRevenue": "Shop revenue (est.)",
  "admin.stats.unmatched": "{0} case(s) without catalogue match",
  "admin.stats.brand.title": "Repairs by brand",
  "admin.stats.brand.empty": "No brand identified over the period.",
  "admin.stats.funnel.title": "Status funnel",
  "admin.stats.peak.title": "Demand by day & period",
  "admin.stats.peak.morning": "Morning",
  "admin.stats.peak.afternoon": "Afternoon",
  "admin.stats.payments.title": "Payment methods",
  "admin.stats.payment.mtn": "MTN MoMo",
  "admin.stats.payment.moov": "Moov Money",
  "admin.stats.payment.celtiis": "Celtiis",
  "admin.stats.payment.especes": "Cash",
  "admin.stats.recent.title": "Recent activity",
  "admin.stats.recent.empty": "No recent activity.",
  "admin.stats.recent.ref": "Ref.",
  "admin.stats.recent.client": "Customer",
  "admin.stats.recent.device": "Device",
  "admin.stats.recent.status": "Status",
  "admin.stats.recent.date": "Date",
  "admin.stats.empty": "No data over the period.",
  "admin.stats.status.en_attente": "Awaiting confirmation",
  "admin.stats.status.confirmee": "Confirmed",
  "admin.stats.status.pieces": "Awaiting parts",
  "admin.stats.status.en_cours": "Repair in progress",
  "admin.stats.status.pret": "Ready for pickup",
  "admin.stats.status.livre": "Delivered",
  "admin.stats.status.terminee": "Completed",
  "admin.stats.status.annulee": "Cancelled",
  "admin.stats.revenue_monthly.title": "Monthly revenue (6 months)",
  "admin.stats.revenue_monthly.empty": "No revenue over the period.",
  "admin.stats.status_distribution.title": "Status distribution",
  "admin.stats.status_distribution.empty": "No status data.",
  "admin.stats.day.0": "Sunday",
  "admin.stats.day.1": "Monday",
  "admin.stats.day.2": "Tuesday",
  "admin.stats.day.3": "Wednesday",
  "admin.stats.day.4": "Thursday",
  "admin.stats.day.5": "Friday",
  "admin.stats.day.6": "Saturday",

  // Admin — CSV export
  "admin.export.dossiers": "Export CSV",
  "admin.export.leads": "Export CSV",
  "admin.export.error": "Export failed",

  // Admin — Advanced filters (dossiers)
  "admin.filters.status": "Filter by status",
  "admin.filters.search": "Search a case…",
  "admin.filters.date_from": "From",
  "admin.filters.date_to": "To",
  "admin.filters.clear": "Clear filters",
  "admin.filters.all": "All statuses",
  "admin.filters.results": "{0} result(s)",

  // Admin — Stock
  "admin.stock.low.title": "Low stock",
  "admin.stock.low.remaining.one": "{0} left",
  "admin.stock.low.remaining.other": "{0} left",

  // Admin — Audit log
  "admin.audit.title": "Audit log",
  "admin.audit.empty": "No operations recorded",

  // Admin — View mode
  "admin.view.technician": "Technician view — your cases only",
  "admin.view.admin": "Full view — all cases",

  // Admin — Feature flags
  "admin.feature-flags": "Feature Flags",
  "admin.feature-flags.description": "Description (optional)",
  "admin.feature-flags.add": "Add",

  // Admin — Webhooks
  "admin.webhooks": "Webhooks",
  "admin.webhooks.add": "Add webhook",
  "admin.webhooks.save": "Save",

  // Admin — Calendar
  "admin.calendar.title": "Reservation Calendar",

  // Admin — Roles
  "admin.roles.title": "Role Management",

  // Admin — Notification center
  "admin.notifications.title": "Notification Center",

  // Admin — Workshops (multi-ateliers)
  "admin.workshops": "Workshops",
  "admin.workshops.add": "Add workshop",

  // Admin — Suppliers
  "admin.suppliers": "Suppliers",

  // Admin — Referrals
  "admin.referrals": "Referral program",

  // Admin — Chat
  "admin.chat": "Customer messages",

  // Admin — Advanced reports
  "admin.reports": "Advanced reports",

  // Admin — Batch 22
  "admin.inventory": "Parts inventory",
  "admin.sla": "SLA tracking",
  "admin.satisfaction": "Customer satisfaction",
  "admin.notifications": "Internal notifications",
  "admin.device-history": "Device history",
  "admin.warranty": "Extended warranty",
  "admin.scheduled-reports": "Scheduled reports",
  "admin.escalation": "Auto escalation",
  "admin.kb": "Knowledge base",

  // Batch 28 — Multi-workshop advanced
  "admin.atelier.filter.all": "All workshops",
  "admin.atelier.transfer": "Transfer…",
  "admin.atelier.transfer.success": "Reservation transferred to {0}",
  "admin.atelier.transfer.error": "Transfer failed",
  "admin.atelier.load.active": "active",
  "admin.atelier.load.progress": "in progress",
  "admin.atelier.load.pending": "pending",
};

registerSegments({ fr, en });
