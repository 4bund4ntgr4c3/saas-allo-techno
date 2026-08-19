import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ACCESSORIES } from "@/data/catalog/accessories";
import { rateLimit } from "@/lib/security";

const MAX_QTY_PER_LINE = 99;
const MAX_LINES = 100;

// Frais de livraison (miroir côté serveur de getDeliveryOptions en client).
// Le client ne transmet que l'identifiant : le tarif est toujours serveur.
const DELIVERY_FEES: Record<string, number> = {
  retrait: 0,
  calavi: 1000,
  cotonou: 2000,
  interieur: 2000,
};

const FREE_DELIVERY_FROM = 50_000;

const shopOrderSchema = z.object({
  name: z.string().trim().min(3, "Indiquez votre nom complet.").max(120),
  phone: z.string().trim().min(8, "Numéro de téléphone invalide.").max(25),
  email: z.string().trim().email("E-mail invalide").max(180).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  delivery: z.string().trim().min(1).max(120),
  deliveryId: z.string().trim().min(1).max(40),
  payment: z.string().trim().min(1).max(60),
  promoCode: z.string().trim().max(20).optional().or(z.literal("")),
  lines: z
    .array(
      z.object({
        slug: z.string().trim().min(1),
        qty: z.number().int().min(1).max(MAX_QTY_PER_LINE),
      }),
    )
    .min(1, "Panier vide")
    .max(MAX_LINES, "Panier trop volumineux"),
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
  .validator((data: unknown) => shopOrderSchema.parse(data))
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

    // Résolution des lignes contre le catalogue : slug inconnu ou quantité
    // excessive = commande rejetée. Le libellé et le prix affichés sont ceux
    // du catalogue, jamais ceux fournis par le client.
    const catalog = new Map(ACCESSORIES.map((a) => [a.slug, a]));
    const lines = data.lines.map((l) => {
      const acc = catalog.get(l.slug);
      if (!acc) throw new Error(`Article inconnu : ${l.slug}`);
      return { slug: l.slug, name: acc.name, qty: l.qty, unitPrice: acc.price };
    });

    // Total recalculé intégralement côté serveur :
    //   sous-total = Σ(prix catalogue × qty)
    //   livraison  = tarif serveur (gratuite au-delà de 50 000 FCFA)
    //   remise     = promo validée serveur
    const subtotal = lines.reduce((n, l) => n + l.qty * l.unitPrice, 0);
    const fee = DELIVERY_FEES[data.deliveryId];
    if (fee === undefined) throw new Error("Mode de livraison inconnu.");
    const shipping = subtotal >= FREE_DELIVERY_FROM ? 0 : fee;
    const total = subtotal + shipping;

    // Réduction promo (validée côté serveur, jamais client). SANS EFFET DE
    // BORDE : elle est contrôlée AVANT la réservation du stock, pour ne pas
    // retenir de marchandise si le code est invalide.
    let promoApplied = false;
    let discountAmount = 0;
    let finalTotal = total;
    const code = (data.promoCode ?? "").trim().toUpperCase();
    if (code) {
      const promo = await validatePromoResult(code);
      if (!promo) throw new Error(PROMO_REASONS.CODE_INVALID);
      if ("reason" in promo) throw new Error(PROMO_REASONS[promo.reason]);
      discountAmount = Math.floor((total * promo.percent) / 100);
      promoApplied = true;
      finalTotal = Math.max(0, total - discountAmount);
    }

    // Réserver le stock avant de créer la commande. En cas d'échec (table
    // non migrée, stock insuffisant), le stock déjà réservé est restitué
    // (best-effort) et la commande est annulée côté client.
    const { reserveInventory, restoreInventory } = await import("@/lib/content.functions");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const ok = await reserveInventory(supabaseAdmin, line.slug, line.qty);
      if (!ok) {
        console.warn(`[shop] stock refused for ${line.slug} ×${line.qty}`);
        for (const prev of lines.slice(0, i)) {
          const restored = await restoreInventory(supabaseAdmin, prev.slug, prev.qty);
          if (!restored) console.warn(`[shop] stock restore failed for ${prev.slug} ×${prev.qty}`);
        }
        throw new Error(
          `Stock insuffisant ou indisponible pour « ${line.name} ». Réessayez plus tard ou contactez-nous.`,
        );
      }
    }

    const detail = lines
      .map((l) => `• ${l.qty} × ${l.name} — ${(l.qty * l.unitPrice).toLocaleString("fr-FR")} FCFA`)
      .join("\n");

    const message = [
      `Commande ${reference}`,
      detail,
      `Sous-total : ${subtotal.toLocaleString("fr-FR")} FCFA`,
      `Livraison : ${shipping === 0 ? "Offerte" : shipping.toLocaleString("fr-FR") + " FCFA"} (${data.delivery})`,
      `Total : ${total.toLocaleString("fr-FR")} FCFA`,
      promoApplied
        ? `Réduction (promo ${code}) : -${discountAmount.toLocaleString("fr-FR")} FCFA`
        : null,
      promoApplied
        ? `Total : ${finalTotal.toLocaleString("fr-FR")} FCFA (au lieu de ${total.toLocaleString("fr-FR")})`
        : null,
      `Paiement : ${data.payment}`,
      data.address ? `Adresse : ${data.address}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    // Enregistrement de la commande : en cas d'échec, le stock réservé est
    // restitué (best-effort) pour ne pas bloquer de marchandise.
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
      for (const line of lines) {
        const ok = await restoreInventory(supabaseAdmin, line.slug, line.qty);
        if (!ok) console.warn(`[shop] stock restore failed for ${line.slug} ×${line.qty}`);
      }
      throw new Error("La commande n'a pas pu être enregistrée. Réessayez.");
    }

    // Consommer le code promo une fois la commande enregistrée (single-use →
    // épuisé, multi-use → compteur). Échec non bloquant : la commande existe.
    if (promoApplied) {
      const { data: consumed, error: promoError } = await supabaseAdmin.rpc("consume_promo", {
        _code: code,
      });
      if (promoError || consumed !== true) {
        console.warn(`[shop] consume_promo failed for ${code}`, promoError);
      }
    }

    const { notifyStaffNewLead } = await import("@/lib/notifications");
    void notifyStaffNewLead({
      source: "boutique",
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      message,
    });

    const { triggerWebhooks } = await import("@/lib/webhooks.functions");
    void triggerWebhooks("lead.new", {
      reference,
      source: "boutique",
      name: data.name,
      phone: data.phone,
      total: finalTotal,
    });

    return { reference, promoApplied, discountAmount, finalTotal };
  });

const validatePromoSchema = z.object({
  code: z.string().trim().min(1, "Indiquez un code promo.").max(20),
});

/** Valide un code promo (affichage du montant estimé, la décision reste serveur). */
export const validatePromoCode = createServerFn({ method: "POST" })
  .validator((data: unknown) => validatePromoSchema.parse(data))
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
