// Service de notifications — Resend (e-mail) + Meta WhatsApp Cloud API.
// Toujours « best-effort » : sans clé API configurée, rien n'est envoyé et le
// site continue de fonctionner normalement. Les erreurs sont loggées, jamais
// propagées aux appels métier.
//
// Configuration (variables d'environnement, documentées dans le README) :
//   RESEND_API_KEY            clé API Resend (obligatoire pour l'e-mail)
//   RESEND_FROM               expéditeur vérifié, ex. "Allô Techno <no-reply@votre-domaine.bj>"
//   WHATSAPP_TOKEN            jeton d'accès Meta (WhatsApp Cloud API)
//   WHATSAPP_PHONE_NUMBER_ID  identifiant du numéro de téléphone WhatsApp
//
// Note WhatsApp : les messages initiés par l'entreprise doivent utiliser un
// modèle approuvé dans la console Meta (WhatsApp Manager → Modèles). Sans
// modèle configuré, l'envoi texte direct fonctionne uniquement dans la fenêtre
// de session client de 24 h ou vers les numéros de test du compte.

import { COMPANY } from "@/data/catalog";
import { PERIOD_LABEL, STATUS_LABEL, formatDateFr } from "@/lib/reservation-schema";
import type { Enums } from "@/integrations/supabase/types";

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

const RESEND_API_KEY = process.env["RESEND_API_KEY"];
const RESEND_FROM =
  process.env["RESEND_FROM"] ?? `Allô Techno <noreply@${COMPANY.email.split("@")[1]}>`;
const WHATSAPP_TOKEN = process.env["WHATSAPP_TOKEN"];
const WHATSAPP_PHONE_NUMBER_ID = process.env["WHATSAPP_PHONE_NUMBER_ID"];

/** Préfixe téléphonique du pays (Bénin = 229). Configurable via PHONE_COUNTRY_PREFIX. */
const PHONE_PREFIX = process.env["PHONE_COUNTRY_PREFIX"] ?? "229";

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const cleaned = digits.startsWith("00") ? digits.slice(2) : digits;
  return cleaned.startsWith(PHONE_PREFIX) ? cleaned : `${PHONE_PREFIX}${cleaned}`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn("[notifications] RESEND_API_KEY manquante — e-mail ignoré");
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: RESEND_FROM, to: [to], subject, html }),
    });
    if (!res.ok) {
      console.error("[notifications] Resend", res.status, await res.text());
    }
  } catch (err) {
    console.error("[notifications] Resend échec réseau", err);
  }
}

async function sendWhatsApp(to: string, body: string): Promise<void> {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.warn(
      "[notifications] WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID manquants — WhatsApp ignoré",
    );
    return;
  }
  try {
    const res = await fetch(
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
      console.error("[notifications] WhatsApp", res.status, await res.text());
    }
  } catch (err) {
    console.error("[notifications] WhatsApp échec réseau", err);
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

function trackingLink(r: ReservationEvent): string {
  return `https://allotechno.bj/suivi?ref=${r.reference}${r.tracking_code ? `&code=${r.tracking_code}` : ""}`;
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
