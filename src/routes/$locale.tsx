import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { isLocale, normalizeLocale } from "@/lib/i18n/locales";

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
  component: () => <Outlet />,
});
