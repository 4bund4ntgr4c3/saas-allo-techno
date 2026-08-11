// Traductions du portail de démonstration (/demo) et du visit tour.
import { registerSegments } from "@/lib/i18n/dictionaries";

const fr = {
  "demo.title": "Visite guidée — découvrez Allô Techno",
  "demo.subtitle":
    "Essayez chaque espace de la plateforme avec un compte de démonstration : cliquez sur un rôle pour explorer, puis lancez la visite guidée depuis l'application.",
  "demo.disclaimer":
    "Comptes de démonstration : données fictives, réinitialisées régulièrement, sans impact sur les données réelles.",
  "demo.seedError": "La préparation de la démonstration a échoué. Réessayez dans un instant.",
  "demo.role.admin": "Administration",
  "demo.role.staff": "Équipe (staff)",
  "demo.role.technicien": "Technicien",
  "demo.role.client": "Client particulier",
  "demo.role.b2b": "Entreprise (B2B)",
  "demo.features.admin":
    "Tableau de bord complet, gestion des dossiers, kanban, équipe, catalogue, inventaire, rapports, paramètres…",
  "demo.features.staff":
    "Gestion des réservations, devis, pièces jointes, livraison, suivi des dossiers en liste ou kanban.",
  "demo.features.technicien":
    "Vos dossiers assignés, changements de statut, historique, photos et devis — vue kanban incluse.",
  "demo.features.client":
    "Espace client : vos réservations, code de suivi, devis et historique de réparation.",
  "demo.features.b2b":
    "Portail entreprise : organisation, parc d'équipements avec QR codes, tickets d'intervention et sites.",
  "demo.explore": "Explorer cet espace",
  "demo.loggingIn": "Connexion…",
  "demo.credentials": "Identifiants",
  "demo.password": "Mot de passe",
  "demo.visitTour": "Visite guidée",
  "demo.tourAdmin": "Tour de l'administration",
  "demo.tourApp": "Tour du portail entreprise",
  "demo.tourAccount": "Tour de l'espace client",
  "demo.tourStart": "Démarrer le tour",
  "demo.tourNext": "Suivant",
  "demo.tourBack": "Retour",
  "demo.tourDone": "Terminer",
  "demo.tourStep": "Étape",
  "demo.backToHome": "Revenir à l'accueil",
  "demo.trackingInfo":
    "Un dossier de démonstration est prêt pour ce compte. Code de suivi à utiliser sur la page Suivi :",
  "demo.trackingCode": "Code de suivi",
  "demo.warning": "Démo",
  "demo.resetNotice":
    "Les comptes partagés peuvent être modifiés par d'autres visiteurs. Aucune donnée sensible n'y figure.",

  "tour.admin.sidebar.title": "Navigation",
  "tour.admin.sidebar.body":
    "Toutes les sections de l'administration : dossiers, équipe, catalogue, inventaire, marketing, rapports et paramètres.",
  "tour.admin.dossiers.title": "Dossiers",
  "tour.admin.dossiers.body":
    "Le cœur du métier : réservations particuliers et entreprises (badge B2B), recherche, filtres par statut, technicien, période et type.",
  "tour.admin.filters.title": "Filtres",
  "tour.admin.filters.body":
    "Recherchez par référence, client ou appareil, filtrez par statut, technicien, dates, et basculez particuliers / entreprises.",
  "tour.admin.status.title": "Suivi de statut",
  "tour.admin.status.body":
    "Avancez chaque dossier d'étape en étape : en attente, confirmé, en cours, pièces, prêt, livré. Historique complet à chaque changement.",
  "tour.admin.kanban.title": "Vue Kanban",
  "tour.admin.kanban.body":
    "Basculez en vue Kanban et déplacez les cartes par glisser-déposer d'une colonne à l'autre pour changer le statut.",
  "tour.admin.technician.title": "Techniciens",
  "tour.admin.technician.body":
    "Assignez un technicien à chaque dossier ; le technicien ne voit que ses dossiers dans son propre espace.",
  "tour.admin.export.title": "Exports",
  "tour.admin.export.body":
    "Exportez la liste en CSV ou PDF (factures comprises) et envoyez les devis aux clients depuis chaque dossier.",
  "tour.admin.live.title": "Temps réel",
  "tour.admin.live.body":
    "L'administration se met à jour en temps réel : nouvelles réservations et changements visibles instantanément.",

  "tour.app.org.title": "Votre organisation",
  "tour.app.org.body":
    "Vos informations d'entreprise, vos membres et leurs rôles. L'organisation rassemble tous vos équipements et tickets.",
  "tour.app.equipment.title": "Parc d'équipements",
  "tour.app.equipment.body":
    "Chaque équipement a son QR code unique : scannez-le pour ouvrir la fiche (historique, garantie, statut).",
  "tour.app.tickets.title": "Tickets d'intervention",
  "tour.app.tickets.body":
    "Signalez une panne ou une maintenance depuis un équipement : Allô Techno intervient, avec priorité et suivi.",
  "tour.app.scan.title": "Scanner un QR code",
  "tour.app.scan.body":
    "Depuis votre téléphone, scannez le QR code d'un équipement pour ouvrir directement sa fiche d'information.",

  "tour.account.reservations.title": "Vos réservations",
  "tour.account.reservations.body":
    "Retrouvez l'historique de vos dépôts de réparation et leurs statuts en un coup d'œil.",
  "tour.account.tracking.title": "Suivi par code",
  "tour.account.tracking.body":
    "Chaque dossier a un code de suivi confidentiel, envoyé par SMS et e-mail : le suivi fonctionne même sans compte.",
  "tour.account.quote.title": "Devis",
  "tour.account.quote.body":
    "Acceptez ou refusez le devis en ligne, puis suivez la réparation jusqu'à la restitution.",
  "tour.account.logout.title": "Déconnexion",
  "tour.account.logout.body":
    "Terminez la visite à tout moment : les comptes de démonstration sont partagés et remis à zéro régulièrement.",
};

