import { fault, type Device, type Fault } from "./types";

const f = fault;

/* ── Helpers Électroménager ─────────────────────────────────────────────── */

type BigTier =
  "frigo" | "lave-linge" | "clim" | "micro-ondes" | "four" | "lave-vaisselle" | "congelateur";

const BIG: Record<
  BigTier,
  { moteur: number; carte: number; compresseur: number; resistance: number; joint: number }
> = {
  frigo: { moteur: 0, carte: 35000, compresseur: 85000, resistance: 25000, joint: 18000 },
  congelateur: { moteur: 0, carte: 38000, compresseur: 95000, resistance: 28000, joint: 20000 },
  "lave-linge": { moteur: 45000, carte: 32000, compresseur: 0, resistance: 22000, joint: 15000 },
  clim: { moteur: 0, carte: 40000, compresseur: 90000, resistance: 0, joint: 20000 },
  "micro-ondes": { moteur: 20000, carte: 28000, compresseur: 0, resistance: 0, joint: 12000 },
  four: { moteur: 0, carte: 30000, compresseur: 0, resistance: 24000, joint: 15000 },
  "lave-vaisselle": {
    moteur: 42000,
    carte: 35000,
    compresseur: 0,
    resistance: 25000,
    joint: 16000,
  },
};

function BigAppliance(
  slug: string,
  name: string,
  brand: string,
  year: number,
  tier: BigTier,
  category: "Électroménager" | "Petit électroménager",
): Device {
  const t = BIG[tier];
  const faults: Fault[] = [
    f("carte", "Réparation carte électronique", t.carte, "48 h", "3 mois", "Composants CMS"),
  ];
  if (t.compresseur)
    faults.push(
      f(
        "compresseur",
        "Remplacement compresseur / moteur",
        t.compresseur,
        "72 h",
        "6 mois",
        "Compresseur compatible",
      ),
    );
  if (t.moteur)
    faults.push(
      f("moteur", "Remplacement moteur", t.moteur, "48 h", "6 mois", "Moteur compatible"),
    );
  if (t.resistance)
    faults.push(
      f(
        "resistance",
        "Remplacement résistance chauffante",
        t.resistance,
        "24 h",
        "3 mois",
        "Résistance compatible",
      ),
    );
  if (t.joint)
    faults.push(f("joint", "Remplacement joint de porte", t.joint, "6 h", "6 mois", "Joint neuf"));
  return {
    slug,
    name,
    brand,
    series: name.split(" ").slice(0, 2).join(" "),
    category,
    year,
    faults,
  };
}

/* ── Helpers Petit électroménager ───────────────────────────────────────── */

type SmallTier =
  | "blender"
  | "fer"
  | "cafetiere"
  | "bouilloire"
  | "robot"
  | "ventilateur"
  | "aspirateur"
  | "grille-pain";

const SMALL: Record<
  SmallTier,
  { moteur: number; resistance: number; carte: number; lame: number }
> = {
  blender: { moteur: 12000, resistance: 0, carte: 8000, lame: 7000 },
  fer: { moteur: 0, resistance: 10000, carte: 6000, lame: 0 },
  cafetiere: { moteur: 0, resistance: 12000, carte: 9000, lame: 0 },
  bouilloire: { moteur: 0, resistance: 9000, carte: 5000, lame: 0 },
  robot: { moteur: 18000, resistance: 0, carte: 10000, lame: 9000 },
  ventilateur: { moteur: 14000, resistance: 0, carte: 7000, lame: 5000 },
  aspirateur: { moteur: 20000, resistance: 0, carte: 12000, lame: 0 },
  "grille-pain": { moteur: 0, resistance: 11000, carte: 6000, lame: 0 },
};

function SmallAppliance(
  slug: string,
  name: string,
  brand: string,
  year: number,
  tier: SmallTier,
): Device {
  const t = SMALL[tier];
  const faults: Fault[] = [
    f("carte", "Réparation carte électronique", t.carte, "24 h", "3 mois", "Composants CMS"),
  ];
  if (t.moteur)
    faults.push(
      f("moteur", "Remplacement moteur", t.moteur, "24 h", "3 mois", "Moteur compatible"),
    );
  if (t.resistance)
    faults.push(
      f(
        "resistance",
        "Remplacement résistance chauffante",
        t.resistance,
        "24 h",
        "3 mois",
        "Résistance compatible",
      ),
    );
  if (t.lame)
    faults.push(
      f("lame", "Remplacement lames / accessoire", t.lame, "6 h", "3 mois", "Pièce compatible"),
    );
  return {
    slug,
    name,
    brand,
    series: name.split(" ").slice(0, 2).join(" "),
    category: "Petit électroménager",
    year,
    faults,
  };
}

