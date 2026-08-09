# Changelog

Toutes les modifications notables d'Allô Techno, du premier commit au plus récent.

Ce fichier suit les principes de [Keep a Changelog](https://keepachangelog.com/).
Le numéro de version suit le format `YYYY.MM.DD` basé sur la date de la release.

---

## [2026.08.09] — 2026-08-09

### Added

- **Multi-ateliers** : table `workshops`, `workshops.functions.ts`, `AdminWorkshops.tsx` — CRUD ateliers avec adresse, ville, téléphone, timezone.
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
