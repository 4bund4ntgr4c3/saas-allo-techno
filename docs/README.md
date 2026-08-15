# Allô Techno

Site web d'Allô Techno, entreprise spécialisée dans la réparation de smartphones, tablettes, ordinateurs, MacBook, iMac, consoles de jeux, montres connectées et autres appareils électroniques, située à Abomey-Calavi (Bénin).

**Version** : 2026.08.15-b42 — [Changelog](./CHANGELOG.md)

## Audit & Durcissement Sécurité (Batch 42)

- **RLS durcie (migration `20260823000000_security_rls_hardening.sql`)** : fermeture des accès anonymes — RLS sur `chat_messages`/`referrals`/`saved_reports`/`google_reviews_cache`, policies staff-only sur marketing/webhooks (dont la colonne `secret`), `get_client_segments()`/`get_segment_counts()` non exécutables par le public, avis sans PII publiques, uploads storage verrouillés, commentaires réservation authentifiés avec `_author` forcé côté serveur, UPDATE réservations réservé admin/staff.
- **Garde serveur** sur l'espace connecté (`/admin`, `/app`) : le JWT est vérifié côté serveur en plus du garde client.
- **Seed démo impossible en production** ; **perf** : refetch réduit (staleTime 60 s), listes admin limitées, jspdf chargé au clic uniquement.
- **Nettoyage** : 34 fichiers morts supprimés + 25 dépendances retirées (bundle inchangé ~474 Ko, 0 vulnérabilité npm).

## Logos Réels des Marques (Batch 41)

- **Logos réels monochromes** pour les 28 marques du catalogue (Apple, Samsung, Tecno, Infinix, itel, Nokia, Sony, Nintendo, Microsoft, Philips, Whirlpool…) — SVG 1 couleur (`currentColor`) rendus en blanc ou noir selon le contexte, sources Simple Icons (CC0) et Wikimedia Commons.

## Performance du Bundle Initial & Nettoyage (Batch 40)

