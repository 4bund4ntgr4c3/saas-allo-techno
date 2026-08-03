import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Enums } from "@/integrations/supabase/types";
import { isPastSlot, toIsoDate } from "@/lib/reservation-schema";

const lookupSchema = z.object({
  reference: z.string().trim().min(1, "Référence requise"),
});

const rescheduleSchema = z.object({
  reference: z.string().trim().min(1, "Référence requise"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choisissez une date"),
  creneau: z.enum(["matin", "apres-midi"]),
  heure: z.string().regex(/^\d{2}:\d{2}$/, "Choisissez une heure"),
});

export type ReservationStatus = {
  reference: string;
  device: string;
  issue: string;
  mode: string;
  payment: string;
  slot_date: string;
  slot_period: Enums<"slot_period">;
  slot_hour: string | null;
  status: Enums<"reservation_status">;
  created_at: string;
};

export type TimelineEntry = {
  old_status: Enums<"reservation_status"> | null;
  new_status: Enums<"reservation_status">;
  note: string | null;
  created_at: string;
};

export const getReservationStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => lookupSchema.parse(data))
  .handler(
    async ({
      data,
    }): Promise<{ found: true; reservation: ReservationStatus } | { found: false }> => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const { data: row, error } = await supabaseAdmin
        .from("reservations")
        .select(
          "reference, device, issue, mode, payment, slot_date, slot_period, slot_hour, status, created_at",
        )
        .eq("reference", data.reference)
        .maybeSingle();

      if (error) {
        console.error("[suivi] lookup failed", error);
        throw new Error("Impossible de vérifier ce dossier. Réessayez plus tard.");
      }

      if (!row) return { found: false };

      return { found: true, reservation: row as ReservationStatus };
    },
  );

/**
 * Reprogramme le rendez-vous d'un dossier (date + heure). La validation du
 * créneau (capacité par mode, dates passées, doublons d'heure) est appliquée
 * par les triggers PostgreSQL côté serveur.
 */
export const rescheduleReservation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => rescheduleSchema.parse(data))
  .handler(async ({ data }): Promise<ReservationStatus> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("reservations")
      .select("id, status")
      .eq("reference", data.reference)
      .maybeSingle();

    if (error) {
      console.error("[suivi] reschedule lookup failed", error);
      throw new Error("Impossible de vérifier ce dossier. Réessayez plus tard.");
    }
    if (!row) throw new Error("Dossier introuvable. Vérifiez la référence.");

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
      .select(
        "reference, device, issue, mode, payment, slot_date, slot_period, slot_hour, status, created_at",
      )
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

      const { data: row, error } = await supabaseAdmin
        .from("reservations")
        .select(
          "reference, device, issue, mode, payment, slot_date, slot_period, slot_hour, status, created_at",
        )
        .eq("reference", data.reference)
        .maybeSingle();

      if (error) {
        console.error("[suivi] lookup failed", error);
        throw new Error("Impossible de vérifier ce dossier. Réessayez plus tard.");
      }

      if (!row) return { found: false };

      const { data: timeline, error: timelineError } = await supabaseAdmin.rpc(
        "get_reservation_timeline",
        { _reference: data.reference },
      );

      if (timelineError) console.error("[suivi] timeline failed", timelineError);

      return {
        found: true,
        reservation: row as ReservationStatus,
        timeline: (timeline ?? []) as TimelineEntry[],
      };
    },
  );
