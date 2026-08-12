import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import type { Enums } from "@/integrations/supabase/types";
import { isPastSlot, toIsoDate } from "@/lib/reservation-schema";
import type { ReservationEvent } from "@/lib/notifications";
import { rateLimit, verifyTrackingCode } from "@/lib/security";

const lookupSchema = z.object({
  reference: z.string().trim().min(1, "Référence requise"),
  code: z.string().trim().min(1, "Code de suivi requis").max(20),
});

const rescheduleSchema = z.object({
  reference: z.string().trim().min(1, "Référence requise"),
  code: z.string().trim().max(20).optional().or(z.literal("")),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choisissez une date"),
  creneau: z.enum(["matin", "apres-midi"]),
  heure: z.string().regex(/^\d{2}:\d{2}$/, "Choisissez une heure"),
});

const RESERVATION_FIELDS =
  "reference, customer_name, phone, email, device, issue, mode, payment, slot_date, slot_period, slot_hour, status, delivery_status, delivery_address, created_at, warranty_months, estimated_delivery, quote_status, quote_amount, quote_token, payment_status";

export type ReservationStatus = {
  reference: string;
  customer_name: string;
  phone: string;
  email: string | null;
  device: string;
  issue: string;
  mode: string;
  payment: string;
  slot_date: string;
  slot_period: Enums<"slot_period">;
  slot_hour: string | null;
  status: Enums<"reservation_status">;
  delivery_status: Enums<"delivery_status">;
  delivery_address: string | null;
  created_at: string;
  warranty_months: number;
  estimated_delivery: string | null;
  quote_status: string | null;
  quote_amount: number | null;
  quote_token: string | null;
  payment_status: string | null;
};

export type TimelineEntry = {
  old_status: Enums<"reservation_status"> | null;
  new_status: Enums<"reservation_status">;
  note: string | null;
  created_at: string;
};

export type SlaForecast = {
  expectedDate: string;
  remainingDays: number;
  stage: string;
};

/** Durées typiques par étape (en jours) — SLA indicatif affiché au client. */
const STAGE_DURATION_DAYS: Record<string, number> = {
  en_attente: 0.04,
  confirmee: 0.5,
  pieces: 2,
  en_cours: 2,
  pret: 0.04,
};

const STAGE_ORDER = ["en_attente", "confirmee", "pieces", "en_cours", "pret"];

const DAY_MS = 24 * 3600 * 1000;

/**
 * Prédit la date de restitution estimée d'un dossier : si
 * reservations.estimated_delivery est renseigné (atelier), on le préfère ;
 * sinon, somme des durées typiques des étapes restantes à partir du statut
 * courant (le temps déjà écoulé dans l'étape courante est déduit via l'historique).
 * Retourne null quand la prédiction n'a pas de sens (livré, terminé, annulé).
 */
export function computeSlaForecast(
  status: string,
  history: TimelineEntry[],
  estimatedDelivery?: string | null,
): SlaForecast | null {
  if (status === "livre" || status === "terminee" || status === "annulee") return null;

  if (estimatedDelivery) {
    const remainingMs = new Date(`${estimatedDelivery}T12:00:00`).getTime() - Date.now();
    return {
      expectedDate: estimatedDelivery,
      remainingDays: Math.max(0, Math.round(remainingMs / DAY_MS)),
      stage: status,
    };
  }

  const currentIndex = STAGE_ORDER.indexOf(status);
  if (currentIndex === -1) return null;

  let elapsedDays = 0;
  const entered = [...history].reverse().find((e) => e.new_status === status);
  if (entered?.created_at) {
    elapsedDays = Math.max(0, (Date.now() - new Date(entered.created_at).getTime()) / DAY_MS);
  }

  let remainingDays = Math.max(0, (STAGE_DURATION_DAYS[status] ?? 0) - elapsedDays);
  for (let i = currentIndex + 1; i < STAGE_ORDER.length; i++) {
    remainingDays += STAGE_DURATION_DAYS[STAGE_ORDER[i]!] ?? 0;
  }

  const expected = new Date(Date.now() + remainingDays * DAY_MS);
  return {
    expectedDate: toIsoDate(expected),
    remainingDays: Math.round(remainingDays * 100) / 100,
    stage: status,
  };
}

/** Masque les données personnelles d'une réservation (vue publique sans code). */
function publicReservation(row: ReservationStatus): ReservationStatus {
  return {
    ...row,
    customer_name: "Client",
    phone: "",
    email: null,
  };
}

export const getReservationStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => lookupSchema.parse(data))
  .handler(
    async ({
      data,
    }): Promise<{ found: true; reservation: ReservationStatus } | { found: false }> => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      if (!(await rateLimit("suivi-lookup", 30))) {
        throw new Error("Trop de demandes. Réessayez dans une minute.");
      }

      const { data: row, error } = await supabaseAdmin
        .from("reservations")
        .select(`${RESERVATION_FIELDS}, tracking_code_hash`)
        .eq("reference", data.reference)
        .maybeSingle();

      if (error) {
        console.error("[suivi] lookup failed", error);
        throw new Error("Impossible de vérifier ce dossier. Réessayez plus tard.");
      }

      if (!row) return { found: false };

      const valid = await verifyTrackingCode(data.code, row.tracking_code_hash);
      const { tracking_code_hash: _hash, ...reservation } = row;

      if (!valid) return { found: true, reservation: publicReservation(reservation) };

      return { found: true, reservation: reservation as ReservationStatus };
    },
  );

/**
 * Reprogramme le rendez-vous d'un dossier (date + heure). La validation du
 * créneau (capacité par mode, dates passées, doublons d'heure) est appliquée
 * par les triggers PostgreSQL côté serveur. Le code de suivi secret est requis.
 */
