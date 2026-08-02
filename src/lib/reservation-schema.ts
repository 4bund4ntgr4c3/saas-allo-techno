import { z } from "zod";

export const SLOT_PERIODS = ["matin", "apres-midi"] as const;
export type SlotPeriod = (typeof SLOT_PERIODS)[number];

export const PERIOD_LABEL: Record<SlotPeriod, string> = {
  matin: "Matin (08:00 — 12:00)",
  "apres-midi": "Après-midi (13:00 — 19:00)",
};

/** Heures de rendez-vous proposées pour chaque demi-journée. */
export const HOURS_BY_PERIOD: Record<SlotPeriod, string[]> = {
  matin: ["08:30", "09:30", "10:30", "11:30"],
  "apres-midi": ["13:30", "14:30", "15:30", "16:30", "17:30", "18:30"],
};

export function periodOfHour(hour: string): SlotPeriod {
  return Number(hour.slice(0, 2)) < 13 ? "matin" : "apres-midi";
}

export const STATUS_LABEL: Record<string, string> = {
  en_attente: "En attente de confirmation",
  confirmee: "Confirmée",
  en_cours: "Réparation en cours",
  terminee: "Terminée",
  annulee: "Annulée",
};

export const reservationInputSchema = z.object({
  nom: z.string().trim().min(2, "Nom trop court").max(80),
  telephone: z
    .string()
    .trim()
    .min(8, "Numéro invalide")
    .max(20)
    .regex(/^[0-9+\s]+$/, "Chiffres uniquement"),
  email: z.string().trim().email("E-mail invalide").max(180).optional().or(z.literal("")),
  appareil: z.string().min(1, "Sélectionnez un appareil"),
  panne: z.string().trim().min(3, "Décrivez la panne").max(500),
  mode: z.enum(["boutique", "domicile"]),
  paiement: z.enum(["mtn", "moov", "especes"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choisissez une date"),
  creneau: z.enum(SLOT_PERIODS),
  heure: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Choisissez une heure")
    .optional()
    .or(z.literal("")),
  message: z.string().trim().max(800).optional().or(z.literal("")),
});

export type ReservationInput = z.infer<typeof reservationInputSchema>;

export type AvailabilityRow = {
  slot_date: string;
  period: SlotPeriod;
  capacity: number;
  remaining: number;
};

export function formatDateFr(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function toIsoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