- **Bundle initial allégé** : l'entrée passe de 657,6 Ko à 474,3 Ko. Le catalogue d'appareils (`DEVICES`, ~344 Ko), jspdf (~390 Ko), recharts (~335 Ko) et xlsx (~354 Ko) sont désormais chargés à la demande — absents du premier chargement de toute page (vérifié en production).
- **Barrel `src/data/catalog` allégé** : il ne re-exporte plus `DEVICES` (déplacé dans `src/data/catalog/devices.ts`, chunk dédié) ; les imports légers (`company`/`static`/`accessories`) restent dans le graphe initial.
- **Sitemap** : l'endpoint est `/sitemap.xml` (l'ancien `/api/sitemap` est supprimé).
- **Code mort supprimé** : serveur fns `calculateLoyaltyDiscount` / `applyLoyaltyDiscount` (jamais appelés par l'application).

## Refonte Formulaire B2B & Correctif Panier (Batch 39)

- **Formulaire de Demande B2B (`B2BRequestForm.tsx`)** :
  - Formules SLA intégrées exclusivement à l'Étape 2.
  - Calculateur de réduction dégressive de -10% pour les équipements > 5.
  - Grille à 4 fréquences de maintenance préventive (2, 3, 6, 12 mois) avec calcul du coût total par passe sur les boutons.
  - Auto-liaison du délai d'intervention SLA et verrouillage du choix manuel.
  - Démarrage sans pré-sélection par défaut aux étapes 1 & 2.
  - Boutons uniformes `h-12` (48px) et style noir technique.
- **Correctif Panier (`AddToCartWidget.tsx` & `cart.tsx`)** : suppression de l'ouverture intempestive du tiroir panier lors du chargement de page.

- **Parc matériel** : tables `equipment` / `equipment_history` / `equipment_documents` / `warranties` isolées par organisation (RLS `org_is_member`/`org_is_admin`), 10 RPC CRUD sécurisés côté base, statuts (actif, en panne, maintenance, garantie, retiré).
- **QR équipement** : `qr_id` unique généré à la création, QR imprimable sur la fiche (`/app/scan?q=…` résout la fiche).
- **Sites** : `workshops` étendue (org_id, responsable, horaires, départements) — les ateliers historiques restent publics, les sites d'organisation sont isolés.
- **Pages** : `/app/organizations/:id/equipment` (liste + recherche + filtre + ajout), `/app/organizations/:id/equipment/:id` (fiche complète, statut, historique, garanties, QR), `/app/organizations/:id/sites`.

## Phase 0 B2B (fondations multi-tenant)

- **Portail entreprises `/app`** : création d'organisation (raison sociale, RCCM/NIF, adresse, secteur, taille, nb de sites/équipements), liste des organisations, gestion des membres (invitation par email, rôles : admin_org, responsable maintenance, responsable de site, comptabilité, lecture seule, membre).
- **Multi-tenant** : tables `organizations` + `organization_members` avec RLS d'isolation (`org_is_member`, `org_is_admin`), `org_id` nullable sur reservations, workshops, leads, inventory_parts, stock_movements, suppliers, supplier_orders — l'activité existante (org_id NULL) coexiste avec les organisations clientes.
- **RPC org** : `create_organization`, `update_organization`, `get_user_orgs`, `get_org_members`, `invite_org_member`, `set_org_member_role`, `remove_org_member` (sécurité vérifiée côté base).

## Fonctionnalités

### Côté client

- **Recherche intelligente** : assistant de diagnostic en 9 étapes (type → marque → série → famille → modèle → pannes → créneau → photos → contact). Moteur de recherche amélioré avec fuzzy matching (tolérance aux fautes de frappe), scoring par pertinence, historique des recherches récentes.
- **Widget panier animé** : toast flottant en bas à droite avec animation slide-in, affiche le dernier article ajouté, prix, boutons "Voir le panier" / "Continuer". Auto-masquage après 4 secondes.
- **Sidebar filtres shop** : filtres latéraux (catégorie, fourchettes de prix, disponibilité, livraison gratuite) avec drawer mobile pour les petits écrans — intégrée boutique et reconditionnés.
- **Icônes SVG marques** : 27 marques avec logos vectoriels inline pour un rendu net sur tous les écrans.
- **Page À propos** : histoire, mission, valeurs, timeline chronologique, chiffres clés, localisation.
- **Page Rejoindre l'équipe** : avantages, postes ouverts, processus de candidature, CTA.
- **Réservation en ligne** : disponibilités en temps réel (créneaux par demi-journée et par heure), dépôt en boutique ou enlèvement à domicile.
- **Suivi de réparation** : par numéro de dossier, historique des changements de statut avec notes et durée par étape, photos d'atelier, commentaires client en temps réel, bouton "Ajouter au calendrier" (Google Calendar).
- **Historique appareils** : page publique `/historique` — recherche par téléphone ou email, stats de réparation, résultats vers le suivi.
- **Boutique enrichie** : badges stock visuels (pulse sur stock limité), aperçu rapide (modal QuickView), liste de souhaits (coeur), récemment consultés, estimation livraison, partage WhatsApp, badges confiance.
- **Avis produits** : notes 1-5 étoiles + texte sur chaque accessoire, affichage sur fiche produit avec formulaire.
- **Paiement en ligne** : 3 providers Mobile Money (Flutterwave, FedaPay, KKiaPay) — MTN MoMo, Moov Money, Celtiis.
- **Acompte 50%** : paiement partiel pour confirmer la réservation.
- **Programme de fidélité** : points gagnés, 3 niveaux (Bronze/Argent/Or), utilisation (100 pts = 500 FCFA).
- **Parrainage** : code unique, lien de partage, bonus de parrainage.
- **Espace client** (6 onglets) : Dossiers, Fidélité, Parrainage, Avis, Paiements, Profil.
- **Demande de devis** : soumission en ligne avec calcul automatique.
- **Notifications push** : toggle dans l'espace client.
- **Mode hors-ligne** : cache localStorage avec TTL 5 min, background sync pour formulaires, indicateur offline avec état cache.
- **PWA installable** : manifeste + service worker v3 (cache-first, network-first, stale-while-revalidate), prompt de mise à jour automatique.
- **Scanner QR/Barcode** : scan par caméra pour lecture de codes de dossiers (html5-qrcode).
- **Signature numérique** : capture canvas haute résolution pour confirmation de remise (signature_pad).
- **Retour en haut** : bouton flottant après 400px de scroll avec smooth scroll.
- **Accessibilité** : labels ARIA sur toutes les navigations, formulaires et boutons icônes, prefers-reduced-motion global.

### Côté atelier / admin (30 onglets)

- **Caisse & POS Comptoir** : encaissement direct espèces ou Mobile Money, vente rapide d'accessoires, calculatrice de monnaie, impression de ticket thermique.
- **Étiquettes Thermiques Atelier** : impression d'étiquettes 58mm/80mm pour pochettes et appareils avec QR de suivi client.
- **Inspection & Contrôle Qualité QA** : grille de vérification 10 points (écran, tactile, caméras, batterie, audio, boutons, châssis) pour admission et sortie.
- **Actions Rapides WhatsApp & SMS** : envoi en 1 clic de notifications directes aux clients (prise en charge, devis, prêt, relance).
- **Messagerie Chat Temps Réel** : multi-conversations en direct liées aux dossiers et à Supabase Realtime avec accusés de lecture.
- **Feature Flags** : gestion et activation dynamique des fonctionnalités système.
- **Dossiers** : liste + kanban avec drag-and-drop, filtres (statut/recherche/dates/technicien).
- **Atelier** : tableau kanban et calendrier des réparations, affectation technicien, transfert d'atelier, scan QR.
- **Équipe** : gestion des rôles (staff, technicien).
- **Leads** : suivi des demandes de devis.
- **Réclamations** : tickets de garantie avec statuts.
- **Analytics** : événements récents + compteurs.
- **Statistiques** : Recharts (AreaChart + PieChart), 4 onglets (Revenus, Clients, Appareils, Temps), tendances hebdomadaires avec indicateurs, export Excel.
- **Funnel conversion** : onglet "Funnel" avec barres de conversion (estimations → réservations → terminées), sources d'acquisition, erreurs récentes 24h.
- **KPI avancés** : métriques de performance en temps réel, KPIs configurables via panneau de config.
- **Sécurité** : OTP 2FA, historique des connexions.
- **Contenu** : blog, guides, mentions légales.
- **Catalogue** : gestion des appareils, marques, pannes.
- **Commandes** : suivi des commandes boutique.
- **Remboursements** : flow de remboursement avec audit.
- **Retours** : gestion des retours produits.
- **Audit** : journal d'audit enrichi avec filtres et export.
- **Ateliers** : multi-ateliers avec CRUD complet, transfert inter-ateliers, filtre kanban par atelier, charge de travail par atelier.
- **Fournisseurs** : gestion fournisseurs et commandes pièces.
- **Parrainage** : programme de parrainage avec niveaux.
- **Chat** : messagerie client-staff en temps réel.
- **Rapports** : rapports avancés avec export PDF.
- **KPIs avancés** : revenus, conversion, durée moyenne par étape, top pannes.
- **Sécurité** : OTP/TOTP 2FA, rate limiting, métriques temps réel.
- **Contenu** : CRUD blog, modération avis, invitations d'avis (WhatsApp + email).
- **Stock** : gestion inventaire, alertes stock bas.
- **Catalogue** : CRUD marques, catégories, appareils, pannes, photos.
- **Commandes** : suivi des commandes boutique.
- **Retours** : gestion des retours de pièces/réparations.
- **Remboursements** : initiation de remboursements avec audit log.
- **Audit** : journal des opérations (100 dernières entrées).
- **Inventaire** : CRUD pièces, alertes stock bas, mouvements entrée/sortie.
- **SLA** : suivi temps par statut, alertes retard, stats P90.
- **Satisfaction** : enquête NPS + note étoiles, dashboard promoteurs/détracteurs.
- **Notifications internes** : centre de notifications staff avec marquer lu.
- **Knowledge base** : wiki interne techniciens (8 catégories, recherche full-text).
- **Marketing** : campagnes email/SMS/WhatsApp, templates prédéfinis, segmentation RFM (VIP/Loyal/Actif/Nouveau/Inactif), tracking envois.
- **Webhooks sortants** : CRUD webhooks, 7 événements, signature HMAC, logs détaillés.
- **iCal** : feed `/api/ical` pour import Google Calendar des réservations actives.
- **Garantie étendue** : upsell 6/12/24 mois, suivi statut.

### Contenu et SEO

- **Pages** : Accueil, Réparations (par marque/appareil), Catalogue, Tarifs, Services, Boutique, Promotions, Magasins, Suivi, Devis, Reprise, Reconditionnés, FAQ, Blog, Avis, Contact, Engagements, Entreprises, Garantie, Réclamation, Guides, Quartiers, Mentions légales.
- **SEO** : Schema.org LocalBusiness, OpenGraph, Twitter Cards, sitemap dynamique, meta par page.
- **Blog** : articles bilingues FR/EN avec catégories et temps de lecture.
- **i18n** : routage bilingue `/fr` + `/en`, 30 segments traduits.

### Infrastructure

- **CI/CD** : GitHub Actions (lint + test + build + deploy + backup hebdomadaire).
- **Monitoring** : Plausible Analytics, endpoint `/api/healthz`, métriques temps réel.
- **Logging structuré** : JSON avec contexte (module, user, reservation).
- **Rate limiting** : sliding window en mémoire (KV documentation pour persistance).
- **Webhooks** : retry exponentiel, vérification HMAC, idempotence.
- **Backup** : script Supabase + workflow GitHub Actions.

## Stack technique

| Couche          | Technologie                                                                                           | Version           |
| --------------- | ----------------------------------------------------------------------------------------------------- | ----------------- |
| Framework       | [TanStack Start](https://tanstack.com/start) (React 19 SSR)                                           | ^1.168.32         |
| Routing         | [TanStack Router](https://tanstack.com/router) (file-based)                                           | ^1.170.18         |
| State           | [TanStack Query](https://tanstack.com/query)                                                          | ^5.101.1          |
| Build           | [Vite](https://vite.dev)                                                                              | ^8.1.5            |
| Langage         | [TypeScript](https://www.typescriptlang.org)                                                          | ^5.8.3            |
| CSS             | [Tailwind CSS](https://tailwindcss.com) v4                                                            | ^4.2.1            |
| UI              | [shadcn/ui](https://ui.shadcn.com) + [Radix UI](https://www.radix-ui.com)                             | 22 primitives     |
| Base de données | [Supabase](https://supabase.com) (PostgreSQL, Auth, Realtime, RLS)                                    | ^2.111.0          |
| Validation      | [react-hook-form](https://react-hook-form.com) + [Zod](https://zod.dev)                               | ^7.71.2 / ^3.24.2 |
| Déploiement     | [Cloudflare Workers](https://workers.cloudflare.com) (Wrangler)                                       | ^4.120.0          |
| SSR / Server    | [Nitro](https://nitro.build)                                                                          | ^3.0.260610-beta  |
| Testing         | [Vitest](https://vitest.dev) (unit) + [Playwright](https://playwright.dev) (E2E)                      | ^4.1.10 / ^1.62.1 |
| CI/CD           | [GitHub Actions](https://github.com/features/actions)                                                 | —                 |
| Monitoring      | [Plausible Analytics](https://plausible.io)                                                           | —                 |
| Notifications   | [Resend](https://resend.com) (email) + WhatsApp Cloud API                                             | —                 |
| Paiements       | [Flutterwave](https://flutterwave.com), [FedaPay](https://fedapay.com), [KKiaPay](https://kkiapay.me) | —                 |
| PDF             | [jsPDF](https://www.npmjs.com/package/jspdf) + jspdf-autotable                                        | ^4.2.1            |
| QR Codes        | [qrcode](https://www.npmjs.com/package/qrcode)                                                        | ^1.5.4            |
| Animation       | [Motion](https://motion.dev) (ex-Framer Motion)                                                       | ^12.43.0          |
| Charts          | [Recharts](https://recharts.org)                                                                      | ^2.15.4           |
| Icons           | [Lucide React](https://lucide.dev)                                                                    | ^0.575.0          |
| Toasts          | [Sonner](https://sonner.emilkowal.ski)                                                                | ^2.0.7            |
| Linting         | ESLint 9 + typescript-eslint + Prettier                                                               | ^9.32.0           |

## Structure du projet

```
src/
  routes/                  # Pages de l'application (TanStack Router)
  routes/app*              # Portail B2B multi-tenant (/app)
  routes/api.*.ts          # Routes API brutes (webhooks, sitemap, docs)
  components/site/         # Composants propres au site
  components/ui/           # Composants shadcn/ui
  components/admin/        # Composants admin (14 onglets extraits)
  components/shop/         # Composants boutique
  data/                    # Catalogue statique (marques, appareils, tarifs, blog, FAQ)
  hooks/                   # Hooks (session, disponibilité des créneaux)
  integrations/supabase/   # Clients Supabase (navigateur, serveur, auth)
  lib/                     # Logique métier (schémas, devis, fonctions serveur)
  lib/i18n/                # Internationalisation (dictionaries, segments, context)
  __tests__/               # Tests unitaires (Vitest)
supabase/
  migrations/              # Schéma SQL, RLS, fonctions et triggers (40 migrations)
e2e/                       # Tests E2E (Playwright, 10 fichiers spec)
scripts/                   # Scripts utilitaires (backup Supabase)
```

## Développement

Prérequis : Node.js 20+ et npm.

```sh
npm install
npm run dev
```

Scripts disponibles :

```sh
npm run build          # build de production
npm run preview        # prévisualisation du build
npm run lint           # eslint
npm run format         # prettier
npx tsc --noEmit       # vérification de types
npx vitest run         # tests unitaires
npx playwright test    # tests E2E
npm run backup         # backup Supabase (bash, nécessite pg_dump)
```

## Configuration

Le projet s'appuie sur Supabase. Les variables d'environnement suivantes sont attendues (fichier `.env`) :

- `VITE_SUPABASE_URL` / `SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (côté serveur uniquement)
- `TRACKING_CODE_PEPPER` — sel de hachage des codes de suivi

### Notifications (optionnel)

- `RESEND_API_KEY` + `RESEND_FROM` — email via Resend.
- `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` — WhatsApp Cloud API.

### Paiement en ligne (optionnel)

- `FLUTTERWAVE_SECRET_KEY` + `FLUTTERWAVE_WEBHOOK_SECRET_HASH` — Flutterwave.
- `FEDAPAY_SECRET_KEY` + `FEDAPAY_WEBHOOK_SECRET` — FedaPay.
- `KKIAPAY_PRIVATE_KEY` + `KKIAPAY_SECRET_KEY` + `KKIAPAY_PUBLIC_KEY` — KKiaPay.

### Push notifications (optionnel)

- `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` — clés VAPID pour les notifications push.

### Hors-ligne

Le mode hors-ligne fonctionne automatiquement : les données sont mises en cache dans localStorage avec un TTL de 5 minutes.

## Monitoring

- **Health check** : `GET /api/healthz` → `{"status":"ok", …}` (HTTP 200).
- **Sitemap** : `GET /sitemap.xml` → XML sitemap dynamique.
- **API docs** : `GET /api/docs` → documentation webhook HTML.
- **Analytics** : Plausible Analytics (configurable via `data-domain`).

## Déploiement

```sh
npx wrangler deploy    # déployer sur Cloudflare Workers
```

Custom domain : `allotechno.africa` (configuré dans `wrangler.jsonc`).

## Licence

Projet privé — Allô Techno, Abomey-Calavi, Bénin.