/* ── Helpers Audio & Hi-Fi ──────────────────────────────────────────────── */

type AudioTier = "casque" | "enceinte" | "soundbar" | "micro" | "tvbox";

const AUDIO: Record<
  AudioTier,
  { hp: number; batterie: number; carte: number; connecteur: number }
> = {
  casque: { hp: 15000, batterie: 12000, carte: 10000, connecteur: 8000 },
  enceinte: { hp: 22000, batterie: 18000, carte: 14000, connecteur: 10000 },
  soundbar: { hp: 45000, batterie: 0, carte: 25000, connecteur: 15000 },
  micro: { hp: 0, batterie: 10000, carte: 12000, connecteur: 8000 },
  tvbox: { hp: 0, batterie: 0, carte: 18000, connecteur: 12000 },
};

function AudioDevice(
  slug: string,
  name: string,
  brand: string,
  year: number,
  tier: AudioTier,
): Device {
  const t = AUDIO[tier];
  const faults: Fault[] = [
    f("carte", "Réparation carte électronique", t.carte, "24 h", "3 mois", "Composants CMS"),
  ];
  if (t.hp)
    faults.push(
      f("hp", "Remplacement haut-parleur", t.hp, "6 h", "3 mois", "Haut-parleur compatible"),
    );
  if (t.batterie)
    faults.push(
      f("batterie", "Remplacement batterie", t.batterie, "3 h", "3 mois", "Batterie certifiée"),
    );
  faults.push(
    f(
      "connecteur",
      "Remplacement connecteur / prise",
      t.connecteur,
      "6 h",
      "3 mois",
      "Connecteur compatible",
    ),
  );
  return {
    slug,
    name,
    brand,
    series: name.split(" ").slice(0, 2).join(" "),
    category: "Audio & Hi-Fi",
    year,
    faults,
  };
}

/* ── Helpers TV & Vidéo ─────────────────────────────────────────────────── */

type TvTier = "tv-hd" | "tv-4k" | "tv-oled" | "projecteur";

const TV: Record<TvTier, { dalle: number; backlight: number; carte: number; alim: number }> = {
  "tv-hd": { dalle: 65000, backlight: 25000, carte: 30000, alim: 25000 },
  "tv-4k": { dalle: 120000, backlight: 35000, carte: 38000, alim: 30000 },
  "tv-oled": { dalle: 280000, backlight: 0, carte: 50000, alim: 35000 },
  projecteur: { dalle: 0, backlight: 0, carte: 45000, alim: 40000 },
};

function TvDevice(slug: string, name: string, brand: string, year: number, tier: TvTier): Device {
  const t = TV[tier];
  const faults: Fault[] = [
    f("carte", "Réparation carte mère", t.carte, "48 h", "3 mois", "Composants CMS"),
    f(
      "alim",
      "Réparation bloc d'alimentation",
      t.alim,
      "48 h",
      "3 mois",
      "Alimentation compatible",
    ),
  ];
  if (t.dalle)
    faults.unshift(f("dalle", "Remplacement dalle", t.dalle, "72 h", "6 mois", "Dalle compatible"));
  if (t.backlight)
    faults.push(
      f(
        "backlight",
        "Remplacement rétroéclairage LED",
        t.backlight,
        "48 h",
        "3 mois",
        "Bandes LED",
      ),
    );
  return {
    slug,
    name,
    brand,
    series: name.split(" ").slice(0, 2).join(" "),
    category: "TV & Vidéo",
    year,
    faults,
  };
}

/* ── Helpers Outillage ──────────────────────────────────────────────────── */

type ToolTier = "perceuse" | "meuleuse" | "ponceuse" | "scie" | "tondeuse";

const TOOL: Record<ToolTier, { moteur: number; batterie: number; carte: number }> = {
  perceuse: { moteur: 20000, batterie: 22000, carte: 12000 },
  meuleuse: { moteur: 25000, batterie: 24000, carte: 14000 },
  ponceuse: { moteur: 18000, batterie: 20000, carte: 10000 },
  scie: { moteur: 28000, batterie: 26000, carte: 15000 },
  tondeuse: { moteur: 35000, batterie: 30000, carte: 18000 },
};

