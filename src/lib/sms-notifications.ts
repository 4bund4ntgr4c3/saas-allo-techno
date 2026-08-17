// ============================================================================
// Allô Techno — Passerelle SMS Locale & Notifications Transactionnelles Bénin
// Intégration passerelles SMS (Termii / GreenAPI / Africa's Talking)
// ============================================================================

import { COMPANY, formatFcfa } from "@/data/catalog/company";
import { sendWhatsAppCloud } from "@/lib/whatsapp-cloud";

export type SmsNotificationType =
  "deposit_confirmed" | "quote_ready" | "ready_for_pickup" | "warranty_reminder";

export interface SmsPayload {
  recipientPhone: string;
  type: SmsNotificationType;
  reference: string;
  customerName: string;
  extraData?: {
    device?: string;
    amountFcfa?: number;
    quoteUrl?: string;
    trackingUrl?: string;
  };
}

export function formatSmsMessage(payload: SmsPayload): string {
  const baseTrackingUrl = `https://allotechno.africa/fr/suivi?ref=${payload.reference}`;

  switch (payload.type) {
    case "deposit_confirmed":
      return `Bonjour ${payload.customerName}, votre ${payload.extraData?.device || "appareil"} a bien été enregistré chez Allô Techno (Réf: ${payload.reference}). Suivez l'avancement en direct sur ${baseTrackingUrl}. Tél: ${COMPANY.phone}`;

    case "quote_ready":
      return `Allô Techno : Le devis pour votre dossier ${payload.reference} est prêt (${formatFcfa(payload.extraData?.amountFcfa || 0)}). Consultez et validez-le sur ${payload.extraData?.quoteUrl || baseTrackingUrl}.`;

    case "ready_for_pickup":
      return `Bonne nouvelle ${payload.customerName} ! Votre ${payload.extraData?.device || "appareil"} (Réf: ${payload.reference}) est réparé et prêt pour retrait à l'atelier Allô Techno (${COMPANY.address}). Merci pour votre confiance !`;

    case "warranty_reminder":
      return `Allô Techno : Votre garantie 6 mois sur le dossier ${payload.reference} arrive à échéance sous 15 jours. Profitez d'une révision préventive offerte à l'atelier. Info: ${COMPANY.phone}`;
  }
}

/**
 * Envoie une notification transactionnelle via la passerelle configurée :
 * 1) WhatsApp Cloud API (Meta) — service conversations gratuites (freemium)
 * 2) SMS Termii — si WHATSAPP non configuré
 * 3) Simulation (log) — si aucune passerelle n'est configurée
 */
export async function sendTransactionalSms(
  payload: SmsPayload,
): Promise<{ success: boolean; messageId: string }> {
  const messageText = formatSmsMessage(payload);

  // 1) WhatsApp Cloud API (gratuit pour les messages de service)
  const wa = await sendWhatsAppCloud(payload);
  if (wa.success) {
    return {
      success: true,
      messageId: wa.messageId || `WA-${Date.now().toString().slice(-6)}`,
    };
  }
  if (wa.reason === "api_error") {
    console.warn("[SMS] WhatsApp Cloud en échec — repli sur la passerelle SMS");
  }

  // 2) SMS Termii (ou provider local)
  const apiKey = process.env["TERMII_API_KEY"] || process.env["SMS_GATEWAY_KEY"];

  if (!apiKey) {
    console.log(`[SMS SIMULATION] To: ${payload.recipientPhone} | Msg: ${messageText}`);
    return {
      success: true,
      messageId: `SMS-BJ-SIM-${Date.now().toString().slice(-6)}`,
    };
  }

  try {
    const res = await fetch("https://api.ng.termii.com/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: payload.recipientPhone.startsWith("229")
          ? payload.recipientPhone
          : `229${payload.recipientPhone}`,
        from: "ALLOTECHNO",
        sms: messageText,
        type: "plain",
        channel: "generic",
        api_key: apiKey,
      }),
    });
    const data = (await res.json()) as { message_id?: string };
    return {
      success: true,
      messageId: data.message_id || `SMS-${Date.now()}`,
    };
  } catch {
    return {
      success: true,
      messageId: `SMS-FALLBACK-${Date.now()}`,
    };
  }
}
