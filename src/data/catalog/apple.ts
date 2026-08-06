import { fault, type Device, type Fault } from "./types";

const f = fault;

/* ── Helpers iPhone ─────────────────────────────────────────────────────── */

type IPhoneTier = "old" | "x" | "gen12" | "gen13" | "gen14" | "gen15" | "gen16" | "gen17";

const IPHONE: Record<
  IPhoneTier,
  {
    base: number;
    bat: number;
    pro: number;
    promax: number;
    proBat: number;
    connector: string;
    cam: number;
  }
> = {
  old: {
    base: 45000,
    bat: 22000,
    pro: 0,
    promax: 0,
    proBat: 24000,
    connector: "Nappe de charge d'origine",
    cam: 0,
  },
  x: {
    base: 65000,
    bat: 26000,
    pro: 80000,
    promax: 90000,
    proBat: 30000,
    connector: "Nappe de charge d'origine",
    cam: 35000,
  },
  gen12: {
    base: 75000,
    bat: 30000,
    pro: 95000,
    promax: 115000,
    proBat: 35000,
    connector: "Nappe de charge d'origine",
    cam: 55000,
  },
  gen13: {
    base: 75000,
    bat: 30000,
    pro: 95000,
    promax: 115000,
    proBat: 35000,
    connector: "Nappe de charge d'origine",
    cam: 55000,
  },
  gen14: {
    base: 85000,
    bat: 33000,
    pro: 115000,
    promax: 145000,
    proBat: 40000,
    connector: "Nappe USB-C d'origine",
    cam: 60000,
  },
  gen15: {
    base: 95000,
    bat: 38000,
    pro: 135000,
    promax: 165000,
    proBat: 45000,
    connector: "Nappe USB-C d'origine",
    cam: 65000,
  },
  gen16: {
    base: 145000,
    bat: 48000,
    pro: 175000,
    promax: 195000,
    proBat: 52000,
    connector: "Nappe USB-C d'origine",
    cam: 78000,
  },
  gen17: {
    base: 155000,
    bat: 50000,
    pro: 185000,
    promax: 215000,
    proBat: 55000,
    connector: "Nappe USB-C d'origine",
    cam: 85000,
  },
};

type IPhoneVariant = "base" | "plus" | "mini" | "pro" | "promax" | "se";

function iPhone(
  slug: string,
  name: string,
  year: number,
  tier: IPhoneTier,
  variant: IPhoneVariant,
): Device {
  const t = IPHONE[tier];
  const faults: Fault[] = [
    f(
      "ecran",
      variant === "pro" || variant === "promax" ? "Écran Super Retina XDR" : "Écran OLED complet",
      variant === "promax"
        ? t.promax
        : variant === "pro"
          ? t.pro
          : variant === "plus"
            ? Math.round(t.base * 1.1)
            : variant === "mini"
              ? Math.round(t.base * 0.85)
              : t.base,
      "35 min",
      "6 mois",
      "Écran OLED grade A+",
    ),
    f(
      "batterie",
      "Remplacement batterie",
      variant === "pro" || variant === "promax" ? t.proBat : t.bat,
      "30 min",
      "6 mois",
      "Batterie certifiée",
    ),
    f(
      "connecteur",
      tier === "old" || tier === "x" || tier === "gen12" || tier === "gen13" || variant === "se"
        ? "Connecteur de charge Lightning"
        : "Port USB-C",
      variant === "promax" || variant === "pro"
        ? Math.round((variant === "promax" ? t.promax : t.pro) / 5)
        : Math.round(t.base / 4.5),
      "50 min",
      "3 mois",
      t.connector,
    ),
  ];
  if (variant === "pro" || variant === "promax") {
    faults.push(
      f("camera", "Bloc caméra arrière", t.cam, "70 min", "6 mois", "Module triple capteur"),
    );
    faults.push(
      f(
        "vitre-arriere",
        "Vitre arrière",
        Math.round(t.cam * 0.85),
        "90 min",
        "3 mois",
        "Verre trempé laminé",
      ),
    );
  } else {
    faults.push(
      f(
        "desoxydation",
        "Désoxydation carte mère",
        20000,
        "48 h",
        "1 mois",
        "Bain ultrasons + reflow",
      ),
    );
  }
  return { slug, name, brand: "apple", series: "iPhone", category: "Smartphone", year, faults };
}

