import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { rateLimit } from "@/lib/security";

const trackSchema = z.object({
  event: z.enum(["step_viewed", "estimation_shown", "reservation_created"]),
  step: z.number().int().min(0).max(20).optional(),
  category: z.string().trim().max(80).optional(),
  brand: z.string().trim().max(80).optional(),
  device: z.string().trim().max(160).optional(),
  source: z.string().trim().max(80).optional(),
  session_id: z.string().trim().min(1).max(80),
});

/**
 * Enregistre un événement analytics. Passer par une server function permet de
 * valider les données, de limiter le débit et de ne pas exposer d'INSERT anon.
 */
export const trackEvent = createServerFn({ method: "POST" })
  .validator((data: unknown) => trackSchema.parse(data))
  .handler(async ({ data }) => {
    if (!(await rateLimit("analytics", 60))) return;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("analytics_events").insert({
      event: data.event,
      step: data.step ?? null,
      category: data.category ?? null,
      brand: data.brand ?? null,
      device: data.device ?? null,
      source: data.source ?? null,
      session_id: data.session_id,
    });
    if (error) console.warn("[analytics] insert failed", error.message);
  });
