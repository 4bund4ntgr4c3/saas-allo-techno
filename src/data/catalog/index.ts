// Catalogue Allô Techno — données de démonstration (marques, appareils, pannes,
// tarifs, accessoires, blog, FAQ, avis). Source unique pour tout le site.
//
// Les morceaux légers (COMPANY, formatFcfa, ACCESSORIES, BRANDS, CATEGORIES,
// POSTS, FAQ, REVIEWS, STEPS) vivent dans des modules séparés : __root / Header /
// Footer / CartProvider / page d'accueil les importent sans charger le gros
// DEVICES (~500 Ko) au premier rendu.
export { COMPANY, absoluteUrl, formatFcfa } from "./company";
export { ACCESSORIES, ACCESSORY_CATEGORIES, type Accessory } from "./accessories";
export { CATEGORIES, POSTS, FAQ, REVIEWS, STEPS, type Post, type Brand } from "./static";

// Types
import type { Device } from "./types";
export type { Fault, Device } from "./types";
import { BRANDS } from "./static";
export { BRANDS };

// Import brand device arrays
import { DEVICES as infinixDevices } from "./infinix";
import { DEVICES as tecnoDevices } from "./tecno";
import { DEVICES as samsungDevices } from "./samsung";
import { DEVICES as appleDevices } from "./apple";
import { DEVICES as miscDevices } from "./misc";
import { DEVICES as huaweiDevices } from "./huawei";
import { DEVICES as googleDevices } from "./google";
import { DEVICES as oneplusDevices } from "./oneplus";
import { DEVICES as honorDevices } from "./honor";
import { DEVICES as sonyDevices } from "./sony";
import { DEVICES as realmeDevices } from "./realme";
import { DEVICES as itelDevices } from "./itel";
import { DEVICES as oppoDevices } from "./oppo";
import { DEVICES as xiaomiDevices } from "./xiaomi";
import { DEVICES as hpDevices } from "./hp";
import { DEVICES as appliancesDevices } from "./appliances";

// Combined DEVICES array (lazy-loaded; voir la note en tête de fichier)
export const DEVICES: Device[] = [
  ...infinixDevices,
  ...tecnoDevices,
  ...samsungDevices,
  ...appleDevices,
  ...miscDevices,
  ...huaweiDevices,
  ...googleDevices,
  ...oneplusDevices,
  ...honorDevices,
  ...sonyDevices,
  ...realmeDevices,
  ...itelDevices,
  ...oppoDevices,
  ...xiaomiDevices,
  ...hpDevices,
  ...appliancesDevices,
];

export const brandBySlug = (slug: string) => BRANDS.find((b) => b.slug === slug);
export const devicesOfBrand = (slug: string) => DEVICES.filter((d) => d.brand === slug);
export const deviceBySlug = (slug: string) => DEVICES.find((d) => d.slug === slug);
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
