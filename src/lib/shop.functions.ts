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
  promoCode: z.string().trim().max(20).optional().or(z.literal("")),
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

const PROMO_REASONS = {
  CODE_INVALID: "Ce code promo est invalide.",
  INACTIVE: "Ce code promo n'est plus actif.",
  EXPIRED: "Ce code promo a expiré.",
  NOT_STARTED: "Ce code promo n'est pas encore valable.",
  USED: "Ce code promo a déjà été utilisé.",
} as const;

type PromoReason = keyof typeof PROMO_REASONS;

/** Valide un code promo via le RPC (service role). Retourne `null` si non applicable. */
async function validatePromoResult(
  code: string,
): Promise<{ percent: number; label?: string | null } | { reason: PromoReason } | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.rpc("validate_promo", { _code: code });
  const result = data as {
    valid?: boolean;
    percent?: number;
    label?: string | null;
    reason?: string;
  } | null;
  if (!result || result.valid !== true) {
    const reason = (result?.reason as PromoReason | undefined) ?? "CODE_INVALID";
    return { reason };
  }
  return { percent: result.percent ?? 0, label: result.label ?? null };
}

/** Enregistre une commande boutique (leads, source 'boutique') et alerte l'équipe. */
export const submitShopOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => shopOrderSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("shop-order", 3))) {
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

    // Réduction promo (validée côté serveur, jamais client).
    let promoApplied = false;
    let discountAmount = 0;
    let finalTotal = data.total;
    const code = (data.promoCode ?? "").trim().toUpperCase();
    if (code) {
      const promo = await validatePromoResult(code);
      if (!promo) throw new Error(PROMO_REASONS.CODE_INVALID);
      if ("reason" in promo) throw new Error(PROMO_REASONS[promo.reason]);
      discountAmount = Math.floor((data.total * promo.percent) / 100);
      promoApplied = true;
      finalTotal = Math.max(0, data.total - discountAmount);
    }

    const message = [
      `Commande ${reference}`,
      detail,
      `Total : ${data.total.toLocaleString("fr-FR")} FCFA`,
      promoApplied
        ? `Réduction (promo ${code}) : -${discountAmount.toLocaleString("fr-FR")} FCFA`
        : null,
      promoApplied
        ? `Total : ${finalTotal.toLocaleString("fr-FR")} FCFA (au lieu de ${data.total.toLocaleString("fr-FR")})`
        : null,
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

    return { reference, promoApplied, discountAmount, finalTotal };
  });

const validatePromoSchema = z.object({
  code: z.string().trim().min(1, "Indiquez un code promo.").max(20),
});

/** Valide un code promo (affichage du montant estimé, la décision reste serveur). */
export const validatePromoCode = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => validatePromoSchema.parse(data))
  .handler(async ({ data }) => {
    if (!(await rateLimit("promo-validate", 20))) {
      throw new Error("Trop de tentatives. Réessayez dans une minute.");
    }

    const code = data.code.trim().toUpperCase();
    const promo = await validatePromoResult(code);
    if (!promo) return { valid: false, reason: "CODE_INVALID" };
    if ("reason" in promo) {
      return { valid: false, reason: promo.reason };
    }
    return {
      valid: true,
      percent: promo.percent,
      label: promo.label ?? code,
      reason: null,
    };
  });
