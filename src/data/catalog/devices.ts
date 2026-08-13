// DEVICES — catalogue lourd des appareils, isolé du barrel léger
// (company/static/accessories). Ce module vit dans son propre chunk, chargé
// uniquement par les routes qui listent ou consultent les appareils
// (catalogue, tarifs, reparations, devis, appareil/$slug...).
// IMPORTANT : ne pas importer company/static/accessories ici — les modules
// partagés avec l'entrée seraient absorbés dans ce chunk.

import type { Device } from "./types";
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

export type { Fault, Device } from "./types";

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

export const deviceBySlug = (slug: string) => DEVICES.find((d) => d.slug === slug);
export const devicesOfBrand = (slug: string) => DEVICES.filter((d) => d.brand === slug);