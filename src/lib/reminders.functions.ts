// Rappels automatisés déclenchés par le cron quotidien (api/cron-reminders).
// Trois types de rappels, dédupliqués via la table scheduled_notifications
// (UNIQUE(type, ref)) : l'insertion se fait AVANT l'envoi, donc deux runs
// simultanés ne peuvent pas notifier deux fois le même dossier (conflit
// 23505 ⇒ déjà traité, ignoré).
//
// 1. rdv_reminder  : dossier confirmé dont le rendez-vous est DEMIN, dans le
//                    fuseau de l'atelier (Africa/Porto-Novo, UTC+1 fixe).
// 2. quote_relance : devis envoyé (quote_status = 'sent') depuis plus de 48 h
//                    sans décision du client — relance avec le lien d'approbation.
// 3. ready_alert   : appareil prêt à récupérer (status = 'pret'). Fenêtre de
//                    48 h sur updated_at pour ne viser que les dossiers
//                    récemment passés à « prêt ».
//
// Note : les helpers privés sendEmail/sendWhatsApp de notifications.ts ne sont
// pas exportés et ce fichier est géré par une autre tâche ; on reproduit donc
// ici le même comportement best-effort (jamais d'exception propagée).

import { COMPANY } from "@/data/catalog/company";
import { PERIOD_LABEL, formatDateFr } from "@/lib/reservation-schema";

const TZ = "Africa/Porto-Novo";
const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const RELANCE_WINDOW_MS = 48 * HOUR_MS;
const MAX_MESSAGES_PER_RUN = 10;

const RESEND_API_KEY = process.env["RESEND_API_KEY"];
const RESEND_FROM =
  process.env["RESEND_FROM"] ??
  `Allô Techno <noreply@${COMPANY.email.split("@")[1] ?? "allotechno.africa"}>`;
const WHATSAPP_TOKEN = process.env["WHATSAPP_TOKEN"];
const WHATSAPP_PHONE_NUMBER_ID = process.env["WHATSAPP_PHONE_NUMBER_ID"];

/** Préfixe téléphonique du pays (Bénin = 229). Configurable via PHONE_COUNTRY_PREFIX. */
const PHONE_PREFIX = process.env["PHONE_COUNTRY_PREFIX"] ?? "229";

type SlotPeriod = "matin" | "apres-midi";

type Candidate = {
  reference: string;
  customer_name: string;
  phone: string;
  email: string | null;
  device: string;
  slot_date: string;
  slot_hour: string | null;
  slot_period: SlotPeriod;
  quote_amount: number | null;
  quote_token: string | null;
};

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const cleaned = digits.startsWith("00") ? digits.slice(2) : digits;
  return cleaned.startsWith(PHONE_PREFIX) ? cleaned : `${PHONE_PREFIX}${cleaned}`;
}

