// Suivi d'événements anonymes (parcours de réservation) — best-effort :
// jamais bloquant, jamais envoyé si un problème réseau survient.

import { supabase } from "@/integrations/supabase/client";

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
}) {
  const { event, step, category, brand, device } = opts;
  void supabase.from("analytics_events").insert({
    event,
    step: step ?? null,
    category: category ?? null,
    brand: brand ?? null,
    device: device ?? null,
    session_id: session(),
  }).then(({ error }) => {
    if (error) console.warn("[analytics] insert failed", error.message);
  });
}