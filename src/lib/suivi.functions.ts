import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Enums } from "@/integrations/supabase/types";

const lookupSchema = z.object({
  reference: z.string().trim().min(1, "Référence requise"),
});

export type ReservationStatus = {
  reference: string;
  device: string;
  issue: string;
  mode: string;
  payment: string;
  slot_date: string;
  slot_period: Enums<"slot_period">;
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
  .handler(async ({ data }): Promise<{ found: true; reservation: ReservationStatus } | { found: false }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("reservations")
      .select("reference, device, issue, mode, payment, slot_date, slot_period, status, created_at")
      .eq("reference", data.reference)
      .maybeSingle();

    if (error) {
      console.error("[suivi] lookup failed", error);
      throw new Error("Impossible de vérifier ce dossier. Réessayez plus tard.");
    }

    if (!row) return { found: false };

    return { found: true, reservation: row as ReservationStatus };
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
        .select("reference, device, issue, mode, payment, slot_date, slot_period, status, created_at")
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
