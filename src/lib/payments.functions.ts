// Paiement en ligne Flutterwave (hosted checkout, XOF) pour les commandes
// boutique (initiateFlutterwavePayment) et les devis de réparation approuvés
// (initiateReservationPayment). Best-effort : sans FLUTTERWAVE_SECRET_KEY
// configurée, le service est désactivé et le panier bascule sur un paiement
// « à la remise » sans bloquer la commande.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { rateLimit } from "@/lib/security";

const initiateSchema = z.object({
  reference: z.string().trim().min(1).max(30),
  amount: z.number().int().positive(),
  customer: z.object({
    email: z.string().trim().email("E-mail invalide").max(180).optional().or(z.literal("")),
    name: z.string().trim().min(3, "Indiquez votre nom complet.").max(120),
    phone: z.string().trim().min(8, "Numéro de téléphone invalide.").max(25),
  }),
});

const referenceSchema = z.object({
  reference: z.string().trim().min(1).max(30),
});

const reservationPaySchema = z.object({
  reference: z.string().trim().min(1).max(30),
  method: z.enum(["MTN MoMo", "Moov Money", "Celtiis"]),
});

type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

type FlutterwaveCheckoutInput = {
  tx_ref: string;
  amount: number;
  email: string;
  name: string;
  phone: string;
  redirectUrl: string;
  title: string;
  description: string;
};

/**
 * Appel à l'API de checkout hébergé Flutterwave v3 (XOF).
 * Retourne le lien de paiement, ou null en cas d'échec (jamais d'exception).
 */
async function createFlutterwaveLink(input: FlutterwaveCheckoutInput): Promise<string | null> {
  const secret = process.env["FLUTTERWAVE_SECRET_KEY"];
  if (!secret) {
    console.warn("[payments] FLUTTERWAVE_SECRET_KEY absent — paiement en ligne désactivé");
    return null;
  }
  try {
    const res = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: input.tx_ref,
        amount: input.amount,
        currency: "XOF",
        redirect_url: input.redirectUrl,
        customer: {
          email: input.email,
          name: input.name,
          phone_number: input.phone,
        },
        customizations: {
          title: input.title,
          description: input.description,
        },
      }),
    });

    const body = (await res.json()) as {
      status?: string;
      message?: string;
      data?: { link?: string };
    };
    if (res.ok && body.status === "success" && body.data?.link) {
      return body.data.link;
    }
    console.error("[payments] Flutterwave init failed", res.status, body.message);
  } catch (err) {
    console.error("[payments] Flutterwave network error", err);
  }
  return null;
}

/**
 * Initialise un paiement Flutterwave pour une commande boutique.
 * Retourne { available:false } si le service n'est pas configuré (le panier
 * bascule alors sur « paiement à la remise »), ou { available:true, link }.
 */
export const initiateFlutterwavePayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => initiateSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getRequestUrl } = await import("@tanstack/react-start/server");

    if (!rateLimit("fw-init", 5)) {
      throw new Error("Trop de demandes de paiement. Réessayez dans une minute.");
    }

    const secret = process.env["FLUTTERWAVE_SECRET_KEY"];
    if (!secret) {
      console.warn("[payments] FLUTTERWAVE_SECRET_KEY absent — paiement en ligne désactivé");
      return { available: false } as const;
    }

    const tx_ref = `AT-${data.reference}`;

    // Idempotence : si un paiement est déjà initié pour cette commande, on
    // renvoie son lien sans créer une nouvelle transaction.
    const { data: existing } = await supabaseAdmin
      .from("payments")
      .select("tx_ref, status")
      .eq("reference", data.reference)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing?.tx_ref && existing.status === "paid") {
      return { available: true as const, link: null as string | null, paid: true as const };
    }

    const redirectUrl = `${getRequestUrl({ xForwardedHost: true }).origin}/fr/panier?ref=${encodeURIComponent(data.reference)}&status=redirect`;

    const link = await createFlutterwaveLink({
      tx_ref,
      amount: data.amount,
      email: data.customer.email || `${data.reference}@allotechno.africa`,
      name: data.customer.name,
      phone: data.customer.phone,
      redirectUrl,
      title: "Allô Techno — Commande " + data.reference,
      description: "Paiement de votre commande d'accessoires",
    });

    if (!link) {
      // Échec d'initiation : on garde la commande, paiement à la remise.
      return { available: false } as const;
    }

    // Enregistre le paiement en attente (réutilise le tx_ref existant le cas échéant).
    const { error } = await supabaseAdmin.from("payments").upsert(
      {
        reference: data.reference,
        source: "boutique",
        amount: data.amount,
        currency: "XOF",
        method: "MTN MoMo",
        status: "pending",
        tx_ref,
      },
      { onConflict: "tx_ref" },
    );

    if (error) {
      console.error("[payments] upsert failed", error);
      return { available: false } as const;
    }

    return { available: true as const, link, paid: false as const };
  });

