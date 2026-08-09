import { COMPANY, formatFcfa } from "@/data/catalog/company";

const RESEND_API_KEY = process.env["RESEND_API_KEY"];
const FROM_EMAIL = process.env["FROM_EMAIL"] || "noreply@allo-techno.com";
const FROM_NAME = process.env["FROM_NAME"] || "Allô Techno";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not configured, skipping email");
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [to],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[email] send failed", res.status, err);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] send error", err);
    return false;
  }
}

function baseTemplate(title: string, content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:24px;font-weight:700;color:#18181b;margin:0;">${COMPANY.name}</h1>
      <p style="font-size:12px;color:#71717a;margin:4px 0 0;">${COMPANY.city} — ${COMPANY.phone}</p>
    </div>
    <div style="background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:24px;">
      <h2 style="font-size:18px;font-weight:600;color:#18181b;margin:0 0 16px;">${title}</h2>
      ${content}
    </div>
    <p style="text-align:center;font-size:11px;color:#a1a1aa;margin-top:24px;">
      ${COMPANY.name} — ${COMPANY.address}<br/>
      <a href="tel:${COMPANY.phone.replace(/\s/g, "")}" style="color:#18181b;">${COMPANY.phone}</a>
    </p>
  </div>
</body>
</html>`;
}

export async function sendReservationConfirmation(
  email: string,
  data: {
    reference: string;
    device: string;
    issue: string;
    slotDate: string;
    slotPeriod: string;
  },
): Promise<boolean> {
  const html = baseTemplate(
    "Réservation confirmée",
    `<p style="color:#52525b;margin:0 0 12px;">Bonjour,</p>
     <p style="color:#52525b;margin:0 0 16px;">Votre réservation a été enregistrée avec succès.</p>
     <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
       <tr><td style="padding:8px 0;color:#71717a;font-size:13px;">Référence</td><td style="padding:8px 0;font-weight:600;font-family:monospace;">${data.reference}</td></tr>
       <tr><td style="padding:8px 0;color:#71717a;font-size:13px;">Appareil</td><td style="padding:8px 0;font-weight:600;">${data.device}</td></tr>
       <tr><td style="padding:8px 0;color:#71717a;font-size:13px;">Problème</td><td style="padding:8px 0;">${data.issue}</td></tr>
       <tr><td style="padding:8px 0;color:#71717a;font-size:13px;">Créneau</td><td style="padding:8px 0;font-weight:600;">${data.slotDate} — ${data.slotPeriod}</td></tr>
     </table>
     <p style="color:#52525b;margin:0 0 8px;">Suivez l'avancement de votre réparation :</p>
     <a href="https://allo-techno.com/suivi?ref=${data.reference}" style="display:inline-block;background:#18181b;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">Suivre ma réparation</a>`,
  );
  return sendEmail({
    to: email,
    subject: `Réservation ${data.reference} confirmée — ${COMPANY.name}`,
    html,
  });
}

export async function sendPaymentConfirmation(
  email: string,
  data: {
    reference: string;
    amount: number;
    method: string;
  },
): Promise<boolean> {
  const html = baseTemplate(
    "Paiement reçu",
    `<p style="color:#52525b;margin:0 0 12px;">Bonjour,</p>
     <p style="color:#52525b;margin:0 0 16px;">Nous avons bien reçu votre paiement.</p>
     <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
       <tr><td style="padding:8px 0;color:#71717a;font-size:13px;">Référence</td><td style="padding:8px 0;font-weight:600;font-family:monospace;">${data.reference}</td></tr>
       <tr><td style="padding:8px 0;color:#71717a;font-size:13px;">Montant</td><td style="padding:8px 0;font-weight:600;">${formatFcfa(data.amount)}</td></tr>
       <tr><td style="padding:8px 0;color:#71717a;font-size:13px;">Méthode</td><td style="padding:8px 0;">${data.method}</td></tr>
     </table>
     <p style="color:#52525b;margin:0;">Merci pour votre confiance.</p>`,
  );
  return sendEmail({
    to: email,
    subject: `Paiement ${data.reference} confirmé — ${COMPANY.name}`,
    html,
  });
}

export async function sendStatusUpdate(
  email: string,
  data: {
    reference: string;
    status: string;
    device: string;
  },
): Promise<boolean> {
  const statusLabels: Record<string, string> = {
    en_attente: "En attente",
    confirmee: "Confirmée",
    pieces: "En attente de pièces",
    en_cours: "En cours de réparation",
    pret: "Prêt à récupérer",
    livre: "Livré",
    terminee: "Terminée",
    annulee: "Annulée",
  };
  const html = baseTemplate(
    "Statut mis à jour",
    `<p style="color:#52525b;margin:0 0 12px;">Bonjour,</p>
     <p style="color:#52525b;margin:0 0 16px;">Le statut de votre réparation a été mis à jour.</p>
     <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
       <tr><td style="padding:8px 0;color:#71717a;font-size:13px;">Référence</td><td style="padding:8px 0;font-weight:600;font-family:monospace;">${data.reference}</td></tr>
       <tr><td style="padding:8px 0;color:#71717a;font-size:13px;">Appareil</td><td style="padding:8px 0;font-weight:600;">${data.device}</td></tr>
       <tr><td style="padding:8px 0;color:#71717a;font-size:13px;">Nouveau statut</td><td style="padding:8px 0;font-weight:600;color:#2563eb;">${statusLabels[data.status] ?? data.status}</td></tr>
     </table>
     <a href="https://allo-techno.com/suivi?ref=${data.reference}" style="display:inline-block;background:#18181b;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">Suivre ma réparation</a>`,
  );
  return sendEmail({
    to: email,
    subject: `Réparation ${data.reference} — ${statusLabels[data.status] ?? data.status} — ${COMPANY.name}`,
    html,
  });
}

export async function sendQuoteReady(
  email: string,
  data: {
    reference: string;
    device: string;
    amount: number;
  },
): Promise<boolean> {
  const html = baseTemplate(
    "Devis prêt",
    `<p style="color:#52525b;margin:0 0 12px;">Bonjour,</p>
     <p style="color:#52525b;margin:0 0 16px;">Votre devis est prêt à consulter.</p>
     <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
       <tr><td style="padding:8px 0;color:#71717a;font-size:13px;">Référence</td><td style="padding:8px 0;font-weight:600;font-family:monospace;">${data.reference}</td></tr>
       <tr><td style="padding:8px 0;color:#71717a;font-size:13px;">Appareil</td><td style="padding:8px 0;font-weight:600;">${data.device}</td></tr>
       <tr><td style="padding:8px 0;color:#71717a;font-size:13px;">Montant estimé</td><td style="padding:8px 0;font-weight:600;">${formatFcfa(data.amount)}</td></tr>
     </table>
     <a href="https://allo-techno.com/devis?ref=${data.reference}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">Consulter le devis</a>`,
  );
  return sendEmail({ to: email, subject: `Devis ${data.reference} prêt — ${COMPANY.name}`, html });
}
