// ============================================================================
// Allô Techno — Moteur de Notifications & Escalade SLA B2B
// Rappels automatiques de maintenance préventive (J-7) et alertes SLA d'urgence.
// Déduplication via la table `scheduled_notifications` (UNIQUE(type, ref)).
// ============================================================================

import { COMPANY } from "@/data/catalog/company";
import { createLogger } from "@/lib/logger";

const TZ = "Africa/Porto-Novo";
const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

const RESEND_API_KEY = process.env["RESEND_API_KEY"];
const RESEND_FROM =
  process.env["RESEND_FROM"] ??
  `Allô Techno Pro <pro@${COMPANY.email.split("@")[1] ?? "allotechno.africa"}>`;
const WHATSAPP_TOKEN = process.env["WHATSAPP_TOKEN"];
const WHATSAPP_PHONE_NUMBER_ID = process.env["WHATSAPP_PHONE_NUMBER_ID"];
const PHONE_PREFIX = process.env["PHONE_COUNTRY_PREFIX"] ?? "229";
const TECH_ALERT_PHONE = process.env["TECH_ALERT_PHONE"] ?? COMPANY.phone;

const logger = createLogger("b2b-reminders");

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const cleaned = digits.startsWith("00") ? digits.slice(2) : digits;
  return cleaned.startsWith(PHONE_PREFIX) ? cleaned : `${PHONE_PREFIX}${cleaned}`;
}

async function sendWhatsApp(to: string, body: string): Promise<void> {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    logger.warn(
      "WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID non configuré, notification simulée en log",
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
      logger.error("Échec envoi WhatsApp B2B", undefined, {
        status: res.status,
        body: await res.text(),
      });
    }
  } catch (err) {
    logger.error("Erreur réseau WhatsApp B2B", err as Error);
  }
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_API_KEY) {
    logger.warn("RESEND_API_KEY non configuré, email ignoré");
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
      logger.error("Échec envoi Email Resend B2B", undefined, {
        status: res.status,
        body: await res.text(),
      });
    }
  } catch (err) {
    logger.error("Erreur réseau Resend B2B", err as Error);
  }
}

function emailShell(title: string, contentHtml: string): string {
  return `
  <div style="font-family:system-ui,-apple-system,sans-serif;max-width:580px;margin:0 auto;color:#111827;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
    <div style="background:#0f172a;color:#ffffff;padding:24px;border-bottom:3px solid #d83100">
      <strong style="font-size:18px;letter-spacing:-0.02em">${COMPANY.name} · Espace Pro B2B</strong>
      <p style="margin:4px 0 0;font-size:12px;opacity:0.85">Maintenance &amp; Support IT Entreprises — ${COMPANY.city}, Bénin</p>
    </div>
    <div style="padding:24px">
      <h2 style="margin:0 0 16px;font-size:18px;color:#111827">${title}</h2>
      ${contentHtml}
      <div style="margin-top:28px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">
        Support Pro : ${COMPANY.phone} · <a href="${COMPANY.url}/app" style="color:#d83100;text-decoration:none;font-weight:600">Accéder au portail B2B</a>
      </div>
    </div>
  </div>`;
}

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

export interface B2BRemindersResult {
  maintenanceRemindersSent: number;
  slaEscalationsSent: number;
  errors: string[];
}

/**
 * Exécute l'ensemble des contrôles et relances B2B :
 * 1. Alertes de maintenance préventive à échéance dans 7 jours.
 * 2. Escalade des tickets B2B urgents en souffrance (> 2h ou > 24h).
 */
