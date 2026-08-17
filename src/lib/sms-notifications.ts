// ============================================================================
// Allô Techno — Notifications transactionnelles (WhatsApp Cloud API + simulation)
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
 * 2) Simulation (log) — si WhatsApp non configuré
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
    console.warn("[SMS] WhatsApp Cloud en échec — repli sur la simulation");
  }

  // 2) Simulation
  console.log(`[SMS SIMULATION] To: ${payload.recipientPhone} | Msg: ${messageText}`);
  return {
    success: true,
    messageId: `SMS-BJ-SIM-${Date.now().toString().slice(-6)}`,
  };
}