export const rescheduleReservation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => rescheduleSchema.parse(data))
  .handler(async ({ data }): Promise<ReservationStatus> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("suivi-reschedule", 5))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const { data: row, error } = await supabaseAdmin
      .from("reservations")
      .select("id, status, user_id, tracking_code_hash")
      .eq("reference", data.reference)
      .maybeSingle();

    if (error) {
      console.error("[suivi] reschedule lookup failed", error);
      throw new Error("Impossible de vérifier ce dossier. Réessayez plus tard.");
    }
    if (!row) throw new Error("Dossier introuvable. Vérifiez la référence.");

    // Preuve de propriété : code de suivi secret, OU session connectée du client propriétaire.
    const codeOk = await verifyTrackingCode(data.code ?? "", row.tracking_code_hash);
    let ownerOk = false;
    if (!codeOk && row.user_id) {
      const authHeader = getRequestHeader("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        const { data: claimsData } = await supabaseAdmin.auth.getClaims(token);
        const sub = claimsData?.claims?.sub;
        ownerOk = typeof sub === "string" && sub === row.user_id;
      }
    }
    if (!codeOk && !ownerOk) {
      throw new Error("Code de suivi invalide. Vérifiez le code reçu à la réservation.");
    }

    if (row.status !== "en_attente" && row.status !== "confirmee") {
      throw new Error("Ce dossier ne peut plus être reprogrammé — la réparation est déjà engagée.");
    }

    const today = toIsoDate(new Date());
    if (data.date < today) throw new Error("Cette date est déjà passée.");
    if (data.date === today && isPastSlot(data.date, data.heure)) {
      throw new Error("Cette heure est déjà passée.");
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("reservations")
      .update({
        slot_date: data.date,
        slot_period: data.creneau,
        slot_hour: data.heure,
      })
      .eq("id", row.id)
      .select(RESERVATION_FIELDS)
      .single();

    if (updateError) {
      console.error("[suivi] reschedule failed", updateError);
      if (updateError.code === "23505") {
        throw new Error(
          "Ce créneau vient d'être réservé par un autre client. Choisissez une autre heure.",
        );
      }
      const message = updateError.message;
      throw new Error(
        message.includes("complet")
          ? "Ce créneau vient d'être complété. Choisissez-en un autre."
          : message.includes("indisponible")
            ? "Nous sommes fermés sur ce créneau."
            : message.includes("passé")
              ? "Cette date est déjà passée."
              : "La reprogrammation n'a pas pu être enregistrée. Réessayez.",
      );
    }

    const { notifyReservationRescheduled } = await import("@/lib/notifications");
    void notifyReservationRescheduled(updated as ReservationEvent);

    return updated as ReservationStatus;
  });

export const getReservationTracking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => lookupSchema.parse(data))
  .handler(
    async ({
      data,
    }): Promise<
      | {
          found: true;
          reservation: ReservationStatus;
          timeline: TimelineEntry[];
          sla: SlaForecast | null;
        }
      | { found: false }
    > => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      if (!(await rateLimit("suivi-lookup", 30))) {
        throw new Error("Trop de demandes. Réessayez dans une minute.");
      }

      const { data: row, error } = await supabaseAdmin
        .from("reservations")
        .select(`${RESERVATION_FIELDS}, tracking_code_hash`)
        .eq("reference", data.reference)
        .maybeSingle();

      if (error) {
        console.error("[suivi] lookup failed", error);
        throw new Error("Impossible de vérifier ce dossier. Réessayez plus tard.");
      }

      if (!row) return { found: false };

      const valid = await verifyTrackingCode(data.code, row.tracking_code_hash);
      const { tracking_code_hash: _hash, ...reservation } = row;

      const { data: timeline, error: timelineError } = await supabaseAdmin.rpc(
        "get_reservation_timeline",
        { _reference: data.reference },
      );

      if (timelineError) console.error("[suivi] timeline failed", timelineError);

      const timelineRows = (timeline ?? []) as TimelineEntry[];
      const sla = computeSlaForecast(
        reservation.status,
        timelineRows,
        reservation.estimated_delivery,
      );

      return {
        found: true,
        reservation: valid
          ? (reservation as ReservationStatus)
          : publicReservation(reservation as ReservationStatus),
        timeline: timelineRows,
        sla,
      };
    },
  );

// ── Comments ──────────────────────────────────────────

export type Comment = {
  id: string;
  author: string;
  author_name: string | null;
  body: string;
  created_at: string;
};

export const getReservationComments = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => lookupSchema.parse(data))
  .handler(async ({ data }): Promise<Comment[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows, error } = await supabaseAdmin.rpc("get_reservation_comments", {
      _reference: data.reference,
      _code: data.code,
    });

    if (error) {
      console.error("[suivi] comments fetch failed", error);
      return [];
    }

    return (rows ?? []) as Comment[];
  });

export const addReservationComment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    lookupSchema
      .extend({
        body: z.string().trim().min(1, "Message requis").max(1000),
        author_name: z.string().trim().max(100).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<{ id: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("suivi-comment", 10))) {
      throw new Error("Trop de commentaires. Réessayez dans une minute.");
    }

    const { data: id, error } = await supabaseAdmin.rpc("add_reservation_comment", {
      _reference: data.reference,
      _code: data.code,
      _author: "customer",
      _author_name: data.author_name ?? null,
      _body: data.body,
    } as never);

    if (error) {
      console.error("[suivi] comment add failed", error);
      throw new Error("Impossible d'ajouter le commentaire. Réessayez.");
    }

    return { id: id as string };
  });
