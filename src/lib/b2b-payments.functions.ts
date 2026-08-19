import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireStaff } from "@/lib/rbac";
import { rateLimit } from "@/lib/security";
import { createLogger } from "@/lib/logger";
import { getSafePaymentOrigin } from "@/lib/origin.server";

// Paiement Mobile Money des contrats B2B (SLA). Deux prestataires (XOF) :
//  - FedaPay (hosted checkout) : initiateSlaPaymentFn provider="fedapay" ;
//  - KKiaPay (lien de paiement) : initiateSlaPaymentFn provider="kkiapay" ;
//  - virement bancaire : initiateSlaPaymentFn provider="bank_transfer"
//    (instructions RIB, aucun paiement en ligne).
// Best-effort : sans clé configurée, le prestataire est désactivé et la
// fonction échoue explicitement — jamais d'URL de checkout fabriquée.
// La confirmation arrive via /api/fedapay-webhook ou /api/kkiapay-webhook
// qui marquent la ligne payments (source="sla") comme payée.

const logger = createLogger("b2b-payments");

export type B2bPaymentProvider = "fedapay" | "kkiapay" | "bank_transfer";
export type MobileMoneyOperator = "mtn" | "moov" | "celtiis" | "card";

export type InitiateSlaPaymentInput = {
  orgId: string;
  contractNumber: string;
  amountFcfa: number;
  provider: B2bPaymentProvider;
  operator?: MobileMoneyOperator;
  phoneNumber?: string;
};

export type InitiateSlaPaymentResult =
  | {
      ok: true;
      paymentRef: string | null;
      checkoutUrl: string | null;
      status: "initiated" | "pending_wire_transfer";
      instructions: string;
    }
  | { ok: false; error: string };

const PAYMENT_UNAVAILABLE =
  "Le service de paiement est momentanément indisponible. Réessayez dans quelques minutes.";

function validateAmount(amount: number): boolean {
  return Number.isInteger(amount) && amount > 0;
}

export const initiateSlaPaymentFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orgId: z.string(),
      contractNumber: z.string(),
      amountFcfa: z.number(),
      provider: z.enum(["fedapay", "kkiapay", "bank_transfer"]),
      operator: z.enum(["mtn", "moov", "celtiis", "card"]).optional(),
      phoneNumber: z.string().optional(),
    }),
  )
  .handler(async ({ data }): Promise<InitiateSlaPaymentResult> => {
    if (!(await rateLimit("initiate-sla-payment", 10))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireStaff(supabaseAdmin);

    if (!validateAmount(data.amountFcfa)) {
      return { ok: false, error: "Montant invalide." };
    }

    if (data.provider === "bank_transfer") {
      return {
        ok: true,
        paymentRef: null,
        checkoutUrl: null,
        status: "pending_wire_transfer",
        instructions: "Virement bancaire vers BOA Bénin - RIB : BJ061 01001 001234567890 12",
      };
    }

    const tx_ref = `SLA-${data.contractNumber}-${Date.now().toString().slice(-6)}`;
    const origin = getSafePaymentOrigin();

    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("name, email, phone")
      .eq("id", data.orgId)
      .maybeSingle();

    const phoneDigits = (data.phoneNumber ?? org?.phone ?? "").replace(/\D/g, "");
    const email = org?.email ?? `${data.orgId}@allotechno.africa`;

    let providerTxId: string | null = null;
    let checkoutUrl: string | null = null;

    if (data.provider === "fedapay") {
      const secret = process.env["FEDAPAY_SECRET_KEY"];
      if (!secret) {
        logger.warn("FEDAPAY_SECRET_KEY absent — FedaPay désactivé");
        return { ok: false, error: "Le paiement FedaPay n'est pas disponible pour le moment." };
      }
      if (!phoneDigits) {
        return {
          ok: false,
          error: "Numéro de téléphone manquant pour le paiement Mobile Money.",
        };
      }

      const nameParts = (org?.name ?? data.contractNumber).trim().split(/\s+/);
      const firstname = nameParts[0] ?? data.contractNumber;
      const lastname = nameParts.slice(1).join(" ") || "—";

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
              description: `Paiement SLA ${tx_ref} (contrat B2B)`,
              amount: data.amountFcfa,
              currency: { iso: "XOF" },
              callback_url: `${origin}/api/fedapay-webhook`,
              reference: tx_ref,
              customer: {
                firstname,
                lastname,
                email,
                phone_number: { number: phoneDigits, country: "bj" },
              },
            }),
          },
        );

        const body = (await res.json()) as {
          data?: { id?: string | number; payment_url?: string };
        };
        const tx = body.data;
        if (res.ok && tx?.payment_url && String(tx.id ?? "").length > 0) {
          providerTxId = String(tx.id);
          checkoutUrl = tx.payment_url;
        } else {
          logger.error("FedaPay SLA init failed", new Error(`HTTP ${res.status}`), {
            status: res.status,
            body: JSON.stringify(body).slice(0, 300),
          });
        }
      } catch (err) {
        logger.error("FedaPay SLA network error", err as Error);
      }
    } else {
      const apiKey = process.env["KKIAPAY_API_KEY"];
      const apiSecret = process.env["KKIAPAY_SECRET"];
      if (!apiKey || !apiSecret) {
        logger.warn("clés KKiaPay absentes — KKiaPay désactivé");
        return { ok: false, error: "Le paiement KKiaPay n'est pas disponible pour le moment." };
      }
      if (!phoneDigits) {
        return {
          ok: false,
          error: "Numéro de téléphone manquant pour le paiement Mobile Money.",
        };
      }

      const prefix = process.env["PHONE_COUNTRY_PREFIX"] || "229";
      const phone = phoneDigits.startsWith("229") ? `+${phoneDigits}` : `+${prefix}${phoneDigits}`;

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
              amount: data.amountFcfa,
              reference: tx_ref,
              callback_url: `${origin}/api/kkiapay-webhook`,
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
          providerTxId = body.token;
          checkoutUrl = body.redirect_url ?? body.link ?? null;
        } else {
          logger.error("KKiaPay SLA init failed", new Error(`HTTP ${res.status}`), {
            status: res.status,
            body: JSON.stringify(body).slice(0, 300),
          });
        }
      } catch (err) {
        logger.error("KKiaPay SLA network error", err as Error);
      }
    }

    if (!checkoutUrl || !providerTxId) {
      return { ok: false, error: PAYMENT_UNAVAILABLE };
    }

    // Ligne payments (source="sla") confirmée par le webhook du prestataire.
    const { data: inserted, error } = await supabaseAdmin
      .from("payments")
      .upsert(
        {
          reference: tx_ref,
          source: "sla",
          amount: data.amountFcfa,
          currency: "XOF",
          method: data.provider === "fedapay" ? "FedaPay" : "KKiaPay",
          status: "pending",
          tx_ref,
          provider_tx_id: providerTxId,
        },
        { onConflict: "tx_ref" },
      )
      .select("id")
      .single();

    if (error || !inserted) {
      logger.error("SLA payment upsert failed", error as Error);
      return { ok: false, error: "Impossible d'enregistrer le paiement." };
    }

    return {
      ok: true,
      paymentRef: inserted.id,
      checkoutUrl,
      status: "initiated",
      instructions: `Paiement Mobile Money (${(data.operator ?? "MTN").toUpperCase()}) en cours pour ${data.amountFcfa.toLocaleString()} FCFA`,
    };
  });
