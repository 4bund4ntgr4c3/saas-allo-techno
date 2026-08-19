# Changelog

Toutes les modifications notables d'Allô Techno, du premier commit au plus récent.

Ce fichier suit les principes de [Keep a Changelog](https://keepachangelog.com/).
Le numéro de version suit le format `YYYY.MM.DD` basé sur la date de la release.

---

## [2026.08.19-b49] - 2026-08-19 (Corrections majeures de l'audit — Batch 49)

### Added

- **Rate-limit sur les 11 handlers de modules simulation** (M12) : `cloud-vault` (10/min), `drp-contract` (10/min), `ewaste-ledger` (60/min), `hw-upgrade` (20/min), `hw-asset-vault` (60/10/min), `voltage-injection` (20/min), `warehouse-stocks` (60/min), `license-audit` (10/min), `thermal-compare` (20/min) — garde `rateLimit` en tête de chaque handler (`src/lib/security`).
- **Origines URL sûres côté serveur** (M19) : `src/lib/origin.server.ts` dérive les origines de redirection/callback de paiement et de sitemap depuis le host de la requête uniquement s'il appartient à l'allowlist (`allotechno.africa` / `*.workers.dev` / localhost), sinon l'origine fonctionnelle du worker — `getRequestUrl({ xForwardedHost: true })` supprimé des 5 usages (payments, b2b-payments).
- **Tests webhooks sur le code de production** (M13) : logique de vérification des signatures (FedaPay HMAC t/s, KKiaPay `x-kkiapay-secret`, Flutterwave `verif-hash`) et traitement des paiements (réservation / SLA / boutique, idempotence, montant, notifications, webhooks sortants) extraite dans `src/lib/payment-webhooks.ts` et exercée par 18 tests — les 5 tests « théâtre » qui ré-implémentaient la logique en inline sont supprimés.
- **E2E Playwright en CI** (M14) : job `e2e` dans `ci.yml` (smoke statique : home, navigation, healthz, i18n-lazy, reparations) avec upload de `playwright-report` en cas d'échec.
- **Schema.org Product** (M10) : JSON-LD Product (name, description, brand, offre, disponibilité) sur les pages `boutique/$slug`.

### Changed

- **Sitemap unique** (M8) : la route dupliquée `/sitemap/xml` (`src/routes/sitemap.xml.ts`, domaine mort `COMPANY.url`) est supprimée ; `/sitemap.xml` consolide toutes les pages (statiques + dynamiques) sur l'origine fonctionnelle via `getSafeServerOrigin` ; `robots.txt` pointe sur le worker.
- **Canonical + hreflang sur toutes les pages localisées** (M10) : le layout `$locale` injecte désormais `<link rel="canonical">` + alternates fr/en/x-default basés sur `match.pathname` — plus besoin de l'ajouter page par page.
- **Clés i18n FR manquantes** (M6) : 42 clés ajoutées (admin analytics/atelier/audit/catalog/stock/marketing/stats, appareil.eyebrow, checkout.address.city, devis._, org.billing.table._, org.tickets._, org.sites._, org.maintenance.kpi.scheduled, panier.shipping-estimate.*, reparations.brand.eyebrow, search.group.recent) + miroirs EN ; correction de la clé CJK `shop.zoom缩小` → `shop.zoom.out` (`ImageZoom.tsx`).
- **Workflows durcis** (M17) : `permissions: contents: read` et `concurrency` (annulation des runs supersédés) ajoutés à `ci.yml`, `deploy.yml`, `reminders.yml`, `demo-reset.yml`.

### Fixed

- **Promo `single_use` consommée atomiquement** (M3, migration `20260826010000_audit_m3_promo_consume.sql`) : nouveau RPC `consume_promo` (UPDATE avec garde `single_use` dans le WHERE) appelé après succès de la commande dans `shop.functions.ts` — un code promo ne peut plus être réutilisé — **migration appliquée en prod**.
- **Stock restitué en cas d'échec partiel de commande** (M2) : si la réservation d'une ligne échoue, les lignes déjà réservées sont restituées (best-effort) avant l'erreur.
- **Fallback du token WhatsApp** (M4) : `WHATSAPP_ACCESS_TOKEN ?? WHATSAPP_TOKEN` sur les 4 points d'usage (notifications, b2b-reminders, reminders, reviews) — le renommage du secret ne casse plus les envois.
- **Webhooks sortants déclenchés** (M5) : `triggerWebhooks` (fire-and-forget) câblé sur reservation.created, reservation.status_changed/completed, lead.new, review.submitted et payment.received/failed (FedaPay/KKiaPay/Flutterwave, branches SLA + réservation + boutique).
- **Test d'intégration réservation** : le mock Supabase expose désormais `.contains` (utilisé par `triggerWebhooks`) — fin de l'erreur non gérée en fin de suite.
- **Encodage de `payments.functions.ts`** : caractères accentués et tirets (em-dash) rétablis (corruption introduite lors du nettoyage des imports `getRequestUrl` au batch 49) — diff vérifié byte-à-byte contre `bf9191f`.

---

## [2026.08.19-b48] - 2026-08-19 (Audit complet & Corrections critiques — Batch 48)

### Added

- **Rapport d'audit complet** (`docs/AUDIT-2026-08-19.md`) : audit transversal sur 6 axes (qualité code & tests, sécurité & données, frontend/UX & a11y, performance & SEO, backend & intégrations, CI/CD & infrastructure) — 6 critiques, 21 majeurs, 18 mineurs, points forts et plan d'action priorisé, chaque constat référencé (file:line).
- **RLS durcie sur `reservations`** (critique C1, migration `20260826000000_audit_c1_c2_rls.sql`) : la policy `reservations_cancel_own` ne permet plus que le passage en `annulee` ; un nouveau trigger `restrict_owner_reservation_update` (comparaison jsonb, insensible aux colonnes futures) bloque toute modification des autres colonnes par le propriétaire — `quote_amount`, `quote_status`, `payment_status`, `staff_notes`, `assigned_technician_id`, etc. ne sont plus falsifiables via l'API client (le paiement factice était exploitable par UPDATE direct).
- **RLS sur 8 tables orphelines** (critique C2) : `sla_configs`, `satisfaction_surveys`, `internal_notifications`, `extended_warranties`, `scheduled_reports`, `escalation_rules`, `escalation_events`, `kb_articles` — policies staff-only + `revoke anon` (toutes ces tables ne sont lues qu'en service role, aucune régression).
- **Paiement B2B SLA réel** (critique C4) : `initiateSlaPaymentFn` appelle les vraies API FedaPay/KKiaPay (transactions avec `callback_url`), insère la ligne `payments` (`source: "sla"`, `provider_tx_id`, idempotence `tx_ref`) ; les webhooks FedaPay/KKiaPay retrouvent le paiement sans filtre `source` et marquent la ligne payée/échouée pour les paiements SLA (le flux réservation reste inchangé) ; virement bancaire conservé en mode hors-ligne. Sans clé de prestataire configurée → erreur explicite, plus jamais d'URL de checkout fabriquée.

### Changed

- **Workflow `reminders.yml`** (critique C3) : `BASE_URL` par défaut sur le worker Cloudflare (`saas-allo-techno.4bund4ntgr4c3.workers.dev`) — `allotechno.africa` est toujours NXDOMAIN ; les rappels automatiques quotidiens (2/2 échecs historiques) peuvent enfin partir.
- **Workflows cron** (critique C5) : l'input `workflow_dispatch.base_url` est supprimé de `reminders.yml` et `demo-reset.yml` — plus aucune URL contrôlable par un déclencheur ne reçoit le Bearer `CRON_TOKEN`.
- **Builds CI/Deploy** (critique C6) : `VITE_VAPID_PUBLIC_KEY` ajoutée aux envs de build — les push notifications (abonnement silencieusement ignoré en prod) sont désormais actives.

---

## [2026.08.18-b46] - 2026-08-18 (Audit QA/SEO — Batch 46)

### Fixed

- **Hydration React #418 sur toutes les pages à fil d'Ariane** : `PageBreadcrumb` imbriquait un `<li>` (`BreadcrumbSeparator`) dans un `<li>` (`BreadcrumbItem`) — HTML invalide que le parseur serveur « répare » différemment du rendu client → erreur d'hydration à chaque chargement (dépannage-domicile, faq, entreprises, diagnostic-auto, work-at/test-technique…). Le séparateur est désormais un frère direct des items dans l'`ol`, conforme au pattern shadcn ; vérifié en dev (aucune erreur) sur 3 pages.
- **WebSocket Realtime Supabase bloqué par la CSP en production** : `connect-src` n'autorisait que `https://…supabase.co`, or le Realtime se connecte en `wss://` (schéma non couvert par `https:`) → le chat temps réel, le suivi en direct et la réservation temps réel étaient silencieusement cassés. `buildContentSecurityPolicy` ajoute désormais l'origine `wss://` dérivée de `SUPABASE_URL` ; 2 tests de non-régression ajoutés (`security.test.ts` : wss présent dans connect-src, script-src sans unsafe-inline).

### Changed

- **`eslint.config.js`** : ajout d'`ignores` explicites (`node_modules`, `dist`, `.output`, `.vinxi`, `test-results`, `playwright-report`, `.eslintcache`) — `eslint .` scannait ~37 000 fichiers et timeout (10-20 min) ; passe désormais en ~43 s.
- **SEO / Canonical + hreflang manquants sur 12 pages publiques** : `localeSeo` (canonical + alternates fr/en/x-default + og:url) ajouté aux routes entreprises, contact, faq, garantie, reprise, mentions-legales, devis, checkout, panier, reservation, avis et marketplace-sequestre (qui pointait par erreur vers `/boutique`) — ces pages n'avaient ni canonical ni hreflang dans le `<head>`.
- **SEO / Longueurs des métadonnées** : 9 titres/descriptions ramenés sous les limites Google (title ≤70, description ≤155) — home (164→153), garantie (163→142), reconditionnés (title 80→62, desc 168→146), boutique (167→148), engagements (182→151), quartiers (195→146) + équivalents anglais.

---

## [2026.08.17-b45] - 2026-08-17 (Sécurité, Push Serveur & Dépannage Pro — Batch 45)

### Added

- **Notifications Web Push côté serveur** : le TODO historique « server-side push must be implemented » est clos — nouveau module `src/lib/push-sender.ts` (JWT VAPID ES256 via WebCrypto, chiffrement aes128gcm RFC 8188/8291 avec HKDF/ECDH P-256, dérivation DER→r||s, purge des endpoints 404/410) exposant `sendPushToUser` / `sendPushToAll` / `isPushEnabled` ; endpoint staff `POST /api/push-send` (rateLimit `push-send` 20/min, Bearer + RPC `is_staff`, schéma zod, 503 si VAPID absent) ; handlers `push` + `notificationclick` ajoutés au service worker (`public/sw.js`) ; paire VAPID générée (`.env`, gitignoré) et déployée en production ; validé par 3 tests de chiffrement de bout en bout (`src/__tests__/push-encryption.test.ts` — déchiffrement côté abonné avec sa clé privée) et par un appel réel au endpoint en prod (`{status:"ok",sent:0}` avec token staff).
- **Fiche d'intervention PDF** : génération jsPDF avec QR vérifiable (`src/lib/fiche-intervention-pdf.ts`, thème `pdf-theme.ts`).
- **Protocoles de maintenance par catégorie d'équipement** : 6 catégories × 6-8 tâches prédéfinies (`preset-tasks.ts`, refonte `AdminChecklistModal` / `MaintenanceChecklistModal`).
- **Wizard dépannage-domicile refondu** : zones tarifées + presets de prestations (`depannage-domicile` +1 147 lignes).
- **Stepper B2B à icônes** avec récap sticky (`B2BRequestForm`), `DeviceSearch`, auto-scroll multi-étapes du checkout, héros des pages entreprises/réparations avec badges SLA.
- **PDFs contractuels** : contrat B2B (`b2b-contract-pdf.ts`), PV de restitution (`pv-restitution-pdf.ts`), certificat de garantie (`warranty-certificate-pdf.ts`).
- **Financement & conformité** : scoring crédit B2B BNPL, bourse pièces UEMOA, générateur PSSI, métrologie ISO 9001.
- **Notifications transactionnelles WhatsApp Cloud API** : nouvelle passerelle freemium prioritaire (`src/lib/whatsapp-cloud.ts`) — messages de service GRATUITS via Meta (service conversations, nov. 2024) ; mapping des 4 types de notification vers des templates français (`dossier_enregistre`, `devis_prest`, `appareil_prest`, `rappel_garantie`) ; chaîne de repli dans `sendTransactionalSms` : WhatsApp Cloud → simulation ; normalisation E.164 (+229) ; secrets `WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` documentés dans `wrangler.jsonc` ; 4 tests unitaires (payload Graph API, mapping templates, repli simulation).

### Changed

- **Rate limiting total** : les 97 server fns des modules feat portent désormais un `rateLimit` (lectures 60/min, écritures 20/min, sensibles 10/min) dans les 42 fichiers `src/lib` concernés — la couverture b44 (188 fns) est étendue à l'ensemble des `createServerFn` du dépôt, sans exception.
- **Documentation déploiement** (`wrangler.jsonc`) : procédure complète des secrets VAPID (`wrangler secret put VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`, var build `VITE_VAPID_PUBLIC_KEY`).
- **Branding** : logo « Allô Techno » avec accents accentués en `text-primary` dans le header, le footer et la sidebar admin, badge « Africa » sous le logo du header ; favicon + icônes PWA refaits avec variantes clair/sombre (`prefers-color-scheme`) déclarées dans `__root.tsx`.

### Fixed

- **Ids de rateLimit cassés** : kebab-case corrompus (`b-oo-kh-om-er-ep-ai-r`) et suffixes `-fn` résiduels sur 10 fichiers de b44 (accounting, b2b-audit, b2b-payments, contracts, demo, esg, maintenance-plans, quote, sla-metrics, whatsapp) — ids normalisés et uniques (41 fichiers).
- **Tests de chiffrement push** : comparaison `Uint8Array` via `Array.from` (piège vitest), typage `BufferSource`/`noUncheckedIndexedAccess` dans le module push.

### Removed

- **Passerelle SMS Termii** : supprimée de `src/lib/sms-notifications.ts` (jamais configurée — aucune clé `TERMII_API_KEY` ; service payant redondant avec WhatsApp Cloud API) — la chaîne de repli devient WhatsApp Cloud → simulation ; secrets `TERMII_API_KEY` / `SMS_GATEWAY_KEY` et leur documentation retirés (`wrangler.jsonc`).

---

## [2026.08.15-b44] - 2026-08-15 (Audit Scurit & Perf - Batch 44)

### Changed

- **Securite / Bundle** : plus aucun code `client.server.ts` (service role) dans les chunks navigateur - les 22 modules serveur qui l'importaient sont migres vers des imports dynamiques `await import("@/integrations/supabase/client.server")` a l'interieur des handlers (72 imports) ; code mort supprime de feature-flags.ts (isFeatureEnabled, clearFlagCache, FLAG_CACHE, CACHE_TTL_MS).
- **Securite / Audit** : les ecritures d'audit passent par la server fn `logAuditEntry` (schema zod des 16 actions, rateLimit `audit-write` 30/min, verifie currentUserId + RPC is_staff) au lieu de `logAudit` cote client qui echouait silencieusement (table RLS sans policies) ; appels remplaces dans AdminKanban (quote.sent), AdminDossiers (reservation.assigned, reservation.status_changed/cancelled) et AdminContent (review.published/hidden).
- **Securite / Rate limiting** : couverture totale des server fns - les 188 `createServerFn` de src/lib portent desormais un `rateLimit` (lectures 60/min, ecritures 20/min, sensibles 10/min : OTP, paiements, envois, exports, uploads) ; `POST /api/push-subscribe` limite a 10/min (429) ; `getAdminReviews` confirme cote serveur (isStaff + rateLimit) - le telephone des clients n'est plus lisible par une requete non-gardee.
- **Securite / Ownership** : /app/mon-compte ne liste et n'annule que ses propres reservations (filtre `.eq("user_id", user.id)` ajoute sur la liste et la mutation d'annulation).
- **Perf / i18n** : les segments de traduction lourds reserves aux zones restreintes ne sont plus charges au premier rendu (dictionnaires ~125 Ko de source en moins dans l'entree) - `admin` (93 Ko), `org` (24 Ko) et `mon-compte` (8 Ko) sont charges dans des chunks dedies : import dynamique declenche des l'evaluation de l'entree (`void import()` dans la route), `loader` de route pour le SSR et la navigation, et re-rendu garanti via `useSyncExternalStore` abonne aux enregistrements de segments (3e argument `getServerSnapshot` obligatoire pour le SSR — son absence plantait le rendu serveur, corrige dans la meme passe) ; cles `admin.*`/`org.*`/`mc.*` confirmees consommees uniquement sous les layouts /admin, /app et mon-compte ; cles eparses corrigees (ProductReviews utilisait `admin.roles.toast.error` -> `common.error`).
- **Tests e2e / Production** : suite Playwright executee contre le worker de production (37/37 verts) - comptes demo recrees dans Supabase (demo.admin/staff/tech/client/b2b, mot de passe Demo@2026, roles via `user_roles`) ; nouveau spec `i18n-lazy.spec.ts` verifiant qu'aucune cle brute ne s'affiche apres hydratation sur /admin, /mon-compte et /app ; specs obsolètes realignees : b2b-maintenance (le portail B2B s'ouvre en mode demo sans auth, `beforeLoad` l'autorise depuis le 13/08), selecteur b2b de roles.spec (`[data-tour="app-header"]` n'existe plus), reservation.spec (/fr/reservation redirige desormais vers /fr/reparations).

### Fixed

- Imports `supabase`/`user` devenus inutiles dans AdminContent et AdminKanban (retires, tsc passe a 0 erreur).
- **Incident production** : `useSyncExternalStore` sans `getServerSnapshot` dans I18nProvider faisait planter le rendu SSR de toutes les pages (erreur « Missing getServerSnapshot ») — corrige en passant `getDictionaryVersion` comme snapshot serveur, la reprise du site a ete verifiee par smoke test (200) et par la suite e2e complete.

---

## [2026.08.15-b43] - 2026-08-15 (Audit Securite & Nettoyage - Batch 43)

### Changed

- **Perf / Admin** : fin du N+1 sur /admin/dossiers - les donnees devis (quote_amount, quote_status, quote_decided_at, quote_token, warranty_months) sont desormais incluses dans la requete de liste des reservations (1 appel au lieu de 1 par dossier) ; le panneau devis (QuotePanel) n'appelle plus getReservationQuote par carte ; invalidation de la liste apres envoi de devis.
- **Perf / Base de connaissances** : searchKB filtre cote SQL (titre/contenu ilike + tags cs) avec limit(50) au lieu de telecharger toute la table puis filtrer en JS.
- **Perf / Catalogue** : photos signees avec ransform: { width: 480 } (le proxy render redimensionne cote CDN, la page ne telecharge plus les originaux ~5 Mo) ; la conversion webp n'est pas exposee par storage-js 2.111 (format restreint a origin).
- **Architecture / Admin** : migration des 16 onglets admin du client Supabase vers des server functions (PII et donnees lues cote serveur uniquement) — AdminDashboard/StatsDashboard/AdminAnalytics/AdminTeam/AdminOrders/AdminLeadsClaims/AdminChecklistModal/AdminContent/AdminStock/AdminDeliveries/AdminSatisfaction/AdminPOS/AdminKanban/AdminChat/AdminDossiers ; nouvelles server fns dans admin.functions.ts (getAdminDashboardStats, getAdminAnalyticsData, getAdminTeamData, getAdminStatsData, getAdminOrdersData, getAdminLeadsData, getAdminDeliveries, getAdminCompletedDossiers, searchAdminReservations, getReservationStatusHistory, getAdminConversationReservations, getAdminReservations, getAdminReservationsPage, getAdminAssignments, getAdminTechnicians, getAdminOrganizations, createTechnicianAssignment, saveChecklist, setLeadStatus, setTeamRole, requireStaffGuard) et content.functions.ts (getAdminBlogPosts, getAdminBlogPost, getAdminReviews, getAdminLowStock, getAdminStock), toutes gardees par is_staff + rateLimit cote serveur (techniciens : vue limitee a leurs dossiers) ; seuls restent cote client les canaux Realtime (chat, atelier), les checks de role via RPC et logAudit (ecriture staff via RLS).
- **Perf / Admin dossiers** : pagination serveur de /admin/dossiers — nouveaux filtres appliques en SQL (statut, recherche ilike, dates, B2B/particulier, technicien via derniere assignation) avec compteur exact et range() ; debounce de la recherche (400 ms) ; navigation Page/Precedent/Suivant avec total ; le tableau n'affiche plus que 50 dossiers par page au lieu de 200 en une fois.
- **Perf / SSR** : route rules Nitro avec cache CDN pour les pages publiques — /fr|/en/blog/** et /fr|/en/catalogue servis avec `Cache-Control: public, s-maxage=300/600, stale-while-revalidate` (revalidation en arriere-plan, pas de purge manuelle) ; applique au HTML SSR, les reponses avec cookie restent non cachees.
- **Maintenance / Deprecations** : remplacement de `createServerFn().inputValidator()` (deprecie) par `.validator()` dans les 21 fichiers serveur (84 appels) ; suppression du plugin `vite-tsconfig-paths` au profit de `resolve.tsconfigPaths: true` natif de Vite 8 (dependance retiree de package.json, bun.lock resynchronise) ; le mock de createServerFn dans integration-reservation.test.ts expose desormais `validator`.
- **Maintenance / Style** : prettier applique sur 24 fichiers de routes et composants restes en dehors du format (api.cron-demo-reset, app.organizations.*, demo, etc.) — `eslint src` passe a 0 erreur (les 25 warnings restants sont des fast-refresh/exhaustive-deps preexistants dans les routes).
- **Maintenance / Build** : verification de la strategie de chunking b40 — les warnings Nitro « manualChunks option is ignored » ne concernent que la passe SSR, le bundle client applique bien `manualChunks` (tentative de retrait : React 250 Ko fusionnait dans l'entree 660 Ko et xlsx 354 Ko dans la route equipment) ; config conservee avec note explicative.
- **Maintenance / Lint** : passage a 0 warning eslint — exports non-composants retires (buttonVariants, badgeVariants, useSidebar, shortDate, parsePostBody, extractOrderTotal, CHECKPOINTS, PRIORITY_BADGE, PREVENTIVE_PERIODS, calculateEstimate, matchedFaults, EQUIPMENT_TYPES) ; constantes partagees extraites dans des modules dedies (`field.ts`, `preset-tasks.ts` pour PRESET_TASKS, `cart-store.ts`, `wishlist-store.ts`, `i18n/context-store.ts`) ; code mort supprime (calculateSlaEstimate jamais appele) ; hooks de contexte (useI18n/useCart/useWishlist + field) autorises dans eslint.config.js via `allowExportNames` (pattern provider+hook, ~140 imports) ; 4 warnings exhaustive-deps corriges (save en useCallback dans AdminStock, deps fetchReviews/fetchRating dans ProductReviews, isB2B dans SearchModal, scheduleList memoise dans maintenance) ; l'hydratation i18n ne remplace plus que le defaut SSR 'fr' (jamais un choix utilisateur).

### Removed

- Server fn getReservationQuote (remplacee par les donnees batchees) et son schema Zod.

---

## [2026.08.18-b47] — 2026-08-18 (Migrations & Crons — Batch 47)

### Fixed

- **3 migrations jamais appliquees en prod** (detectees via le cron-reminders qui retournait 2 erreurs SQL) :
  - `20260818000000_b2b_billing_maintenance.sql` : tables `organization_invoices`, `organization_invoice_items`, `equipment_maintenance_schedules` + RLS/policies/indexes — appliquee ;
  - `20260817000000_checklists.sql` : colonnes `reservations.intake_checklist` / `qa_checklist` + index GIN — appliquee ;
  - `20260825000000_add_reservations_description.sql` : colonne `reservations.description` (requete B2B tickets) — appliquee.
- **Journal des migrations reparable** : `supabase_migrations.schema_migrations` contenait 17 versions avec suffixe (format non reconnu par la CLI) et ne refletait pas les migrations appliquees via le dashboard — versions normalisees en timestamps purs (14 chiffres), 22 entrees inserees pour les migrations reellement appliquees.
- **8 migrations jumelees** (2 fichiers au meme timestamp : 20260809100000_feature_flags_webhooks, 20260809120000_batch21_workshops_suppliers_chat, 20260809130000_reservation_source, 20260809150000_batch23_reservation_comments, 20260810140000_batch28_multi_workshop, 20260811000000_inventory_thresholds, 20260812000000_performance_indexes, 20260813000000_rls_hardening) renommees avec un timestamp unique (+1 minute) pour que la CLI puisse les representer dans le journal (cle primaire = timestamp).
- **`supabase db push` fonctionnel** : retourne « Remote database is up to date » (avant : erreurs LegacyDbPushMissingLocalError/LegacyDbPushApplyError).

### Changed

- **Cron reminders verifie en prod** : POST `/api/cron-reminders` avec Bearer CRON_TOKEN → `errors: []` (4 escalations SLA B2B traitees) ; 401 sans token.
- **Workflow horaire demo-reset repare** : echouait chaque heure pour 2 raisons — (1) le secret GitHub `CRON_TOKEN` n'existait pas (requete sans Bearer → 401) et (2) `BASE_URL` pointait vers `allotechno.africa` (DNS encore absent) ; secret `CRON_TOKEN` cree (libsodium, meme valeur que wrangler) et `BASE_URL` par defaut ramene au worker `saas-allo-techno.4bund4ntgr4c3.workers.dev` (a rebasculer sur le domaine apres le DNS). En plus, `/api/cron-demo-reset` retournait 500 quand la demo est desactivee (DEMO_ENABLED=false en prod) — c'est desormais un no-op proprement documente : nouvelle erreur typée `DemoDisabledError` dans `demo.functions.ts` → réponse `200 {"skipped":true}` (le 500 etait assimile a un echec par `curl -f` du workflow). Verifie : dispatch → run `success`.
- **Backup GitHub hebdomadaire repare** (il echouait depuis sa creation : secret SUPABASE_DATABASE_URL vide puis URL invalide) — `backup.yml` et `scripts/backup-supabase.sh` utilisent desormais `supabase link` (pooler IPv4) + `supabase db dump` (schema + data) via le token API, sans DATABASE_URL ; secrets GitHub ajoutes : `SUPABASE_ACCESS_TOKEN` (token renouvele) et `SUPABASE_DB_PASSWORD` ; l'ancien secret `SUPABASE_DATABASE_URL` (URL inexistante) a ete supprime. Verifie : run de test OK (dump 344 Ko, artifact `supabase-backup-5`).
- **4 warnings eslint react-refresh elimines** : les hooks/donnees exportes a cote des composants (perte du Fast Refresh en dev) sont extraits dans `src/lib/` — `use-network-status.ts`, `momo-provider.ts` (type `MoMoProvider` + `detectMomoProvider`, import de test mis a jour), `courier-mission.ts` (`CourierMission` + `MOCK_COURIER_MISSION`), `technician-profile.ts` (`TechnicianProfile` + `DEFAULT_TECH_PROFILE`). `npx eslint src/` : 0 erreur, 0 warning.
- **Formatage Prettier applique** sur les fichiers des features recentes (18 fichiers) — la CI (`prettier --check src/`) echouerait sinon.
- Token d'acces Supabase renouvele (ancien `sbp_...` revoque) — prerequisite pour `supabase db push` / `db query` / backup.

---

## [2026.08.15-b42] — 2026-08-15 (Audit Sécurité & Nettoyage — Batch 42)

### Added

- **Migration RLS `20260823000000_security_rls_hardening.sql`** : clôture des accès anonymes —
  - `chat_messages`, `referrals`, `saved_reports`, `google_reviews_cache` : RLS activée (policies staff-only, lecture de ses propres parrainages) ;
  - policies publiques (`using (true)` sans `to`) de `marketing_campaigns`, `campaign_sends`, `outbound_webhooks` (colonne `secret`) et `webhook_logs` remplacées par des policies `authenticated` + `is_staff()` ;
  - `get_client_segments()` / `get_segment_counts()` : `REVOKE EXECUTE` anon/public + garde JWT (anon et authenticated non-staff bloqués, service role intact) ;
  - `reviews` : SELECT public retiré (PII phone/email exposées) → staff only ;
  - `product_reviews` : INSERT authentifié uniquement + suppression staff ;
  - storage `device-photos` : INSERT anon et UPDATE global retirés ;
  - `reservation_comments` : INSERT authentifié, RPC `add_reservation_comment` gardé (anon bloqué) et `_author` forcé à `'customer'` côté serveur ;
  - policy UPDATE `reservations` restreinte à admin/staff (les techniciens passent par le RPC d'affectation vérifiant l'assignation).
- **Garde d'authentification serveur** sur l'espace connecté (`_authenticated/route.tsx`, `/admin` et `/app`) : le JWT est vérifié côté serveur (server fn) en plus du garde client.
- **Garde production du seed démo** : `DEMO_ENABLED` ne peut plus être vrai en production, `DEMO_PASSWORD` surchargeable via variable d'environnement.

### Changed

- **Perf** : `QueryClient` global avec `staleTime: 60 s` / `gcTime: 10 min` (fini le refetch systématique) ; `.limit()` ajoutés sur les listes admin (payments 500, analytics_events 20 000, livraisons 200, historique mon-compte 50, blog 100, avis 50) ; `jspdf`/`jspdf-autotable` chargés à la volée au clic sur le formulaire B2B (plus de 390 Ko statiques sur `/devis` et `/entreprises`).

### Removed

- **Dead code** : 34 fichiers — `usePersistedState.ts`, `org-schemas.ts` (+ son test dédié), 5 composants site inutilisés (PullToRefresh, QrScanner, SignatureCapture, SlotPicker, GoogleReviewsWidget), 24 wrappers shadcn inutilisés, 3 libs PDF mortes (`guarantee.functions.ts`, `invoice-pdf.ts`, `devis-pdf.ts`), exports org morts (`updateOrganization`, `getUserOrgsFn`, `createOrganizationFn`, `OrgMember`, `MOCK_ORGS`, `MOCK_EQUIPMENT`, `EquipmentByQr`, `ReservationStatus`, `B2BTicketInput`, `OrgSiteInput`, `assertOrgAccess`, `assertTicketAccess` — dont un doublon divergent avec la version locale), `LowStockItem`.
- **25 dépendances** inutilisées (`motion`, `date-fns`, `signature_pad`, `html5-qrcode`, `react-day-picker`, `input-otp`, `vaul`, `react-resizable-panels`, `embla-carousel-react`, `dompurify`, 15 paquets `@radix-ui/*`) — `bun.lock` resynchronisé.

### Fixed

- **Fuite du suivi** : le timeline (historique statuts + notes staff) n'est plus renvoyé quand le code de suivi est invalide (`suivi.functions.ts`) — seules les données publiques le sont.

---

## [2026.08.13-b41] — 2026-08-13 (Real Brand Logos — Batch 41)

### Changed

- **Logos réels des marques** : les glyphes SVG approximatifs de `brand-icons.ts` sont remplacés par les vrais logos monochromes (fill `currentColor` → blanc ou noir selon le contexte) pour les 28 marques : Simple Icons (CC0) + Wikimedia Commons (logos officiels ramenés à une couleur unique). Le `BrandLogo` centre désormais le SVG dans sa zone.

---

## [2026.08.13-b40] — 2026-08-13 (Bundle Performance & Cleanup — Batch 40)

### Changed

- **Bundle initial allégé** : l'entrée client passe de 657,6 Ko à 474,3 Ko. Le catalogue d'appareils (`DEVICES`, ~344 Ko), jspdf (~390 Ko), recharts (~335 Ko) et xlsx (~354 Ko) sont sortis du premier chargement — chargés à la demande uniquement (vérifié en production sur la page d'accueil et les pages appareil).
- **Barrel `src/data/catalog` allégé** : il ne re-exporte plus `DEVICES` ; les données lourdes sont déplacées dans `src/data/catalog/devices.ts` (chunk dédié importé en lazy par les routes catalogue/tarifs/reparations/devis/reprise ou en import dynamique par les loaders `appareil/$slug` et `reparations/$brand`). Les modules légers (`company`, `static`, `accessories`) restent dans le graphe initial ; les têtes SEO des routes inlinées n'utilisent plus `DEVICES` (le meta du catalogue compte depuis `BRANDS`).
- **`manualChunks`** : règles recharts/d3, jspdf/qrcode et catalog supprimées ; `vendor-react` isole React seul dans son chunk. Les imports lourds passent par `@/lib/invoice` en import dynamique (`suivi.tsx`) et les imports de composants sont redirigés vers `company`/`static`/`accessories`.

### Removed

- **Code mort** : serveur fns `calculateLoyaltyDiscount` / `applyLoyaltyDiscount` de `src/lib/loyalty.functions.ts` (jamais appelés par l'application) + leurs tests factices.
- **Route `api.sitemap.ts`** : remplacée par `/sitemap.xml` (le README référence désormais `/sitemap.xml`).

---

## [2026.08.12-b39] — 2026-08-12 (B2B Form Overhaul & Cart Hydration Fix — Batch 39)

### Added

- **Formulaire de Demande B2B Dynamique (`B2BRequestForm.tsx`)** :
  - **SLA & Tarification par Équipement** : placement exclusif des cartes de formules SLA (_ESSENTIEL_, _BUSINESS_, _Sur-Mesure_) à l'Étape 2 pour les contrats SLA.
  - **Tarif Dégressif -10% Parc Élargi** : réduction automatique de 10% appliquée pour les parcs de 6 à 15 et 16 à 50 équipements, affichée avec badge `-10% Dégressif` sur les boutons de sélection.
  - **Grille de Maintenance Préventive 4 Fréquences** : sélection parmi 4 périodicités (2 mois: 6 500 F, 3 mois: 8 000 F, 6 mois: 10 000 F, 12 mois: 15 000 F) avec calcul du montant total par passe directement affiché sur les boutons.
  - **Auto-Liaison des Délais d'Urgence SLA** : verrouillage automatique du délai d'intervention selon la formule choisie (Essentiel $\rightarrow$ Sous 48h, Business $\rightarrow$ Urgent < 24h).
  - **Zéro Pré-sélection par Défaut** : options non sélectionnées par défaut aux Étapes 1 et 2 pour inciter le client à faire un choix explicite, avec messages d'avertissement Toast en cas d'omission.
  - **Boutons Techniques Uniformes** : hauteur uniforme `h-12` (48px) et style noir technique sur l'ensemble du formulaire.

### Fixed

- **Widget Panier & Hydratation (`AddToCartWidget.tsx` & `cart.tsx`)** : résolution de l'ouverture intempestive du tiroir panier lors des rafraîchissements de page en ignorant la phase d'hydratation `localStorage`.

---

## [2026.08.12-b38] — 2026-08-12 (Strategic Enterprise & Operations Suite — Batch 38)

### Added

- **Portail Entreprise B2B Phase 3 : Facturation Consolidée** (`/app/organizations/$orgId/billing` & migration `20260818000000_b2b_billing_maintenance.sql`) : consolidation mensuelle automatique des interventions atelier en factures périodiques, calcul de la TVA 18%, gestion des statuts de règlement et export PDF.
- **Portail Entreprise B2B Phase 3 : Maintenance Préventive du Parc** (`/app/organizations/$orgId/maintenance`) : calendrier prévisionnel des révisions récurrentes (dépoussiérage, pâte thermique, santé batterie, diagnostic SSD), alertes d'échéances et validation en 1 clic.
- **Logistique Terrain & Application Coursier** (`/admin/livraisons` & `AdminDeliveries.tsx`) : tableau de bord de gestion des courses d'enlèvement et de livraison à domicile, filtrage par statut, navigation GPS en 1 clic, appel et WhatsApp coursier pré-rempli, modal de signature tactile client.
- **Gestion Avancée des Stocks & Bon de Commande Fournisseur Rapide** (`AdminInventory.tsx` & `inventory.functions.ts`) : tableau de bord de valorisation financière du stock (FCFA, références actives, seuils critiques), génération automatique en 1 clic d'un bon de commande fournisseur pour les pièces en rupture et export instantané vers WhatsApp.
- **Marketing & Relances Enquêtes de Satisfaction J+2** (`AdminSatisfaction.tsx`) : détection automatique des dossiers clôturés et envoi des enquêtes NPS/Avis par WhatsApp avec incitation +50 points fidélité.
- **Tests E2E Playwright** (`e2e/caisse-pos.spec.ts`, `e2e/b2b-maintenance.spec.ts`) : couverture E2E des accès sécurisés sur les routes POS et B2B.

---

## [2026.08.12] — 2026-08-12 (Admin Suite & POS Overhaul — Batch 37)

### Added

- **Caisse & Encaissement Direct Comptoir (POS)** (`/admin/caisse` & `AdminPOS.tsx`) : encaissement direct en espèces ou Mobile Money (MTN, Moov, Celtiis), recherche dossier ou vente rapide d'accessoires, calculatrice de monnaie automatique et impression thermique du ticket de caisse.
- **Générateur d'Étiquettes Thermiques Atelier** (`AdminDeviceLabel.tsx`) : impression d'étiquettes adhésives 58mm/80mm avec QR code de suivi client, référence dossier, coordonnées et diagnostic panne.
- **Inspection & Contrôle Qualité QA** (`AdminChecklistModal.tsx` & migration `20260817000000_checklists.sql`) : grille d'évaluation 10 points (écran, tactile, caméras, batterie, audio, boutons, châssis) pour l'entrée et la sortie d'atelier.
- **Actions Rapides WhatsApp & SMS** (`AdminQuickContact.tsx`) : messages préformatés en 1 clic (prise en charge, devis prêt, appareil réparé, relance) intégrés dans les dossiers et l'atelier.
- **Messagerie Admin Multi-Conversations** (`AdminChat.tsx`) : messagerie bidirectionnelle en temps réel connectée aux dossiers clients et à Supabase Realtime avec accusés de lecture.
- **Feature Flags Admin** (`/admin/feature-flags`) : interface de pilotage et d'activation dynamique des fonctionnalités système.
- **Robots.txt** : protection de la route privée B2B (`Disallow: /app`) pour les moteurs de recherche.

### Changed

- **Admin Dashboard** : calcul exact du chiffre d'affaires mensuel basé sur la table `payments` (`status = 'paid'`) et les devis validés.
- **Security Headers** : ajustement de la `permissions-policy` pour autoriser la caméra (`camera=(self)`) et les paiements (`payment=(self)`) sur l'origine propre, nécessaires au scanner QR d'atelier et aux flux Mobile Money.
- **Webhook KKiaPay** : comparaison du secret webhook en temps constant (`timingSafeEqual`) pour prévenir les attaques temporelles.

### Fixed

- **Tests Vitest** : mock de `createServerFn` dans `integration-reservation.test.ts` et correction du mode de paiement fixture (`especes`), rétablissant 100% de tests au vert (94/94 passants).

---

## [2026.08.11] — 2026-08-11 (Phase 1 B2B — parc matériel & sites)

### Added

- **Parc matériel** : tables `equipment` (statuts actif/en_panne/maintenance/garantie/retire, qr_id unique généré automatiquement), `equipment_history` (journal d'événements), `equipment_documents`, `warranties` — avec RLS d'isolation par organisation et 10 RPC (`create_equipment`, `update_equipment`, `set_equipment_status` avec journalisation automatique, `delete_equipment`, `add_equipment_history`, `upsert_warranty`, `delete_warranty`, `get_org_equipment` avec recherche/filtre, `get_equipment` fiche complète JSON, `get_equipment_by_qr`).
- **Portail `/app/organizations/:id/equipment`** : liste du parc avec recherche + filtre statut, formulaire d'ajout (type, marque, modèle, n° de série, asset tag, site, dates, affectation, localisation), fiche équipement (infos, changement de statut avec raison, historique, garanties, QR code imprimable pointant vers `/app/scan`).
- **Sites** : `workshops` étendue avec `org_id`, `manager`, `opening_hours`, `departments` + RLS préservant l'existant (ateliers org_id NULL restent publics) + 4 RPC (`get_org_sites`, `create_org_site`, `update_org_site`, `delete_org_site` avec détachement des équipements).
- **Page `/app/organizations/:id/sites`** : liste des sites (équipements rattachés, départements), ajout/suppression.
- **Page `/app/scan?q=`** : résolution d'un QR équipement vers la fiche (target du scan caméra à venir avec les tickets B2B).
- **i18n** : traductions FR/EN équipement + sites.

### Changed

- **types.ts** : tables `equipment`, `equipment_documents`, `equipment_history`, `workshops` (colonnes sites), `warranties` + enum `equipment_status` + 14 RPC.
- **README** : section Phase 1 B2B.

---

## [2026.08.11] — 2026-08-11 (Phase 0 B2B — fondations multi-tenant)

### Added

- **Multi-tenant (Phase 0)** : tables `organizations` + `organization_members` avec enum `org_role` (admin_org, responsable_maintenance, responsable_site, comptabilite, lecture_seule, membre) et `org_status` (pending/active/suspended).
- **Isolation RLS par organisation** : helpers `org_role_of()` / `org_is_admin()` / `org_is_member()`, policies membres/administration sur les 2 nouvelles tables.
- **RPC org** : `create_organization` (le créateur devient admin_org), `update_organization`, `get_user_orgs`, `get_org_members`, `invite_org_member` (par email), `set_org_member_role`, `remove_org_member` (protège le dernier admin).
- **`org_id` nullable + RLS étendues** sur reservations, workshops, leads, inventory_parts, stock_movements, suppliers, supplier_orders — l'activité Allô Techno existante (org_id NULL) et les organisations clientes coexistent.
- **Portail B2B `/app`** : layout avec sidebar + liste des organisations + création d'organisation (formulaire complet : raison sociale, RCCM, adresse, secteur, taille, nb sites/équipements) + détail organisation avec gestion des membres (invitation, changement de rôle, retrait).
- **`src/lib/org.functions.ts`** : server functions org avec client Supabase scopé utilisateur (JWT Bearer) pour que `auth.uid()` des RPC résolve correctement côté serveur.
- **i18n** : segment `org` FR/EN enregistré dans `segments/index.ts`.

### Changed

- **types.ts** : ajout des tables `organizations`/`organization_members`, des enums `org_role`/`org_status` et des 9 RPC org dans `Database`.

---

## [2026.08.11] — 2026-08-11 (Fix CI/CD)

### Fixed

- **CI/CD** : pin Node 20 + `ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION=true` pour le deploy Cloudflare via GitHub Actions.
- **bun.lock** : régénéré avec `zustand` inclu pour que `bun install --frozen-lockfile` passe sur Cloudflare.

---

## [2026.08.11] — 2026-08-11 (Batch 36)

### Added

- **Search analytics** : enregistrement des requêtes de recherche utilisateur dans Supabase (`search_queries` table) pour analytics populaires.
- **Skeleton loading** : composants `ProductCardSkeleton`, `ProductGridSkeleton`, `ProductDetailSkeleton` pour les états de chargement boutique.
- **Mobile filter drawer amélioré** : touche Escape pour fermer, focus trap (Tab reste dans le drawer), aria-modal sur le dialogue.
- **Zoom image produit** : composant `ImageZoom` avec survol pour zoom x2, overlay plein écran au clic, Escape pour fermer.
- **Breadcrumbs sur toutes les pages** : composant `PageBreadcrumb` réutilisable ajouté aux pages services, tarifs, blog, guides, FAQ, about.
- **Cookie consent banner** : bannière RGPD dans le footer avec Accepter/Refuser, persisté dans localStorage.

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

- **Migration vers un build autonome Cloudflare Workers** : build autonome, wrangler, custom domain.
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
