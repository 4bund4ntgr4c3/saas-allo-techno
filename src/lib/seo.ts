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
