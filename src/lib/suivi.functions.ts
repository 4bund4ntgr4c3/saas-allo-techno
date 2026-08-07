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
  "reference, customer_name, phone, email, device, issue, mode, payment, slot_date, slot_period, slot_hour, status, delivery_status, delivery_address, created_at";

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
};

export type TimelineEntry = {
  old_status: Enums<"reservation_status"> | null;
  new_status: Enums<"reservation_status">;
  note: string | null;
  created_at: string;
};

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

      if (!rateLimit("suivi-lookup", 30)) {
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

    if (!rateLimit("suivi-reschedule", 5)) {
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
      { found: true; reservation: ReservationStatus; timeline: TimelineEntry[] } | { found: false }
    > => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      if (!rateLimit("suivi-lookup", 30)) {
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

      return {
        found: true,
        reservation: valid
          ? (reservation as ReservationStatus)
          : publicReservation(reservation as ReservationStatus),
        timeline: (timeline ?? []) as TimelineEntry[],
      };
    },
  );
