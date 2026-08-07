import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { translate } from "./dictionaries";
import { isLocale, normalizeLocale, type Locale } from "./locales";
import "@/lib/i18n/segments/catalog";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Retourne une chaîne traduite. */
  t: (key: string, params?: (string | number)[]) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "at-locale";

function readStoredLocale(): Locale | null {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  }
  return null;
}

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  /** Locale imposée par l'URL (/fr, /en). Si fournie elle prime sur le stockage. */
  initialLocale?: Locale;
}) {
  // Locale provenant de l'URL si disponible, sinon préférence cafée, sinon navigateur.
  const [locale, setLocale] = useState<Locale>(() => {
    if (initialLocale && isLocale(initialLocale)) return initialLocale;
    return (
      readStoredLocale() ??
      normalizeLocale(typeof window !== "undefined" ? window.navigator.language : undefined)
    );
  });

  // Réagit à un changement de locale porté par l'URL (navigation SPA).
  useEffect(() => {
    if (initialLocale && isLocale(initialLocale) && initialLocale !== locale) {
      setLocale(initialLocale);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLocale]);

  // Synchronise l'attribut lang et la préférence persistée.
  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* stockage indisponible */
    }
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, params) => translate(locale, key, params),
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n doit être utilisé dans <I18nProvider>");
  }
  return ctx;
}
