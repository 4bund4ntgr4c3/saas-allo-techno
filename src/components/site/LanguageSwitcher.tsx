import { useRouter } from "@tanstack/react-router";
import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/locales";

/**
 * Sélecteur de langue présent dans le header. Change la locale globale et
 * synchronise le préfixe d'URL (/fr, /en) quand le routage le permet.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  const router = useRouter();

  const switchTo = (next: Locale) => {
    setLocale(next);
    if (typeof window !== "undefined") {
      document.documentElement.lang = next;
    }
    const pathname = typeof window !== "undefined" ? window.location.pathname : "";
    if (pathname) {
      const prefix = `/${locale}/`;
      let target = pathname;
      if (pathname === `/${locale}` || target.startsWith(prefix)) {
        target = target === `/${locale}` ? "/" : target.slice(prefix.length - 1);
      }
      if (target === "/") target = `/${next}`;
      else if (!target.startsWith(`/${next}`)) target = `/${next}${target === "/" ? "" : target}`;
      window.history.replaceState({}, "", target);
      router.invalidate();
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-1 border border-border p-0.5 ${className ?? ""}`}
      role="group"
      aria-label={t("header.changeLanguage")}
    >
      <Languages className="size-4 text-muted-foreground" aria-hidden />
      {(["fr", "en"] as Locale[]).map((code) => (
        <button
          key={code}
          onClick={() => switchTo(code)}
          aria-pressed={locale === code}
          className={`px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider transition-colors ${
            locale === code
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
