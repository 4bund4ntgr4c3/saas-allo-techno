// Service de notifications — Resend (e-mail) + Meta WhatsApp Cloud API.
// Toujours « best-effort » : sans clé API configurée, rien n'est envoyé et le
// site continue de fonctionner normalement. Les erreurs sont loggées, jamais
// propagées aux appels métier.
//
// Configuration (variables d'environnement, documentées dans le README) :
//   RESEND_API_KEY            clé API Resend (obligatoire pour l'e-mail)
//   RESEND_FROM               expéditeur vérifié, ex. "Allô Techno <no-reply@votre-domaine.bj>"
//   WHATSAPP_ACCESS_TOKEN     jeton d'accès Meta (WhatsApp Cloud API)
//   WHATSAPP_PHONE_NUMBER_ID  identifiant du numéro de téléphone WhatsApp
//
// Note WhatsApp : les messages initiés par l'entreprise doivent utiliser un
// modèle approuvé dans la console Meta (WhatsApp Manager → Modèles). Sans
// modèle configuré, l'envoi texte direct fonctionne uniquement dans la fenêtre
// de session client de 24 h ou vers les numéros de test du compte.

import { COMPANY } from "@/data/catalog/company";
import { PERIOD_LABEL, STATUS_LABEL, formatDateFr } from "@/lib/reservation-schema";
import type { Enums } from "@/integrations/supabase/types";
import { createLogger } from "@/lib/logger";
import { fetchWithRetry } from "@/lib/webhook-retry";

const logger = createLogger("notifications");

export type ReservationEvent = {
  reference: string;
  tracking_code?: string | null;
  customer_name: string;
  email: string | null;
  phone: string;
  device: string;
  issue: string;
  mode: string;
  payment: string;
  slot_date: string;
  slot_period: Enums<"slot_period">;
  slot_hour: string | null;
  status: Enums<"reservation_status">;
};

export type QuoteEvent = ReservationEvent & {
  token: string;
  quote_amount: number;
  warranty_months: number;
};

export type PhotoEvent = {
  reference: string;
  customer_name: string;
  email: string | null;
  phone: string;
  device: string;
  stage: string;
};

const RESEND_API_KEY = process.env["RESEND_API_KEY"];
const RESEND_FROM =
  process.env["RESEND_FROM"] ?? `Allô Techno <noreply@${COMPANY.email.split("@")[1]}>`;
const WHATSAPP_TOKEN = process.env["WHATSAPP_ACCESS_TOKEN"] ?? process.env["WHATSAPP_TOKEN"];
const WHATSAPP_PHONE_NUMBER_ID = process.env["WHATSAPP_PHONE_NUMBER_ID"];
const AT_API_KEY = process.env["AT_API_KEY"];
const AT_USERNAME = process.env["AT_USERNAME"] ?? "sandbox";
const AT_SENDER_ID = process.env["AT_SENDER_ID"] ?? "ALLOTECH";

/** Préfixe téléphonique du pays (Bénin = 229). Configurable via PHONE_COUNTRY_PREFIX. */
const PHONE_PREFIX = process.env["PHONE_COUNTRY_PREFIX"] ?? "229";

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const cleaned = digits.startsWith("00") ? digits.slice(2) : digits;
  return cleaned.startsWith(PHONE_PREFIX) ? cleaned : `${PHONE_PREFIX}${cleaned}`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_API_KEY) {
    logger.warn("RESEND_API_KEY manquante — e-mail ignoré");
    return;
  }
  try {
    const res = await fetchWithRetry("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: RESEND_FROM, to: [to], subject, html }),
    });
    if (!res.ok) {
      logger.error("Resend error", new Error(`HTTP ${res.status}`), {
        status: res.status,
        body: await res.text(),
      });
    }
  } catch (err) {
    logger.error("Resend échec réseau", err as Error);
  }
}

