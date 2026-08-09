import { DEVICES, brandName, type Device } from "@/data/catalog";

/** Normalize text: strip accents, punctuation, lowercase */
export const normalizeText = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/["'''″]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export type DeviceMatch = { device: Device; score: number };

/** Levenshtein distance */
function levenshtein(a: string, b: string): number {
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

/**
 * Smart device search: all query tokens must appear somewhere in
 * name + brand + series + category. Fuzzy matching with typo tolerance.
 */
export function searchDevices(raw: string): DeviceMatch[] {
  const q = normalizeText(raw);
  if (!q) return [];
  const tokens = q.split(" ").filter(Boolean);

  const out: DeviceMatch[] = [];
  for (const d of DEVICES) {
    const name = normalizeText(d.name);
    const brand = normalizeText(brandName(d.brand));
    const series = normalizeText(d.series);
    const category = normalizeText(d.category);
    const haystack = `${name} ${brand} ${series} ${category}`;

    // Check if all tokens match (with fuzzy tolerance)
    const allMatch = tokens.every((t) => {
      if (haystack.includes(t)) return true;
      // Fuzzy: allow 1 edit for tokens >= 4 chars
      if (t.length >= 4) {
        const words = haystack.split(" ");
        return words.some((w) => {
          if (Math.abs(w.length - t.length) > 2) return false;
          return levenshtein(t, w) <= 1 || w.startsWith(t) || t.startsWith(w);
        });
      }
      return false;
    });

    if (!allMatch) continue;

    // Scoring
    let score: number;
    if (name === q) score = 0;
    else if (name.startsWith(q)) score = 1;
    else if (name.includes(q)) score = 2;
    else if (tokens.length === 1 && name.includes(tokens[0]!)) score = 3;
    else score = 4;

    // Bonus: exact brand match
    if (tokens.some((t) => brand.includes(t))) score = Math.max(0, score - 1);

    out.push({ device: d, score });
  }

  return out.sort((a, b) => a.score - b.score || a.device.name.localeCompare(b.device.name));
}
