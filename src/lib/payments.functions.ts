// Paiement en ligne des devis de réparation approuvés et des commandes
// boutique. Trois prestataires Mobile Money (XOF) :
//  - Flutterwave (hosted checkout) pour le panier boutique
//    (initiateFlutterwavePayment) et les devis (initiateReservationPayment) ;
//  - FedaPay (hosted checkout) pour les devis (initiateFedaPayReservationPayment) ;
//  - KKiaPay (lien de paiement) pour les devis (initiateKkiapayReservationPayment).
// Best-effort : sans clé configurée, le prestataire est désactivé et le
// panier bascule sur un paiement « à la remise » sans bloquer la commande.

import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { rateLimit } from "@/lib/security";
import { createLogger } from "@/lib/logger";
import { trackMetric } from "@/lib/monitoring";

const logger = createLogger("payments");

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
  amount: z.number().int().positive(),
});

const reservationAmountSchema = z.object({
  reference: z.string().trim().min(1).max(30),
  amount: z.number().int().positive(),
});

/**
 * Montants acceptés pour le règlement en ligne d'un devis : l'intégralité du
 * devis, l'acompte de 50 % (arrondi au supérieur), ou le solde restant après
 * un acompte déjà versé. Tout autre montant est rejeté — le client ne choisit
 * jamais le montant facturé.
 */
function validatedPaymentAmount(quoteAmount: number, amount: number): number | null {
  if (quoteAmount <= 0) return null;
  const deposit = Math.ceil(quoteAmount * 0.5);
  const balance = quoteAmount - deposit;
  if (amount === quoteAmount || amount === deposit || amount === balance) return amount;
  return null;
}

async function currentUserId(supabaseAdmin: SupabaseClient<Database>): Promise<string> {
  const authHeader = getRequestHeader("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) throw new Error("Non authentifié");
  const { data: claimsData } = await supabaseAdmin.auth.getClaims(token);
  const sub = claimsData?.claims?.sub;
  if (typeof sub !== "string") throw new Error("Non authentifié");
  return sub;
}

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
    logger.warn("FLUTTERWAVE_SECRET_KEY absent — paiement en ligne désactivé");
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
    logger.error("Flutterwave init failed", new Error(`HTTP ${res.status}`), {
      status: res.status,
      message: body.message,
    });
  } catch (err) {
    logger.error("Flutterwave network error", err as Error);
  }
  return null;
}

/**
 * Initialise un paiement Flutterwave pour une commande boutique.
 * Retourne { available:false } si le service n'est pas configuré (le panier
 * bascule alors sur « paiement à la remise »), ou { available:true, link }.
 */
export const initiateFlutterwavePayment = createServerFn({ method: "POST" })
  .validator((data: unknown) => initiateSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getRequestUrl } = await import("@tanstack/react-start/server");

    if (!(await rateLimit("fw-init", 5))) {
      throw new Error("Trop de demandes de paiement. Réessayez dans une minute.");
    }

    const secret = process.env["FLUTTERWAVE_SECRET_KEY"];
    if (!secret) {
      logger.warn("FLUTTERWAVE_SECRET_KEY absent — paiement en ligne désactivé");
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
      trackMetric("payment_processed", { reference: data.reference, source: "boutique" });
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
      trackMetric("payment_failed", { reference: data.reference, source: "boutique" });
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
      logger.error("upsert failed", error as Error);
      return { available: false } as const;
    }

    return { available: true as const, link, paid: false as const };
  });

/** Retourne le statut du dernier paiement d'une commande (ou null). */
export const getOrderPaymentStatus = createServerFn({ method: "POST" })
  .validator((data: unknown) => referenceSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("fw-status", 10))) {
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
      logger.error("status lookup failed", error as Error);
      throw new Error("Impossible de vérifier le paiement. Réessayez.");
    }

    return { status: (payment?.status as PaymentStatus | undefined) ?? null };
  });

