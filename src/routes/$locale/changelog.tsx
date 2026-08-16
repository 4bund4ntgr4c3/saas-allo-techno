import { createFileRoute } from "@tanstack/react-router";
import { CtaBand } from "@/components/site/Blocks";
import { PageBreadcrumb } from "@/components/site/PageBreadcrumb";
import { useI18n } from "@/lib/i18n/context";
import { normalizeLocale } from "@/lib/i18n/locales";
import { localeSeo } from "@/lib/seo";
import { translate } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";

export const Route = createFileRoute("/$locale/changelog")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const suffix = "/changelog";
    const seo = localeSeo(locale, suffix);
    return {
      meta: [
        { title: translate(locale, "changelog.meta.title") },
        { name: "description", content: translate(locale, "changelog.meta.description") },
        { property: "og:title", content: translate(locale, "changelog.meta.og.title") },
        { property: "og:description", content: translate(locale, "changelog.meta.og.description") },
        ...seo.meta,
      ],
      links: [...seo.links],
    };
  },
  component: ChangelogPage,
});

interface ChangelogEntry {
  version: string;
  date: string;
  added?: string[];
  changed?: string[];
  fixed?: string[];
  removed?: string[];
}

const ENTRIES: ChangelogEntry[] = [
  {
    version: "2026.08.17 — Suivi Coursier GPS, Destruction Sécurisée NIST, Test Recrutement Technicien & Diagnostic IA (Batch 48)",
    date: "2026-08-17",
    added: [
      "Composant de suivi en direct du coursier express (CourierLiveTrackerModal.tsx) avec trajet Cotonou/Calavi, progression temps réel et contact direct",
      "Générateur officiel de Certificat de Destruction Sécurisée des Données & DEEE (data-destruction-certificate-pdf.ts) conforme NIST SP 800-88 et DoD 5220.22-M pour DSI et banques",
      "Portail d'évaluation technique et QCM de recrutement en micro-soudure (src/routes/$locale/work-at/test-technique.tsx) avec score immédiat et candidature WhatsApp",
      "Assistant de diagnostic prédictif guidé par IA (AiDiagnosticAssistant.tsx, ai-diagnostic.functions.ts) analysant les descriptions de pannes et chiffrant les devis estimatifs",
    ],
    fixed: [
      "Calcul des scores d'évaluation technique avec explications pédagogiques détaillées",
      "Sécurisation des attestations de destruction de supports de stockage avec jeton APDP certifié",
    ],
  },
  {
    version: "2026.08.17 — Programme Parrainage MoMo, Audit Énergétique SBEE, Premiers Secours SAV & Passerelle SMS (Batch 47)",
    date: "2026-08-17",
    added: [
      "Programme de parrainage et affiliation avec reversement Mobile Money (src/routes/$locale/parrainage.tsx, referral.functions.ts) : lien unique, bon filleul 2 000 FCFA et virement MoMo des commissions",
      "Calculateur d'audit énergétique de parc informatique et économies SBEE (src/components/b2b/energy/EnergyAuditCalculator.tsx) avec calcul des kWh et CO2 évité",
      "Guide interactif de premiers secours et gestes d'urgence matérielle (src/routes/$locale/premiers-secours.tsx) pour les accidents de liquide renversé, surtension et surchauffe",
      "Passerelle transactionnelle SMS locale Bénin (src/lib/sms-notifications.ts) pour alertes automatiques de devis prêt et matériel disponible au retrait en boutique",
    ],
    fixed: [
      "Interface de demande de virement de commission Mobile Money avec seuil minimum de 5 000 FCFA",
      "Numérotation d'urgence et liaison directe WhatsApp pour les désoxydations critiques",
    ],
  },
  {
    version: "2026.08.17 — Diagnostic Matériel Web, Simulateur ROI DSI, Badge Technicien & Bordereaux UEMOA (Batch 46)",
    date: "2026-08-17",
    added: [
      "Banc de test matériel interactif en direct (src/routes/$locale/diagnostic-auto.tsx) : testeur de touches clavier, détecteur de pixels morts, test microphone/haut-parleurs et flux webcam",
      "Simulateur de rentabilité et d'amortissement de flotte informatique pour DSI/DAF (RoiCalculatorModal.tsx) calculant les économies nettes en FCFA par rapport au rachat systématique de neuf",
      "Badge numérique de technicien certifié (src/components/tech/TechnicianBadgeModal.tsx) avec matricule, accréditations Apple/Dell/Micro-Soudure et QR code d'authentification",
      "Générateur officiel d'ordres de virement bancaire normalisés UEMOA / Bénin (src/lib/bank-transfer-orders.ts) pour Ecobank, BOA, UBA et Société Générale Bénin",
    ],
    fixed: [
      "Intégration du simulateur ROI sur la page Entreprises (/fr/entreprises) avec liaison directe vers l'audit gratuit",
      "Capture audio WebRTC et oscillateur sinusoïdal pour vérification instantanée des transducteurs audio",
    ],
  },
  {
    version: "2026.08.17 — Trade-In Argus, Suivi Fret Pièces, Journal SAV & Certificat Garantie SHA-256 (Batch 45)",
    date: "2026-08-17",
    added: [
      "Simulateur de reprise et argus informatique Trade-In (src/lib/trade-in.ts, TradeInEstimator.tsx) avec estimation instantanée de la valeur de rachat et bonus bon d'achat +10%",
      "Système de traçabilité des pièces détachées et fret aérien en transit (src/lib/parts-tracker.ts, SupplierPartsTracker.tsx) depuis les hubs de Dubaï, Paris et Shenzhen",
      "Journal des interactions clients et mémos d'atelier SAV (src/lib/interactions.functions.ts, ClientInteractionDrawer.tsx) pour consigner les appels et consignes techniques",
      "Générateur officiel de Certificat de Garantie Numérique Inviolable (src/lib/warranty-certificate-pdf.ts) avec scellé cryptographique SHA-256 et QR code d'authentification",
    ],
    fixed: [
      "Intégration du simulateur Trade-In sur la page Services (/fr/services) avec redirection WhatsApp pré-remplie",
      "Sécurisation des certificats de garantie contre la falsification via empreinte numérique de 32 octets",
    ],
  },
  {
    version: "2026.08.17 — Scanner QR Caméra PWA, Alertes Climat Tropical & Paiement Mobile Money Direct (Batch 44)",
    date: "2026-08-17",
    added: [
      "Scanner QR Code temps réel avec flux vidéo caméra (src/components/scanner/QrCameraScanner.tsx) avec support de l'API BarcodeDetector et cadre laser animé",
      "Intégration directe du scanner caméra dans la route /app/scan avec retour haptique et résolution automatique des URLs",
      "Moteur d'alertes préventives pour le climat tropical d'Afrique de l'Ouest (tropical-climate-advisor.ts) : poussière de l'Harmattan, humidité côtière et surchauffe estivale",
      "Composant d'alerte et de recommandation matérielle proactive (TropicalAdvisoryCard.tsx) intégré sur le portail de maintenance",
      "Module de paiement instantané Mobile Money Bénin (MobileMoneyDirectPay.tsx) avec détection automatique d'opérateur (MTN MoMo, Moov Money, Celtiis Cash)",
    ],
    fixed: [
      "Gestion adaptative des permissions de caméra avec bascule caméra avant / arrière",
      "Affichage des instructions USSD de validation Mobile Money avec décompte temps réel",
    ],
  },
  {
    version: "2026.08.16 — Impression Thermique 58/80mm, Suivi Client WhatsApp & Audit Sécurité APDP (Batch 43)",
    date: "2026-08-16",
    added: [
      "Générateur d'impression de reçus thermiques de caisse ESC/POS 58mm/80mm (src/lib/thermal-receipt.ts) avec QR code de suivi scannable direct",
      "Bouton d'assistance WhatsApp directe avec référence et contexte pré-remplis sur la page de suivi client (/fr/suivi)",
      "Module d'estimation cartographique des délais d'intervention coursier et technicien par quartier (CoverageZoneEstimator.tsx, locations.ts)",
      "Journal d'audit de sécurité et export de conformité APDP / RGPD (org-audit.functions.ts) pour la traçabilité des accès et actions sensibles",
    ],
    fixed: [
      "Formatage optimisé pour imprimantes thermiques de comptoir sans marge inutile",
      "Calcul précis des temps de parcours pour le Grand Cotonou, Abomey-Calavi et Porto-Novo",
    ],
  },
  {
    version: "2026.08.16 — Signature Électronique, Mode PWA Hors-Ligne & Tableau Analytique SLA (Batch 42)",
    date: "2026-08-16",
    added: [
      "Composant de signature électronique tactile (src/components/ui/SignaturePad.tsx) pour validation au doigt ou à la souris sur mobile et tablette",
      "Modale d'attestation de signature (SignatureModal.tsx) et intégration automatique du tracé de signature dans les factures et reçus PDF (invoice.ts)",
      "Moteur PWA Offline-First (src/lib/offline-sync.ts) avec file d'attente locale et synchronisation en tâche de fond dès retour du réseau",
      "Bandeau d'état réseau non-intrusif (OfflineBanner.tsx) et hook réactif useNetworkStatus intégré globalement dans l'application",
      "Tableau de bord de performance SLA & analytique flotte (SlaAnalyticsDashboard.tsx) avec indicateurs MTTR (Mean Time To Repair), Uptime 99.8% et graphiques interactifs Recharts",
      "Suite de tests E2E Playwright complète (e2e/b2b-full-flow.spec.ts) validant le parcours multi-étapes et les outils entreprise",
    ],
    fixed: [
      "Persistance locale des actions techniciens terrain en cas de coupure de connectivité",
      "Rendu dynamique et haute performance des graphiques de répartition et de tendance de maintenance",
    ],
  },
  {
    version: "2026.08.16 — Alertes SLA WhatsApp, Bilan RSE Certifié PDF & Health Score (Batch 41)",
    date: "2026-08-16",
    added: [
      "Moteur de rappels automatisés B2B (src/lib/b2b-reminders.functions.ts) avec déduplication stricte dans scheduled_notifications",
      "Escalade SLA automatique WhatsApp : alerte immédiate de l'astreinte technique pour les tickets B2B urgents en attente depuis plus de 2 heures",
      "Relances WhatsApp / Email préventives J-7 pour les maintenances d'équipements planifiées à échéance",
      "Générateur officiel de Bilan d'Impact Environnemental & RSE en PDF (src/lib/esg-pdf.ts) avec calcul des émissions CO2 évitées et des DEEE recyclés",
      "Bouton de téléchargement du Rapport RSE PDF certifié directement sur le portail facturation B2B (EsgMetricsCard)",
      "Indice de Santé Matériel (Health Score 0-100%) calculé dynamiquement sur chaque fiche et carte d'équipement (src/lib/health-score.ts)",
    ],
    fixed: [
      "Intégration transparente des tâches B2B dans le point d'entrée cron quotidien /api/cron-reminders",
      "Affichage visuel du score de durabilité et de santé sur l'inventaire matériel B2B",
    ],
  },
  {
    version: "2026.08.15 — Architecture Modulaire B2B & Sous-modules (Batch 40)",
    date: "2026-08-15",
    added: [
      "Modularisation complète de org.functions.ts (46 KB) en 6 sous-modules spécialisés sous src/lib/org/",
      "org-client.ts: client Supabase contextuel avec JWT utilisateur et guards assertOrgAccess / assertTicketAccess",
      "org-core.functions.ts: gestion du cycle de vie des organisations et attribution de rôles B2B",
      "org-equipment.functions.ts: inventaire matériel, QR codes et suivi des garanties constructeurs",
      "org-sites.functions.ts: gestion des agences régionales et rattachement des départements",
      "org-tickets.functions.ts: cycle de vie des tickets d'incidents SAV B2B et upload sécurisé de médias",
      "org-billing-maintenance.functions.ts: facturation mensuelle B2B et plannings de maintenance récurrente",
    ],
    fixed: [
      "Résolution de 100% des erreurs TypeScript strict (exactOptionalPropertyTypes)",
      "Barrel export src/lib/org/index.ts assurant une rétrocompatibilité totale des imports",
    ],
  },
  {
    version: "2026.08.15 — Réinitialisation Automatique Horaire de la Démo (Batch 39)",
    date: "2026-08-15",
    added: [
      "Purge et re-seed idempotent complet de l'environnement de démonstration (resetAndSeedDemoEnvironment)",
      "Route API /api/cron-demo-reset avec authentification sécurisée par jeton porteur à temps constant",
      "Workflow GitHub Actions .github/workflows/demo-reset.yml s'exécutant chaque heure (0 * * * *)",
      "Bouton interactif de réinitialisation instantanée sur la page /demo avec retour visuel par notification toast",
    ],
  },
  {
    version: "2026.08.14 — Modularisation des Routes B2B & Composants Partagés (Batch 38)",
    date: "2026-08-14",
    added: [
      "Extraction de 11 composants modulaires spécialisés pour les 5 routes B2B (equipment, maintenance, sites, billing, tickets)",
      "Composant partagé LoadingState avec indicateur accessible et texte personnalisable",
      "Composant partagé EmptyState avec icône contextuelle, message et bouton d'action CTA",
      "Hook personnalisé usePersistedState pour la synchronisation localStorage sécurisée côté SSR",
    ],
    changed: ["Allègement de plus de 50% du volume de code des routes TanStack Router"],
  },
  {
    version: "2026.08.14 — Sécurité XSS, Sanitisation d'Erreurs & DB Migration (Batch 37)",
    date: "2026-08-14",
    added: [
      "Désinfection HTML stricte par liste blanche autorisée dans content.functions.ts contre les attaques XSS",
      "Parseur d'erreurs centralisé error-parser.ts masquant les détails d'implémentation PostgreSQL",
      "Schémas Zod stricts pour toutes les entités du domaine B2B (org-schemas.ts)",
      "Migration SQL: soft-delete (deleted_at), index GIN pg_trgm pour recherche ultra-rapide et triggers d'audit automatiques sur payments et inventory_parts",
    ],
  },
  {
    version: "2026.08.11 — Fix CI/CD",
    date: "2026-08-11",
    fixed: [
      "CI: pin Node 20 + ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION pour wrangler deploy",
      "bun.lock régénéré avec zustand pour Cloudflare build",
    ],
  },
  {
    version: "2026.08.11 — Batch 36",
    date: "2026-08-11",
    added: [
      "Search analytics: enregistrement des requêtes de recherche dans Supabase",
      "Skeleton loading: composants de chargement pour les pages boutique",
      "Mobile filter drawer: touche Escape + focus trap (accessibilité)",
      "Zoom image produit: zoom x2 au survol, overlay plein écran, Escape pour fermer",
      "Breadcrumbs sur toutes les pages: composant PageBreadcrumb réutilisable",
      "Cookie consent banner: bannière RGPD avec Accepter/Refuser, localStorage",
    ],
  },
  {
    version: "2026.08.11 — Breadcrumbs consistency",
    date: "2026-08-11",
    changed: [
      "Toutes les pages utilisent maintenant le même pattern de breadcrumb: eyebrow à gauche, breadcrumb à droite dans un flex container",
    ],
  },
  {
    version: "2026.08.11 — Batch 35",
    date: "2026-08-11",
    added: [
      "Newsletter signup: formulaire inscription footer avec validation email + table Supabase",
      "Comparateur accessoires: bouton Comparer, barre flottante max 3 produits, page /boutique/comparer",
      "Filtres boutique persistés URL: catégorie, prix, disponibilité, tri et recherche sauvegardés dans l'URL",
    ],
  },
  {
    version: "2026.08.11 — Boutique polish",
    date: "2026-08-11",
    changed: [
      "Breadcrumb boutique: même ligne que l'eyebrow, aligné à droite avec bord fine arrondie",
    ],
  },
  {
    version: "2026.08.10 — Batch 34",
    date: "2026-08-10",
    added: [
      "Breadcrumbs boutique: navigation sur page index et page produit (Accueil > Boutique > Produit)",
      "Récemment consultés produit: 5 derniers produits consultés affichés sur la fiche produit",
      "Escape QuickView: modale aperçu rapide fermable avec Escape (accessibilité clavier)",
    ],
  },
  {
    version: "2026.08.10 — Batch 33",
    date: "2026-08-10",
    added: [
      "Bouton retour en haut (BackToTop): apareît après 400px de scroll",
      " prefers-reduced-motion: animations désactivées pour les utilisateurs sensibles",
      "Corrections accessibilité: ARIA labels, focus management, skip-to-content",
    ],
  },
  {
    version: "2026.08.10 — Batch 32",
    date: "2026-08-10",
    added: [
      "Funnel de conversion: analytics du parcours client (Diagnostic → RDV → Paiement)",
      "PWA Update Prompt: bannière de mise à jour automatique du service worker",
      "Indicateur offline: badge discret quand la connexion est perdue",
    ],
  },
  {
    version: "2026.08.10 — Batch 31",
    date: "2026-08-10",
    added: [
      "Service Worker v3: strategies de cache optimisées pour le offline",
      "Scanner QR/barcode: lecture de codes-barres pour identifier les appareils",
      "Signatures numériques: capture de signature sur tablette pour les réparations",
    ],
  },
  {
    version: "2026.08.10 — Batch 30",
    date: "2026-08-10",
    added: [
      "Flux iCal: export des rendez-vous au format iCal pour Google Calendar",
      "Webhooks sortants: notifications webhook pour les événements importants",
      "Intégration Google Calendar: synchronisation des créneaux disponibles",
    ],
  },
  {
    version: "2026.08.10 — Batch 29",
    date: "2026-08-10",
    added: [
      "Campagnes marketing: création et gestion de campagnes email/SMS",
      "Segmentation RFM: classification des clients par Récence, Fréquence, Montant",
      "Analytics marketing: suivi des taux d'ouverture et de clic",
    ],
  },
  {
    version: "2026.08.10 — Batch 28",
    date: "2026-08-10",
    added: [
      "Transferts multi-atelier: transfert de dossiers entre ateliers",
      "Charge atelier: visualisation de la charge de travail par atelier",
      "Gestion des priorités: files d'attente prioritaires par atelier",
    ],
  },
  {
    version: "2026.08.10 — Batch 27",
    date: "2026-08-10",
    added: [
      "Avis produits: système de notation et d'avis pour les accessoires boutique",
      "Liste de souhaits: ajout/suppression d'accessoires en favoris",
      "QuickView: aperçu rapide des produits sans quitter la page boutique",
      "Badges stock: affichage du statut de stock (en stock, stock limité, sur commande)",
    ],
  },
  {
    version: "2026.08.10 — Batch 26",
    date: "2026-08-10",
    added: [
      "Historique appareils: suivi de tous les appareils réparés par client",
      "Export Excel: export des données en format Excel (.xlsx)",
      "KPIs avancés: indicateurs de performance en temps réel",
    ],
  },
  {
    version: "2026.08.10 — Batch 25",
    date: "2026-08-10",
    added: [
      "Devis instantané: estimation en ligne avec calcul automatique des prix",
      "Garantie étendue: options 6/12 mois avec tarification",
      "Promotions étudiant/enseignant: réductions spéciales",
    ],
  },
  {
    version: "2026.08.10 — Batch 24",
    date: "2026-08-10",
    added: [
      "Checkout wizard: processus de commande en 3 étapes",
      "Panier amélioré: mise à jour quantitative, suppression, résumé",
      "Mobile Money: intégration paiement par téléphone",
    ],
  },
  {
    version: "2026.08.10 — Batch 23",
    date: "2026-08-10",
    added: [
      "Checkout wizard: processus de commande en 3 étapes",
      "Paiement intégré: Flutterwave + Mobile Money",
      "Résumé commande: récapitulatif avant confirmation",
    ],
  },
  {
    version: "2026.08.09",
    date: "2026-08-09",
    added: [
      "Password reset flow (forgot → email → update)",
      "Auth page fully translated FR/EN (27 keys)",
      "404 page + ErrorComponent translated FR/EN",
      "Admin refactor: 5131 → 872 lines (-83%), 14 tab components extracted",
      "Refund flow: server functions + admin tab with confirmation dialog",
      "Push notifications server: /api/push-subscribe endpoint + VAPID dispatch",
      "Audit log: audit_log table, logAudit/getAuditLogs functions",
      "Webhook retry: exponential backoff for payment webhooks",
      "Blog i18n: BilingualPost exported, FR/EN translations",
    ],
    fixed: [
      "mon-compte: hooks reordered (useServerFn before useQuery), unused imports removed",
      "webhook-retry: unused WebhookAttempt interface and retryQueue removed",
      'vite.config.ts: process.env["ANALYZE"] bracket notation (TS4111)',
      "audit.ts: entity_id accepts string | null (exactOptionalPropertyTypes)",
      "admin.tsx: AuditSection uses useI18n() for translations",
      "Type safety: 15+ as never/as any casts removed",
    ],
  },
  {
    version: "2026.08.08",
    date: "2026-08-08",
    added: [
      "17 database performance indexes",
      "AuthErrorHandler: session expiry detection with toast + redirect",
      "KV rate limiting documentation (Cloudflare Workers)",
      "Deposit payment (50% acompte) for reservations",
      "Extended warranty (12 months, +15% of price)",
      "Usable loyalty points (100pts = 500 FCFA)",
      "Push notification toggle (client-side)",
      "CI/CD: GitHub Actions (lint + test + build + deploy + backup)",
      "Cloudflare monitoring (trackMetric + MetricsPanel)",
      "Supabase backup script + weekly workflow",
      "ErrorBoundary component + errorComponent on routes",
      "Lazy loading StatsDashboard (React.lazy + Suspense)",
      "Accessibility: aria-labels Footer, skip-to-content",
      "6 E2E test files (suivi, reservation, mon-compte, admin)",
      "Dynamic sitemap (/api/sitemap)",
      "Structured logging (createLogger)",
      "Image optimization (lazy + async)",
      "Plausible Analytics",
      "Offline mode (SW v2 + offline.html + OfflineIndicator)",
      "API docs (/api/docs)",
    ],
  },
  {
    version: "2026.08.07",
    date: "2026-08-07",
    added: [
      "Mon-compte tabs: Loyalty, Referral, Reviews, Profile (6 tabs total)",
      "Server functions: listCustomerReviews, listCustomerPayments, getLoyaltySummary",
      "i18n segment mon-compte: 6 tabs FR/EN",
      "Payment history export CSV + low stock alerts",
    ],
  },
  {
    version: "2026.08.06",
    date: "2026-08-06",
    added: [
      "FedaPay/KKiaPay payment providers (2 additional Mobile Money)",
      "WhatsApp auto-reminders: confirmation, status change, rescheduling",
      "Verified customer reviews: moderation system (publish/hide)",
      "Workshop kanban: drag-and-drop board for repair statuses",
      "Advanced KPIs: revenue, conversion, average duration per stage",
      "Structured data SEO: Schema.org LocalBusiness",
    ],
  },
  {
    version: "2026.08.05",
    date: "2026-08-05",
    added: [
      "Neighborhood pages: index + slug pages for each Abomey-Calavi neighborhood",
      "Online quote payment: Flutterwave for approved quotes",
      "Returns management: tracking of part/repair returns",
      "Admin catalog: CRUD brands, categories, devices, faults, photos",
      "Local SEO: neighborhood pages, Google Maps, business hours",
    ],
  },
  {
    version: "2026.08.04",
    date: "2026-08-04",
    added: [
      "Consoles and games: PS4, PS5, Xbox, Switch in catalog",
      "Repair guides: maintenance and troubleshooting articles",
      "Warranty claims: ticket system with statuses",
      "Commitments page: service promises",
      "Refurbished devices: refurbished device catalog",
    ],
  },
  {
    version: "2026.08.03",
    date: "2026-08-03",
    added: [
      "Quote workflow: complete devis → approval → payment",
      "Tracking photos: upload per stage (diagnosis, parts, repair)",
      "Extended warranty: 6/12 month options with pricing",
      "Student/teacher promo: special discounts",
      "Complementary services: backup, data recovery",
      "Store locations: workshop location pages",
    ],
  },
  {
    version: "2026.08.02",
    date: "2026-08-02",
    added: [
      "Online payment: Flutterwave (MTN MoMo, Moov Money, Celtiis)",
      "Loyalty program: points, tiers (Bronze/Silver/Gold), referrals",
      "Home delivery: status tracking (scheduled → in transit → delivered)",
      "Admin statistics: Recharts interactive charts",
      "SEO: meta tags, Open Graph, Twitter Cards, sitemap",
      "PWA: manifest, service worker, installable",
      "E2E tests: Playwright for main flows",
    ],
  },
  {
    version: "2026.08.01",
    date: "2026-08-01",
    added: [
      "Security: secret tracking code, 2FA server, private uploads, rate limiting",
      "Extended catalog: Samsung 263, HP 350, Apple 142, appliances",
      "Admin staff: role management, leads, tests",
      "i18n: bilingual routing /fr /en across entire site",
      "Bundle perf: DEVICES extracted from initial bundle, security headers",
      "Monitoring: /api/healthz endpoint",
      "Env conventions: .env.example documented",
    ],
  },
  {
    version: "2026.07.31",
    date: "2026-07-31",
    added: [
      "Migration Lovable → Cloudflare Workers: standalone build, wrangler, custom domain",
      "Supabase config: new project, .env excluded from git, sb_publishable_/sb_secret_ keys",
      "References: adaptive padding AT-YYYY-XXXX beyond 9999",
      "Fault factory: centralized in types.ts, removed 16 helper copies",
      "Quick wins: quote by name, aligned hours, absolute canonicals/OG, dead code removed",
    ],
  },
  {
    version: "2026.07.30",
    date: "2026-07-30",
    added: [
      "9-step reservation: type → brand → series → family → model → faults → slot → photos → contact",
      "Rescheduling: modify slot after booking",
      "Global search: cmdk + SearchModal with autocomplete",
      "Catalog: pages per brand with detailed device sheets",
    ],
  },
  {
    version: "2026.07.29",
    date: "2026-07-29",
    added: [
      "Admin dashboard: status management screen",
      "Tracking: repair status page by reference number",
      "Accessories shop: catalog with cart",
      "Design system: base UI components (shadcn/ui)",
      "Brand pages: SEO pages per brand",
    ],
  },
  {
    version: "2026.07.28",
    date: "2026-07-28",
    added: [
      "Initial project: TanStack Start template",
      "Base pages: home, repairs, contact, pricing",
      "Online booking: diagnostic wizard",
      "Admin: initial management screen",
      "Tracking: repair status tracker",
    ],
  },
];

