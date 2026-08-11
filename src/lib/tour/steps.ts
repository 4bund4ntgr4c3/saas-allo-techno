// Définitions des visites guidées par espace.
// Chaque étape cible un élément via l'attribut `data-tour="…"` ; si l'élément
// n'existe pas sur la page courante (ex. listes vides), l'étape s'affiche
// centrée sans spotlight, sans bloquer la visite.
import type { TourStep } from "@/lib/tour/store";

export const ADMIN_DASHBOARD_TOUR: TourStep[] = [
  {
    target: "admin-sidebar",
    titleKey: "tour.admin.sidebar.title",
    bodyKey: "tour.admin.sidebar.body",
  },
  { target: "admin-header", titleKey: "tour.admin.live.title", bodyKey: "tour.admin.live.body" },
  {
    target: "admin-content",
    titleKey: "tour.admin.dossiers.title",
    bodyKey: "tour.admin.dossiers.body",
  },
];

export const ADMIN_DOSSIERS_TOUR: TourStep[] = [
  {
    target: "admin-sidebar",
    titleKey: "tour.admin.sidebar.title",
    bodyKey: "tour.admin.sidebar.body",
  },
  { target: "admin-header", titleKey: "tour.admin.live.title", bodyKey: "tour.admin.live.body" },
  {
    target: "admin-filters",
    titleKey: "tour.admin.filters.title",
    bodyKey: "tour.admin.filters.body",
  },
  {
    target: "admin-kanban-toggle",
    titleKey: "tour.admin.kanban.title",
    bodyKey: "tour.admin.kanban.body",
  },
  {
    target: "admin-export",
    titleKey: "tour.admin.export.title",
    bodyKey: "tour.admin.export.body",
  },
  {
    target: "admin-status",
    titleKey: "tour.admin.status.title",
    bodyKey: "tour.admin.status.body",
  },
  {
    target: "admin-technician",
    titleKey: "tour.admin.technician.title",
    bodyKey: "tour.admin.technician.body",
  },
];

export const APP_TOUR: TourStep[] = [
  { target: "app-header", titleKey: "tour.app.org.title", bodyKey: "tour.app.org.body" },
  { target: "app-nav", titleKey: "tour.app.equipment.title", bodyKey: "tour.app.equipment.body" },
  { target: "app-main", titleKey: "tour.app.tickets.title", bodyKey: "tour.app.tickets.body" },
  { target: "app-main", titleKey: "tour.app.scan.title", bodyKey: "tour.app.scan.body" },
];

export const ACCOUNT_TOUR: TourStep[] = [
  {
    target: "account-header",
    titleKey: "tour.account.reservations.title",
    bodyKey: "tour.account.reservations.body",
  },
  {
    target: "account-tabs",
    titleKey: "tour.account.tracking.title",
    bodyKey: "tour.account.tracking.body",
  },
  {
    target: "account-reservations",
    titleKey: "tour.account.quote.title",
    bodyKey: "tour.account.quote.body",
  },
  {
    target: "account-logout",
    titleKey: "tour.account.logout.title",
    bodyKey: "tour.account.logout.body",
  },
];

export interface TourDefinition {
  id: string;
  labelKey: string;
  steps: TourStep[];
}

/** Tours proposables par préfixe de route (le launcher filtre selon la page). */
export const TOURS_BY_PREFIX: { prefix: string; tour: TourDefinition }[] = [
  {
    prefix: "/admin/dossiers",
    tour: { id: "admin-dossiers", labelKey: "demo.tourAdmin", steps: ADMIN_DOSSIERS_TOUR },
  },
  {
    prefix: "/admin",
    tour: { id: "admin-dashboard", labelKey: "demo.tourAdmin", steps: ADMIN_DASHBOARD_TOUR },
  },
  { prefix: "/app", tour: { id: "app", labelKey: "demo.tourApp", steps: APP_TOUR } },
  {
    prefix: "/mon-compte",
    tour: { id: "account", labelKey: "demo.tourAccount", steps: ACCOUNT_TOUR },
  },
];

/** Tour applicable à la route courante (la plus spécifique gagne). */
export function tourForPath(pathname: string): TourDefinition | null {
  let best: TourDefinition | null = null;
  let bestLen = -1;
  for (const { prefix, tour } of TOURS_BY_PREFIX) {
    if (pathname.startsWith(prefix) && prefix.length > bestLen) {
      best = tour;
      bestLen = prefix.length;
    }
  }
  return best;
}