async function sendWhatsApp(to: string, body: string): Promise<void> {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    logger.warn("WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID manquants — WhatsApp ignoré");
    return;
  }
  try {
    const res = await fetchWithRetry(
      `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: normalizePhone(to),
          type: "text",
          text: { body },
        }),
      },
    );
    if (!res.ok) {
      logger.error("WhatsApp error", new Error(`HTTP ${res.status}`), {
        status: res.status,
        body: await res.text(),
      });
    }
  } catch (err) {
    logger.error("WhatsApp échec réseau", err as Error);
  }
}

async function sendSms(to: string, message: string): Promise<void> {
  if (!AT_API_KEY) {
    logger.warn("AT_API_KEY manquante — SMS ignoré");
    return;
  }
  try {
    const res = await fetchWithRetry("https://api.africastalking.com/version1/messaging", {
      method: "POST",
      headers: {
        apiKey: AT_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        username: AT_USERNAME,
        to: normalizePhone(to),
        message,
        from: AT_SENDER_ID,
      }).toString(),
    });
    if (!res.ok) {
      logger.error("SMS error", new Error(`HTTP ${res.status}`), {
        status: res.status,
        body: await res.text(),
      });
    }
  } catch (err) {
    logger.error("SMS échec réseau", err as Error);
  }
}

function shell(title: string, blocks: string[]): string {
  return `
  <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#111827">
    <div style="background:#0f172a;color:#fff;padding:20px 24px;border-radius:10px 10px 0 0">
      <strong style="font-size:16px">${COMPANY.name}</strong>
      <p style="margin:2px 0 0;font-size:12px;opacity:.8">Réparation &amp; vente — ${COMPANY.city}, Bénin</p>
    </div>
    <div style="border:1px solid #e5e7eb;border-top:0;padding:24px;border-radius:0 0 10px 10px">
      <h2 style="margin:0 0 16px;font-size:18px">${title}</h2>
      ${blocks.join("\n")}
    </div>
  </div>`;
}

function reservationSummary(r: ReservationEvent): string {
  const lines = [
    `Dossier : <strong>${r.reference}</strong>`,
    `Appareil : <strong>${r.device}</strong> (${r.issue})`,
    `Rendez-vous : <strong>${formatDateFr(r.slot_date)}</strong>, ${PERIOD_LABEL[r.slot_period]}${
      r.slot_hour ? ` à ${r.slot_hour}` : ""
    }`,
    `Statut : ${STATUS_LABEL[r.status]}`,
  ];
  if (r.tracking_code) {
    lines.push(
      `Code de suivi : <strong>${r.tracking_code}</strong> (à garder pour consulter le dossier)`,
    );
  }
  return lines.map((line) => `<p style="margin:4px 0;font-size:14px">${line}</p>`).join("");
}

function trackingLink(r: { reference: string; tracking_code?: string | null }): string {
  return `${COMPANY.url}/fr/suivi?ref=${r.reference}${r.tracking_code ? `&code=${r.tracking_code}` : ""}`;
}

/** Confirmation d'une réservation : e-mail client + WhatsApp client. */
export async function notifyReservationCreated(r: ReservationEvent): Promise<void> {
  const sujet = `Confirmation de votre réservation ${r.reference}`;
  const waBody = [
    `Bonjour ${r.customer_name}, votre réservation ${r.reference} (${r.device}) est confirmée.`,
    `Rendez-vous le ${formatDateFr(r.slot_date)} à ${r.slot_hour ?? PERIOD_LABEL[r.slot_period].toLowerCase()}.`,
    ...(r.tracking_code
      ? [`Votre code de suivi : ${r.tracking_code} (à garder précieusement).`]
      : []),
    `Suivez votre dossier : ${trackingLink(r)}`,
    `${COMPANY.name} — ${COMPANY.phone}`,
  ].join("\n");

  if (r.email) {
    const html = shell(sujet, [
      `<p style="font-size:14px">Bonjour <strong>${r.customer_name}</strong>, merci pour votre confiance. Voici le récapitulatif de votre dossier :</p>`,
      reservationSummary(r),
      `<p style="font-size:14px">Consultez l'avancement à tout moment : <a href="${trackingLink(r)}">suivre mon dossier</a></p>`,
      `<p style="margin-top:20px;font-size:12px;color:#6b7280">${COMPANY.address} — ${COMPANY.phone}</p>`,
    ]);
    await sendEmail(r.email, sujet, html);
  }
  await sendWhatsApp(r.phone, waBody);
}