/**
 * Initialise un paiement en ligne Flutterwave (Mobile Money : MTN MoMo,
 * Moov Money, Celtiis) pour le devis approuvé d'une réservation. Le montant
 * est validé côté serveur : intégralité du devis, ou acompte de 50 %.
 *
 * INPUT  : { reference: string, method: "MTN MoMo" | "Moov Money" | "Celtiis",
 *            amount: number }
 * OUTPUT : { ok: true, url: string | null, paymentRef: string | null,
 *            alreadyPaid: boolean }            — url = lien de checkout à ouvrir
 *            (null si déjà payé) ; paymentRef = id de la ligne payments.
 *        | { ok: false, error: string }
 */
export const initiateReservationPayment = createServerFn({ method: "POST" })
  .validator((data: unknown) => reservationPaySchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getRequestUrl } = await import("@tanstack/react-start/server");

    if (!(await rateLimit("fw-res-init", 5))) {
      throw new Error("Trop de demandes de paiement. Réessayez dans une minute.");
    }

    const { data: reservation, error: fetchError } = await supabaseAdmin
      .from("reservations")
      .select("reference, status, quote_status, quote_amount, customer_name, email, phone")
      .eq("reference", data.reference)
      .maybeSingle();

    if (fetchError || !reservation) {
      logger.error("reservation lookup failed", fetchError as Error);
      return { ok: false as const, error: "Dossier introuvable." };
    }

    // Éligibilité : devis approuvé avec montant, ou dossier confirmé (un
    // montant de devis doit toutefois exister pour régler en ligne).
    const quoteApproved =
      reservation.quote_status === "approved" && (reservation.quote_amount ?? 0) > 0;
    if (reservation.status !== "confirmee" && !quoteApproved) {
      return { ok: false as const, error: "Ce dossier ne peut pas encore être payé en ligne." };
    }
    const amount = validatedPaymentAmount(reservation.quote_amount ?? 0, data.amount);
    if (amount === null) {
      return {
        ok: false as const,
        error: "Le montant demandé ne correspond pas au devis (total ou acompte de 50 %).",
      };
    }

    // Idempotence : si le montant demandé a déjà été réglé (dernier paiement
    // confirmé du même montant), on renvoie l'état sans nouvelle transaction.
    // Un acompte déjà versé ne bloque pas le règlement du solde restant.
    const { data: existing } = await supabaseAdmin
      .from("payments")
      .select("id, tx_ref, status, amount")
      .eq("reference", data.reference)
      .eq("source", "reservation")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing?.tx_ref && existing.status === "paid" && existing.amount === amount) {
      trackMetric("payment_processed", { reference: data.reference, source: "reservation" });
      return {
        ok: true as const,
        url: null as string | null,
        paymentRef: existing.id,
        alreadyPaid: true as const,
      };
    }

    const tx_ref = `AT-${data.reference}-${Date.now().toString().slice(-6)}`;
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
      trackMetric("payment_failed", { reference: data.reference, source: "reservation" });
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
      logger.error("reservation payment upsert failed", error as Error);
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
 * Retourne le statut du dernier paiement d'une réservation (source='reservation'),
 * ainsi que le total déjà réglé et le solde restant (acompte possible).
 *
 * INPUT  : { reference: string }
 * OUTPUT : { status: "pending" | "paid" | "failed" | "refunded" | null,
 *            txId: string | null, amount: number | null, method: string | null,
 *            paidAmount: number, remaining: number }
 *          — champs null si aucun paiement n'a encore été initié.
 */
