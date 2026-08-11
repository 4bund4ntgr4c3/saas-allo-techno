// Point d'entrée unique pour l'enregistrement de tous les segments i18n.
// Importer CE fichier (pas les segments individuels) garantit que toutes les
// traductions sont enregistrées AVANT tout rendu, y compris sur Cloudflare
// Workers où les side-effect imports dispersés peuvent ne pas s'exécuter dans
// l'ordre attendu.

import "./about";
import "./admin";
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
import "./mon-compte";
import "./notfound";
import "./org";
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