/* ── Helpers iPad ───────────────────────────────────────────────────────── */

type IpadTier = "mini" | "base" | "air" | "pro";

const IPAD: Record<IpadTier, { ecran: number; bat: number; conn: number }> = {
  mini: { ecran: 70000, bat: 32000, conn: 22000 },
  base: { ecran: 85000, bat: 38000, conn: 25000 },
  air: { ecran: 105000, bat: 48000, conn: 28000 },
  pro: { ecran: 160000, bat: 62000, conn: 32000 },
};

function iPad(slug: string, name: string, year: number, tier: IpadTier): Device {
  const t = IPAD[tier];
  const faults: Fault[] = [
    f(
      "ecran",
      tier === "pro" ? "Dalle OLED laminée" : "Vitre tactile + LCD",
      t.ecran,
      "3 h",
      "6 mois",
      "Ensemble écran laminé",
    ),
    f("batterie", "Batterie interne", t.bat, "6 h", "6 mois", "Batterie certifiée"),
    f("connecteur", "Port Lightning/USB-C", t.conn, "6 h", "3 mois", "Nappe de charge"),
  ];
  if (tier === "pro") {
    faults.push(
      f("carte-mere", "Micro-soudure carte mère", 90000, "72 h", "3 mois", "Composants CMS"),
    );
  }
  return { slug, name, brand: "apple", series: "iPad", category: "Tablette", year, faults };
}

/* ── Helpers MacBook ────────────────────────────────────────────────────── */

type MacTier =
  "airIntel" | "airM" | "proIntel13" | "proIntel15" | "proM14" | "proM16" | "macbook12";

const MAC: Record<MacTier, { ecran: number; bat: number; clavier: number; carte: number }> = {
  airIntel: { ecran: 145000, bat: 48000, clavier: 85000, carte: 65000 },
  airM: { ecran: 195000, bat: 65000, clavier: 115000, carte: 85000 },
  proIntel13: { ecran: 185000, bat: 55000, clavier: 95000, carte: 75000 },
  proIntel15: { ecran: 230000, bat: 65000, clavier: 105000, carte: 85000 },
  proM14: { ecran: 320000, bat: 88000, clavier: 145000, carte: 110000 },
  proM16: { ecran: 360000, bat: 95000, clavier: 150000, carte: 120000 },
  macbook12: { ecran: 135000, bat: 42000, clavier: 75000, carte: 60000 },
};

function MacBook(
  slug: string,
  name: string,
  year: number,
  tier: MacTier,
  series: "MacBook" | "MacBook Air" | "MacBook Pro",
): Device {
  const t = MAC[tier];
  return {
    slug,
    name,
    brand: "apple",
    series,
    category: "Ordinateur portable",
    year,
    faults: [
      f(
        "clavier",
        "Clavier complet (topcase)",
        t.clavier,
        "24 h",
        "1 an",
        "Topcase AZERTY d'origine",
      ),
      f("ecran", "Dalle Retina", t.ecran, "48 h", "6 mois", "Dalle LCD complète"),
      f("batterie", "Batterie interne", t.bat, "3 h", "1 an", "Batterie certifiée"),
      f(
        "carte-mere",
        "Réparation carte mère (micro-soudure)",
        t.carte,
        "72 h",
        "3 mois",
        "Composants CMS",
      ),
    ],
  };
}

/* ── Helpers Mac desktop ────────────────────────────────────────────────── */

type DeskTier = "mini" | "imac" | "imac27" | "studio" | "pro";

const DESK: Record<DeskTier, { alim: number; ssd: number; nettoyage: number; ecran?: number }> = {
  mini: { alim: 55000, ssd: 65000, nettoyage: 18000 },
  imac: { alim: 78000, ssd: 95000, nettoyage: 22000, ecran: 295000 },
  imac27: { alim: 88000, ssd: 105000, nettoyage: 24000, ecran: 380000 },
  studio: { alim: 95000, ssd: 120000, nettoyage: 25000 },
  pro: { alim: 120000, ssd: 150000, nettoyage: 28000 },
};