async function sendWhatsApp(to: string, body: string): Promise<void> {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.warn(
      "[reminders] WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID manquants — WhatsApp ignoré",
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
      console.error("[reminders] WhatsApp", res.status, await res.text());
    }
  } catch (err) {
    console.error("[reminders] WhatsApp échec réseau", err);
  }
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn("[reminders] RESEND_API_KEY manquante — e-mail ignoré");
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
      console.error("[reminders] Resend", res.status, await res.text());
    }
  } catch (err) {
    console.error("[reminders] Resend échec réseau", err);
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

/** Lien de suivi public du dossier (sans code : seul le hash est stocké en base). */
function trackingLink(reference: string): string {
  return `${COMPANY.url}/fr/suivi?ref=${reference}`;
}

/**
 * Lien de décision du devis : même format que notifyQuoteSent (notifications.ts).
 * Le jeton secret est la preuve d'autorisation — aucune session requise.
 */
function quoteDecisionLink(token: string): string {
  return `${COMPANY.url}/fr/suivi?token=${encodeURIComponent(token)}`;
}

/** Date du jour (YYYY-MM-DD) dans le fuseau de l'atelier (UTC+1 fixe, pas d'heure d'été). */
function isoDateInTz(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const year = parts.find((p) => p.type === "year")?.value ?? "1970";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

/** ISO de demain dans le fuseau atelier — sélection des rdv_reminder. */
function tomorrowIso(): string {
  return isoDateInTz(new Date(Date.now() + DAY_MS));
}

function buildRdvReminder(r: Candidate): {
  subject: string;
  html: string;
  waBody: string;
  smsBody: string;
} {
  const sujet = `Rappel : rendez-vous ${r.reference} demain`;
  const creneau = `${formatDateFr(r.slot_date)} à ${r.slot_hour ?? PERIOD_LABEL[r.slot_period].toLowerCase()}`;
  const waBody = [
    `Bonjour ${r.customer_name}, rappel de votre rendez-vous ${r.reference} (${r.device}) :`,
    `Rendez-vous demain, ${creneau}.`,
    `Suivez votre dossier : ${trackingLink(r.reference)}`,
    `${COMPANY.name} — ${COMPANY.phone}`,
  ].join("\n");
  const smsBody = `Allô Techno : Rappel rdv ${r.reference} (${r.device}) demain ${creneau}. Suivez ${trackingLink(r.reference)}`;
  const html = shell(sujet, [
    `<p style="font-size:14px">Bonjour <strong>${r.customer_name}</strong>, votre dossier est confirmé :</p>`,
    `<p style="font-size:14px">Rendez-vous <strong>demain</strong>, ${creneau}.</p>`,
    `<p style="font-size:14px"><a href="${trackingLink(r.reference)}">Suivre mon dossier</a></p>`,
    `<p style="margin-top:20px;font-size:12px;color:#6b7280">${COMPANY.address} — ${COMPANY.phone}</p>`,
  ]);
  return { subject: sujet, html, waBody, smsBody };
}

function buildQuoteRelance(r: Candidate): {
  subject: string;
  html: string;
  waBody: string;
  smsBody: string;
} {
  const amount = `${(r.quote_amount ?? 0).toLocaleString("fr-FR")} FCFA`;
  const decisionUrl = r.quote_token ? quoteDecisionLink(r.quote_token) : trackingLink(r.reference);
  const sujet = `Dossier ${r.reference} — votre devis ${amount} attend votre réponse`;
  const waBody = [
    `Bonjour ${r.customer_name}, votre devis pour le dossier ${r.reference} (${r.device}) est toujours en attente : ${amount}.`,
    `Validez ou refusez le devis ici : ${decisionUrl}`,
    `${COMPANY.name} — ${COMPANY.phone}`,
  ].join("\n");
  const smsBody = `Allô Techno : Votre devis ${amount} pour ${r.device} (${r.reference}) attend votre réponse. Validez : ${decisionUrl}`;
  const html = shell(sujet, [
    `<p style="font-size:14px">Bonjour <strong>${r.customer_name}</strong>, votre devis pour le dossier ${r.reference} (${r.device}) n'a pas encore reçu de réponse :</p>`,
    `<p style="font-size:20px;font-weight:700;margin:10px 0">${amount}</p>`,
    `<p style="font-size:14px">Vous pouvez accepter ou refuser ce devis :</p>`,
    `<p style="margin:18px 0">
      <a href="${decisionUrl}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;margin-right:8px;font-weight:600">Approuver le devis</a>
      <a href="${decisionUrl}" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600">Refuser le devis</a>
    </p>`,
    `<p style="margin-top:20px;font-size:12px;color:#6b7280">${COMPANY.address} — ${COMPANY.phone}</p>`,
  ]);
  return { subject: sujet, html, waBody, smsBody };
}

function buildReadyAlert(r: Candidate): {
  subject: string;
  html: string;
  waBody: string;
  smsBody: string;
} {
  const sujet = `Dossier ${r.reference} — votre appareil est prêt`;
  const waBody = [
    `Bonjour ${r.customer_name}, bonne nouvelle : votre ${r.device} (dossier ${r.reference}) est réparé et prêt à récupérer !`,
    `Récupération : ${COMPANY.address} — Lundi — vendredi 08:30 — 20:30 · samedi 09:00 — 17:00.`,
    `Suivez votre dossier : ${trackingLink(r.reference)}`,
    `${COMPANY.name} — ${COMPANY.phone}`,
  ].join("\n");
  const smsBody = `Allô Techno : Votre ${r.device} (${r.reference}) est prêt ! Récupérez-le au ${COMPANY.address}.`;
  const html = shell(sujet, [
    `<p style="font-size:14px">Bonjour <strong>${r.customer_name}</strong>, bonne nouvelle : votre <strong>${r.device}</strong> (dossier ${r.reference}) est réparé et prêt à récupérer !</p>`,
    `<p style="font-size:14px">Venez le récupérer à l'atelier : ${COMPANY.address}.</p>`,
    `<p style="font-size:12px;color:#374151">Horaires — Lundi — vendredi 08:30 — 20:30 · samedi 09:00 — 17:00.</p>`,
    `<p style="font-size:14px"><a href="${trackingLink(r.reference)}">Suivre mon dossier</a></p>`,
    `<p style="margin-top:20px;font-size:12px;color:#6b7280">${COMPANY.address} — ${COMPANY.phone}</p>`,
  ]);
  return { subject: sujet, html, waBody, smsBody };
}

type AdminClient = {
  from: (table: "scheduled_notifications") => {
    insert: (row: {
      type: string;
      ref: string;
    }) => Promise<{ error: { code: string; message: string } | null }>;
  };
};

/**
 * Déduplication + envoi d'un rappel. La ligne est insérée dans
 * scheduled_notifications AVANT l'envoi : en cas de course (deux runs
 * simultanés), la contrainte unique (type, ref) fait échouer la seconde
 * insertion (23505) et le dossier est simplement ignoré.
 */
async function runReminders(): Promise<{ sent: number; skipped: number }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const counters = { sent: 0, skipped: 0 };
  const FIELDS =
    "reference, customer_name, phone, email, device, slot_date, slot_hour, slot_period, quote_amount, quote_token";
  const cutoff48h = new Date(Date.now() - RELANCE_WINDOW_MS).toISOString();

  const tryNotify = async (
    type: string,
    ref: string,
    send: (r: Candidate) => Promise<void>,
    r: Candidate,
  ): Promise<void> => {
    if (counters.sent >= MAX_MESSAGES_PER_RUN) return;
    const { error } = await (supabaseAdmin as unknown as AdminClient)
      .from("scheduled_notifications")
      .insert({ type, ref });
    if (error) {
      if (error.code === "23505") {
        counters.skipped += 1;
        return;
      }
      console.error(`[reminders] déduplication impossible (${type}/${ref})`, error);
      counters.skipped += 1;
      return;
    }
    try {
      await send(r);
    } catch (err) {
      console.error(`[reminders] envoi échoué (${type}/${ref})`, err);
    }
    counters.sent += 1;
  };

  // 1. Rappel de rendez-vous : confirmés, rendez-vous demain (fuseau atelier).
  const { data: rdvRows, error: rdvError } = await supabaseAdmin
    .from("reservations")
    .select(FIELDS)
    .eq("status", "confirmee")
    .eq("slot_date", tomorrowIso());
  if (rdvError) {
    console.error("[reminders] requête rdv_reminder échouée", rdvError);
  } else {
    for (const row of (rdvRows ?? []) as unknown as Candidate[]) {
      await tryNotify("rdv_reminder", row.reference, (r) => sendBoth(buildRdvReminder(r), r), row);
    }
  }

  // 2. Relance de devis : envoyé depuis plus de 48 h, toujours sans décision.
  const { data: quoteRows, error: quoteError } = await supabaseAdmin
    .from("reservations")
    .select(FIELDS)
    .eq("quote_status", "sent")
    .lt("created_at", cutoff48h);
  if (quoteError) {
    console.error("[reminders] requête quote_relance échouée", quoteError);
  } else {
    for (const row of (quoteRows ?? []) as unknown as Candidate[]) {
      await tryNotify(
        "quote_relance",
        row.reference,
        (r) => sendBoth(buildQuoteRelance(r), r),
        row,
      );
    }
  }

  // 3. Appareil prêt : récemment passé à « prêt » (48 h), encore non notifié.
  const { data: readyRows, error: readyError } = await supabaseAdmin
    .from("reservations")
    .select(FIELDS)
    .eq("status", "pret")
    .gte("updated_at", cutoff48h);
  if (readyError) {
    console.error("[reminders] requête ready_alert échouée", readyError);
  } else {
    for (const row of (readyRows ?? []) as unknown as Candidate[]) {
      await tryNotify("ready_alert", row.reference, (r) => sendBoth(buildReadyAlert(r), r), row);
    }
  }

  // 4. Alertes stock bas : accessoires dont la quantité <= seuil.
  const { data: inventoryRows, error: invError } = await supabaseAdmin
    .from("inventory")
    .select("slug, quantity, low_stock_threshold");
  if (invError) {
    console.error("[reminders] requête low_stock_alert échouée", invError);
  } else {
    const lowStock = (inventoryRows ?? []).filter((row) => row.quantity <= row.low_stock_threshold);
    for (const item of lowStock) {
      if (counters.sent >= MAX_MESSAGES_PER_RUN) break;
      const urgency = item.quantity === 0 ? "RUPTURE" : "stock bas";
      const msg = `Alerte stock : ${item.slug} — ${item.quantity} en stock (${urgency})`;
      await sendWhatsApp(process.env["STAFF_PHONE"] ?? "", `[Allô Techno] ${msg}`);
      counters.sent += 1;
    }
  }

  return counters;
}

/** E-mail + WhatsApp + SMS en repli (best-effort, jamais d'exception propagée). */
async function sendBoth(
  message: { subject: string; html: string; waBody: string; smsBody?: string },
  r: Candidate,
): Promise<void> {
  if (r.email) {
    try {
      await sendEmail(r.email, message.subject, message.html);
    } catch (err) {
      console.error(`[reminders] e-mail échoué (${r.reference})`, err);
    }
  }
  let waOk = false;
  try {
    await sendWhatsApp(r.phone, message.waBody);
    waOk = true;
  } catch (err) {
    console.error(`[reminders] WhatsApp échoué (${r.reference})`, err);
  }
  // Fallback SMS si WhatsApp échoue
  if (!waOk && message.smsBody) {
    try {
      const { sendSimpleSms } = await import("@/lib/sms");
      await sendSimpleSms(r.phone, message.smsBody);
    } catch (err) {
      console.error(`[reminders] SMS échoué (${r.reference})`, err);
    }
  }
}

export { runReminders };
