import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { rateLimit } from "@/lib/security";

const leadSchema = z.object({
  source: z.enum(["devis", "contact", "suivi"]),
  name: z.string().trim().min(1, "Votre nom est requis").max(120),
  phone: z
    .string()
    .trim()
    .min(8, "Numéro de téléphone invalide")
    .max(25)
    .optional()
    .or(z.literal("")),
  email: z.string().trim().email("E-mail invalide").max(180).optional().or(z.literal("")),
  reference: z.string().trim().max(30).optional().or(z.literal("")),
  message: z.string().trim().min(3, "Décrivez votre demande").max(2000),
  // Honeypot anti-spam : invisible pour les humains, rempli par les bots.
  website: z.string().trim().max(120).optional().or(z.literal("")),
});

/** Enregistre un lead (devis / contact / assistance suivi) et alerte l'équipe. */
export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => leadSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Honeypot rempli : bot détecté, on répond « succès » sans rien enregistrer.
    if (data.website) {
      return true;
    }

    if (!rateLimit("lead-submit", 3)) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const reference = data.reference || null;
    const { error } = await supabaseAdmin.from("leads").insert({
      source: data.source,
      reference,
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      message: data.message,
      status: "nouveau",
    });

    if (error) {
      console.error("[leads] insert failed", error);
      throw new Error("Le message n'a pas pu être enregistré. Réessayez.");
    }

    const { notifyStaffNewLead } = await import("@/lib/notifications");
    void notifyStaffNewLead({
      source: data.source,
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      message: data.message,
    });

    return true;
  });