export type ReservationPaidEvent = {
  reference: string;
  tracking_code?: string | null;
  customer_name: string;
  email: string | null;
  phone: string;
  device: string;
  quote_amount: number;
};

/**
 * Confirmation de paiement en ligne d'un devis approuvé : e-mail + WhatsApp
 * au client, puis alerte interne à l'atelier. Best-effort comme les autres
 * notifications : les erreurs sont loggées, jamais propagées.
 */
export async function notifyReservationPaid(r: ReservationPaidEvent): Promise<void> {
  const amount = `${r.quote_amount.toLocaleString("fr-FR")} FCFA`;
  const sujet = `Dossier ${r.reference} — paiement reçu`;
  const waBody = [
    `Bonjour ${r.customer_name}, nous avons bien reçu votre paiement en ligne de ${amount} pour le dossier ${r.reference} (${r.device}).`,
    `L'atelier s'occupe de votre appareil. Suivez l'avancement : ${trackingLink(r)}`,
    `${COMPANY.name} — ${COMPANY.phone}`,
  ].join("\n");

  if (r.email) {
    const html = shell(sujet, [
      `<p style="font-size:14px">Bonjour <strong>${r.customer_name}</strong>, nous avons bien reçu votre paiement en ligne :</p>`,
      `<p style="font-size:20px;font-weight:700;margin:10px 0;color:#16a34a">${amount}</p>`,
      `<p style="font-size:14px">Dossier <strong>${r.reference}</strong> — ${r.device}. L'atelier peut démarrer la réparation dès maintenant.</p>`,
      `<p style="font-size:14px"><a href="${trackingLink(r)}">Suivre mon dossier</a></p>`,
      `<p style="margin-top:20px;font-size:12px;color:#6b7280">${COMPANY.address} — ${COMPANY.phone}</p>`,
    ]);
    await sendEmail(r.email, sujet, html);
  }
  await sendWhatsApp(r.phone, waBody);

  // Alerte interne : le règlement permet de lancer la réparation.
  const staffSujet = `Paiement reçu ${r.reference} — ${amount}`;
  const staffHtml = shell(staffSujet, [
    `<p style="font-size:14px">Le client a réglé en ligne le devis approuvé de son dossier <strong>${r.reference}</strong>.</p>`,
    `<p style="font-size:14px">Client : <strong>${r.customer_name}</strong> — ${r.phone}${r.email ? ` — ${r.email}` : ""}</p>`,
    `<p style="font-size:14px">Appareil : ${r.device}</p>`,
    `<p style="font-size:20px;font-weight:700;margin:10px 0;color:#16a34a">${amount}</p>`,
  ]);
  await sendEmail(COMPANY.email, staffSujet, staffHtml);
  await sendWhatsApp(
    COMPANY.whatsapp,
    `Paiement en ligne reçu ${r.reference} — ${r.customer_name} : ${amount}.`,
  );
}

/** Avertit l'équipe de l'arrivée d'un nouveau dossier (e-mail + WhatsApp interne). */
export async function notifyStaffNewReservation(r: ReservationEvent): Promise<void> {
  const sujet = `Nouveau dossier ${r.reference} — ${r.customer_name}`;
  const html = shell(sujet, [
    `<p style="font-size:14px">Un nouveau dossier vient d'être créé.</p>`,
    reservationSummary(r),
  ]);
  await sendEmail(COMPANY.email, sujet, html);
  await sendWhatsApp(
    COMPANY.whatsapp,
    `Nouveau dossier ${r.reference} — ${r.customer_name} (${r.device}), ${formatDateFr(r.slot_date)} à ${r.slot_hour ?? PERIOD_LABEL[r.slot_period].toLowerCase()}.`,
  );
}

