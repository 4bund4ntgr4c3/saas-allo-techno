// Point d'entrée unique pour l'enregistrement des segments i18n du rendu
// initial (pages publiques + authentification).
// Importer CE fichier (pas les segments individuels) garantit que les
// traductions sont enregistrées AVANT tout rendu, y compris sur Cloudflare
// Workers où les side-effect imports dispersés peuvent ne pas s'exécuter dans
// l'ordre attendu.
//
// Les segments lourds réservés à des zones restreintes sont enregistrés
// LAZYMENT, importés depuis le layout qui les consomme (le chunk n'est alors
// chargé que lorsque la zone est visitée) :
//   - "admin"      → src/routes/_authenticated/admin.tsx
//   - "org"        → src/routes/app.tsx
//   - "mon-compte" → src/routes/_authenticated/mon-compte.tsx

import "./about";
import "./appareil";
import "./auth";
import "./avis";
import "./blog";
import "./boutique";
import "./catalog";
import "./changelog";
import "./checkout";
import "./demo";
import "./engagements";
import "./entreprises";
import "./faq-seo";
import "./guides";
import "./historique";
import "./info";
import "./loyalty";
import "./magasins";
import "./notfound";
import "./panier";
import "./promotions";
import "./push";
import "./quartiers";
import "./reclamation";
import "./reconditionnes";
import "./reparations";
import "./reservation";
import "./services";
import "./suivi";
import "./work-at";
