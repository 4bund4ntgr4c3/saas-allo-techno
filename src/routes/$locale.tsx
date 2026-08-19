import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { isLocale, normalizeLocale } from "@/lib/i18n/locales";
import { DEFAULT_ORIGIN } from "@/lib/origin";

/**
 * URLs canoniques + hreflang alternés (fr / en / x-default) injectées sur
 * toutes les pages localisées. La variante alternée remplace le préfixe de
 * langue courant par l'autre langue, en conservant le sous-chemin.
 */
export const Route = createFileRoute("/$locale")({
  beforeLoad: ({ params, location }) => {
    const raw = params.locale as string | undefined;
    // Segment langue non supporté -> on redirige vers la langue la plus
    // pertinente en conservant le sous-chemin (ex. /reparations -> /fr/reparations).
    if (!isLocale(raw)) {
      const locale = normalizeLocale(raw);
      const suffix = location.pathname.replace(/^\/[^/]+/, "");
      throw redirect({
        href: `/${locale}${suffix || ""}`,
      });
    }
  },
  head: ({ match }) => {
    // match.pathname est fiable en SSR comme en navigation client ; l'origine
    // canonique est l'origine fonctionnelle (worker), qui sera remplacée par
    // le domaine allotechno.africa une fois le DNS branché (M21).
    const current = match.pathname || "/";
    const currentLocale = /^\/en(?:\/|$)/.test(current) ? "en" : "fr";
    const bare = current.replace(/^\/(?:fr|en)(?=\/|$)/, "") || "/";
    const absolute = (locale: string) => `${DEFAULT_ORIGIN}/${locale}${bare}`;

    return {
      links: [
        { rel: "canonical", href: `${DEFAULT_ORIGIN}${current}` },
        { rel: "alternate", hrefLang: "fr", href: absolute("fr") },
        { rel: "alternate", hrefLang: "en", href: absolute("en") },
        { rel: "alternate", hrefLang: "x-default", href: absolute(currentLocale) },
      ],
    };
  },
  component: () => <Outlet />,
});