/** Alerte interne : nouveau lead (devis, contact, assistance suivi). */
export async function notifyStaffNewLead(lead: {
  source: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
}): Promise<void> {
  const sourceLabel: Record<string, string> = {
    devis: "Demande de devis",
    contact: "Message de contact",
    suivi: "Demande d'assistance (suivi)",
    boutique: "Commande boutique",
    reclamation: "Réclamation de garantie",
  };
  const label = sourceLabel[lead.source] ?? "Nouveau lead";
  const sujet = `${label} — ${lead.name ?? "Anonyme"}`;
  const detail = `<p style="font-size:14px">${lead.message ?? ""}</p>`;
  const cordonnees = [
    lead.name ? `<li>Nom : ${lead.name}</li>` : "",
    lead.phone ? `<li>Téléphone : ${lead.phone}</li>` : "",
    lead.email ? `<li>E-mail : ${lead.email}</li>` : "",
  ]
    .filter(Boolean)
    .join("");
  const html = shell(sujet, [
    detail,
    cordonnees ? `<ul style="margin:8px 0;font-size:13px;color:#374151">${cordonnees}</ul>` : "",
  ]);
  await sendEmail(COMPANY.email, sujet, html);
  await sendWhatsApp(
    COMPANY.whatsapp,
    `${label}${lead.name ? ` de ${lead.name}` : ""}${lead.phone ? ` — ${lead.phone}` : ""}: ${lead.message ?? ""}`,
  );
}

/** Changement de statut : le client est tenu informé. */
export async function notifyReservationStatusChanged(r: ReservationEvent): Promise<void> {
  const sujet = `Dossier ${r.reference} — ${STATUS_LABEL[r.status]}`;
  let waBody = [
    `Bonjour ${r.customer_name}, votre dossier ${r.reference} (${r.device}) est maintenant : ${STATUS_LABEL[r.status]}.`,
    `Détails : ${trackingLink(r)}`,
  ].join("\n");

  if (r.status === "pret") {
    waBody += `\nVotre appareil est prêt — passez le récupérer : ${COMPANY.address}.`;
  }

  if (r.email) {
    const html = shell(sujet, [
      `<p style="font-size:14px">Bonjour <strong>${r.customer_name}</strong>, votre dossier a changé de statut :</p>`,
      reservationSummary(r),
    ]);
    await sendEmail(r.email, sujet, html);
  }
  await sendWhatsApp(r.phone, waBody);

  if (r.status === "pret" || r.status === "livre" || r.status === "terminee") {
    const smsBody = `${r.reference} — ${STATUS_LABEL[r.status]} — ${r.device}\nSuivi : ${trackingLink(r)}`;
    await sendSms(r.phone, smsBody);
  }
}