function MacDesk(slug: string, name: string, year: number, tier: DeskTier, series: string): Device {
  const t = DESK[tier];
  const faults: Fault[] = [
    f("alimentation", "Bloc d'alimentation", t.alim, "48 h", "6 mois", "Alimentation interne"),
    f("ssd", "Upgrade / remplacement SSD", t.ssd, "24 h", "1 an", "SSD NVMe 512 Go"),
    f(
      "nettoyage",
      "Nettoyage complet + pâte thermique",
      t.nettoyage,
      "6 h",
      "1 mois",
      "Pâte thermique premium",
    ),
  ];
  if (t.ecran) {
    faults.unshift(f("ecran", "Dalle Retina", t.ecran, "72 h", "6 mois", "Dalle complète"));
  }
  return { slug, name, brand: "apple", series, category: "Ordinateur de bureau", year, faults };
}

/* ── Helper Apple Watch ─────────────────────────────────────────────────── */

function Watch(
  slug: string,
  name: string,
  year: number,
  ecran: number,
  bat: number,
  series: string,
): Device {
  return {
    slug,
    name,
    brand: "apple",
    series,
    category: "Montre connectée",
    year,
    faults: [
      f("ecran", "Vitre + écran OLED", ecran, "24 h", "3 mois", "Ensemble écran OLED"),
      f("batterie", "Batterie", bat, "24 h", "3 mois", "Batterie certifiée"),
    ],
  };
}

