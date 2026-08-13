import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { rateLimit } from "@/lib/security";
import { createLogger } from "@/lib/logger";
import { requireStaff } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

const logger = createLogger("pos");

// Catalogue comptoir (miroir serveur de AdminPOS) : le prix et le libellé
// sont toujours ceux du serveur, jamais ceux envoyés par le client.
const POS_ACCESSORIES = [
  { slug: "acc-1", name: "Verre Trempé 9D (Pose incluse)", price: 2500 },
  { slug: "acc-2", name: "Câble Type-C vers Lightning (Fast Charge)", price: 3500 },
  { slug: "acc-3", name: "Câble Type-C vers Type-C (60W)", price: 3000 },
  { slug: "acc-4", name: "Chargeur Rapide 20W Power Delivery", price: 6500 },
  { slug: "acc-5", name: "Coque Antichoc Renforcée", price: 4000 },
  { slug: "acc-6", name: "Écouteurs Stéréo Filaire Jack/Type-C", price: 3500 },
] as const;

const posSchema = z.object({
  reservationId: z.string().uuid().nullable().optional(),
  items: z
    .array(
      z.object({
        // "quote" = ligne devis du dossier lié ; sinon slug du catalogue comptoir.
        slug: z.string().trim().min(1).max(40),
        qty: z.number().int().min(1).max(99),
      }),
    )
    .min(1, "Le panier est vide")
    .max(50, "Panier trop volumineux"),
  method: z.enum(["especes", "mtn", "moov", "celtiis"]),
  customerName: z.string().trim().min(1, "Indiquez le nom du client.").max(120),
  customerPhone: z.string().trim().max(25).optional().or(z.literal("")),
  amountReceived: z.number().int().min(0).optional(),
});

export type PosReceipt = {
  receiptId: string;
  date: string;
  customerName: string;
  customerPhone: string;
  items: { name: string; price: number; quantity: number }[];
  totalAmount: number;
  paymentMethod: string;
  amountReceived: number;
  changeDue: number;
  reservationRef: string | null;
};

/**
 * Encaissement comptoir (espèces / Mobile Money) : réservé au personnel.
 * Le montant est recalculé côté serveur (devis en base + catalogue comptoir),
 * la ligne `payments` est insérée avec le rôle service (l'insertion directe
 * depuis le client est bloquée par RLS), et le dossier lié est clôturé avec
 * propagation des erreurs. Renvoie les données du reçu.
 */
export const recordPosPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => posSchema.parse(data))
  .handler(async ({ data }): Promise<PosReceipt> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("pos-checkout", 20))) {
      throw new Error("Trop d'encaissements. Réessayez dans une minute.");
    }

    const userId = await requireStaff(supabaseAdmin);

    // Dossier lié : montant du devis toujours lu en base, jamais du client.
    let reservationRef: string | null = null;
    let quoteItem: { name: string; price: number } | null = null;
    if (data.reservationId) {
      const { data: reservation } = await supabaseAdmin
        .from("reservations")
        .select("id, reference, device, quote_amount, status")
        .eq("id", data.reservationId)
        .maybeSingle();
      if (!reservation) throw new Error("Dossier de réparation introuvable.");
      if ((reservation.quote_amount ?? 0) <= 0) {
        throw new Error("Ce dossier n'a pas de devis validé à encaisser.");
      }
      reservationRef = reservation.reference;
      quoteItem = {
        name: `Réparation ${reservation.device ?? ""} (${reservation.reference ?? ""})`,
        price: reservation.quote_amount ?? 0,
      };
    }

    const catalog = new Map<string, (typeof POS_ACCESSORIES)[number]>(
      POS_ACCESSORIES.map((a) => [a.slug, a]),
    );
    const items = data.items.map((it) => {
      if (it.slug === "quote") {
        if (!quoteItem) throw new Error("Ligne devis invalide pour cette commande.");
        return { name: quoteItem.name, price: quoteItem.price, quantity: it.qty };
      }
      const acc = catalog.get(it.slug);
      if (!acc) throw new Error(`Article inconnu : ${it.slug}`);
      return { name: acc.name, price: acc.price, quantity: it.qty };
    });

    const totalAmount = items.reduce((n, it) => n + it.price * it.quantity, 0);
    if (totalAmount <= 0) throw new Error("Le panier est vide");

    const receiptId = `POS-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 90 + 10)}`;

    const { error: payError } = await supabaseAdmin.from("payments").insert({
      reference: reservationRef ?? receiptId,
      source: "pos",
      amount: totalAmount,
      currency: "XOF",
      method: data.method,
      status: "paid",
    });
    if (payError) {
      logger.error("pos payment insert failed", payError as Error);
      throw new Error("L'encaissement n'a pas pu être enregistré. Réessayez.");
    }

    // Dossier lié : clôture + paiement, avec propagation des erreurs.
    if (data.reservationId) {
      const { error: resError } = await supabaseAdmin
        .from("reservations")
        .update({ payment_status: "paid", status: "terminee" })
        .eq("id", data.reservationId);
      if (resError) {
        logger.error("pos reservation update failed", resError as Error);
        throw new Error(
          "Le paiement est enregistré mais le dossier n'a pas pu être clôturé. Contactez un administrateur.",
        );
      }
    }

    await logAudit(supabaseAdmin, {
      user_id: userId,
      action: "payment.confirmed",
      entity: "payment",
      entity_id: receiptId,
      details: {
        reference: reservationRef ?? receiptId,
        amount: totalAmount,
        method: data.method,
        source: "pos",
      },
    });

    const amountReceived = data.amountReceived ?? totalAmount;
    return {
      receiptId,
      date: new Date().toLocaleString("fr-FR"),
      customerName: data.customerName,
      customerPhone: data.customerPhone ?? "",
      items,
      totalAmount,
      paymentMethod: data.method,
      amountReceived,
      changeDue: data.method === "especes" ? Math.max(0, amountReceived - totalAmount) : 0,
      reservationRef,
    };
  });