/** Changement du statut de livraison (dossier en enlèvement à domicile). */
export async function notifyDeliveryStatusChanged(r: {
  reference: string;
  customer_name: string;
  email: string | null;
  phone: string;
  device: string;
  issue: string;
  mode: string;
  payment: string;
  slot_date: string;
  slot_period: Enums<"slot_period">;
  slot_hour: string | null;
  status: Enums<"reservation_status">;
  delivery_status: string;
  delivery_address: string | null;
}): Promise<void> {
  const label: Record<string, string> = {
    a_planifier: "Livraison à planifier",
    en_route: "En route vers vous",
    livre: "Livré",
  };
  const statusLabel = label[r.delivery_status] ?? r.delivery_status;
  const sujet = `Dossier ${r.reference} — ${statusLabel}`;
  let waBody = [
    `Bonjour ${r.customer_name}, voici le point sur la livraison de votre dossier ${r.reference} (${r.device}) : ${statusLabel}.`,
    `Détails : ${trackingLink(r)}`,
  ].join("\n");

  if (r.delivery_status === "livre" && r.delivery_address) {
    waBody += `\nVotre appareil a été livré à l'adresse : ${r.delivery_address}.`;
  }
  if (r.delivery_status === "en_route" && r.delivery_address) {
    waBody += `\nLe livreur est en route vers : ${r.delivery_address}.`;
  }

  if (r.email) {
    const addressBlocks =
      r.delivery_status === "livre" && r.delivery_address
        ? [
            `<p style="font-size:14px">Votre appareil a été livré à l'adresse : <strong>${r.delivery_address}</strong>.</p>`,
          ]
        : r.delivery_status === "en_route" && r.delivery_address
          ? [
              `<p style="font-size:14px">Le livreur est en route vers : <strong>${r.delivery_address}</strong>.</p>`,
            ]
          : [];
    const html = shell(sujet, [
      `<p style="font-size:14px">Bonjour <strong>${r.customer_name}</strong>, votre dossier a changé de statut de livraison :</p>`,
      reservationSummary(r),
      ...addressBlocks,
    ]);
    await sendEmail(r.email, sujet, html);
  }
  await sendWhatsApp(r.phone, waBody);
}

/** Reprogrammation du rendez-vous. */
export async function notifyReservationRescheduled(r: ReservationEvent): Promise<void> {
  const sujet = `Dossier ${r.reference} — rendez-vous reprogrammé`;
  const waBody = [
    `Bonjour ${r.customer_name}, votre rendez-vous ${r.reference} a été reprogrammé.`,
    `Nouveau créneau : ${formatDateFr(r.slot_date)} à ${r.slot_hour ?? PERIOD_LABEL[r.slot_period].toLowerCase()}.`,
    `Détails : ${trackingLink(r)}`,
  ].join("\n");

  if (r.email) {
    const html = shell(sujet, [
      `<p style="font-size:14px">Bonjour <strong>${r.customer_name}</strong>, votre rendez-vous a été déplacé :</p>`,
      reservationSummary(r),
    ]);
    await sendEmail(r.email, sujet, html);
  }
  await sendWhatsApp(r.phone, waBody);
}

/** Envoi d'un devis à valider : le client approuve ou refuse via un lien secret. */
export async function notifyQuoteSent(r: QuoteEvent): Promise<void> {
  const sujet = `Dossier ${r.reference} — devis à valider`;
  const amount = `${r.quote_amount.toLocaleString("fr-FR")} FCFA`;
  const decisionUrl = `${COMPANY.url}/fr/suivi?token=${encodeURIComponent(r.token)}`;
  const warrantyLine =
    r.warranty_months > 0 ? `Garantie étendue de ${r.warranty_months} mois.` : null;

  const waBody = [
    `Bonjour ${r.customer_name}, le devis de votre dossier ${r.reference} (${r.device}) est prêt : ${amount}.`,
    ...(warrantyLine ? [warrantyLine] : []),
    `Validez ou refusez le devis ici : ${decisionUrl}`,
    `${COMPANY.name} — ${COMPANY.phone}`,
  ].join("\n");

  if (r.email) {
    const html = shell(sujet, [
      `<p style="font-size:14px">Bonjour <strong>${r.customer_name}</strong>, le devis pour votre ${r.device} (dossier ${r.reference}) est prêt :</p>`,
      `<p style="font-size:20px;font-weight:700;margin:10px 0">${amount}</p>`,
      ...(warrantyLine
        ? [`<p style="font-size:14px;color:#374151">${warrantyLine}</p>`]
        : [`<p style="font-size:14px;color:#374151">Garantie standard incluse.</p>`]),
      `<p style="font-size:14px">Vous pouvez accepter ou refuser ce devis :</p>`,
      `<p style="margin:18px 0">
        <a href="${decisionUrl}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;margin-right:8px;font-weight:600">Approuver le devis</a>
        <a href="${decisionUrl}" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600">Refuser le devis</a>
      </p>`,
      `<p style="margin-top:20px;font-size:12px;color:#6b7280">${COMPANY.address} — ${COMPANY.phone}</p>`,
    ]);
    await sendEmail(r.email, sujet, html);
  }
  await sendWhatsApp(r.phone, waBody);
}

