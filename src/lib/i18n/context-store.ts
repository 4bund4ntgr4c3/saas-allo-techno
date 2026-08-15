import { createContext, useContext } from "react";
import { isLocale, type Locale } from "./locales";

export type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Retourne une chaîne traduite. */
  t: (key: string, params?: (string | number)[]) => string;
};

export const I18nContext = createContext<I18nContextValue | null>(null);

export const STORAGE_KEY = "at-locale";

export function readStoredLocale(): Locale | null {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  }
  return null;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n doit être utilisé dans <I18nProvider>");
  }
  return ctx;
}
