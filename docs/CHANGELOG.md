# Changelog

Toutes les modifications notables d'Allô Techno, du premier commit au plus récent.

Ce fichier suit les principes de [Keep a Changelog](https://keepachangelog.com/).
Le numéro de version suit le format `YYYY.MM.DD` basé sur la date de la release.

---

## [2026.08.11] — 2026-08-11 (Batch 35)

### Added

- **Newsletter signup** : formulaire d'inscription newsletter dans le footer, avec validation email et toast de confirmation. Table `newsletter_subscribers` créée en migration.
- **Comparateur accessoires** : bouton "Comparer" sur chaque produit, barre flottante avec max 3 produits, page `/boutique/comparer` avec tableau de comparaison (prix, stock, grade, stockage, garantie).
- **Filtres boutique persistés URL** : catégorie, prix, disponibilité, tri et recherche sont sauvegardés dans les paramètres d'URL — liens partageables, navigation retour/restauration automatique.

### Changed

- **Boutique filtres → URL** : les filtres boutique sync dans l'URL (`?category=...&sort=...&inStock=1`), rendant les vues partageables et le back/forward natif fonctionnel.

---

## [2026.08.11] — 2026-08-11 (Boutique polish)

### Changed

- **Breadcrumb boutique** : déplacé sur la même ligne que l'eyebrow, aligné à droite avec `justify-between`. Breadcrumb avec bord fine arrondie (`rounded-sm border border-border`).

---

## [2026.08.10] — 2026-08-10 (Batch 34)

### Added

- **Breadcrumbs boutique** : navigation breadcrumb sur la page index boutique et la page produit (Accueil > Boutique > Produit), utilise le composant `Breadcrumb` shadcn/ui existant.
- **Récemment consultés produit** : la page détail produit affiche maintenant les 5 derniers produits consultés (section déjà trackée mais non affichée).
- **Escape QuickView** : la modale aperçu rapide se ferme avec la touche Escape (accessibilité clavier).

### Changed

- **Breadcrumbs activés** : le composant `Breadcrumb` shadcn/ui (défini mais jamais importé) est maintenant utilisé sur les pages boutique.

---

## [2026.08.10] — 2026-08-10 (Batch 33)

### Added

- **Back-to-top** : bouton flottant "Retour en haut de page" — apparaît après 400px de scroll, smooth scroll, aria-label accessible.
- **prefers-reduced-motion** : CSS global — désactive toutes les animations (`animate-pulse`, `animate-spin`, transitions, Sheet/Dialog animations) pour les utilisateurs qui le demandent.

### Fixed

- **ARIA labels** : 3 breadcrumb `<nav>` (appareil, quartiers, réparations) + 2 nav utility (Header) + input recherche boutique + select tri boutique — tous labellisés.
- **Lazy loading** : photos de profil Google Reviews avec `loading="lazy"`.

---

## [2026.08.10] — 2026-08-10 (Batch 32)

### Added

- **Analytics avancées** : onglet "Funnel" dans l'admin avec funnel de conversion (estimations → réservations → terminées), graphique barres sources d'acquisition (10 sources top), erreurs récentes 24h avec compteur. Server functions `getConversionFunnel`, `getSourceStats`, `getRecentErrors`.
- **PWA Update Prompt** : composant `PwaUpdatePrompt` détecte l'installation d'un nouveau service worker et propose un bouton "Actualiser" pour appliquer la mise à jour (skipWaiting + reload).
- **Offline Indicator amélioré** : affiche l'état du cache localStorage, le dernier timestamp de sync, et des icônes contextualisées (amber theme pour offline).
- **i18n** : 10 clés `suivi.pwa.*` FR/EN pour les indicateurs PWA.

### Changed

- **Admin enrichi** : 28 onglets dont "Funnel" (analytics avancées).

---

## [2026.08.10] — 2026-08-10 (Batch 31)

### Added

- **Service Worker v3** : stratégies de cache avancées — stale-while-revalidate pour API publiques (suivi, catalogue), background sync pour soumissions hors-ligne via IndexedDB queue, cache séparé static/API/pages, cleanup des anciens caches.
- **Scanner QR/Barcode** : composant `QrScanner` (html5-qrcode) — scan par caméra device, mode environment, détection QR + barcodes, gestion erreurs caméra (refusée, absente), overlay modal.
- **Signature numérique** : composant `SignatureCapture` (signature_pad) — canvas haute résolution (devicePixelRatio), signature doigt/stylet, effacer/valider, export PNG data URL. Table `handoff_signatures` + RPCs `saveHandoffSignature`, `getHandoffSignature`, `has_handoff_signature`.
- **Migration** : table `handoff_signatures` avec RLS + index + RPC vérification.
- **i18n** : 16 clés `suivi.scan.*` + `suivi.signature.*` + `suivi.handoff.*` FR/EN.

### Changed

- **PWA** : service worker passé de v2 à v3 avec stratégies de cache différenciées et support background sync.

---

## [2026.08.10] — 2026-08-10 (Batch 30)

### Added

- **iCal feed** : route `/api/ical` génère un fichier `.ics` des réservations actives — importable dans Google Calendar, Outlook, Apple Calendar. Inclut fuseau horaire Africa/Porto-Novo, statut et détails dossier.
- **Webhooks sortants** : système complet d'outbound webhooks — tables `outbound_webhooks` + `webhook_logs`, 7 événements disponibles (reservation.created, reservation.status_changed, reservation.completed, payment.received, payment.failed, lead.new, review.submitted), signature HMAC SHA-256 optionnelle, logs avec status code + durée.
- **Onglet Webhooks (admin)** : CRUD webhooks avec sélection d'événements, activation/désactivation, logs détaillés par webhook avec historique des 50 derniers appels.
- **Ajout au calendrier** : bouton "Ajouter au calendrier" sur la page de suivi — génère un lien Google Calendar avec date, heure, référence et appareil.
- **Migration** : tables `outbound_webhooks` + `webhook_logs` + RLS.

### Changed

- **Admin enrichi** : 27 onglets dont Webhooks avec gestion complète et logs.

---

## [2026.08.10] — 2026-08-10 (Batch 29)

### Added

- **Campagnes marketing** : CRUD complet (create, update, delete, send), types email/SMS/WhatsApp, statuts (draft/sending/sent/failed), tracking envois individuels. Table `marketing_campaigns` + `campaign_sends`.
- **Templates prédéfinis** : 5 templates (Bienvenue, Réactivation, Promotion, Demander un avis, Rappel maintenance) avec variables dynamiques ({name}, {device}, {company}, {code}, etc.).
- **Segmentation RFM** : analyse Récence/Fréquence/Montant de tous les clients, 5 segments (VIP, Loyal, Actif, Nouveau, Inactif). RPCs `get_client_segments` + `get_segment_counts`.
- **Onglet Marketing** : dans l'admin, onglet "Marketing" avec vue campagnes, formulaire création avec template, segment filter, vue clients RFM avec tableau.
- **Migration** : tables `marketing_campaigns` + `campaign_sends` + 2 RPCs RFM + RLS.
- **i18n** : 16 clés `admin.marketing.*` FR/EN.

### Changed

- **Admin enrichi** : 26 onglets dont Marketing avec segmentation et campagnes.

---

## [2026.08.10] — 2026-08-10 (Batch 28)

### Added

- **Transfert d'atelier** : bouton "Transférer…" sur chaque carte du kanban, sélection du workshop cible, RPC `transfer_reservation` côté serveur avec historique dans `status_history`.
- **Filtre atelier** : dropdown "Tous les ateliers" dans le header du kanban, filtrage des cartes par workshop, cards cliquables pour filtrer/défiltrer.
- **Charge de travail** : panel de 4 cards au-dessus du kanban (actifs, en cours, en attente) par atelier, RPC `get_workshop_load` + `WorkshopLoad` type.
- **Migration** : colonne `workshop_id` sur `reservations` + index + 2 RPCs (`transfer_reservation`, `get_workshop_load`).
- **i18n** : 7 clés `admin.atelier.*` FR/EN.

### Changed

- **Atelier kanban enrichi** : filtre par workshop, transfert inter-ateliers, charge de travail visible, real-time refresh inclut les transferts.
- **AtelierCard enrichie** : dropdown transfert vers autres ateliers actifs.

---

## [2026.08.10] — 2026-08-10 (Batch 27)

### Added

- **Avis produits** : notes 1-5 étoiles + texte sur chaque accessoire. Composant `StarRating` (interactive + lecture seule), `ProductReviewsSection` sur fiche produit, formulaire de soumission, table `product_reviews` + RPC `get_product_reviews` / `get_product_rating`. 12 clés i18n `boutique.review.*` FR/EN.
- **Liste de souhaits** : `WishlistProvider` + `useWishlist` (localStorage), bouton coeur sur chaque produit (liste + fiche), toggle avec toast. 4 clés i18n `boutique.wishlist.*`.
- **Récemment consultés** : `useRecentlyViewed` (localStorage, 5 derniers), section sur page boutique + tracking automatique sur fiche produit. 1 clé i18n.
- **Badges stock visuels** : pastilles verte (stock > 5), ambre avec animation pulse (stock ≤ 5), grise (sur commande) sur liste et fiche produit.
- **Aperçu rapide** : modal `QuickView` depuis la liste boutique (image, prix, stock, ajout panier). 1 clé i18n.
- **Estimation livraison** : délai 24-72h selon zone sur fiche produit. 1 clé i18n.
- **Partage produit** : boutons WhatsApp + copier lien sur fiche produit. 2 clés i18n.
- **Badges confiance** : grille 3 colonnes (paiement sécurisé, retour 14j, stock vérifié) sur fiche produit. 3 clés i18n.

### Changed

- **Boutique enrichie** : liste avec WishlistProvider, QuickView, badges stock colorés, section récemment consultés.
- **Fiche produit enrichie** : badges stock, estimation livraison, partage, badges confiance, avis produits, tracking récemment consultés.
- **Root layout** : `WishlistProvider` ajouté au provider tree global.

### Migration

- `supabase/migrations/20260810120000_batch27_product_reviews.sql` : table `product_reviews` + RPCs + RLS.

---

## [2026.08.10] — 2026-08-10 (Batch 26)

### Added

- **Page historique appareils** : `/historique` — page publique permettant de rechercher l'historique de réparation par téléphone ou email, avec stats (réparations totales, terminées, taux complétion), résultats cliquables vers le suivi. 21 clés i18n `historique.*` FR/EN.
- **Export Excel dashboard** : `exportDashboardXlsx` — exporte réservations, paiements et leads en 3 onglets Excel (package `xlsx`), bouton "Exporter Excel" dans `StatsDashboard`.
- **Tendances hebdomadaires** : `AreaChart` 8 semaines + indicateurs de tendance (TrendingUp/TrendingDown + %) dans les KPIs dashboard.
- **KPIs configurables** : sélection des 4 KPIs visibles via `localStorage` (`admin.dashboard.kpis`), panneau de configuration avec 8 métriques disponibles.
- **SMS fallback reminders** : `sendBoth` tente WhatsApp d'abord, puis bascule sur SMS (`sendSimpleSms`) si WhatsApp échoue.

### Changed

- **Dashboard stats enrichi** : AreaChart remplace les stats simples, tendances avec flèches colorées, panneau de configuration KPI.
- **Export multi-format** : CSV (existants) + Excel (nouveau) pour les données du dashboard.

### Fixed

- **TypeScript error** : `sendReservationSms` remplacé par `sendSimpleSms` dans les reminders (correction signature).
- **Unused import** : `useMemo` supprimé de `historique.tsx`.

---

## [2026.08.09] — 2026-08-09 (Batch 25)

### Added

- **Comparateur devis public** : `DevisComparison.tsx` intégré à la page `/devis`. Bouton "Comparer" sur chaque estimation, grille de comparaison côte à côte (prix, délai, garantie, pièces), toggle "Afficher/masquer les différences", suppression individuelle. 12 clés i18n `devis.compare.*` FR/EN enregistrées.
- **Onglet "Mes devis"** : dans `mon-compte.tsx`, nouvel onglet listant tous les devis reçus (montant, garantie, statut coloré, date), avec bouton de paiement si devis approuvé. 12 clés i18n `mc.devis.*` FR/EN.

### Changed

- **Devis page enrichie** : estimation instantanée + bouton "Comparer" pour ajouter à la comparaison multi-devis.
- **Mon-compte enrichi** : 7 onglets (dossiers, devis, fidélité, parrainer, avis, paiements, profil).

---

## [2026.08.09] — 2026-08-09 (Batch 24)

### Added

- **Tendances hebdomadaires** : AreaChart Recharts (8 dernières semaines) dans le dashboard stats, avec dégradé rempli et tooltips FCFA.
- **Indicateurs de tendance** : KPI cards avec flèches TrendingUp/TrendingDown + pourcentage de variation vs mois précédent (réparations, revenus).
- **KPI configurables** : boutons toggle pour afficher/masquer chaque KPI (repairs, boutique, repair revenue, boutique revenue), persisté dans localStorage.
- **Export Excel** : `exportDashboardXlsx` serveur — génère un fichier `.xlsx` avec 3 onglets (Réservations, Paiements, Leads). Bouton "Export Excel" dans le header du dashboard.

### Changed

- **Dashboard stats enrichi** : ajout d'un AreaChart hebdomadaire à côté du LineChart mensuel, section KPI avec toggles, header avec bouton export.

---

## [2026.08.09] — 2026-08-09 (Batch 23)

### Added

- **Commentaires suivi enrichi** : `/$locale/suivi` — section commentaires client après timeline + photos. Les clients peuvent laisser des messages (nom + texte) sur leur dossier de réparation, avec auto-refresh 30s et validation côté serveur. Table `reservation_comments` + RPC `get_reservation_comments` / `add_reservation_comment`.
- **Devis public** : `/$locale/devis` (existant) — page publique sans login, estimateur instantané marque→appareil→panne, demande de devis personnalisée.
- **Garantie client** : `/$locale/garantie` (existant) — page publique avec 3 niveaux de garantie (3/6/12 mois), liste couvert/non-couvert, étapes réclamation, FAQ.
- **i18n commentaires** : 9 clés FR/EN `suivi.comments.*` ajoutées.

### Changed

- **Batch 23 complet** : devis public, garantie client, suivi enrichi (timeline + photos + commentaires).

---

## [2026.08.09] — 2026-08-09

### Added

- **Page À propos** : `/$locale/about` — histoire, mission, valeurs (4), timeline chronologique, chiffres clés (5000+ réparations, 3500+ clients, 4.8/5, 6 mois garantie), localisation. i18n complet FR/EN via `segments/about.ts`.
- **Page Rejoindre l'équipe** : `/$locale/work-at` — pourquoi nous, avantages (4), postes ouverts (technicien, commercial, stagiaire, manager), processus de candidature (4 étapes), CTA contact. i18n complet FR/EN via `segments/work-at.ts`.
- **Header restructuré** : barre utilitaire — À propos, Rejoindre l'équipe, Entreprises (gauche) ; Blog, Contact (droite). Suppression de Suivi et Boutique de la barre supérieure. Mobile nav mise à jour.
- **Footer restructuré** : grille 6 colonnes — Marque+Contact (col-span-2), Réparations & Devis (7 liens), Services & Accessoires (8 liens), Entreprises & Info (8 liens), Localisation (5 liens). Toutes les 33 pages ont un lien dans le footer.
- **Filtres boutique reconditionnés** : `ShopFilterSidebar` intégré à `reconditionnes.tsx` avec filtres prix et disponibilité, drawer mobile.
- **Fix guide/blog** : loaders `listBlogPosts` wrappés en try/catch avec fallback sur données statiques POSTS — plus de crash si Supabase non configuré.
- **Widget panier animé** : `AddToCartWidget.tsx` — toast flottant en bas à droite avec animation slide-in, auto-masquage 4s.
- **Sidebar filtres shop** : `ShopFilterSidebar.tsx` — catégorie, fourchettes de prix, disponibilité, livraison gratuite. Intégré à boutique et reconditionnés.
- **Timeline dots changelog** : `changelog.tsx` — ligne verticale avec dots animés pour chaque entrée.
- **Icônes SVG marques** : `brand-icons.ts` + `BrandLogo.tsx` — 27 marques avec logos vectoriels inline.
- **Moteur de recherche amélioré** : Levenshtein, fuzzy matching, scoring par pertinence, historique des recherches.
- **Baisse des prix de 60%** : tarifs réparations (pannes) uniquement. Services/accessoires/frais inchangés.
- **Multi-ateliers** : table `workshops`, CRUD admin.
- **Gestion fournisseurs** : tables `suppliers` + `supplier_orders`.
- **Programme de parrainage** : table `referrals`, stats, niveaux Bronze/Argent/Or.
- **Chat client-staff** : table `chat_messages`, messagerie temps réel.
- **Rapports avancés** : génération PDF avec jsPDF + QR code.
- **API publique REST** : endpoints `/api/v1/*` avec auth par API key.
- **Inventaire pièces** : tables `inventory_parts` + `stock_movements`, alertes stock bas.
- **SLA tracking** : alertes retard, stats temps moyen/P90.
- **Satisfaction client** : NPS (0-10), note 1-5 étoiles.
- **Notifications internes** : centre de notifications staff.
- **Historique device** : recherche par téléphone/email/appareil.
- **DB migration** : 10 tables supplémentaires.
- **Gestion fournisseurs** : tables `suppliers` + `supplier_orders`, `suppliers.functions.ts`, `AdminSuppliers.tsx` — ajout fournisseurs, suivi commandes pièces, statuts (pending→ordered→shipped→received).
- **Programme de parrainage** : table `referrals`, `referral-advanced.ts`, `AdminReferrals.tsx` — stats parrainage, niveaux Bronze/Argent/Or, historique entrées.
- **Chat client-staff** : table `chat_messages`, `chat.functions.ts`, `AdminChat.tsx` — messagerie temps réel entre client et atelier.
- **Rapports avancés** : `reports.functions.ts`, `AdminAdvancedReports.tsx`, `report-pdf.ts` — génération rapports (stats par jour/marque/statut), export PDF avec jsPDF + QR code.
- **API publique REST** : `api.v1.$.tsx` — endpoints `/api/v1/reservations`, `/api/v1/devices`, `/api/v1/brands`, `/api/v1/status` avec auth par API key (Bearer + query param).
- **Table API keys** : table `api_keys` avec rate limit, scopes, last_used_at.
- **Google Reviews widget** : `google-reviews.ts` + `GoogleReviewsWidget.tsx` — avis Google Places avec cache.
- **Comparateur devis** : `DevisComparison.tsx` — comparaison côte à côte de devis (prix, durée, garantie, pièces).
- **DB migration** : tables `workshops`, `suppliers`, `supplier_orders`, `chat_messages`, `referrals`, `saved_reports`, `google_reviews_cache`, `api_keys`. Feature flags defaults ajoutés.
- **Inventaire pièces** : tables `inventory_parts` + `stock_movements`, `inventory.functions.ts`, `AdminInventory.tsx` — CRUD pièces, alertes stock bas, mouvements entrée/sortie avec historique.
- **SLA tracking** : table `sla_configs`, `sla.ts`, `AdminSLA.tsx` — alertes retard par statut, stats temps moyen/P90 par transition, dossiers critiques.
- **Satisfaction client** : table `satisfaction_surveys`, `satisfaction.functions.ts`, `AdminSatisfaction.tsx` — enquête NPS (0-10), note 1-5 étoiles, distribution, promoteurs/détracteurs.
- **Notifications internes** : table `internal_notifications`, `internal-notifications.ts`, `AdminInternalNotifs.tsx` — centre de notifications staff avec marquer lu/tout lu.
- **Historique device** : `device-history.ts` — recherche par téléphone/email/appareil, stats taux complétion.
- **Garantie étendue** : table `extended_warranties`, `extended-warranty.ts` — upsell 6/12/24 mois (5000/10000/18000 FCFA), suivi statut actif/expiré/réclamé.
- **Rapports programmés** : table `scheduled_reports`, `scheduled-reports.ts` — planification email quotidien/hebdo/mensuel avec metrics configurables.
- **Escalade automatique** : tables `escalation_rules` + `escalation_events`, `escalation.ts` — détection SLA dépassé avec notification rôles et réaffectation auto.
- **Knowledge base** : table `kb_articles`, `knowledge-base.ts`, `AdminKnowledgeBase.tsx` — wiki interne techniciens (8 catégories, recherche full-text, compteur vues/helpful).
- **DB migration batch 22** : `inventory_parts`, `stock_movements`, `sla_configs`, `satisfaction_surveys`, `internal_notifications`, `extended_warranties`, `scheduled_reports`, `escalation_rules`, `escalation_events`, `kb_articles`. SLA/escalation defaults.

### Fixed

- **Footer navigation** : toutes les colonnes du footer utilisaient `to="/page"` sans préfixe locale, ce qui empêchait la navigation côté client. Correction vers `to="/$locale/page"` + `params={{ locale }}`.
- **Footer i18n** : ajout de `nav.changelog` FR/EN dans le dictionnaire.

### Changed

- **Services i18n** : migration complète du système bilingue `_fr/_en` vers le système i18n `t()`. 28 clés `services.*` ajoutées.
- **FAQ i18n** : catégories traduites via `CAT_I18N` mapping.
- **Contact i18n** : horaires traduits (Lundi—Vendredi, Samedi, Dimanche, Fermé).
- **Devis i18n** : "Estimation :" → `t("devis.estimateLabel")`.
- **Admin atelier** : vue calendrier ajoutée (toggle kanban/calendrier).
- **Notifications** : SMS intégré (Africa's Talking) pour statuts critiques (pret, livre, terminee).
- **Search avancée** : filtres marque/catégorie + tri (relevance, nom) dans `search-fulltext.ts`.
- **Admin rôles** : `AdminRoles.tsx` — UI d'assignation de rôles (admin/staff/technicien/user).
- **Live dashboard** : `LiveDashboard.tsx` — métriques temps réel (réparations actives, réservations, CA).
- **Facture PDF** : `invoice-pdf.ts` — facture finale avec QR code, détails, garantie.
- **Audit enrichi** : `AdminAuditEnriched.tsx` — filtres par action/entité, export CSV, pagination.
- **Performance monitoring** : `PerfMonitoring.tsx` — temps de réponse, taux d'erreur, uptime, requêtes/min.
- **Refund flow** : `initiateRefund` + `listRefundablePayments` serveur, onglet admin "Remboursements" avec confirmation et audit log.
- **Push notifications serveur** : endpoint `/api/push-subscribe` (POST/GET), migration `push_subscriptions` avec RLS, `sendPushNotification` avec chiffrement VAPID/AES-128-GCM.
- **Audit log** : table `audit_log`, fonctions `logAudit` / `getAuditLogs`, onglet admin "Journal d'audit".
- **Webhook retry** : logique de relance exponentielle pour les webhooks de paiement.
- **Blog i18n** : `BilingualPost` exporté, traductions blog en FR/EN.
- **i18n segments** : `auth.ts`, `notfound.ts` ajoutés au système de segments.

### Changed

- `admin.tsx` : import des 14 composants extraits au lieu de fonctions inline.
- `__root.tsx` : `NotFoundComponent` et `ErrorComponent` utilisent `t()`.
- `auth.tsx` : réécrit avec i18n complet + modes login/signup/forgot/reset-sent/update-password.

### Fixed

- `mon-compte.tsx` : hooks réordonnés (useServerFn avant useQuery), imports inutilisés supprimés.
- `webhook-retry.ts` : interface `WebhookAttempt` et `retryQueue` supprimés (inutilisés).
- `vite.config.ts` : `process.env["ANALYZE"]` en notation bracket (TS4111).
- `audit.ts` : `entity_id` accepte `string | null` (exactOptionalPropertyTypes).
- `blog.$slug.tsx` / `blog.index.tsx` : imports `BilingualPost` corrigés.
- `admin.tsx` : `AuditSection` utilise `useI18n()` pour les traductions.
- Type safety : suppression de 15+ `as never`/`as any` casts obsolètes.

---

## [2026.08.08] — 2026-08-08

### Added

- **Batch 9-11** : hardening complet.
  - 17 indexes de performance sur les tables Supabase.
  - `AuthErrorHandler` : détection d'expiration de session avec toast + redirection.
  - Documentation rate limiting KV (Cloudflare Workers).
  - Paiement d'acompte (50%) pour les réservations.
  - Garantie étendue (12 mois, +15% du prix).
  - Utilisation des points fidélité (100 pts = 500 FCFA).
  - Toggle notifications push (client-side).
  - CI/CD GitHub Actions (lint + test + build + deploy + backup).
  - Monitoring Cloudflare (`trackMetric` + `MetricsPanel`).
  - Script de backup Supabase + workflow hebdomadaire.

- **Batch 6-8** : qualité et infrastructure.
  - `ErrorBoundary` réutilisable + `errorComponent` sur les routes.
  - Lazy loading `StatsDashboard` (React.lazy + Suspense).
  - Accessibilité : aria-labels Footer, skip-to-content.
  - 6 fichiers E2E Playwright (suivi, réservation, mon-compte, admin).
  - Sitemap dynamique (`/api/sitemap`).
  - Logging structuré (`createLogger`).
  - Optimisation images (lazy + async).
  - Plausible Analytics.
  - Mode hors-ligne (SW v2 + `offline.html` + `OfflineIndicator`).
  - API docs (`/api/docs`).

- **Batch 3-5** : features utilisateur.
  - Historique des paiements client.
  - Suivi enrichi avec durée + notes par étape.
  - Filtres admin (statut/recherche/dates).
  - Recharts (LineChart + PieChart) pour les statistiques.
  - Soumission de devis par les leads.
  - Bannière PWA installable.
  - Rate limiting dashboard.
  - E2E tests (devis + navigation).

### Changed

- `StatsDashboard` : lazy-loaded, 4 onglets (Revenus, Clients, Appareils, Temps).
- `ReservationPayBlock` : toggle acompte/complet, réduction fidélité.

---

## [2026.08.07] — 2026-08-07

### Added

- **Onglets mon-compte** : Fidélité, Parrainage, Avis, Profil (6 onglets au total).
- **Fonctions serveur** : `listCustomerReviews`, `listCustomerPayments`, `getLoyaltySummary`.
- **i18n segment mon-compte** : 6 onglets FR/EN.
- **Export CSV paiements** et **alertes stock bas**.

### Changed

- `mon-compte.tsx` : architecture refactorisée avec onglets TanStack UI.

---

## [2026.08.06] — 2026-08-06

### Added

- **Paiements FedaPay/KKiaPay** : deux providers Mobile Money supplémentaires.
- **Rappels WhatsApp automatiques** : confirmation, changement de statut, reprogrammation.
- **Avis clients vérifiés** : système de modération (publier/masquer).
- **Kanban atelier** : tableau avec drag-and-drop pour les statuts de réparation.
- **KPIs avancés** : revenus, conversion, durée moyenne par étape.
- **Données structurées SEO** : Schema.org LocalBusiness.

### Changed

- Webhooks : vérification HMAC, idempotence, montant cohérent.

---

## [2026.08.05] — 2026-08-05

### Added

- **Pages quartiers** : index + pages slug pour chaque quartier d'Abomey-Calavi.
- **Paiement de devis en ligne** : Flutterwave pour les devis approuvés.
- **Gestion des retours** : suivi des retours de pièces/reparations.
- **Catalogue administrable** : CRUD marques, catégories, appareils, pannes, photos.
- **SEO local** : pages quartiers, Google Maps, horaires.

---

## [2026.08.04] — 2026-08-04

### Added

- **Consoles et jeux** : PS4, PS5, Xbox, Switch dans le catalogue.
- **Guides réparation** : articles de maintenance et dépannage.
- **Réclamation de garantie** : système de tickets avec statuts.
- **Engagements** : page de promesses service.
- **Reconditionnés** : catalogue d'appareils reconditionnés.

---

## [2026.08.03] — 2026-08-03

### Added

- **Devis à valider** : workflow complet devis → approbation → paiement.
- **Photos de suivi** : upload par étape (diagnostic, pièces, réparation).
- **Garantie étendue** : options 6/12 mois avec tarification.
- **Promo étudiants/enseignants** : réductions spéciales.
- **Services complémentaires** : backup, récupération de données.
- **Magasins** : pages de localisation des ateliers.

---

## [2026.08.02] — 2026-08-02

### Added

- **Paiement en ligne** : Flutterwave (MTN MoMo, Moov Money, Celtiis).
- **Programme de fidélité** : points, niveaux (Bronze/Argent/Or), parrainage.
- **Livraison à domicile** : suivi statut (à planifier → en route → livré).
- **Statistiques admin** : Recharts, graphiques interactifs.
- **SEO** : meta tags, Open Graph, Twitter Cards, sitemap.
- **PWA** : manifeste, service worker, installable.
- **Tests E2E** : Playwright pour les flux principaux.

---

## [2026.08-01] — 2026-08-01

### Added

- **Sécurité** : code de suivi secret, 2FA serveur, uploads prives, rate limiting.
- **Catalogue étendu** : Samsung 263, HP 350, Apple 142, electroménager.
- **Admin staff** : gestion des rôles, leads, tests.
- **i18n** : routage bilingue /fr /en sur tout le site.
- **Bundle perf** : DEVICES sorti du bundle initial, en-têtes sécurité.
- **Monitoring** : endpoint `/api/healthz`.
- **Conventions env** : `.env.example` documenté.

---

## [2026.07-31] — 2026-07-31

### Added

- **Migration Lovable → Cloudflare Workers** : build autonome, wrangler, custom domain.
- **Config Supabase** : nouveau projet, `.env` exclu de git, support clés `sb_publishable_`/`sb_secret_`.
- **References** : padding adaptatif AT-YYYY-XXXX au-delà de 9999.
- **Factory fault** : centralisée dans `types.ts`, suppression de 16 copies.
- **Quick wins** : devis par nom, horaires alignés, canonicals/OG absolus, code mort retiré.

---

## [2026.07-30] — 2026-07-30

### Added

- **Reservation 9 étapes** : type → marque → série → famille → modèle → pannes → créneau → photos → contact.
- **Reprogrammation** : modification de créneau après réservation.
- **Recherche globale** : cmdk + SearchModal avec autocomplétion.
- **Catalogue** : pages par marque avec fiches détaillées.

---

## [2026.07-29] — 2026-07-29

### Added

- **Admin écran** : tableau de bord avec gestion des statuts.
- **Suivi** : page de suivi par numéro de référence.
- **Boutique d'accessoires** : catalogue avec panier.
- **Design system** : composants UI de base (shadcn/ui).
- **Brand pages** : pages SEO par marque.

---

## [2026.07-28] — 2026-07-28

### Added

- **Projet initial** : template TanStack Start.
- **Pages de base** : accueil, réparations, contact, tarifs.
- **Réservation en ligne** : assistant de diagnostic.
- **Admin** : écran de gestion initial.
- **Suivi** : tracker de statut de réparation.

---

## Statistiques du projet

| Métrique                 | Valeur                            |
| ------------------------ | --------------------------------- |
| Commits totaux           | 164                               |
| Fichiers sources (src/)  | ~200                              |
| Composants React         | ~150                              |
| Fonctions serveur        | ~60                               |
| Routes TanStack Router   | ~50                               |
| Migrations Supabase      | 40                                |
| Tests unitaires (Vitest) | 92 passent                        |
| Tests E2E (Playwright)   | 10 fichiers spec                  |
| Pages i18n (FR/EN)       | 27 segments                       |
| Providers de paiement    | 3 (Flutterwave, FedaPay, KKiaPay) |
| Onglets admin            | 15                                |
| Onglets mon-compte       | 6                                 |

---

## Stack technique

| Couche          | Technologie                                |
| --------------- | ------------------------------------------ |
| Framework       | TanStack Start (React 19 SSR)              |
| Routing         | TanStack Router (file-based)               |
| State           | TanStack Query                             |
| Build           | Vite 8                                     |
| CSS             | Tailwind CSS v4                            |
| UI              | shadcn/ui + Radix UI (22 primitives)       |
| Base de données | Supabase (PostgreSQL, Auth, Realtime, RLS) |
| Validation      | react-hook-form + Zod                      |
| Déploiement     | Cloudflare Workers (Wrangler)              |
| Monitoring      | Plausible Analytics, `/api/healthz`        |
| Tests           | Vitest (unit) + Playwright (E2E)           |
| CI/CD           | GitHub Actions                             |
| Notifications   | Resend (email) + WhatsApp Cloud API        |
| Paiements       | Flutterwave, FedaPay, KKiaPay              |
| PDF             | jsPDF + jspdf-autotable                    |
| QR Codes        | qrcode                                     |
| Animation       | Motion (ex-Framer Motion)                  |
| Charts          | Recharts                                   |
