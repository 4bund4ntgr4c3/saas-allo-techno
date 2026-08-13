import { DEVICES } from "@/data/catalog/devices";
import { brandName } from "@/data/catalog";
import { POSTS } from "@/data/catalog/static";

export interface SearchResult {
  type: "device" | "blog" | "page";
  title: string;
  description: string;
  url: string;
  score: number;
  brand?: string;
  category?: string;
}

export interface SearchFilters {
  brand?: string;
  category?: string;
  sortBy?: "relevance" | "name";
}

const PAGE_TRANSLATIONS: Record<string, { fr: string; en: string; keywords: string }> = {
  reparations: {
    fr: "Réparations",
    en: "Repairs",
    keywords: "diagnostic reparer panne atelier ecran batterie",
  },
  tarifs: { fr: "Tarifs", en: "Pricing", keywords: "prix cout combien tarif" },
  boutique: { fr: "Boutique", en: "Shop", keywords: "acheter accessoire coque chargeur" },
  services: { fr: "Services", en: "Services", keywords: "nettoyage transfert sauvegarde reset" },
  faq: { fr: "FAQ", en: "FAQ", keywords: "questions reponses aide" },
  contact: { fr: "Contact", en: "Contact", keywords: "adresse telephone whatsapp localisation" },
  devis: { fr: "Devis", en: "Quote", keywords: "estimation devis prix gratuit" },
  garantie: { fr: "Garantie", en: "Warranty", keywords: "garantie sav reclamation" },
  suivi: { fr: "Suivi", en: "Tracking", keywords: "suivre statut dossier etat" },
  reservation: { fr: "Réservation", en: "Booking", keywords: "reserver rendez-vous creneau" },
  reprise: { fr: "Reprise", en: "Trade-in", keywords: "revente vendre acheter occasion" },
  blog: { fr: "Blog", en: "Blog", keywords: "articles guides conseils" },
  entreprise: { fr: "Entreprises", en: "Business", keywords: "pro entreprise bureau partenariat" },
  catalogue: { fr: "Catalogue", en: "Catalog", keywords: "tous les appareils modeles" },
};

export function fullTextSearch(
  query: string,
  locale: string = "fr",
  filters?: SearchFilters,
): SearchResult[] {
  const normalizedQuery = normalizeText(query);
  if (normalizedQuery.length < 2 && !filters?.brand && !filters?.category) return [];

  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const results: SearchResult[] = [];

  // Search devices
  for (const device of DEVICES) {
    if (filters?.brand && device.brand !== filters.brand) continue;
    if (filters?.category && device.category !== filters.category) continue;

    const deviceText = normalizeText(
      `${brandName(device.brand)} ${device.name} ${device.category} ${device.series} ${device.brand}`,
    );
    const score =
      normalizedQuery.length >= 2
        ? calculateEnhancedScore(normalizedQuery, queryTokens, deviceText)
        : 1;

    if (score > 0 || filters?.brand || filters?.category) {
      results.push({
        type: "device",
        title: device.name,
        description: `${device.category} · ${brandName(device.brand)}`,
        url: `/${locale}/reparations/${device.brand}/${device.slug}`,
        score,
        brand: device.brand,
        category: device.category,
      });
    }
  }

  // Search blog posts and pages (when no filters active)
  if (!filters?.brand && !filters?.category) {
    for (const post of POSTS) {
      const searchText = normalizeText(`${post.title} ${post.excerpt} ${post.category}`);
      const score = calculateEnhancedScore(normalizedQuery, queryTokens, searchText);
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

    for (const [slug, labels] of Object.entries(PAGE_TRANSLATIONS)) {
      const title = labels[locale as "fr" | "en"] ?? labels.fr;
      const searchText = normalizeText(`${title} ${labels.keywords}`);
      const score = calculateEnhancedScore(normalizedQuery, queryTokens, searchText);
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
  }

  // Sort
  if (filters?.sortBy === "name") {
    results.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  }

  return results.slice(0, 25);
}

export function getFilterOptions() {
  const brands = [...new Set(DEVICES.map((d) => d.brand))].sort();
  const categories = [...new Set(DEVICES.map((d) => d.category))].sort();
  return { brands, categories };
}

/** Normalize text: strip accents, punctuation, lowercase */
function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/["'''″]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Enhanced scoring with fuzzy matching and typo tolerance */
function calculateEnhancedScore(query: string, tokens: string[], text: string): number {
  let score = 0;

  // Exact full match (highest priority)
  if (text === query) return 100;

  // Starts with query
  if (text.startsWith(query)) score += 40;

  // Contains exact query as substring
  if (text.includes(query)) score += 30;

  // Per-token scoring
  for (const token of tokens) {
    if (token.length < 2) continue;

    // Exact token match in text
    if (text.includes(token)) {
      score += 10;

      // Bonus: token at start of text
      if (text.startsWith(token)) score += 5;

      // Bonus: token matches a word boundary
      const wordBoundaryRegex = new RegExp(`(?:^|\\s)${escapeRegex(token)}`, "i");
      if (wordBoundaryRegex.test(text)) score += 3;
    } else {
      // Fuzzy matching: allow 1-2 character differences for tokens >= 4 chars
      if (token.length >= 4) {
        const fuzzyScore = fuzzyMatch(token, text);
        score += fuzzyScore;
      }
    }
  }

  // Typo tolerance: check if query is close to any word in text
  if (score === 0 && query.length >= 3) {
    const textWords = text.split(/\s+/);
    for (const word of textWords) {
      if (word.length < 3) continue;
      const distance = levenshteinDistance(query, word.slice(0, query.length));
      if (distance <= 1 && query.length >= 4) score += 5;
      else if (distance <= 2 && query.length >= 6) score += 3;
    }
  }

  return score;
}

/** Fuzzy match: find token in text with small edits allowed */
function fuzzyMatch(token: string, text: string): number {
  const textWords = text.split(/\s+/);
  let bestScore = 0;

  for (const word of textWords) {
    if (Math.abs(word.length - token.length) > 2) continue;

    // Prefix match (e.g., "sams" matches "samsung")
    if (word.startsWith(token) || token.startsWith(word)) {
      bestScore = Math.max(bestScore, 6);
      continue;
    }

    // Containment (e.g., "galax" matches "galaxy")
    if (word.includes(token) || token.includes(word)) {
      bestScore = Math.max(bestScore, 4);
      continue;
    }

    // Levenshtein distance for close matches
    const maxLen = Math.max(token.length, word.length);
    if (maxLen <= 8) {
      const dist = levenshteinDistance(token, word);
      if (dist === 1) bestScore = Math.max(bestScore, 4);
      else if (dist === 2 && token.length >= 5) bestScore = Math.max(bestScore, 2);
    }
  }

  return bestScore;
}

/** Levenshtein distance between two strings */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0) as number[]);

  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(dp[i - 1]![j]! + 1, dp[i]![j - 1]! + 1, dp[i - 1]![j - 1]! + cost);
    }
  }

  return dp[m]![n]!;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