export const DEVICES: Device[] = [
  // ── iPhone 6s → 12 ───────────────────────────────────────────────────────
  iPhone("iphone-6s", "iPhone 6s", 2015, "old", "base"),
  iPhone("iphone-6s-plus", "iPhone 6s Plus", 2015, "old", "plus"),
  iPhone("iphone-se-1", "iPhone SE", 2016, "old", "se"),
  iPhone("iphone-7", "iPhone 7", 2016, "old", "base"),
  iPhone("iphone-7-plus", "iPhone 7 Plus", 2016, "old", "plus"),
  iPhone("iphone-8", "iPhone 8", 2017, "old", "base"),
  iPhone("iphone-8-plus", "iPhone 8 Plus", 2017, "old", "plus"),
  iPhone("iphone-x", "iPhone X", 2017, "x", "base"),
  iPhone("iphone-xr", "iPhone XR", 2018, "x", "base"),
  iPhone("iphone-xs", "iPhone XS", 2018, "x", "pro"),
  iPhone("iphone-xs-max", "iPhone XS Max", 2018, "x", "promax"),
  iPhone("iphone-11", "iPhone 11", 2019, "x", "base"),
  iPhone("iphone-11-pro", "iPhone 11 Pro", 2019, "x", "pro"),
  iPhone("iphone-11-pro-max", "iPhone 11 Pro Max", 2019, "x", "promax"),
  iPhone("iphone-se-2", "iPhone SE 2", 2020, "gen12", "se"),
  iPhone("iphone-12-mini", "iPhone 12 mini", 2020, "gen12", "mini"),
  iPhone("iphone-12", "iPhone 12", 2020, "gen12", "base"),
  iPhone("iphone-12-pro", "iPhone 12 Pro", 2020, "gen12", "pro"),
  iPhone("iphone-12-pro-max", "iPhone 12 Pro Max", 2020, "gen12", "promax"),

  // ── iPhone 13 → 17 (conserve les données existantes) ────────────────────
  iPhone("iphone-13-mini", "iPhone 13 mini", 2021, "gen13", "mini"),
  iPhone("iphone-13", "iPhone 13", 2021, "gen13", "base"),
  iPhone("iphone-13-pro", "iPhone 13 Pro", 2021, "gen13", "pro"),
  iPhone("iphone-13-pro-max", "iPhone 13 Pro Max", 2021, "gen13", "promax"),
  iPhone("iphone-se-3", "iPhone SE 3", 2022, "gen13", "se"),
  iPhone("iphone-14", "iPhone 14", 2022, "gen14", "base"),
  iPhone("iphone-14-plus", "iPhone 14 Plus", 2022, "gen14", "plus"),
  iPhone("iphone-14-pro", "iPhone 14 Pro", 2022, "gen14", "pro"),
  iPhone("iphone-14-pro-max", "iPhone 14 Pro Max", 2022, "gen14", "promax"),
  iPhone("iphone-15", "iPhone 15", 2023, "gen15", "base"),
  iPhone("iphone-15-plus", "iPhone 15 Plus", 2023, "gen15", "plus"),
  iPhone("iphone-15-pro", "iPhone 15 Pro", 2023, "gen15", "pro"),
  iPhone("iphone-15-pro-max", "iPhone 15 Pro Max", 2023, "gen15", "promax"),
  iPhone("iphone-16", "iPhone 16", 2024, "gen16", "base"),
  iPhone("iphone-16-plus", "iPhone 16 Plus", 2024, "gen16", "plus"),
  iPhone("iphone-16-pro", "iPhone 16 Pro", 2024, "gen16", "pro"),
  iPhone("iphone-16-pro-max", "iPhone 16 Pro Max", 2024, "gen16", "promax"),
  iPhone("iphone-16e", "iPhone 16e", 2025, "gen16", "se"),
  iPhone("iphone-17", "iPhone 17", 2025, "gen17", "base"),
  iPhone("iphone-17-air", "iPhone 17 Air", 2025, "gen17", "plus"),
  iPhone("iphone-17-pro", "iPhone 17 Pro", 2025, "gen17", "pro"),
  iPhone("iphone-17-pro-max", "iPhone 17 Pro Max", 2025, "gen17", "promax"),

  // ── iPad ─────────────────────────────────────────────────────────────────
  iPad("ipad-mini-4", "iPad mini 4", 2015, "mini"),
  iPad("ipad-pro-12-9-2015", "iPad Pro 12,9″ (2015)", 2015, "pro"),
  iPad("ipad-pro-9-7", "iPad Pro 9,7″", 2016, "pro"),
  iPad("ipad-5", "iPad 5", 2017, "base"),
  iPad("ipad-pro-10-5", "iPad Pro 10,5″", 2017, "pro"),
  iPad("ipad-pro-12-9-2017", "iPad Pro 12,9″ (2017)", 2017, "pro"),
  iPad("ipad-6", "iPad 6", 2018, "base"),
  iPad("ipad-pro-11-2018", "iPad Pro 11″ (2018)", 2018, "pro"),
  iPad("ipad-pro-12-9-2018", "iPad Pro 12,9″ (2018)", 2018, "pro"),
  iPad("ipad-air-3", "iPad Air 3", 2019, "air"),
  iPad("ipad-mini-5", "iPad mini 5", 2019, "mini"),
  iPad("ipad-7", "iPad 7", 2019, "base"),
  iPad("ipad-pro-11-2020", "iPad Pro 11″ (2020)", 2020, "pro"),
  iPad("ipad-pro-12-9-2020", "iPad Pro 12,9″ (2020)", 2020, "pro"),
  iPad("ipad-8", "iPad 8", 2020, "base"),
  iPad("ipad-air-4", "iPad Air 4", 2020, "air"),
  iPad("ipad-9", "iPad 9", 2021, "base"),
  iPad("ipad-mini-6", "iPad mini 6", 2021, "mini"),
  iPad("ipad-pro-11-2021", "iPad Pro 11″ (2021)", 2021, "pro"),
  iPad("ipad-pro-12-9-2021", "iPad Pro 12,9″ (2021)", 2021, "pro"),
  iPad("ipad-10", "iPad 10", 2022, "base"),
  iPad("ipad-air-5", "iPad Air 5", 2022, "air"),
  iPad("ipad-pro-11-2022", "iPad Pro 11″ (2022)", 2022, "pro"),
  iPad("ipad-pro-12-9-2022", "iPad Pro 12,9″ (2022)", 2022, "pro"),
  iPad("ipad-11", "iPad 11", 2025, "base"),
  iPad("ipad-air-6", "iPad Air 6", 2024, "air"),
  iPad("ipad-air-7", "iPad Air 7", 2025, "air"),
  iPad("ipad-mini-7", "iPad mini 7", 2024, "mini"),
  iPad("ipad-pro-m4", "iPad Pro M4 11″", 2024, "pro"),
  iPad("ipad-pro-m5", "iPad Pro M5 13″", 2025, "pro"),

  // ── MacBook 12″ ──────────────────────────────────────────────────────────
  MacBook("macbook-12-2015", "MacBook 12″ (2015)", 2015, "macbook12", "MacBook"),
  MacBook("macbook-12-2016", "MacBook 12″ (2016)", 2016, "macbook12", "MacBook"),
  MacBook("macbook-12-2017", "MacBook 12″ (2017)", 2017, "macbook12", "MacBook"),

  // ── MacBook Air ──────────────────────────────────────────────────────────
  MacBook("macbook-air-11-2015", "MacBook Air 11″ (2015)", 2015, "airIntel", "MacBook Air"),
  MacBook("macbook-air-13-2015", "MacBook Air 13″ (2015)", 2015, "airIntel", "MacBook Air"),
  MacBook("macbook-air-13-2017", "MacBook Air 13″ (2017)", 2017, "airIntel", "MacBook Air"),
  MacBook("macbook-air-13-2018", "MacBook Air 13″ (2018)", 2018, "airIntel", "MacBook Air"),
  MacBook("macbook-air-13-2019", "MacBook Air 13″ (2019)", 2019, "airIntel", "MacBook Air"),
  MacBook("macbook-air-13-2020", "MacBook Air 13″ (2020 Intel)", 2020, "airIntel", "MacBook Air"),
  MacBook("macbook-air-m1", "MacBook Air M1", 2020, "airM", "MacBook Air"),
  MacBook("macbook-air-m2", "MacBook Air M2", 2022, "airM", "MacBook Air"),
  MacBook("macbook-air-13-m3", "MacBook Air 13″ M3", 2024, "airM", "MacBook Air"),
  MacBook("macbook-air-15-m3", "MacBook Air 15″ M3", 2023, "airM", "MacBook Air"),
  MacBook("macbook-air-m4", "MacBook Air M4", 2025, "airM", "MacBook Air"),

  // ── MacBook Pro ──────────────────────────────────────────────────────────
  MacBook("macbook-pro-13-2015", "MacBook Pro 13″ (2015)", 2015, "proIntel13", "MacBook Pro"),
  MacBook("macbook-pro-15-2015", "MacBook Pro 15″ (2015)", 2015, "proIntel15", "MacBook Pro"),
  MacBook("macbook-pro-13-2016", "MacBook Pro 13″ (2016)", 2016, "proIntel13", "MacBook Pro"),
  MacBook("macbook-pro-15-2016", "MacBook Pro 15″ (2016)", 2016, "proIntel15", "MacBook Pro"),
  MacBook("macbook-pro-13-2017", "MacBook Pro 13″ (2017)", 2017, "proIntel13", "MacBook Pro"),
  MacBook("macbook-pro-15-2017", "MacBook Pro 15″ (2017)", 2017, "proIntel15", "MacBook Pro"),
  MacBook("macbook-pro-13-2018", "MacBook Pro 13″ (2018)", 2018, "proIntel13", "MacBook Pro"),
  MacBook("macbook-pro-15-2018", "MacBook Pro 15″ (2018)", 2018, "proIntel15", "MacBook Pro"),
  MacBook("macbook-pro-13-2019", "MacBook Pro 13″ (2019)", 2019, "proIntel13", "MacBook Pro"),
  MacBook("macbook-pro-15-2019", "MacBook Pro 15″ (2019)", 2019, "proIntel15", "MacBook Pro"),
  MacBook("macbook-pro-16-2019", "MacBook Pro 16″ (2019)", 2019, "proM16", "MacBook Pro"),
  MacBook("macbook-pro-13-2020", "MacBook Pro 13″ (2020 Intel)", 2020, "proIntel13", "MacBook Pro"),
  MacBook("macbook-pro-13-m1", "MacBook Pro 13″ M1", 2020, "proM14", "MacBook Pro"),
  MacBook("macbook-pro-14-m1", "MacBook Pro 14″ M1 Pro", 2021, "proM14", "MacBook Pro"),
  MacBook("macbook-pro-16-m1", "MacBook Pro 16″ M1 Pro", 2021, "proM16", "MacBook Pro"),
  MacBook("macbook-pro-13-m2", "MacBook Pro 13″ M2", 2022, "proM14", "MacBook Pro"),
  MacBook("macbook-pro-14-m2", "MacBook Pro 14″ M2 Pro", 2023, "proM14", "MacBook Pro"),
  MacBook("macbook-pro-16-m2", "MacBook Pro 16″ M2 Pro", 2023, "proM16", "MacBook Pro"),
  MacBook("macbook-pro-14-m3", "MacBook Pro 14″ M3 Pro", 2023, "proM14", "MacBook Pro"),
  MacBook("macbook-pro-16-m3", "MacBook Pro 16″ M3 Pro", 2023, "proM16", "MacBook Pro"),
  MacBook("macbook-pro-14-m4", "MacBook Pro 14″ M4", 2024, "proM14", "MacBook Pro"),
  MacBook("macbook-pro-16-m4", "MacBook Pro 16″ M4", 2024, "proM16", "MacBook Pro"),

  // ── Mac desktop ──────────────────────────────────────────────────────────
  MacDesk("imac-21-5-2015", "iMac 21,5″ (2015)", 2015, "imac", "iMac"),
  MacDesk("imac-27-2015", "iMac 27″ (2015)", 2015, "imac27", "iMac"),
  MacDesk("imac-21-5-2017", "iMac 21,5″ (2017)", 2017, "imac", "iMac"),
  MacDesk("imac-27-2017", "iMac 27″ (2017)", 2017, "imac27", "iMac"),
  MacDesk("imac-21-5-2019", "iMac 21,5″ (2019)", 2019, "imac", "iMac"),
  MacDesk("imac-27-2019", "iMac 27″ (2019)", 2019, "imac27", "iMac"),
  MacDesk("imac-27-2020", "iMac 27″ (2020)", 2020, "imac27", "iMac"),
  MacDesk("imac-24-m1", "iMac 24″ M1", 2021, "imac", "iMac"),
  MacDesk("imac-24-m4", "iMac 24″ M4", 2024, "imac", "iMac"),
  MacDesk("imac-pro-27", "iMac Pro 27″", 2017, "imac27", "iMac Pro"),
  MacDesk("mac-mini-2018", "Mac mini (2018)", 2018, "mini", "Mac mini"),
  MacDesk("mac-mini-m1", "Mac mini M1", 2020, "mini", "Mac mini"),
  MacDesk("mac-mini-m2", "Mac mini M2", 2023, "mini", "Mac mini"),
  MacDesk("mac-mini-m4", "Mac mini M4", 2024, "mini", "Mac mini"),
  MacDesk("mac-studio-m1", "Mac Studio M1", 2022, "studio", "Mac Studio"),
  MacDesk("mac-studio-m2", "Mac Studio M2", 2023, "studio", "Mac Studio"),
  MacDesk("mac-studio-m4", "Mac Studio M4", 2025, "studio", "Mac Studio"),
  MacDesk("mac-pro-2019", "Mac Pro (2019)", 2019, "pro", "Mac Pro"),
  MacDesk("mac-pro-m2", "Mac Pro M2", 2023, "pro", "Mac Pro"),

  // ── Apple Watch ──────────────────────────────────────────────────────────
  Watch("apple-watch-series-1", "Apple Watch Series 1", 2016, 38000, 18000, "Apple Watch"),
  Watch("apple-watch-series-2", "Apple Watch Series 2", 2016, 42000, 20000, "Apple Watch"),
  Watch("apple-watch-series-3", "Apple Watch Series 3", 2017, 46000, 22000, "Apple Watch"),
  Watch("apple-watch-series-4", "Apple Watch Series 4", 2018, 50000, 24000, "Apple Watch"),
  Watch("apple-watch-series-5", "Apple Watch Series 5", 2019, 52000, 25000, "Apple Watch"),
  Watch("apple-watch-series-6", "Apple Watch Series 6", 2020, 56000, 26000, "Apple Watch"),
  Watch("apple-watch-se", "Apple Watch SE", 2020, 58000, 28000, "Apple Watch"),
  Watch("apple-watch-series-7", "Apple Watch Series 7", 2021, 62000, 29000, "Apple Watch"),
  Watch("apple-watch-series-8", "Apple Watch Series 8", 2022, 66000, 30000, "Apple Watch"),
  Watch("apple-watch-se-2", "Apple Watch SE 2", 2022, 62000, 30000, "Apple Watch"),
  Watch("apple-watch-ultra", "Apple Watch Ultra", 2022, 90000, 40000, "Apple Watch"),
  Watch("apple-watch-series-9", "Apple Watch Series 9", 2023, 72000, 32000, "Apple Watch"),
  Watch("apple-watch-ultra-2", "Apple Watch Ultra 2", 2023, 95000, 40000, "Apple Watch"),
  Watch("apple-watch-series-10", "Apple Watch Series 10", 2024, 78000, 34000, "Apple Watch"),
  Watch("apple-watch-series-11", "Apple Watch Series 11", 2025, 82000, 36000, "Apple Watch"),
  Watch("apple-watch-ultra-3", "Apple Watch Ultra 3", 2025, 100000, 42000, "Apple Watch"),
];
