import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/reservation")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { device?: string; panne?: string; date?: string; creneau?: string; heure?: string } => ({
    ...(typeof search["device"] === "string" ? { device: search["device"] as string } : {}),
    ...(typeof search["panne"] === "string" ? { panne: search["panne"] as string } : {}),
    ...(typeof search["date"] === "string" ? { date: search["date"] as string } : {}),
    ...(typeof search["creneau"] === "string" ? { creneau: search["creneau"] as string } : {}),
    ...(typeof search["heure"] === "string" ? { heure: search["heure"] as string } : {}),
  }),

  head: () => ({
    meta: [
      { title: "Réserver une réparation — Allô Techno Abomey-Calavi" },
      {
        name: "description",
        content:
          "Réservez votre créneau de réparation à Abomey-Calavi : disponibilités en temps réel, dépôt en boutique ou enlèvement à domicile.",
      },
    ],
  }),
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

  useEffect(() => {
    navigate({ to: "/reparations", search, replace: true });
  }, [navigate, search]);

  return null;
}
