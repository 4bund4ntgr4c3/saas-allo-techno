// Paiement en ligne Flutterwave (hosted checkout, XOF) pour les commandes
// boutique. Best-effort : sans FLUTTERWAVE_SECRET_KEY configurée, le service
// est désactivé (available=false) et le panier bascule sur un paiement
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

type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

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

    let link: string | null = null;
    try {
      const res = await fetch("https://api.flutterwave.com/v3/payments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tx_ref,
          amount: data.amount,
          currency: "XOF",
          redirect_url: redirectUrl,
          customer: {
            email: data.customer.email || `${data.reference}@allotechno.africa`,
            name: data.customer.name,
            phone_number: data.customer.phone,
          },
          customizations: {
            title: "Allô Techno — Commande " + data.reference,
            description: "Paiement de votre commande d'accessoires",
          },
        }),
      });

      const body = (await res.json()) as {
        status?: string;
        message?: string;
        data?: { link?: string };
      };
      if (res.ok && body.status === "success" && body.data?.link) {
        link = body.data.link;
      } else {
        console.error("[payments] Flutterwave init failed", res.status, body.message);
      }
    } catch (err) {
      console.error("[payments] Flutterwave network error", err);
    }

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
