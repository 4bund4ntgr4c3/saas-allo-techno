import { z } from "zod";

export const SLOT_PERIODS = ["matin", "apres-midi"] as const;
export type SlotPeriod = (typeof SLOT_PERIODS)[number];

export const DEPOSIT_MODES = ["boutique", "domicile"] as const;
export type DepositMode = (typeof DEPOSIT_MODES)[number];

export const PERIOD_LABEL: Record<SlotPeriod, string> = {
  matin: "Matin (08:30 — 12:00)",
  "apres-midi": "Après-midi (13:00 — 20:30)",
};

/** Heures de rendez-vous proposées pour chaque demi-journée (08:30 → 20:30). */
export const HOURS_BY_PERIOD: Record<SlotPeriod, string[]> = {
  matin: ["08:30", "09:30", "10:30", "11:30"],
  "apres-midi": ["13:30", "14:30", "15:30", "16:30", "17:30", "18:30", "19:30", "20:30"],
};

/** Toutes les heures de créneau possibles, dans l'ordre. */
export const ALL_SLOT_HOURS = [...HOURS_BY_PERIOD.matin, ...HOURS_BY_PERIOD["apres-midi"]];

/** Plages d'ouverture par mode de dépôt et jour JS (0 = dimanche, null = fermé). */
export const OPEN_HOURS: Record<DepositMode, Record<number, [string, string] | null>> = {
  boutique: {
    1: ["08:30", "20:30"],
    2: ["08:30", "20:30"],
    3: ["08:30", "20:30"],
    4: ["08:30", "20:30"],
    5: ["08:30", "20:30"],
    6: ["09:00", "17:00"],
    0: null,
  },
  domicile: {
    1: ["10:00", "15:00"],
    2: ["10:00", "15:00"],
    3: ["10:00", "15:00"],
    4: ["10:00", "15:00"],
    5: ["10:00", "15:00"],
    6: ["10:00", "15:00"],
    0: null,
  },
};

/** Libellé horaires affiché en mode « venez maintenant ». */
export const OPEN_NOW_LABEL = "Lundi — vendredi 08:30 — 20:30 · samedi 09:00 — 17:00";

/** Libellé horaires de l'enlèvement à domicile. */
export const DOMICILE_HOURS_LABEL = "Enlèvement à domicile — lundi — samedi, 10:00 — 15:00";

export function openWindowFor(mode: DepositMode, weekday: number): [string, string] | null {
  return OPEN_HOURS[mode][weekday] ?? null;
}

/** Vrai si le service est ouvert à l'instant donné pour le mode choisi. */
export function isOpenNow(now = new Date(), mode: DepositMode = "boutique"): boolean {
  const s = openWindowFor(mode, now.getDay());
  if (!s) return false;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = s[0].split(":").map(Number);
  const [ch, cm] = s[1].split(":").map(Number);
  const open = oh! * 60 + om!;
  const close = ch! * 60 + cm!;
  return minutes >= open && minutes < close;
}

/** Heures de créneau proposées pour un mode et un jour (fenêtre d'ouverture). */
export function slotHoursFor(mode: DepositMode, weekday: number): string[] {
  const s = openWindowFor(mode, weekday);
  if (!s) return [];
  return ALL_SLOT_HOURS.filter((h) => h >= s[0] && h <= s[1]);
}

export function periodOfHour(hour: string): SlotPeriod {
  return Number(hour.slice(0, 2)) < 13 ? "matin" : "apres-midi";
}

/** Horaires d'ouverture boutique, par jour JS (0 = dimanche, null = fermé). */
export const OPEN_SCHEDULE: Record<number, [string, string] | null> = OPEN_HOURS.boutique;

/** Vrai si le créneau (date, heure) est déjà passé (aujourd'hui, heure écoulée). */
export function isPastSlot(date: string, hour: string): boolean {
  const now = new Date();
  if (date !== toIsoDate(now)) return false;
  const [hh, mm] = hour.split(":").map(Number);
  return hh! < now.getHours() || (hh === now.getHours() && mm! <= now.getMinutes());
}

export const STATUS_LABEL: Record<string, string> = {
  en_attente: "En attente de confirmation",
  confirmee: "Confirmée",
  pieces: "En attente de pièces",
  en_cours: "Réparation en cours",
  pret: "Prêt à récupérer",
  livre: "Livré",
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
  mode: z.enum(DEPOSIT_MODES),
  paiement: z.enum(["mtn", "moov", "especes", "celtiis"]),
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

/** Sous-ensemble « coordonnées » (étape dossier) validé par le formulaire. */
export const contactSchema = reservationInputSchema.pick({
  nom: true,
  telephone: true,
  email: true,
  paiement: true,
  message: true,
});

export type ContactInput = z.infer<typeof contactSchema>;

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
