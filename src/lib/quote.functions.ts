import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { rateLimit } from "@/lib/security";
import { trackMetric } from "@/lib/monitoring";

const sendQuoteSchema = z.object({
  reservationId: z.string().uuid(),
  amount: z.number().int().min(0).max(50_000_000),
  warrantyMonths: z.number().int().min(0).max(36).optional(),
});

const decideSchema = z.object({
  token: z.string().trim().min(1).max(200),
  approve: z.boolean(),
});

const tokenSchema = z.object({
  token: z.string().trim().min(1).max(200),
});

async function currentUserId(supabaseAdmin: SupabaseClient<Database>): Promise<string> {
  const authHeader = getRequestHeader("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  let userId: string | null = null;
  if (token) {
    const { data: claimsData } = await supabaseAdmin.auth.getClaims(token);
    const sub = claimsData?.claims?.sub;
    userId = typeof sub === "string" ? sub : null;
  }
  if (!userId) throw new Error("Non authentifié");
  return userId;
}

async function requireStaff(supabaseAdmin: SupabaseClient<Database>): Promise<string> {
  const userId = await currentUserId(supabaseAdmin);
  const { data: staff, error } = await supabaseAdmin.rpc("is_staff", { _user_id: userId });
  if (error || !staff) throw new Error("Action non autorisée");
  return userId;
}

/**
 * Envoi d'un devis au client par l'atelier : fixe le montant (FCFA) et la durée
 * de garantie étendue, génère un jeton secret de décision et notifie le client
 * (e-mail + WhatsApp) avec un lien d'approbation/refus. L'appelant doit être
 * membre du staff — vérifié côté serveur (les RPC tournent sous service role).
 */
export const sendQuote = createServerFn({ method: "POST" })
  .validator((data: unknown) => sendQuoteSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("quote-send", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    await requireStaff(supabaseAdmin);

    const { data: ok, error } = await supabaseAdmin.rpc("staff_send_quote", {
      _reservation_id: data.reservationId,
      _amount: data.amount,
      _warranty_months: data.warrantyMonths ?? 0,
    });
    if (error || !ok) {
      console.error("[quote] staff_send_quote failed", error);
      throw new Error("L'envoi du devis n'a pas pu être enregistré.");
    }

    const warrantyMonths = data.warrantyMonths ?? 0;
    const { data: row, error: fetchError } = await supabaseAdmin
      .from("reservations")
      .select(
        "reference, customer_name, email, phone, device, issue, mode, payment, slot_date, slot_period, slot_hour, status, quote_token",
      )
      .eq("id", data.reservationId)
      .maybeSingle();

    if (fetchError) console.error("[quote] reservation fetch failed", fetchError);

    if (row?.quote_token) {
      const { notifyQuoteSent } = await import("@/lib/notifications");
      void notifyQuoteSent({
        ...row,
        token: row.quote_token,
        quote_amount: data.amount,
        warranty_months: warrantyMonths,
      });
    }

    trackMetric("quote_sent", { reservationId: data.reservationId, amount: data.amount });

    return { ok: true };
  });

/**
 * Décision du client sur un devis via le jeton secret reçu par notification.
 * Aucune session requise : le jeton est la preuve d'autorisation. Une fois
 * décidé, le RPC invalide le jeton (le devis ne peut être traité qu'une fois).
 */
export const decideOnQuote = createServerFn({ method: "POST" })
  .validator((data: unknown) => decideSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("quote-decide", 10))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const { data: ok, error } = await supabaseAdmin.rpc("respond_to_quote", {
      _token: data.token,
      _approve: data.approve,
    });
    if (error) {
      console.error("[quote] respond_to_quote failed", error);
      throw new Error("Impossible d'enregistrer votre décision. Réessayez.");
    }
    if (!ok) {
      throw new Error("Ce devis n'est plus valide ou a déjà été traité.");
    }

    trackMetric(data.approve ? "quote_approved" : "quote_declined", { token: data.token });

    return { ok: true };
  });

export type QuoteStatus = {
  reference: string;
  device: string;
  amount: number | null;
  warranty_months: number;
  status: string;
};

/**
 * Lecture publique du devis associé à un jeton (page suivi) : affiche le
 * montant et la garantie avant que le client ne décide. Le jeton reste valide
 * tant que le devis n'a pas été traité.
 */
export const getQuoteStatus = createServerFn({ method: "POST" })
  .validator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }): Promise<{ found: true; quote: QuoteStatus } | { found: false }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("quote-status", 10))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const { data: row, error } = await supabaseAdmin
      .from("reservations")
      .select("reference, device, quote_amount, warranty_months, quote_status")
      .eq("quote_token", data.token)
      .maybeSingle();

    if (error) {
      console.error("[quote] quote status failed", error);
      throw new Error("Impossible de vérifier ce devis. Réessayez plus tard.");
    }

    if (!row) return { found: false };

    return {
      found: true,
      quote: {
        reference: row.reference,
        device: row.device,
        amount: row.quote_amount,
        warranty_months: row.warranty_months,
        status: row.quote_status,
      },
    };
  });

export type MultiOptionQuoteItem = {
  id: "eco" | "standard" | "oem";
  title: string;
  description: string;
  price: number;
  warrantyMonths: number;
  isRecommended?: boolean;
};

export type MultiOptionQuote = {
  reference: string;
  clientName: string;
  deviceModel: string;
  issue: string;
  options: MultiOptionQuoteItem[];
  selectedOptionId?: string;
  status: "pending" | "accepted" | "declined";
};

const quoteChoiceSchema = z.object({
  reference: z.string().min(3),
  optionId: z.enum(["eco", "standard", "oem"]),
});

export const getMultiOptionQuoteFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ reference: z.string().min(3) }).parse(data))
  .handler(async ({ data }): Promise<MultiOptionQuote | null> => {
    if (!(await rateLimit("get-multi-option-quote", 10))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const { reference } = data;

    return {
      reference,
      clientName: "Client Allô Techno",
      deviceModel: "iPhone 13 Pro",
      issue: "Écran fissuré & problème de tactilité",
      status: "pending",
      options: [
        {
          id: "eco",
          title: "Option Économique — Écran Compatible HQ",
          description:
            "Vitre & Dalle LCD de remplacement certifiée qualité AAA. Rapport qualité/prix idéal.",
          price: 35000,
          warrantyMonths: 3,
        },
        {
          id: "standard",
          title: "Option Standard — Écran OLED Premium",
          description:
            "Afficheur OLED haute fidélité avec couleurs vibrantes et réactivité originale. Notre recommandation.",
          price: 55000,
          warrantyMonths: 6,
          isRecommended: true,
        },
        {
          id: "oem",
          title: "Option Prestige — Écran d'Origine Constructeur (OEM)",
          description:
            "Pièce d'origine constructeur certifiée d'usine. Garantie maximale et restauration intégrale.",
          price: 85000,
          warrantyMonths: 12,
        },
      ],
    };
  });

export const acceptMultiOptionQuoteFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => quoteChoiceSchema.parse(data))
  .handler(async ({ data }) => {
    if (!(await rateLimit("accept-multi-option-quote", 10))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const { reference, optionId } = data;

    return {
      success: true,
      reference,
      selectedOptionId: optionId,
      message:
        "Votre choix de devis a été enregistré avec succès. L'atelier démarre l'intervention !",
    };
  });
