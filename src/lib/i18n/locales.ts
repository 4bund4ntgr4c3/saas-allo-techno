export type Locale = "fr" | "en";

export const DEFAULT_LOCALE: Locale = "fr";

export const LOCALE_COOKIE = "at-locale";
export const LOCALE_STORAGE = "at-locale";

const SUPPORTED = new Set<Locale>(["fr", "en"]);

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && SUPPORTED.has(value as Locale);
}

/** Normalise une locale source (navigateur, en-tête) vers une locale supportée. */
export function normalizeLocale(value: unknown): Locale {
  if (isLocale(value)) return value;
  if (typeof value === "string") {
    const base: string | undefined = value.split("-")[0];
    if (base?.toLowerCase() === "en") return "en";
    if (base?.toLowerCase() === "fr") return "fr";
  }
  return DEFAULT_LOCALE;
}

const STORAGE_KEY = "at-locale";

/** Préférence de langue enregistrée côté navigateur (si présente). */
export function getStoredLocale(): Locale | null {
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isLocale(stored)) return stored;
    } catch {
      /* stockage indisponible */
    }
  }
  return null;
}

/** Locale la plus pertinente : stockage > navigateur > français. */
export function detectLocale(value?: unknown): Locale {
  return (
    getStoredLocale() ??
    normalizeLocale(
      value ?? (typeof window !== "undefined" ? window.navigator.language : undefined),
    )
  );
}

/**
 * Prépare un chemin en lui préfixant la locale, sans doublon.
 * Ex. "/reparations" -> "/fr/reparations", "/" -> "/fr". */
export function toLocalePath(path: string, locale?: Locale): string {
  const l = locale ?? detectLocale();
  const segments = path.split("/").filter(Boolean);
  if (segments[0] === "fr" || segments[0] === "en") {
    segments[0] = l;
  } else {
    segments.unshift(l);
  }
  return `/${segments.join("/")}`;
}
