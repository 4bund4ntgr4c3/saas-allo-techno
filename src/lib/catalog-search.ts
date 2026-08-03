import { DEVICES, brandName, type Device } from "@/data/catalog";

/**
 * Normalisation « intelligente » : insensible aux accents, à la casse et aux
 * ponctuations (« écràn 17 aire » → « ecran 17 air »), utile pour la recherche.
 */
export const normalizeText = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/["'’″]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export type DeviceMatch = { device: Device; score: number };

/**
 * Recherche parmi tous les appareils : tous les termes doivent correspondre
 * (nom, marque, série ou catégorie), tri par pertinence décroissante.
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
    if (!tokens.every((t) => haystack.includes(t))) continue;

    let score: number;
    if (name === q) score = 0;
    else if (name.startsWith(q)) score = 1;
    else if (name.includes(q)) score = 2;
    else if (tokens.length === 1 && name.includes(tokens[0]!)) score = 3;
    else score = 4;

    out.push({ device: d, score });
  }

  return out.sort((a, b) => a.score - b.score || a.device.name.localeCompare(b.device.name));
}
