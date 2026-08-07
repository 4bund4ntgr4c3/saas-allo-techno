import { registerSegments } from "@/lib/i18n/dictionaries";

const fr = {
  // Boutique — meta
  "boutique.meta.title": "Boutique accessoires — Coques, chargeurs, batteries | Allô Techno",
  "boutique.meta.description":
    "Accessoires testés en atelier à Abomey-Calavi : coques, verres trempés, chargeurs rapides, câbles, batteries externes et écouteurs. Prix en FCFA, retrait ou livraison.",
  "boutique.og.title": "Boutique d'accessoires — Allô Techno",
  "boutique.og.description":
    "Coques, chargeurs, batteries et écouteurs disponibles en stock à Abomey-Calavi.",
  "boutique.eyebrow": "Boutique · stock atelier",
  "boutique.title": "Accessoires testés en atelier",
  "boutique.hero":
    "Chaque référence est contrôlée par nos techniciens avant mise en vente. Retrait immédiat à Zogbadjè ou livraison — offerte dès {0} d'achat.",
  "boutique.refs": "{0} réf.",
  "boutique.refs.one": "{0} référence",
  "boutique.catalogue": "Catalogue",
  "boutique.catalogue.text":
    "Filtrez par famille de produit, comparez les prix et ajoutez au panier.",
  "boutique.cart": "Panier ({0})",
  "boutique.search": "Recherche",
  "boutique.search.placeholder": "Coque, chargeur 20W, câble…",
  "boutique.family": "Famille",
  "boutique.all-families": "Toutes les familles",
  "boutique.sort": "Tri",
  "boutique.sort.populaire": "Pertinence",
  "boutique.sort.prix-asc": "Prix croissant",
  "boutique.sort.prix-desc": "Prix décroissant",
  "boutique.sort.stock": "Stock disponible",
  "boutique.no-results":
    "Aucun accessoire ne correspond à cette recherche. Contactez-nous : nous commandons sur demande sous 72 h.",
  "boutique.add": "Ajouter",
  "boutique.in-cart": "Au panier ({0})",
  "boutique.unavailable": "Indisponible",
  "boutique.on-order": "Sur commande",
  "boutique.in-stock": "En stock · {0} pcs",
  "boutique.low-stock": "Stock limité · {0} pcs",
  "boutique.details": "Détails",
  "boutique.toast.added": "{0} ajouté au panier",

  // Boutique — fiche produit
  "boutique.meta.detail.title": "{0} — Boutique Allô Techno",
  "boutique.meta.detail.og.title": "{0} — Allô Techno",
  "boutique.meta.detail.description":
    "{0} — accessoire contrôlé en atelier, disponible à Abomey-Calavi. Retrait immédiat ou livraison, paiement Mobile Money.",
  "boutique.accessory": "Accessoire",
  "boutique.back": "Retour à la boutique",
  "boutique.test":
    "Référence testée par nos techniciens avant mise en rayon. Garantie d'échange 14 jours en cas de défaut constaté.",
  "boutique.availability": "Disponibilité",
  "boutique.stock-available": "{0} pcs en stock",
  "boutique.on-order-72": "Sur commande (72 h)",
  "boutique.reference": "Référence",
  "boutique.qty.decrease": "Diminuer la quantité",
  "boutique.qty.increase": "Augmenter la quantité",
  "boutique.add-to-cart": "Ajouter au panier",
  "boutique.view-cart": "Voir le panier ({0})",
  "boutique.free-delivery": "Livraison offerte dès {0}",
  "boutique.exchange": "Échange 14 jours, facture fournie",
  "boutique.related": "Dans la même famille",
  "boutique.toast.added-qty": "{0} × {1} ajouté au panier",
};

const en = {
  // Boutique — meta
  "boutique.meta.title": "Accessories shop — Cases, chargers, batteries | Allô Techno",
  "boutique.meta.description":
    "Workshop-tested accessories in Abomey-Calavi: cases, tempered glass, fast chargers, cables, power banks and earphones. Prices in FCFA, pickup or delivery.",
  "boutique.og.title": "Accessories shop — Allô Techno",
  "boutique.og.description": "Cases, chargers, batteries and earphones in stock in Abomey-Calavi.",
  "boutique.eyebrow": "Shop · workshop stock",
  "boutique.title": "Workshop-tested accessories",
  "boutique.hero":
    "Every reference is checked by our technicians before sale. Immediate pickup in Zogbadjè or delivery — free from {0} in purchases.",
  "boutique.refs": "{0} refs",
  "boutique.refs.one": "{0} reference",
  "boutique.catalogue": "Catalogue",
  "boutique.catalogue.text": "Filter by product family, compare prices and add to your cart.",
  "boutique.cart": "Cart ({0})",
  "boutique.search": "Search",
  "boutique.search.placeholder": "Case, 20W charger, cable…",
  "boutique.family": "Family",
  "boutique.all-families": "All families",
  "boutique.sort": "Sort",
  "boutique.sort.populaire": "Relevance",
  "boutique.sort.prix-asc": "Price ascending",
  "boutique.sort.prix-desc": "Price descending",
  "boutique.sort.stock": "In stock first",
  "boutique.no-results":
    "No accessory matches this search. Contact us: we order on demand within 72 h.",
  "boutique.add": "Add",
  "boutique.in-cart": "In cart ({0})",
  "boutique.unavailable": "Unavailable",
  "boutique.on-order": "On order",
  "boutique.in-stock": "In stock · {0} pcs",
  "boutique.low-stock": "Low stock · {0} pcs",
  "boutique.details": "Details",
  "boutique.toast.added": "{0} added to cart",

  // Boutique — product page
  "boutique.meta.detail.title": "{0} — Allô Techno Shop",
  "boutique.meta.detail.og.title": "{0} — Allô Techno",
  "boutique.meta.detail.description":
    "{0} — an accessory checked at the workshop, available in Abomey-Calavi. Immediate pickup or delivery, Mobile Money payment.",
  "boutique.accessory": "Accessory",
  "boutique.back": "Back to shop",
  "boutique.test":
    "Reference tested by our technicians before it hits the shelf. 14-day exchange warranty in case of detected defect.",
  "boutique.availability": "Availability",
  "boutique.stock-available": "{0} pcs in stock",
  "boutique.on-order-72": "On order (72 h)",
  "boutique.reference": "Reference",
  "boutique.qty.decrease": "Decrease quantity",
  "boutique.qty.increase": "Increase quantity",
  "boutique.add-to-cart": "Add to cart",
  "boutique.view-cart": "View cart ({0})",
  "boutique.free-delivery": "Free delivery from {0}",
  "boutique.exchange": "14-day exchange, invoice provided",
  "boutique.related": "In the same family",
  "boutique.toast.added-qty": "{0} × {1} added to cart",
};

registerSegments({ fr, en });