function ChangelogPage() {
  const { t } = useI18n();

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="at-eyebrow">{t("changelog.eyebrow")}</span>
            <PageBreadcrumb items={[{ label: t("nav.changelog") }]} />
          </div>
          <h1 className="at-display text-4xl md:text-6xl">{t("changelog.title")}</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">{t("changelog.subtitle")}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-12">
              {ENTRIES.map((entry, idx) => (
                <article key={entry.version} className="relative pl-10">
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-1 flex items-center">
                    <span className="relative flex size-6 items-center justify-center">
                      <span
                        className={`absolute inline-flex size-full animate-ping opacity-20 ${
                          idx === 0 ? "bg-primary" : "bg-muted-foreground"
                        }`}
                      />
                      <span
                        className={`relative inline-flex size-3 ${
                          idx === 0 ? "bg-primary" : "bg-muted-foreground/50"
                        }`}
                      />
                    </span>
                  </div>

                  <div className="flex flex-wrap items-baseline gap-3">
                    <h2 className="text-2xl font-bold tracking-tight">{entry.version}</h2>
                    <time dateTime={entry.date} className="font-mono text-xs text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString("fr-BJ", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </time>
                  </div>

                  <div className="mt-6 space-y-6">
                    {entry.added && entry.added.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-success">
                          {t("changelog.added")}
                        </h3>
                        <ul className="space-y-1">
                          {entry.added.map((item) => (
                            <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                              <span className="mt-1.5 size-1.5 shrink-0 bg-success" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {entry.changed && entry.changed.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
                          {t("changelog.changed")}
                        </h3>
                        <ul className="space-y-1">
                          {entry.changed.map((item) => (
                            <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                              <span className="mt-1.5 size-1.5 shrink-0 bg-primary" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {entry.fixed && entry.fixed.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-500">
                          {t("changelog.fixed")}
                        </h3>
                        <ul className="space-y-1">
                          {entry.fixed.map((item) => (
                            <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                              <span className="mt-1.5 size-1.5 shrink-0 bg-amber-500" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {entry.removed && entry.removed.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-destructive">
                          {t("changelog.removed")}
                        </h3>
                        <ul className="space-y-1">
                          {entry.removed.map((item) => (
                            <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                              <span className="mt-1.5 size-1.5 shrink-0 bg-destructive" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
