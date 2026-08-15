import { useEffect, useMemo, useState, type ReactNode } from "react";
import { translate } from "./dictionaries";
import { isLocale, normalizeLocale, type Locale } from "./locales";
// Import unique de TOUS les segments — garantit l'enregistrement avant tout
// rendu, y compris sur Cloudflare Workers.
import "./segments/index";
import { I18nContext, STORAGE_KEY, readStoredLocale, type I18nContextValue } from "./context-store";

export { useI18n, type I18nContextValue } from "./context-store";

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  /** Locale imposée par l'URL (/fr, /en). Si fournie elle prime sur le stockage. */
  initialLocale?: Locale;
}) {
  // Locale provenant de l'URL si disponible, sinon défaut SSR 'fr' puis sync au montage.
  const [locale, setLocale] = useState<Locale>(() => {
    if (initialLocale && isLocale(initialLocale)) return initialLocale;
    return "fr";
  });

  // Hydratation sécurisée des préférences utilisateur au montage client :
  // ne remplace que le défaut SSR 'fr', jamais un choix déjà effectué.
  useEffect(() => {
    if (initialLocale) return;
    const stored = readStoredLocale() ?? normalizeLocale(window.navigator.language);
    if (stored) {
      setLocale((prev) => (prev === "fr" && stored !== prev ? stored : prev));
    }
  }, [initialLocale]);

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
