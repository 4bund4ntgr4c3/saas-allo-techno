import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { rateLimit } from "@/lib/security";

const shopOrderSchema = z.object({
  name: z.string().trim().min(3, "Indiquez votre nom complet.").max(120),
  phone: z.string().trim().min(8, "Numéro de téléphone invalide.").max(25),
  email: z.string().trim().email("E-mail invalide").max(180).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  delivery: z.string().trim().min(1).max(120),
  payment: z.string().trim().min(1).max(60),
  total: z.number().positive(),
  lines: z
    .array(
      z.object({
        slug: z.string().trim().min(1),
        label: z.string().trim().min(1).max(200),
        qty: z.number().int().positive(),
        price: z.number().nonnegative(),
      }),
    )
    .min(1, "Panier vide"),
});

/** Enregistre une commande boutique (leads, source 'boutique') et alerte l'équipe. */
export const submitShopOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => shopOrderSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!rateLimit("shop-order", 3)) {
      throw new Error("Trop de commandes. Réessayez dans une minute.");
    }

    const { data: refData, error: refError } = await supabaseAdmin.rpc("next_shop_reference");
    if (refError || !refData) {
      console.error("[shop] reference failed", refError);
      throw new Error("La commande n'a pas pu être enregistrée. Réessayez.");
    }
    const reference = refData as string;

    // Réserver le stock avant de créer la commande. En cas d'échec (table
    // non migrée, stock insuffisant), on annule la commande côté client.
    const { reserveInventory } = await import("@/lib/content.functions");
    for (const line of data.lines) {
      const ok = await reserveInventory(supabaseAdmin, line.slug, line.qty);
      if (!ok) {
        console.warn(`[shop] stock refused for ${line.slug} ×${line.qty}`);
        throw new Error(
          `Stock insuffisant ou indisponible pour « ${line.label} ». Réessayez plus tard ou contactez-nous.`,
        );
      }
    }

    const detail = data.lines
      .map((l) => `• ${l.qty} × ${l.label} — ${l.price.toLocaleString("fr-FR")} FCFA`)
      .join("\n");
    const message = [
      `Commande ${reference}`,
      detail,
      `Total : ${data.total.toLocaleString("fr-FR")} FCFA`,
      `Livraison : ${data.delivery}`,
      `Paiement : ${data.payment}`,
      data.address ? `Adresse : ${data.address}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const { error } = await supabaseAdmin.from("leads").insert({
      source: "boutique",
      reference,
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      message,
      status: "nouveau",
    });

    if (error) {
      console.error("[shop] insert failed", error);
      throw new Error("La commande n'a pas pu être enregistrée. Réessayez.");
    }

    const { notifyStaffNewLead } = await import("@/lib/notifications");
    void notifyStaffNewLead({
      source: "boutique",
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      message,
    });

    return { reference };
  });
