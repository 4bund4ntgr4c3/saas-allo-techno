// Coordonnées de l'atelier + petits helpers. Isolé du gros catalogue pour
// pouvoir être importé par __root / Header / Footer sans charger les données
// d'appareils (~500 Ko) dans le bundle du premier rendu.
export const COMPANY = {
  name: "Allô Techno",
  city: "Abomey-Calavi",
  country: "Bénin",
  address: "Quartier Zogbadjè, Rue de l'Université, Abomey-Calavi, Bénin",
  phone: "+229 01 43 67 97 67",
  whatsapp: "+229 01 43 67 97 67",
  email: "contact@allotechno.africa",
  url: "https://allotechno.africa",
  lat: 6.4489,
  lng: 2.3553,
  hours: [
    { d: "Lundi — Vendredi", h: "08:30 — 20:30" },
    { d: "Samedi", h: "09:00 — 17:00" },
    { d: "Dimanche", h: "Fermé" },
  ],
};

/** URL absolue du site (canonicals, Open Graph). */
export const absoluteUrl = (path: string) =>
  `${COMPANY.url}${path.startsWith("/") ? path : `/${path}`}`;

export const formatFcfa = (n: number, locale = "fr-FR") =>
  `${n.toLocaleString(locale).replace(/\u202f|\s/g, ".")} FCFA`;