export const getReservationPaymentStatus = createServerFn({ method: "POST" })
  .validator((data: unknown) => referenceSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("fw-res-status", 10))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const [{ data: payment, error }, quoteRes, paidRes] = await Promise.all([
      supabaseAdmin
        .from("payments")
        .select("status, tx_id, amount, method")
        .eq("reference", data.reference)
        .eq("source", "reservation")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from("reservations")
        .select("quote_amount")
        .eq("reference", data.reference)
        .maybeSingle(),
      supabaseAdmin
        .from("payments")
        .select("amount")
        .eq("reference", data.reference)
        .eq("source", "reservation")
        .eq("status", "paid"),
    ]);

    if (error) {
      logger.error("reservation status lookup failed", error as Error);
      throw new Error("Impossible de vérifier le paiement. Réessayez.");
    }

    const quoteAmount = quoteRes.data?.quote_amount ?? 0;
    const paidAmount = (paidRes.data ?? []).reduce((n, p) => n + (p.amount ?? 0), 0);

    return {
      status: (payment?.status as PaymentStatus | undefined) ?? null,
      txId: payment?.tx_id ?? null,
      amount: payment?.amount ?? null,
      method: payment?.method ?? null,
      paidAmount,
      remaining: Math.max(0, quoteAmount - paidAmount),
    };
  });

/**
 * Précharge un dossier de réservation pour un paiement en ligne : vérifie
 * l'éligibilité (devis approuvé avec montant, ou dossier confirmé), valide le
 * montant demandé (total, acompte de 50 % ou solde restant) et le statut d'un
 * éventuel paiement déjà initié. Commun aux trois prestataires.
 */
async function loadReservationForPayment(reference: string, amount: number) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: reservation, error: fetchError } = await supabaseAdmin
    .from("reservations")
    .select("reference, status, quote_status, quote_amount, customer_name, email, phone")
    .eq("reference", reference)
    .maybeSingle();

  if (fetchError || !reservation) {
    logger.error("reservation lookup failed", fetchError as Error);
    return { error: "Dossier introuvable." } as const;
  }

  const quoteApproved =
    reservation.quote_status === "approved" && (reservation.quote_amount ?? 0) > 0;
  if (reservation.status !== "confirmee" && !quoteApproved) {
    return { error: "Ce dossier ne peut pas encore être payé en ligne." } as const;
  }
  const validated = validatedPaymentAmount(reservation.quote_amount ?? 0, amount);
  if (validated === null) {
    return {
      error:
        "Le montant demandé ne correspond pas au devis (total, acompte de 50 % ou solde restant).",
    } as const;
  }

  // Idempotence : si le montant demandé a déjà été réglé (dernier paiement
  // confirmé du même montant), on renvoie l'état sans nouvelle transaction.
  // Un acompte déjà versé ne bloque pas le règlement du solde restant.
  const { data: existing } = await supabaseAdmin
    .from("payments")
    .select("id, tx_ref, status, amount")
    .eq("reference", reference)
    .eq("source", "reservation")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.tx_ref && existing.status === "paid" && existing.amount === validated) {
    return {
      alreadyPaid: true as const,
      paymentRef: existing.id,
      reservation,
      amount: validated,
    };
  }

  return {
    alreadyPaid: false as const,
    paymentRef: existing?.id ?? null,
    reservation,
    amount: validated,
  };
}

/**
 * Initialise un paiement FedaPay pour le devis approuvé d'une réservation.
 * Le montant est validé côté serveur (total, acompte de 50 % ou solde restant).
 * FedaPay expose un lien de checkout hébergé (payment_url) ouvert par le client.
 *
 * INPUT  : { reference: string, amount: number }
 * OUTPUT : même forme que initiateReservationPayment
 *          ({ ok, url, paymentRef, alreadyPaid } | { ok: false, error }).
 */