const en = {
  "demo.title": "Guided tour — discover Allô Techno",
  "demo.subtitle":
    "Try every part of the platform with a demo account: click a role to explore, then start the guided tour from inside the app.",
  "demo.disclaimer": "Demo accounts: fictional data, reset regularly, with no impact on real data.",
  "demo.seedError": "Preparing the demo failed. Please retry in a moment.",
  "demo.role.admin": "Administration",
  "demo.role.staff": "Team (staff)",
  "demo.role.technicien": "Technician",
  "demo.role.client": "Individual customer",
  "demo.role.b2b": "Business (B2B)",
  "demo.features.admin":
    "Full dashboard, case management, kanban, team, catalogue, inventory, reports, settings…",
  "demo.features.staff":
    "Manage bookings, quotes, attachments, delivery and case tracking in list or kanban view.",
  "demo.features.technicien":
    "Your assigned cases, status changes, history, photos and quotes — kanban view included.",
  "demo.features.client": "Customer area: your bookings, tracking code, quotes and repair history.",
  "demo.features.b2b":
    "Business portal: organisation, equipment fleet with QR codes, service tickets and sites.",
  "demo.explore": "Explore this space",
  "demo.loggingIn": "Signing in…",
  "demo.credentials": "Credentials",
  "demo.password": "Password",
  "demo.visitTour": "Guided tour",
  "demo.tourAdmin": "Admin tour",
  "demo.tourApp": "Business portal tour",
  "demo.tourAccount": "Customer area tour",
  "demo.tourStart": "Start the tour",
  "demo.tourNext": "Next",
  "demo.tourBack": "Back",
  "demo.tourDone": "Done",
  "demo.tourStep": "Step",
  "demo.backToHome": "Back to home",
  "demo.trackingInfo":
    "A demo case is ready for this account. Use the tracking code on the Tracking page:",
  "demo.trackingCode": "Tracking code",
  "demo.warning": "Demo",
  "demo.resetNotice":
    "Shared accounts may be modified by other visitors. No sensitive data is stored there.",

  "tour.admin.sidebar.title": "Navigation",
  "tour.admin.sidebar.body":
    "Every admin section: cases, team, catalogue, inventory, marketing, reports and settings.",
  "tour.admin.dossiers.title": "Cases",
  "tour.admin.dossiers.body":
    "The core of the business: individual and business bookings (B2B badge), search, status, technician, date and type filters.",
  "tour.admin.filters.title": "Filters",
  "tour.admin.filters.body":
    "Search by reference, customer or device; filter by status, technician, dates, and switch between individuals and businesses.",
  "tour.admin.status.title": "Status tracking",
  "tour.admin.status.body":
    "Move each case forward step by step: pending, confirmed, in progress, parts, ready, delivered. Full history on every change.",
  "tour.admin.kanban.title": "Kanban view",
  "tour.admin.kanban.body":
    "Switch to the kanban view and drag cards between columns to change status.",
  "tour.admin.technician.title": "Technicians",
  "tour.admin.technician.body":
    "Assign a technician to each case; the technician only sees their own cases in their space.",
  "tour.admin.export.title": "Exports",
  "tour.admin.export.body":
    "Export the list to CSV or PDF (invoices included) and send quotes to customers from each case.",
  "tour.admin.live.title": "Real time",
  "tour.admin.live.body":
    "The admin updates in real time: new bookings and changes appear instantly.",

  "tour.app.org.title": "Your organisation",
  "tour.app.org.body":
    "Your company details, members and their roles. The organisation gathers all your equipment and tickets.",
  "tour.app.equipment.title": "Equipment fleet",
  "tour.app.equipment.body":
    "Each device has a unique QR code: scan it to open the record (history, warranty, status).",
  "tour.app.tickets.title": "Service tickets",
  "tour.app.tickets.body":
    "Report a fault or schedule maintenance from a device: Allô Techno responds, with priority and tracking.",
  "tour.app.scan.title": "Scan a QR code",
  "tour.app.scan.body": "From your phone, scan a device QR code to open its record directly.",

  "tour.account.reservations.title": "Your bookings",
  "tour.account.reservations.body":
    "Browse your repair drop-off history and their statuses at a glance.",
  "tour.account.tracking.title": "Track with a code",
  "tour.account.tracking.body":
    "Every case has a confidential tracking code sent by SMS and email: tracking works even without an account.",
  "tour.account.quote.title": "Quotes",
  "tour.account.quote.body":
    "Accept or decline your quote online, then follow the repair until it is ready.",
  "tour.account.logout.title": "Log out",
  "tour.account.logout.body":
    "End the visit at any time: demo accounts are shared and reset regularly.",
};

registerSegments({ fr, en });
