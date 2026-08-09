import { DEVICES, brandName } from "@/data/catalog";
import { POSTS } from "@/data/catalog/static";

export interface SearchResult {
  type: "device" | "blog" | "page";
  title: string;
  description: string;
  url: string;
  score: number;
}

export function fullTextSearch(query: string, locale: string = "fr"): SearchResult[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (normalizedQuery.length < 2) return [];

  const results: SearchResult[] = [];

  for (const device of DEVICES) {
    const searchText = `${brandName(device.brand)} ${device.name} ${device.category} ${device.series}`.toLowerCase();
    const score = calculateScore(normalizedQuery, searchText);
    if (score > 0) {
      results.push({
        type: "device",
        title: device.name,
        description: `${device.category} · ${brandName(device.brand)}`,
        url: `/${locale}/reparations/${device.brand}/${device.slug}`,
        score,
      });
    }
  }

  for (const post of POSTS) {
    const searchText = `${post.title} ${post.excerpt} ${post.category}`.toLowerCase();
    const score = calculateScore(normalizedQuery, searchText);
    if (score > 0) {
      results.push({
        type: "blog",
        title: post.title,
        description: post.excerpt.slice(0, 120),
        url: `/${locale}/blog/${post.slug}`,
        score,
      });
    }
  }

  const pageTranslations: Record<string, { fr: string; en: string }> = {
    reparations: { fr: "Réparations", en: "Repairs" },
    tarifs: { fr: "Tarifs", en: "Pricing" },
    boutique: { fr: "Boutique", en: "Shop" },
    services: { fr: "Services", en: "Services" },
    faq: { fr: "FAQ", en: "FAQ" },
    contact: { fr: "Contact", en: "Contact" },
    devis: { fr: "Devis", en: "Quote" },
    garantie: { fr: "Garantie", en: "Warranty" },
  };

  for (const [slug, labels] of Object.entries(pageTranslations)) {
    const title = labels[locale as "fr" | "en"] ?? labels.fr;
    const score = calculateScore(normalizedQuery, title.toLowerCase());
    if (score > 0) {
      results.push({
        type: "page",
        title,
        description: "",
        url: `/${locale}/${slug}`,
        score,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 20);
}

function calculateScore(query: string, text: string): number {
  if (text.includes(query)) return 10;
  if (text.startsWith(query)) return 8;
  const words = query.split(/\s+/);
  let score = 0;
  for (const word of words) {
    if (text.includes(word)) score += 3;
  }
  return score;
}
