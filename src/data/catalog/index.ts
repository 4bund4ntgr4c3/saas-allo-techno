// Catalogue Allô Techno — données de démonstration (marques, appareils, pannes,
// tarifs, accessoires, blog, FAQ, avis). Source unique pour tout le site.
//
// Ce barrel est volontairement LÉGER : il re-exporte company / static /
// accessories (+ helpers sans données) sans jamais importer le gros DEVICES,
// qui vit dans ./devices (chunk dédié chargé uniquement par les routes qui en
// ont besoin — voir la note en tête de ./devices).
export { COMPANY, absoluteUrl, formatFcfa } from "./company";
export { ACCESSORIES, ACCESSORY_CATEGORIES, type Accessory } from "./accessories";
export { CATEGORIES, POSTS, FAQ, REVIEWS, STEPS, type Post, type Brand } from "./static";
import { BRANDS } from "./static";
export { BRANDS } from "./static";

// Types (effacés à la compilation — aucun coût runtime)
export type { Fault, Device } from "./types";

export const brandBySlug = (slug: string) => BRANDS.find((b) => b.slug === slug);
export const brandName = (slug: string) => brandBySlug(slug)?.name ?? slug;

/**
 * Famille de modèles (génération) déduite du nom commercial :
 * « Samsung Galaxy A56 5G » → « Galaxy A5x », « iPhone 17 Air » → « iPhone 17 »,
 * « Samsung Galaxy S25+ » → « Galaxy S25 », « Tecno Camon 40 Pro » → « Camon 40 »,
 * « HP Laptop 14 (2022) » → « Laptop 14 », « HP EliteBook 820 G4 » → « EliteBook 820 ».
 */
export function familyOf(name: string): string {
  const words = name.replace(/″/g, "").split(" ");
  const PREFIXES = new Set([
    "Samsung",
    "Tecno",
    "Infinix",
    "Google",
    "Xiaomi",
    "Huawei",
    "Oppo",
    "Motorola",
    "Nintendo",
    "Sony",
    "Microsoft",
    "HP",
    "Lenovo",
    "Dell",
    "Itel",
    "Honor",
    "LG",
    "Philips",
    "Hisense",
    "TCL",
    "Bosch",
    "JBL",
    "Bose",
    "Whirlpool",
  ]);
  while (words.length && PREFIXES.has(words[0] ?? "")) words.shift();
  const isWatchUltra =
    words[0] === "Galaxy" && words[1] === "Watch" && words[words.length - 1] === "Ultra";
  const VARIANTS = /^(Pro\+?|Max|Plus|Ultra|FE|Mini|5G|Slim|HD|Neo|Premier|Curve|Air|i|e)$/i;
  while (words.length && VARIANTS.test(words[words.length - 1] ?? "")) words.pop();
  while (words.length && /^\(\d{4}\)$/.test(words[words.length - 1] ?? "")) words.pop();
  while (words.length && /^G\d{1,2}$/i.test(words[words.length - 1] ?? "")) words.pop();
  if (isWatchUltra) words.push("Ultra");
  const last = words[words.length - 1] ?? "";
  if (words.length && !/^m\d+$/i.test(last) && /\d+[A-Za-z+]+$/.test(last)) {
    words[words.length - 1] = last.replace(/(\d+)[A-Za-z+]*$/, "$1");
  }
  if (words[0] === "Galaxy" && /^A\d{2,3}$/.test(words[1] ?? "")) {
    words[1] = words[1]!.replace(/^A(\d).*$/, "A$1x");
    return words.slice(0, 2).join(" ");
  }
  return words.join(" ");
}