function ToolDevice(
  slug: string,
  name: string,
  brand: string,
  year: number,
  tier: ToolTier,
): Device {
  const t = TOOL[tier];
  return {
    slug,
    name,
    brand,
    series: name.split(" ").slice(0, 2).join(" "),
    category: "Outillage & Bricolage",
    year,
    faults: [
      f("moteur", "Remplacement moteur", t.moteur, "24 h", "3 mois", "Moteur compatible"),
      f("batterie", "Remplacement batterie", t.batterie, "6 h", "3 mois", "Batterie compatible"),
      f("carte", "Réparation carte de commande", t.carte, "24 h", "3 mois", "Composants CMS"),
    ],
  };
}

export const DEVICES: Device[] = [
  // ── Électroménager (gros) ───────────────────────────────────────────────
  BigAppliance(
    "frigo-samsung-2018",
    "Samsung Réfrigérateur No Frost",
    "samsung",
    2018,
    "frigo",
    "Électroménager",
  ),
  BigAppliance(
    "frigo-samsung-2021",
    "Samsung Réfrigérateur French Door",
    "samsung",
    2021,
    "frigo",
    "Électroménager",
  ),
  BigAppliance("frigo-lg-2019", "LG Réfrigérateur Inverter", "lg", 2019, "frigo", "Électroménager"),
  BigAppliance(
    "frigo-whirlpool-2017",
    "Whirlpool Réfrigérateur",
    "whirlpool",
    2017,
    "frigo",
    "Électroménager",
  ),
  BigAppliance(
    "frigo-hisense-2020",
    "Hisense Réfrigérateur",
    "hisense",
    2020,
    "frigo",
    "Électroménager",
  ),
  BigAppliance(
    "congelateur-lg-2018",
    "LG Congélateur coffre",
    "lg",
    2018,
    "congelateur",
    "Électroménager",
  ),
  BigAppliance(
    "congelateur-hisense-2019",
    "Hisense Congélateur",
    "hisense",
    2019,
    "congelateur",
    "Électroménager",
  ),
  BigAppliance(
    "lave-linge-samsung-2019",
    "Samsung Machine à laver",
    "samsung",
    2019,
    "lave-linge",
    "Électroménager",
  ),
  BigAppliance(
    "lave-linge-lg-2020",
    "LG Machine à laver Inverter",
    "lg",
    2020,
    "lave-linge",
    "Électroménager",
  ),
  BigAppliance(
    "lave-linge-whirlpool-2018",
    "Whirlpool Machine à laver",
    "whirlpool",
    2018,
    "lave-linge",
    "Électroménager",
  ),
  BigAppliance(
    "lave-linge-bosch-2021",
    "Bosch Machine à laver",
    "bosch",
    2021,
    "lave-linge",
    "Électroménager",
  ),
  BigAppliance(
    "clim-samsung-2019",
    "Samsung Climatiseur Split",
    "samsung",
    2019,
    "clim",
    "Électroménager",
  ),
  BigAppliance(
    "clim-lg-2020",
    "LG Climatiseur Dual Inverter",
    "lg",
    2020,
    "clim",
    "Électroménager",
  ),
  BigAppliance(
    "clim-hisense-2021",
    "Hisense Climatiseur",
    "hisense",
    2021,
    "clim",
    "Électroménager",
  ),
  BigAppliance(
    "micro-ondes-samsung-2018",
    "Samsung Micro-ondes",
    "samsung",
    2018,
    "micro-ondes",
    "Petit électroménager",
  ),
  BigAppliance(
    "micro-ondes-lg-2020",
    "LG Micro-ondes",
    "lg",
    2020,
    "micro-ondes",
    "Petit électroménager",
  ),
  BigAppliance(
    "micro-ondes-philips-2019",
    "Philips Micro-ondes",
    "philips",
    2019,
    "micro-ondes",
    "Petit électroménager",
  ),
  BigAppliance(
    "four-samsung-2020",
    "Samsung Four encastrable",
    "samsung",
    2020,
    "four",
    "Électroménager",
  ),
  BigAppliance(
    "four-bosch-2019",
    "Bosch Four encastrable",
    "bosch",
    2019,
    "four",
    "Électroménager",
  ),
  BigAppliance(
    "four-whirlpool-2017",
    "Whirlpool Four",
    "whirlpool",
    2017,
    "four",
    "Électroménager",
  ),
  BigAppliance(
    "lave-vaisselle-bosch-2020",
    "Bosch Lave-vaisselle",
    "bosch",
    2020,
    "lave-vaisselle",
    "Électroménager",
  ),
  BigAppliance(
    "lave-vaisselle-samsung-2019",
    "Samsung Lave-vaisselle",
    "samsung",
    2019,
    "lave-vaisselle",
    "Électroménager",
  ),
  BigAppliance(
    "lave-vaisselle-whirlpool-2018",
    "Whirlpool Lave-vaisselle",
    "whirlpool",
    2018,
    "lave-vaisselle",
    "Électroménager",
  ),

  // ── Petit électroménager ────────────────────────────────────────────────
  SmallAppliance("blender-philips-2020", "Philips Blender", "philips", 2020, "blender"),
  SmallAppliance("blender-samsung-2019", "Samsung Mixeur", "samsung", 2019, "blender"),
  SmallAppliance("blender-lg-2021", "LG Mixeur", "lg", 2021, "blender"),
  SmallAppliance("fer-philips-2020", "Philips Fer à repasser", "philips", 2020, "fer"),
  SmallAppliance("fer-tcl-2019", "TCL Fer à repasser", "tcl", 2019, "fer"),
  SmallAppliance(
    "cafetiere-philips-2020",
    "Philips Cafetière filtre",
    "philips",
    2020,
    "cafetiere",
  ),
  SmallAppliance("cafetiere-samsung-2018", "Samsung Cafetière", "samsung", 2018, "cafetiere"),
  SmallAppliance("bouilloire-philips-2019", "Philips Bouilloire", "philips", 2019, "bouilloire"),
  SmallAppliance("robot-philips-2021", "Philips Robot culinaire", "philips", 2021, "robot"),
  SmallAppliance("robot-samsung-2020", "Samsung Robot culinaire", "samsung", 2020, "robot"),
  SmallAppliance("ventilateur-samsung-2018", "Samsung Ventilateur", "samsung", 2018, "ventilateur"),
  SmallAppliance("ventilateur-lg-2019", "LG Ventilateur", "lg", 2019, "ventilateur"),
  SmallAppliance("ventilateur-hisense-2020", "Hisense Ventilateur", "hisense", 2020, "ventilateur"),
  SmallAppliance("aspirateur-philips-2020", "Philips Aspirateur", "philips", 2020, "aspirateur"),
  SmallAppliance("aspirateur-samsung-2019", "Samsung Aspirateur", "samsung", 2019, "aspirateur"),
  SmallAppliance("grille-pain-philips-2018", "Philips Grille-pain", "philips", 2018, "grille-pain"),
  SmallAppliance("grille-pain-tcl-2020", "TCL Grille-pain", "tcl", 2020, "grille-pain"),

  // ── Audio & Hi-Fi ───────────────────────────────────────────────────────
  AudioDevice("casque-sony-2020", "Sony Casque Bluetooth", "sony", 2020, "casque"),
  AudioDevice("casque-sony-2023", "Sony Casque WH-1000XM5", "sony", 2023, "casque"),
  AudioDevice("casque-jbl-2021", "JBL Casque Tune", "jbl", 2021, "casque"),
  AudioDevice("casque-jbl-2023", "JBL Casque Live", "jbl", 2023, "casque"),
  AudioDevice("casque-bose-2022", "Bose Casque QuietComfort", "bose", 2022, "casque"),
  AudioDevice("casque-samsung-2020", "Samsung Galaxy Buds Pro", "samsung", 2020, "casque"),
  AudioDevice("casque-apple-airpods", "Apple AirPods Pro 2", "apple", 2022, "casque"),
  AudioDevice("enceinte-jbl-2020", "JBL Enceinte Flip", "jbl", 2020, "enceinte"),
  AudioDevice("enceinte-jbl-2022", "JBL Enceinte Charge", "jbl", 2022, "enceinte"),
  AudioDevice("enceinte-bose-2021", "Bose Enceinte SoundLink", "bose", 2021, "enceinte"),
  AudioDevice("enceinte-sony-2019", "Sony Enceinte SRS-XB", "sony", 2019, "enceinte"),
  AudioDevice("enceinte-samsung-2021", "Samsung Enceinte Bluetooth", "samsung", 2021, "enceinte"),
  AudioDevice("soundbar-samsung-2020", "Samsung Soundbar", "samsung", 2020, "soundbar"),
  AudioDevice("soundbar-lg-2021", "LG Soundbar", "lg", 2021, "soundbar"),
  AudioDevice("soundbar-sony-2022", "Sony Soundbar", "sony", 2022, "soundbar"),
  AudioDevice("micro-sony-2020", "Sony Micro cravate", "sony", 2020, "micro"),
  AudioDevice("micro-philips-2019", "Philips Micro", "philips", 2019, "micro"),

  // ── TV & Vidéo ──────────────────────────────────────────────────────────
  TvDevice("tv-samsung-hd-2018", "Samsung TV HD 32″", "samsung", 2018, "tv-hd"),
  TvDevice("tv-samsung-4k-2020", "Samsung TV 4K 55″", "samsung", 2020, "tv-4k"),
  TvDevice("tv-samsung-4k-2022", "Samsung TV Neo QLED 4K", "samsung", 2022, "tv-4k"),
  TvDevice("tv-samsung-oled-2023", "Samsung TV OLED 55″", "samsung", 2023, "tv-oled"),
  TvDevice("tv-lg-hd-2018", "LG TV HD 32″", "lg", 2018, "tv-hd"),
  TvDevice("tv-lg-4k-2020", "LG TV 4K 55″", "lg", 2020, "tv-4k"),
  TvDevice("tv-lg-oled-2021", "LG TV OLED 55″", "lg", 2021, "tv-oled"),
  TvDevice("tv-lg-oled-2023", "LG TV OLED 65″", "lg", 2023, "tv-oled"),
  TvDevice("tv-sony-4k-2020", "Sony TV Bravia 4K", "sony", 2020, "tv-4k"),
  TvDevice("tv-sony-oled-2022", "Sony TV Bravia OLED", "sony", 2022, "tv-oled"),
  TvDevice("tv-hisense-hd-2019", "Hisense TV HD 32″", "hisense", 2019, "tv-hd"),
  TvDevice("tv-hisense-4k-2021", "Hisense TV 4K 55″", "hisense", 2021, "tv-4k"),
  TvDevice("tv-tcl-hd-2020", "TCL TV HD 32″", "tcl", 2020, "tv-hd"),
  TvDevice("tv-tcl-4k-2021", "TCL TV 4K 55″", "tcl", 2021, "tv-4k"),
  TvDevice("tv-philips-4k-2020", "Philips TV 4K 50″", "philips", 2020, "tv-4k"),
  TvDevice("projecteur-lg-2019", "LG Vidéoprojecteur", "lg", 2019, "projecteur"),
  TvDevice("projecteur-samsung-2020", "Samsung The Freestyle", "samsung", 2020, "projecteur"),
  TvDevice("projecteur-hisense-2021", "Hisense Vidéoprojecteur", "hisense", 2021, "projecteur"),

  // ── Outillage & Bricolage ───────────────────────────────────────────────
  ToolDevice("perceuse-bosch-2019", "Bosch Perceuse sans fil", "bosch", 2019, "perceuse"),
  ToolDevice("perceuse-bosch-2022", "Bosch Perceuse visseuse", "bosch", 2022, "perceuse"),
  ToolDevice("perceuse-lg-2020", "LG Perceuse", "lg", 2020, "perceuse"),
  ToolDevice("meuleuse-bosch-2020", "Bosch Meuleuse", "bosch", 2020, "meuleuse"),
  ToolDevice("ponceuse-bosch-2019", "Bosch Ponceuse", "bosch", 2019, "ponceuse"),
  ToolDevice("scie-bosch-2021", "Bosch Scie circulaire", "bosch", 2021, "scie"),
  ToolDevice("scie-lg-2020", "LG Scie sauteuse", "lg", 2020, "scie"),
  ToolDevice("tondeuse-bosch-2018", "Bosch Tondeuse", "bosch", 2018, "tondeuse"),
  ToolDevice("tondeuse-whirlpool-2019", "Whirlpool Tondeuse", "whirlpool", 2019, "tondeuse"),
];
