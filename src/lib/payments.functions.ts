// Paiement en ligne des devis de réparation approuvés et des commandes
// boutique. Trois prestataires Mobile Money (XOF) :
//  - Flutterwave (hosted checkout) pour le panier boutique
//    (initiateFlutterwavePayment) et les devis (initiateReservationPayment) ;
//  - FedaPay (hosted checkout) pour les devis (initiateFedaPayReservationPayment) ;
//  - KKiaPay (lien de paiement) pour les devis (initiateKkiapayReservationPayment).
// Best-effort : sans clé configurée, le prestataire est désactivé et le
// panier bascule sur un paiement « à la remise » sans bloquer la commande.

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

// `provider_tx_id` (id technique chez le prestataire : FedaPay / KKiaPay) a été
// ajoutée par la migration 20260810000000 mais n'existe pas encore dans les
// types Supabase générés (types.ts sera patché à part) — interface locale.
interface ReservationPaymentRow {
  reference: string;
  source: string;
  amount: number;
  currency: string;
  method: string;
  status: PaymentStatus;
  tx_ref: string;
  provider_tx_id?: string;
}

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

/**
 * Précharge un dossier de réservation pour un paiement en ligne : vérifie
 * l'éligibilité (devis approuvé avec montant, ou dossier confirmé) et le
 * statut d'un éventuel paiement déjà initié. Commun aux trois prestataires.
 */
async function loadReservationForPayment(reference: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: reservation, error: fetchError } = await supabaseAdmin
    .from("reservations")
    .select("reference, status, quote_status, quote_amount, customer_name, email, phone")
    .eq("reference", reference)
    .maybeSingle();

  if (fetchError || !reservation) {
    console.error("[payments] reservation lookup failed", fetchError);
    return { error: "Dossier introuvable." } as const;
  }

  const quoteApproved =
    reservation.quote_status === "approved" && (reservation.quote_amount ?? 0) > 0;
  if (reservation.status !== "confirmee" && !quoteApproved) {
    return { error: "Ce dossier ne peut pas encore être payé en ligne." } as const;
  }
  const amount = reservation.quote_amount ?? 0;
  if (amount <= 0) {
    return { error: "Aucun montant de devis à régler." } as const;
  }

  // Idempotence : si un paiement est déjà initié pour cette réservation, on
  // renvoie son état sans créer une nouvelle transaction.
  const { data: existing } = await supabaseAdmin
    .from("payments")
    .select("id, tx_ref, status")
    .eq("reference", reference)
    .eq("source", "reservation")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.tx_ref && existing.status === "paid") {
    return {
      alreadyPaid: true as const,
      paymentRef: existing.id,
      reservation,
      amount,
    };
  }

  return { alreadyPaid: false as const, paymentRef: existing?.id ?? null, reservation, amount };
}

/**
 * Initialise un paiement FedaPay pour le devis approuvé d'une réservation.
 * Le montant est toujours celui du devis (quote_amount). FedaPay expose un
 * lien de checkout hébergé (payment_url) ouvert par le client.
 *
 * INPUT  : { reference: string }
 * OUTPUT : même forme que initiateReservationPayment
 *          ({ ok, url, paymentRef, alreadyPaid } | { ok: false, error }).
 */
