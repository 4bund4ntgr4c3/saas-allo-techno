// ============================================================================
// Allô Techno — Envoi WhatsApp Cloud API (Meta) — notifications transactionnelles
// Les "service conversations" (OTP, alertes dossier, devis, retrait) sont
// GRATUITES depuis novembre 2024 — pas d'abonnement, pas de coût à l'unité.
// Prérequis : compte Meta Business + numéro WhatsApp vérifié + templates
// approuvés (dossier_enregistre, devis_prest, appareil_prest, rappel_garantie).
// Secrets : WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID (wrangler secret put).
// ============================================================================

import { COMPANY, formatFcfa } from "@/data/catalog/company";
import type { SmsPayload } from "@/lib/sms-notifications";

const API_VERSION = "v23.0";
const BASE_URL = "https://graph.facebook.com";

type TemplateName = "dossier_enregistre" | "devis_prest" | "appareil_prest" | "rappel_garantie";

function getCredentials(): { token: string; phoneId: string } | null {
  const token = process.env["WHATSAPP_ACCESS_TOKEN"];
  const phoneId = process.env["WHATSAPP_PHONE_NUMBER_ID"];
  if (!token || !phoneId) return null;
  return { token, phoneId };
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.startsWith("229") ? digits : `229${digits}`;
}

function buildTemplate(payload: SmsPayload): {
  name: TemplateName;
  parameters: { type: "text"; text: string }[];
} {
  const trackingUrl = `https://allotechno.africa/fr/suivi?ref=${payload.reference}`;
  switch (payload.type) {
    case "deposit_confirmed":
      return {
        name: "dossier_enregistre",
        parameters: [
          { type: "text", text: payload.customerName },
          { type: "text", text: payload.extraData?.device || "appareil" },
          { type: "text", text: payload.reference },
          { type: "text", text: trackingUrl },
          { type: "text", text: COMPANY.phone },
        ],
      };
    case "quote_ready":
      return {
        name: "devis_prest",
        parameters: [
          { type: "text", text: payload.reference },
          { type: "text", text: formatFcfa(payload.extraData?.amountFcfa || 0) },
          {
            type: "text",
            text: payload.extraData?.quoteUrl || trackingUrl,
          },
        ],
      };
    case "ready_for_pickup":
      return {
        name: "appareil_prest",
        parameters: [
          { type: "text", text: payload.customerName },
          { type: "text", text: payload.extraData?.device || "appareil" },
          { type: "text", text: payload.reference },
          { type: "text", text: COMPANY.address },
        ],
      };
    case "warranty_reminder":
      return {
        name: "rappel_garantie",
        parameters: [
          { type: "text", text: payload.reference },
          { type: "text", text: COMPANY.phone },
        ],
      };
  }
}

export type WhatsAppSendResult =
  | { success: true; messageId?: string }
  | { success: false; reason: "not_configured" | "api_error" };

/** Envoie un message template via WhatsApp Cloud API (service, gratuit). */
export async function sendWhatsAppCloud(payload: SmsPayload): Promise<WhatsAppSendResult> {
  const creds = getCredentials();
  if (!creds) {
    return { success: false, reason: "not_configured" };
  }
  const template = buildTemplate(payload);
  try {
    const res = await fetch(`${BASE_URL}/${API_VERSION}/${creds.phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizePhone(payload.recipientPhone),
        type: "template",
        template: {
          name: template.name,
          language: { code: "fr" },
          components: [{ type: "body", parameters: template.parameters }],
        },
      }),
    });
    if (!res.ok) {
      console.error(`[whatsapp-cloud] API ${res.status}: ${await res.text()}`);
      return { success: false, reason: "api_error" };
    }
    const data = (await res.json()) as { messages?: { id?: string }[] };
    const messageId = data.messages?.[0]?.id;
    return messageId ? { success: true, messageId } : { success: true };
  } catch (err) {
    console.error("[whatsapp-cloud] fetch failed", err);
    return { success: false, reason: "api_error" };
  }
}