export async function runB2BReminders(): Promise<B2BRemindersResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const result: B2BRemindersResult = {
    maintenanceRemindersSent: 0,
    slaEscalationsSent: 0,
    errors: [],
  };

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * DAY_MS);
  const targetDateStr = isoDateInTz(in7Days);

  // --------------------------------------------------------------------------
  // 1. Rappels de Maintenance Préventive B2B (J-7)
  // --------------------------------------------------------------------------
  try {
    const { data: schedules, error: schedErr } = await supabaseAdmin
      .from("equipment_maintenance_schedules" as never)
      .select(
        `
        id,
        org_id,
        equipment_id,
        task_title,
        next_due_at,
        status,
        equipment:equipment_id(name, brand, model, asset_tag, serial_number),
        organizations:org_id(name, email, phone)
      `,
      )
      .lte("next_due_at", targetDateStr)
      .in("status", ["scheduled", "overdue"])
      .limit(50);

    if (schedErr) {
      result.errors.push(`Erreur requete maintenance: ${schedErr.message}`);
    } else if (schedules && schedules.length > 0) {
      for (const s of schedules as unknown as {
        id: string;
        org_id: string;
        equipment_id: string;
        task_title: string;
        next_due_at: string;
        equipment?: {
          name: string;
          brand: string | null;
          model: string | null;
          asset_tag: string | null;
        };
        organizations?: { name: string; email: string | null; phone: string | null };
      }[]) {
        const orgName = s.organizations?.name ?? "votre entreprise";
        const eqName = s.equipment?.name ?? "Équipement";
        const eqInfo = `${eqName}${s.equipment?.brand ? ` (${s.equipment.brand} ${s.equipment.model ?? ""})` : ""}`;
        const notifType = `b2b_maint_${s.id}_${s.next_due_at}`;

        // Tentative de déduplication dans scheduled_notifications
        const { error: insErr } = await supabaseAdmin
          .from("scheduled_notifications")
          .insert({ type: notifType, ref: s.id });

        if (insErr) {
          // Déjà notifié pour cette échéance
          continue;
        }

        const portalUrl = `${COMPANY.url}/app/organizations/${s.org_id}/maintenance`;
        const phone = s.organizations?.phone;
        const email = s.organizations?.email;

        // Notification WhatsApp B2B
        if (phone) {
          const waText = [
            `🛠️ *Rappel Maintenance Préventive Allô Techno Pro*`,
            `Bonjour ${orgName}, une révision planifiée approche pour :`,
            `• *Matériel :* ${eqInfo}`,
            `• *Opération :* ${s.task_title}`,
            `• *Échéance prévue :* ${s.next_due_at}`,
            ``,
            `Nos techniciens certifiés peuvent intervenir sur site à Cotonou/Calavi ou en atelier.`,
            `Consulter la fiche d'intervention : ${portalUrl}`,
            `${COMPANY.name} Pro — ${COMPANY.phone}`,
          ].join("\n");
          await sendWhatsApp(phone, waText);
        }

        // Notification Email B2B
        if (email) {
          const emailSubject = `Rappel Maintenance Préventive : ${eqInfo} (Échéance ${s.next_due_at})`;
          const emailHtml = emailShell(
            `Maintenance Préventive Programmée — ${orgName}`,
            `
            <p style="font-size:14px;line-height:1.5">Bonjour,</p>
            <p style="font-size:14px;line-height:1.5">Dans le cadre de votre contrat de maintenance Allô Techno Pro, une révision préventive arrive à échéance :</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:16px;margin:16px 0;border-radius:6px">
              <p style="margin:0 0 6px;font-size:14px"><strong>Équipement :</strong> ${eqInfo}</p>
              <p style="margin:0 0 6px;font-size:14px"><strong>Intervention :</strong> ${s.task_title}</p>
              <p style="margin:0;font-size:14px"><strong>Date d'échéance :</strong> ${s.next_due_at}</p>
            </div>
            <p style="margin:20px 0">
              <a href="${portalUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:4px;font-weight:600;font-size:13px">
                Accéder au Planning de Maintenance &rarr;
              </a>
            </p>
            `,
          );
          await sendEmail(email, emailSubject, emailHtml);
        }

        result.maintenanceRemindersSent++;
      }
    }
  } catch (err) {
    result.errors.push(`Erreur globale rappels maintenance: ${(err as Error).message}`);
  }

  // --------------------------------------------------------------------------
  // 2. Escalade des Tickets B2B en Souffrance (SLA Dépassé)
  // --------------------------------------------------------------------------
  try {
    const { data: tickets, error: ticketErr } = await supabaseAdmin
      .from("reservations")
      .select("id, reference, org_id, device, description, created_at, status")
      .not("org_id", "is", null)
      .in("status", ["en_attente", "confirmee"])
      .order("created_at", { ascending: true })
      .limit(50);

    if (ticketErr) {
      result.errors.push(`Erreur requete tickets B2B: ${ticketErr.message}`);
    } else if (tickets && tickets.length > 0) {
      for (const t of tickets as unknown as {
        id: string;
        reference: string;
        org_id: string;
        device: string;
        description: string | null;
        created_at: string;
        status: string;
      }[]) {
        const createdMs = new Date(t.created_at).getTime();
        const elapsedHours = (now.getTime() - createdMs) / HOUR_MS;

        // Seuil d'escalade : 2 heures pour ticket B2B non pris en charge
        if (elapsedHours >= 2) {
          const notifType = `b2b_sla_esc_${t.id}_${Math.floor(elapsedHours)}h`;
          const { error: insErr } = await supabaseAdmin
            .from("scheduled_notifications")
            .insert({ type: notifType, ref: t.id });

          if (insErr) {
            // Déjà escaladé
            continue;
          }

          // Alerte prioritaire à l'astreinte technique
          const alertText = [
            `🚨 *ALERTE SLA B2B — TICKET EN ATTENTE > ${Math.round(elapsedHours)}H*`,
            `• *Référence :* ${t.reference}`,
            `• *Matériel :* ${t.device}`,
            `• *Statut actuel :* ${t.status}`,
            `• *Créé le :* ${new Date(t.created_at).toLocaleString("fr-FR", { timeZone: TZ })}`,
            ``,
            `Dossier à assigner d'urgence : ${COMPANY.url}/fr/suivi?ref=${t.reference}`,
          ].join("\n");

          await sendWhatsApp(TECH_ALERT_PHONE, alertText);
          result.slaEscalationsSent++;
        }
      }
    }
  } catch (err) {
    result.errors.push(`Erreur globale escalade SLA: ${(err as Error).message}`);
  }

  logger.info("Fin du cycle de rappels B2B", {
    maintenanceSent: result.maintenanceRemindersSent,
    slaEscalationsSent: result.slaEscalationsSent,
    errorsCount: result.errors.length,
  });

  return result;
}