export const initiateFedaPayReservationPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => referenceSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getRequestUrl } = await import("@tanstack/react-start/server");

    if (!rateLimit("fedapay-res-init", 5)) {
      throw new Error("Trop de demandes de paiement. Réessayez dans une minute.");
    }

    const secret = process.env["FEDAPAY_SECRET_KEY"];
    if (!secret) {
      console.warn("[payments] FEDAPAY_SECRET_KEY absent — FedaPay désactivé");
      return {
        ok: false as const,
        error: "Le paiement FedaPay n'est pas disponible pour le moment.",
      };
    }

    const loaded = await loadReservationForPayment(data.reference);
    if ("error" in loaded) {
      return { ok: false as const, error: loaded.error };
    }
    if (loaded.alreadyPaid) {
      return {
        ok: true as const,
        url: null as string | null,
        paymentRef: loaded.paymentRef,
        alreadyPaid: true as const,
      };
    }

    const { reservation, amount } = loaded;
    const tx_ref = `AT-${data.reference}`;
    const origin = getRequestUrl({ xForwardedHost: true }).origin;

    // FedaPay attend les prénom / nom séparément ; on découpe le nom complet.
    const nameParts = reservation.customer_name.trim().split(/\s+/);
    const firstname = nameParts[0] ?? reservation.customer_name.trim();
    const lastname = nameParts.slice(1).join(" ") || "—";

    const phoneDigits = reservation.phone.replace(/\D/g, "");

    let paymentUrl: string | null = null;
    let providerTxId: string | null = null;
    try {
      const res = await fetch(
        `${process.env["FEDAPAY_SANDBOX"] === "true" ? "https://sandbox-api.fedapay.com" : "https://api.fedapay.com"}/v1/transactions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secret}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            description: `Paiement devis ${tx_ref} (réparation)`,
            amount,
            currency: { iso: "XOF" },
            callback_url: `${origin}/api/fedapay-webhook`,
            reference: tx_ref,
            customer: {
              firstname,
              lastname,
              email: reservation.email || `${data.reference}@allotechno.africa`,
              phone_number: { number: phoneDigits, country: "bj" },
            },
          }),
        },
      );

      const body = (await res.json()) as {
        data?: { id?: string | number; payment_url?: string; status?: string; reference?: string };
      };
      const tx = body.data;
      if (res.ok && tx?.payment_url && String(tx.id ?? "").length > 0) {
        providerTxId = String(tx.id);
        paymentUrl = tx.payment_url;
      } else {
        console.error(
          "[payments] FedaPay init failed",
          res.status,
          JSON.stringify(body).slice(0, 300),
        );
      }
    } catch (err) {
      console.error("[payments] FedaPay network error", err);
    }

    if (!paymentUrl || !providerTxId) {
      return {
        ok: false as const,
        error:
          "Le service de paiement est momentanément indisponible. Réessayez dans quelques minutes.",
      };
    }

    const paymentRow: ReservationPaymentRow = {
      reference: data.reference,
      source: "reservation",
      amount,
      currency: "XOF",
      method: "FedaPay",
      status: "pending",
      tx_ref,
      provider_tx_id: providerTxId,
    };
    const { data: inserted, error } = await supabaseAdmin
      .from("payments")
      .upsert(paymentRow, { onConflict: "tx_ref" })
      .select("id")
      .single();

    if (error || !inserted) {
      console.error("[payments] FedaPay upsert failed", error);
      return { ok: false as const, error: "Impossible d'enregistrer le paiement." };
    }

    return {
      ok: true as const,
      url: paymentUrl,
      paymentRef: inserted.id,
      alreadyPaid: false as const,
    };
  });

/**
 * Initialise un lien KKiaPay pour le devis approuvé d'une réservation
 * (Mobile Money). KKiaPay renvoie une URL (page ou mobile) à ouvrir par le
 * client ; le webhook confirmera la transaction.
 *
 * INPUT  : { reference: string }
 * OUTPUT : même forme que initiateReservationPayment.
 */
export const initiateKkiapayReservationPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => referenceSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getRequestUrl } = await import("@tanstack/react-start/server");

    if (!rateLimit("kkiapay-res-init", 5)) {
      throw new Error("Trop de demandes de paiement. Réessayez dans une minute.");
    }

    const apiKey = process.env["KKIAPAY_API_KEY"];
    const apiSecret = process.env["KKIAPAY_SECRET"];
    if (!apiKey || !apiSecret) {
      console.warn("[payments] clés KKiaPay absentes — KKiaPay désactivé");
      return {
        ok: false as const,
        error: "Le paiement KKiaPay n'est pas disponible pour le moment.",
      };
    }

    const loaded = await loadReservationForPayment(data.reference);
    if ("error" in loaded) {
      return { ok: false as const, error: loaded.error };
    }
    if (loaded.alreadyPaid) {
      return {
        ok: true as const,
        url: null as string | null,
        paymentRef: loaded.paymentRef,
        alreadyPaid: true as const,
      };
    }

    const { reservation, amount } = loaded;
    const tx_ref = `AT-${data.reference}`;

    // KKiaPay attend le numéro avec l'indicatif pays (« +229… »).
    const phoneDigits = reservation.phone.replace(/\D/g, "");
    const prefix = process.env["PHONE_COUNTRY_PREFIX"] || "229";
    const phone = phoneDigits.startsWith("229") ? `+${phoneDigits}` : `+${prefix}${phoneDigits}`;

    let redirectUrl: string | null = null;
    let providerToken: string | null = null;
    try {
      const res = await fetch(
        `${process.env["KKIAPAY_SANDBOX"] === "true" ? "https://sandbox-api.kkiapay.me" : "https://api.kkiapay.me"}/v2/transactions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apikey: apiKey,
            secret: apiSecret,
            phone,
            amount,
            reference: tx_ref,
            callback_url: `${getRequestUrl({ xForwardedHost: true }).origin}/api/kkiapay-webhook`,
          }),
        },
      );

      const body = (await res.json()) as {
        success?: boolean;
        token?: string;
        link?: string;
        redirect_url?: string;
      };
      if (res.ok && body.success && (body.redirect_url || body.link) && body.token) {
        redirectUrl = body.redirect_url ?? body.link ?? null;
        providerToken = body.token;
      } else {
        console.error("[payments] KKiaPay init failed", res.status, JSON.stringify(body).slice(0, 300));
      }
    } catch (err) {
      console.error("[payments] KKiaPay network error", err);
    }

    if (!redirectUrl || !providerToken) {
      return {
        ok: false as const,
        error:
          "Le service de paiement est momentanément indisponible. Réessayez dans quelques minutes.",
      };
    }

    const paymentRow: ReservationPaymentRow = {
      reference: data.reference,
      source: "reservation",
      amount,
      currency: "XOF",
      method: "KKiaPay",
      status: "pending",
      tx_ref,
      provider_tx_id: providerToken,
    };
    const { data: inserted, error } = await supabaseAdmin
      .from("payments")
      .upsert(paymentRow, { onConflict: "tx_ref" })
      .select("id")
      .single();

    if (error || !inserted) {
      console.error("[payments] KKiaPay upsert failed", error);
      return { ok: false as const, error: "Impossible d'enregistrer le paiement." };
    }

    return {
      ok: true as const,
      url: redirectUrl,
      paymentRef: inserted.id,
      alreadyPaid: false as const,
    };
  });
