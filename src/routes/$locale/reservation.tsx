import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import "@/lib/i18n/segments/reservation";
import type { Locale } from "@/lib/i18n/locales";

export const Route = createFileRoute("/$locale/reservation")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { device?: string; panne?: string; date?: string; creneau?: string; heure?: string } => ({
    ...(typeof search["device"] === "string" ? { device: search["device"] as string } : {}),
    ...(typeof search["panne"] === "string" ? { panne: search["panne"] as string } : {}),
    ...(typeof search["date"] === "string" ? { date: search["date"] as string } : {}),
    ...(typeof search["creneau"] === "string" ? { creneau: search["creneau"] as string } : {}),
    ...(typeof search["heure"] === "string" ? { heure: search["heure"] as string } : {}),
  }),

  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    return {
      meta: [
        { title: translate(locale, "reservation.meta.title") },
        { name: "description", content: translate(locale, "reservation.meta.description") },
      ],
    };
  },
  component: ReservationRedirect,
});

/**
 * La réservation a été fusionnée dans l'assistant de réparation (9 étapes,
 * /reparations). Cette route est conservée pour les anciens liens : elle
 * redirige vers l'assistant en transmettant les paramètres déjà remplis.
 */
function ReservationRedirect() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { locale } = useI18n();

  useEffect(() => {
    navigate({ to: "/$locale/reparations", params: { locale }, search, replace: true });
  }, [navigate, search, locale]);

  return null;
}