export const initiateFedaPayReservationPayment = createServerFn({ method: "POST" })
  .validator((data: unknown) => reservationAmountSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getRequestUrl } = await import("@tanstack/react-start/server");

    if (!(await rateLimit("fedapay-res-init", 5))) {
      throw new Error("Trop de demandes de paiement. Réessayez dans une minute.");
    }

    const secret = process.env["FEDAPAY_SECRET_KEY"];
    if (!secret) {
      logger.warn("FEDAPAY_SECRET_KEY absent — FedaPay désactivé");
      return {
        ok: false as const,
        error: "Le paiement FedaPay n'est pas disponible pour le moment.",
      };
    }

    const loaded = await loadReservationForPayment(data.reference, data.amount);
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
    const tx_ref = `AT-${data.reference}-${Date.now().toString().slice(-6)}`;
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
        logger.error("FedaPay init failed", new Error(`HTTP ${res.status}`), {
          status: res.status,
          body: JSON.stringify(body).slice(0, 300),
        });
      }
    } catch (err) {
      logger.error("FedaPay network error", err as Error);
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
      logger.error("FedaPay upsert failed", error as Error);
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
 * client ; le webhook confirmera la transaction. Le montant est validé côté
 * serveur (total, acompte de 50 % ou solde restant).
 *
 * INPUT  : { reference: string, amount: number }
 * OUTPUT : même forme que initiateReservationPayment.
 */
export const initiateKkiapayReservationPayment = createServerFn({ method: "POST" })
  .validator((data: unknown) => reservationAmountSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getRequestUrl } = await import("@tanstack/react-start/server");

    if (!(await rateLimit("kkiapay-res-init", 5))) {
      throw new Error("Trop de demandes de paiement. Réessayez dans une minute.");
    }

    const apiKey = process.env["KKIAPAY_API_KEY"];
    const apiSecret = process.env["KKIAPAY_SECRET"];
    if (!apiKey || !apiSecret) {
      logger.warn("clés KKiaPay absentes — KKiaPay désactivé");
      return {
        ok: false as const,
        error: "Le paiement KKiaPay n'est pas disponible pour le moment.",
      };
    }

    const loaded = await loadReservationForPayment(data.reference, data.amount);
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
    const tx_ref = `AT-${data.reference}-${Date.now().toString().slice(-6)}`;

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
        logger.error("KKiaPay init failed", new Error(`HTTP ${res.status}`), {
          status: res.status,
          body: JSON.stringify(body).slice(0, 300),
        });
      }
    } catch (err) {
      logger.error("KKiaPay network error", err as Error);
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
      logger.error("KKiaPay upsert failed", error as Error);
      return { ok: false as const, error: "Impossible d'enregistrer le paiement." };
    }

    return {
      ok: true as const,
      url: redirectUrl,
      paymentRef: inserted.id,
      alreadyPaid: false as const,
    };
  });

// ---------------------------------------------------------------------------
// Historique paiements client connecté
// ---------------------------------------------------------------------------

export type CustomerPayment = {
  id: string;
  amount: number;
  method: string;
  status: string;
  reference: string;
  created_at: string;
  device: string | null;
};

/** Liste les paiements de l'utilisateur connecté (via réservations liées). */
export const listCustomerPayments = createServerFn({ method: "POST" }).handler(
  async (): Promise<CustomerPayment[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("customer-payments-list", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const userId = await currentUserId(supabaseAdmin);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("phone")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.phone) return [];

    const { data: reservations, error: resError } = await supabaseAdmin
      .from("reservations")
      .select("reference, device")
      .eq("user_id", userId)
      .limit(200);

    if (resError) {
      logger.error("customer reservations lookup failed", resError as Error);
      return [];
    }

    const references = (reservations ?? []).map((r) => r.reference).filter(Boolean);
    if (references.length === 0) return [];

    const deviceByRef = new Map<string, string>();
    for (const r of reservations ?? []) {
      if (r.reference && r.device) deviceByRef.set(r.reference, r.device);
    }

    const { data: payments, error: payError } = await supabaseAdmin
      .from("payments")
      .select("id, amount, method, status, reference, created_at")
      .in("reference", references as string[])
      .order("created_at", { ascending: false })
      .limit(100);

    if (payError) {
      logger.error("customer list failed", payError as Error);
      return [];
    }

    return (payments ?? []).map((p) => ({
      id: p.id,
      amount: p.amount,
      method: p.method,
      status: p.status,
      reference: p.reference,
      created_at: p.created_at,
      device: deviceByRef.get(p.reference) ?? null,
    }));
  },
);