/** Retourne le statut du dernier paiement d'une commande (ou null). */
export const getOrderPaymentStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => referenceSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!rateLimit("fw-status", 10)) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .select("status, tx_id")
      .eq("reference", data.reference)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[payments] status lookup failed", error);
      throw new Error("Impossible de vérifier le paiement. Réessayez.");
    }

    return { status: (payment?.status as PaymentStatus | undefined) ?? null };
  });

/**
 * Initialise un paiement en ligne Flutterwave (Mobile Money : MTN MoMo,
 * Moov Money, Celtiis) pour le devis approuvé d'une réservation. Le montant
 * est toujours celui du devis (quote_amount), jamais un montant client.
 *
 * INPUT  : { reference: string, method: "MTN MoMo" | "Moov Money" | "Celtiis" }
 * OUTPUT : { ok: true, url: string | null, paymentRef: string | null,
 *            alreadyPaid: boolean }            — url = lien de checkout à ouvrir
 *            (null si déjà payé) ; paymentRef = id de la ligne payments.
 *        | { ok: false, error: string }
 */
export const initiateReservationPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => reservationPaySchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getRequestUrl } = await import("@tanstack/react-start/server");

    if (!rateLimit("fw-res-init", 5)) {
      throw new Error("Trop de demandes de paiement. Réessayez dans une minute.");
    }

    const { data: reservation, error: fetchError } = await supabaseAdmin
      .from("reservations")
      .select("reference, status, quote_status, quote_amount, customer_name, email, phone")
      .eq("reference", data.reference)
      .maybeSingle();

    if (fetchError || !reservation) {
      console.error("[payments] reservation lookup failed", fetchError);
      return { ok: false as const, error: "Dossier introuvable." };
    }

    // Éligibilité : devis approuvé avec montant, ou dossier confirmé (un
    // montant de devis doit toutefois exister pour régler en ligne).
    const quoteApproved =
      reservation.quote_status === "approved" && (reservation.quote_amount ?? 0) > 0;
    if (reservation.status !== "confirmee" && !quoteApproved) {
      return { ok: false as const, error: "Ce dossier ne peut pas encore être payé en ligne." };
    }
    const amount = reservation.quote_amount ?? 0;
    if (amount <= 0) {
      return { ok: false as const, error: "Aucun montant de devis à régler." };
    }

    // Idempotence : si un paiement est déjà initié pour cette réservation, on
    // renvoie son état sans créer de nouvelle transaction.
    const { data: existing } = await supabaseAdmin
      .from("payments")
      .select("id, tx_ref, status")
      .eq("reference", data.reference)
      .eq("source", "reservation")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing?.tx_ref && existing.status === "paid") {
      return {
        ok: true as const,
        url: null as string | null,
        paymentRef: existing.id,
        alreadyPaid: true as const,
      };
    }

    const tx_ref = `AT-${data.reference}`;
    const redirectUrl = `${getRequestUrl({ xForwardedHost: true }).origin}/mon-compte?ref=${encodeURIComponent(data.reference)}&status=redirect`;

    const link = await createFlutterwaveLink({
      tx_ref,
      amount,
      email: reservation.email || `${data.reference}@allotechno.africa`,
      name: reservation.customer_name,
      phone: reservation.phone,
      redirectUrl,
      title: "Allô Techno — Réparation " + data.reference,
      description: "Paiement du devis approuvé (réparation)",
    });

    if (!link) {
      // Échec d'initiation : le dossier reste en l'état, le client peut
      // régler à la remise ou réessayer plus tard.
      return {
        ok: false as const,
        error:
          "Le service de paiement est momentanément indisponible. Réessayez dans quelques minutes.",
      };
    }

    // Enregistre le paiement en attente (réutilise le tx_ref existant le cas échéant).
    const { data: inserted, error } = await supabaseAdmin
      .from("payments")
      .upsert(
        {
          reference: data.reference,
          source: "reservation",
          amount,
          currency: "XOF",
          method: data.method,
          status: "pending",
          tx_ref,
        },
        { onConflict: "tx_ref" },
      )
      .select("id")
      .single();

    if (error || !inserted) {
      console.error("[payments] reservation payment upsert failed", error);
      return { ok: false as const, error: "Impossible d'enregistrer le paiement." };
    }

    return {
      ok: true as const,
      url: link,
      paymentRef: inserted.id,
      alreadyPaid: false as const,
    };
  });

/**
 * Retourne le statut du dernier paiement d'une réservation (source='reservation').
 *
 * INPUT  : { reference: string }
 * OUTPUT : { status: "pending" | "paid" | "failed" | "refunded" | null,
 *            txId: string | null, amount: number | null, method: string | null }
 *          — champs null si aucun paiement n'a encore été initié.
 */
export const getReservationPaymentStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => referenceSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!rateLimit("fw-res-status", 10)) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .select("status, tx_id, amount, method")
      .eq("reference", data.reference)
      .eq("source", "reservation")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[payments] reservation status lookup failed", error);
      throw new Error("Impossible de vérifier le paiement. Réessayez.");
    }

    return {
      status: (payment?.status as PaymentStatus | undefined) ?? null,
      txId: payment?.tx_id ?? null,
      amount: payment?.amount ?? null,
      method: payment?.method ?? null,
    };
  });
