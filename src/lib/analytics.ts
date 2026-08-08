// Suivi d'événements anonymes (parcours de réservation) — best-effort :
// jamais bloquant, jamais envoyé si un problème réseau survient.
// Les données sont enregistrées via une server function (validation + rate limit).

import { trackEvent } from "@/lib/analytics.functions";

declare global {
  interface Window {
    plausible?: (event: string, options?: { u?: string; props?: Record<string, string> }) => void;
  }
}

export function trackPageView(url: string) {
  if (typeof window !== "undefined" && window.plausible) {
    window.plausible("pageview", { u: url });
  }
}

export function trackPlausibleEvent(name: string, props?: Record<string, string>) {
  if (typeof window !== "undefined" && window.plausible) {
    window.plausible(name, props ? { props } : undefined);
  }
}

let sessionId: string | null = null;

function session(): string {
  if (sessionId) return sessionId;
  const KEY = "at-analytics-session";
  const stored = localStorage.getItem(KEY);
  if (stored) {
    sessionId = stored;
    return stored;
  }
  sessionId = crypto.randomUUID();
  localStorage.setItem(KEY, sessionId);
  return sessionId;
}

export function trackWizardEvent(opts: {
  event: string;
  step?: number;
  category?: string;
  brand?: string;
  device?: string;
  source?: string;
}) {
  void trackEvent({ data: { ...opts, session_id: session() } }).catch(() => {
    // best-effort : jamais bloquant
  });
}