/** Avertit le client qu'une photo a été ajoutée à son dossier (best-effort). */
export async function notifyPhotoAdded(r: PhotoEvent): Promise<void> {
  const stageLabel: Record<string, string> = {
    diagnostic: "diagnostic",
    pieces: "commande de pièces",
    since: "diagnostic",
    live: "réparation en cours",
    repair: "réparation en cours",
  };
  const label = stageLabel[r.stage] ?? "avancement";
  const link = `${COMPANY.url}/fr/suivi?ref=${r.reference}`;
  const sujet = `Dossier ${r.reference} — une photo a été ajoutée`;

  if (r.email) {
    const html = shell(sujet, [
      `<p style="font-size:14px">Bonjour <strong>${r.customer_name}</strong>, une photo de l'étape « ${label} » vient d'être ajoutée à votre dossier ${r.reference}.</p>`,
      `<p style="font-size:14px"><a href="${link}">Consulter mon dossier</a></p>`,
    ]);
    await sendEmail(r.email, sujet, html);
  }
  await sendWhatsApp(
    r.phone,
    [
      `Bonjour ${r.customer_name}, une photo de l'étape « ${label} » vient d'être ajoutée à votre dossier ${r.reference} (${r.device}).`,
      `Suivez l'avancement : ${link}`,
    ].join("\n"),
  );
}

const CLAIM_STATUS_LABEL: Record<string, string> = {
  nouveau: "Nouvelle",
  en_cours: "En cours de traitement",
  acceptee: "Acceptée",
  refuse: "Refusée",
  cloturee: "Clôturée",
};

/** Alerte interne : nouvelle réclamation de garantie soumise via le site. */
export async function notifyClaimCreated(c: {
  reference: string;
  name: string;
  phone: string;
  email: string | null;
  device: string | null;
  message: string;
}): Promise<void> {
  const sujet = `Réclamation ${c.reference} — ${c.name}`;
  const cordonnees = [
    `<li>Nom : ${c.name}</li>`,
    `<li>Téléphone : ${c.phone}</li>`,
    c.email ? `<li>E-mail : ${c.email}</li>` : "",
    c.device ? `<li>Appareil : ${c.device}</li>` : "",
  ]
    .filter(Boolean)
    .join("");
  const html = shell(sujet, [
    `<p style="font-size:14px">Une nouvelle réclamation de garantie vient d'être soumise.</p>`,
    cordonnees ? `<ul style="margin:8px 0;font-size:13px;color:#374151">${cordonnees}</ul>` : "",
    `<p style="font-size:14px">Message : <em>${c.message}</em></p>`,
  ]);
  await sendEmail(COMPANY.email, sujet, html);
  await sendWhatsApp(
    COMPANY.whatsapp,
    `Nouvelle réclamation ${c.reference} — ${c.name}${c.device ? ` (${c.device})` : ""} : ${c.message}`,
  );
}

/** Changement de statut d'une réclamation : le client est tenu informé (WhatsApp). */
export async function notifyClaimStatus({
  phone,
  reference,
  status,
}: {
  phone: string;
  reference: string;
  status: string;
}): Promise<void> {
  const statusLabel = CLAIM_STATUS_LABEL[status] ?? status;
  await sendWhatsApp(
    phone,
    `Bonjour, votre réclamation de garantie ${reference} est maintenant : ${statusLabel}. L'atelier Allô Techno vous recontacte par WhatsApp pour la suite.`,
  );
}
