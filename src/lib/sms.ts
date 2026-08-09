const AT_API_KEY = process.env["AT_API_KEY"];
const AT_USERNAME = process.env["AT_USERNAME"] || "sandbox";
const AT_SENDER_ID = process.env["AT_SENDER_ID"] || "ALLOTECH";

interface SmsOptions {
  to: string;
  message: string;
}

async function sendSms({ to, message }: SmsOptions): Promise<boolean> {
  if (!AT_API_KEY) {
    console.warn("[sms] AT_API_KEY not configured, skipping SMS");
    return false;
  }
  try {
    const res = await fetch(`https://api.africastalking.com/version1/messaging`, {
      method: "POST",
      headers: {
        apiKey: AT_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        username: AT_USERNAME,
        to,
        message,
        from: AT_SENDER_ID,
      }).toString(),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[sms] send failed", res.status, err);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[sms] send error", err);
    return false;
  }
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("229")) return `+${digits}`;
  if (digits.length === 8) return `+229${digits}`;
  return `+${digits}`;
}

export async function sendReservationSms(
  phone: string,
  data: {
    reference: string;
    device: string;
    slotDate: string;
    slotPeriod: string;
  },
): Promise<boolean> {
  const message = [
    `${data.reference}`,
    `Réservation confirmée !`,
    `Appareil : ${data.device}`,
    `Créneau : ${data.slotDate} ${data.slotPeriod}`,
    `Suivez : allo-techno.com/suivi`,
    `— Allô Techno`,
  ].join("\n");
  return sendSms({ to: formatPhone(phone), message });
}

export async function sendStatusSms(
  phone: string,
  data: {
    reference: string;
    status: string;
    device: string;
  },
): Promise<boolean> {
  const statusLabels: Record<string, string> = {
    en_attente: "En attente",
    confirmee: "Confirmée",
    pieces: "Pièces en cours",
    en_cours: "En réparation",
    pret: "Prêt !",
    livre: "Livré",
    terminee: "Terminée",
    annulee: "Annulée",
  };
  const label = statusLabels[data.status] ?? data.status;
  const message = [
    `${data.reference}`,
    `Statut : ${label}`,
    `${data.device}`,
    `Détails : allo-techno.com/suivi`,
    `— Allô Techno`,
  ].join("\n");
  return sendSms({ to: formatPhone(phone), message });
}

export async function sendPaymentSms(
  phone: string,
  data: {
    reference: string;
    amount: string;
  },
): Promise<boolean> {
  const message = [
    `${data.reference}`,
    `Paiement reçu : ${data.amount}`,
    `Merci pour votre confiance !`,
    `— Allô Techno`,
  ].join("\n");
  return sendSms({ to: formatPhone(phone), message });
}
