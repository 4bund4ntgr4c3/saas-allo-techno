import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

import { reservationInputSchema } from "./reservation-schema";

export const createReservation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => reservationInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let userId: string | null = null;
    const authHeader = getRequestHeader("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { data: claimsData } = await supabaseAdmin.auth.getClaims(token);
      const sub = claimsData?.claims?.sub;
      userId = typeof sub === "string" ? sub : null;
    }

    const message = [
      data.heure ? `Heure souhaitée : ${data.heure}` : "",
      data.message ?? "",
    ]
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
        message: message ? message : null,
      })
      .select("id, reference, slot_date, slot_period, status")
      .single();

    if (error) {
      console.error("[reservations] insert failed", error);
      const message = error.message.includes("complet")
        ? "Ce créneau vient d'être complété. Choisissez-en un autre."
        : error.message.includes("indisponible")
          ? "Nous sommes fermés sur ce créneau."
          : error.message.includes("passé")
            ? "Cette date est déjà passée."
            : "La réservation n'a pas pu être enregistrée. Réessayez.";
      throw new Error(message);
    }

    return row;
  });
