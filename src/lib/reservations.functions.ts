import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

import { reservationInputSchema } from "./reservation-schema";
import { generateTrackingCode, hashTrackingCode, rateLimit } from "./security";
import type { TablesInsert } from "@/integrations/supabase/types";
import { trackMetric } from "@/lib/monitoring";

// Schéma local : reservationInputSchema (partagé) + attribution optionnelle.
const createReservationSchema = reservationInputSchema.extend({
  source: z.string().trim().max(80).optional(),
});

export const createReservation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createReservationSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!rateLimit("reservation-create", 8)) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    let userId: string | null = null;
    const authHeader = getRequestHeader("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { data: claimsData } = await supabaseAdmin.auth.getClaims(token);
      const sub = claimsData?.claims?.sub;
      userId = typeof sub === "string" ? sub : null;
    }

    // Code de suivi secret : seul le client le reçoit (confirmation + notifications),
    // seule son empreinte poivrée est stockée.
    const trackingCode = generateTrackingCode();
    const trackingCodeHash = await hashTrackingCode(trackingCode);

    const message = [data.heure ? `Heure souhaitée : ${data.heure}` : "", data.message ?? ""]
      .filter(Boolean)
      .join("\n");

    const { data: row, error } = await supabaseAdmin
      .from("reservations")
      .insert({
        user_id: userId,
        customer_name: data.nom,
        phone: data.telephone,
        email: data.email ? data.email : null,
        device: data.appareil,
        issue: data.panne,
        mode: data.mode,
        payment: data.paiement,
        slot_date: data.date,
        slot_period: data.creneau,
        slot_hour: data.heure ? data.heure : null,
        message: message ? message : null,
        tracking_code_hash: trackingCodeHash,
        ...(data.source ? { source: data.source } : {}),
      } as TablesInsert<"reservations">)
      .select(
        "reference, customer_name, email, phone, device, issue, mode, payment, slot_date, slot_period, slot_hour, status",
      )
      .single();

    if (error) {
      console.error("[reservations] insert failed", error);
      // 23505 = violation de l'index unique (date, heure) : quelqu'un a réservé avant nous.
      if (error.code === "23505") {
        throw new Error(
          "Ce créneau vient d'être réservé par un autre client. Choisissez une autre heure.",
        );
      }
      const message = error.message.includes("complet")
        ? "Ce créneau vient d'être complété. Choisissez-en un autre."
        : error.message.includes("indisponible")
          ? "Nous sommes fermés sur ce créneau."
          : error.message.includes("passé")
            ? "Cette date est déjà passée."
            : "La réservation n'a pas pu être enregistrée. Réessayez.";
      throw new Error(message);
    }

    const { notifyReservationCreated, notifyStaffNewReservation } =
      await import("@/lib/notifications");
    void notifyReservationCreated({ ...row, tracking_code: trackingCode });
    void notifyStaffNewReservation(row);

    trackMetric("reservation_created", { reference: row.reference });

    return { ...row, tracking_code: trackingCode };
  });
