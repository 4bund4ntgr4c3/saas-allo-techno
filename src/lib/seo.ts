import type { Locale } from "@/lib/i18n/locales";
import { COMPANY } from "@/data/catalog/company";

/**
 * Métadonnées SEO localisées pour une route sous /$locale.
 * Construit l'URL canonique, les liens hreflang (fr/en/x-default) et les
 * champs Open Graph localisés à partir du segment de langue (`locale`) et du
 * suffixe de chemin propre à la route (`suffix`, ex. "/reparations" ou
 * "/reparations/apple"). Le suffixe est statique par route ; il n'est pas
 * dérivé de l'URL courante (head() ne dispose pas du chemin complet).
 */
export function localeUrl(locale: Locale, suffix: string): string {
  const clean = suffix.replace(/^\/+/, "");
  const base = `/${locale}`;
  if (!clean) return `${COMPANY.url}${base}`;
  if (clean.startsWith(locale + "/") || clean === locale) return `${COMPANY.url}/${clean}`;
  return `${COMPANY.url}${base}/${clean}`;
}

const OGC_LOCALE: Record<Locale, string> = { fr: "fr_BJ", en: "en_US" };

export function localeSeo(locale: Locale, suffix: string) {
  const url = localeUrl(locale, suffix);
  const alternateUrl = (l: Locale) => localeUrl(l, suffix);
  const frUrl = localeUrl("fr", suffix);
  const enUrl = localeUrl("en", suffix);
  return {
    meta: [
      { property: "og:url", content: url },
      { property: "og:locale", content: OGC_LOCALE[locale] },
      { property: "og:locale:alternate", content: locale === "fr" ? "en_US" : "fr_BJ" },
    ],
    links: [
      { rel: "canonical", href: url },
      { rel: "alternate", hreflang: "fr", href: frUrl },
      { rel: "alternate", hreflang: "en", href: enUrl },
      { rel: "alternate", hreflang: "x-default", href: alternateUrl("fr") },
    ],
  };
}

/**
 * Données structurées FAQPage (schema.org) pour les pages publiques.
 * `questions` doit être localisé (fr ou en) selon la locale de la route.
 */
export function faqSchema(questions: { q: string; a: string }[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

// Jour de la semaine (nom français de COMPANY.hours) -> dayOfWeek schema.org.
const WEEKDAY_FR_TO_EN: Record<string, string> = {
  Lundi: "Monday",
  Mardi: "Tuesday",
  Mercredi: "Wednesday",
  Jeudi: "Thursday",
  Vendredi: "Friday",
  Samedi: "Saturday",
  Dimanche: "Sunday",
};

const WEEKDAYS_FR = Object.keys(WEEKDAY_FR_TO_EN);

// « Lundi — Vendredi » -> ["Monday", ..., "Friday"] (les plages sont expansées).
function daysOfWeek(fr: string): string[] {
  const parts = fr.split("—").map((p) => p.trim());
  if (parts.length === 1) {
    const single = WEEKDAY_FR_TO_EN[parts[0] ?? ""];
    return single ? [single] : [];
  }
  const from = WEEKDAYS_FR.indexOf(parts[0] ?? "");
  const to = WEEKDAYS_FR.indexOf(parts[parts.length - 1] ?? "");
  if (from === -1 || to === -1) return [];
  if (from <= to) return WEEKDAYS_FR.slice(from, to + 1).map((d) => WEEKDAY_FR_TO_EN[d] as string);
  return [
    ...WEEKDAYS_FR.slice(from).map((d) => WEEKDAY_FR_TO_EN[d] as string),
    ...WEEKDAYS_FR.slice(0, to + 1).map((d) => WEEKDAY_FR_TO_EN[d] as string),
  ];
}

// Horaires d'ouverture depuis COMPANY.hours ; les jours « Fermé » sont omis.
function openingHoursSpecification() {
  return COMPANY.hours.flatMap(({ d, h }) => {
    if (h.trim() === "Fermé") return [];
    const dayOfWeek = daysOfWeek(d);
    if (dayOfWeek.length === 0) return [];
    const [opens, closes] = h.split("—").map((t) => t.trim());
    if (!opens || !closes) return [];
    return [{ "@type": "OpeningHoursSpecification", dayOfWeek, opens, closes }];
  });
}

/**
 * Fiche LocalBusiness (ElectronicsStore) de l'atelier, partagée par toutes
 * les pages. L'@id fixe permet d'y faire référence (provider Service, etc.).
 * `areaServed` sert aux pages quartiers ; les notes agrégées ne sont incluses
 * que si `reviewCount > 0`.
 */
export function localBusinessSchema(opts?: {
  areaServed?: string[];
  ratingValue?: number;
  reviewCount?: number;
}): object {
  return {
    "@context": "https://schema.org",
    "@type": "ElectronicsStore",
    "@id": `${COMPANY.url}/#entreprise`,
    name: COMPANY.name,
    url: COMPANY.url,
    telephone: COMPANY.phone,
    email: COMPANY.email,
    image: `${COMPANY.url}/og-image.png`,
    priceRange: "FCFA",
    address: {
      "@type": "PostalAddress",
      streetAddress: COMPANY.address,
      addressLocality: COMPANY.city,
      addressCountry: "BJ",
    },
    geo: { "@type": "GeoCoordinates", latitude: COMPANY.lat, longitude: COMPANY.lng },
    openingHoursSpecification: openingHoursSpecification(),
    ...(opts?.areaServed ? { areaServed: opts.areaServed } : {}),
    ...(opts && opts.reviewCount && opts.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: opts.ratingValue ?? 0,
            reviewCount: opts.reviewCount,
          },
        }
      : {}),
  };
}

/**
 * Fiche Service (schema.org) pour les pages de réparation par marque.
 * `name`/`description` doivent être localisés ; `brand` alimente un
 * hasOfferCatalog minimal.
 */
export function serviceSchema(opts: {
  name: string;
  description: string;
  url: string;
  brand?: string;
}): object {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${opts.url}#service`,
    name: opts.name,
    serviceType: opts.name,
    description: opts.description,
    url: opts.url,
    provider: { "@id": `${COMPANY.url}/#entreprise` },
    areaServed: ["Bénin", COMPANY.city],
    ...(opts.brand ? { hasOfferCatalog: { "@type": "OfferCatalog", name: opts.brand } } : {}),
  };
}

/**
 * Notes agrégées (schema.org aggregateRating) pour une entité
 * LocalBusiness/Product. L'agrégat n'est émis que si `reviewCount > 0`.
 */
export function aggregateReviewSchema(opts: { ratingValue: number; reviewCount: number }): object {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${COMPANY.url}/#entreprise`,
    name: COMPANY.name,
    ...(opts.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: opts.ratingValue,
            reviewCount: opts.reviewCount,
          },
        }
      : {}),
  };
}

/** Fil d'Ariane (schema.org BreadcrumbList) ; les URL doivent être absolues. */
export function breadcrumbSchema(items: { name: string; url: string }[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
