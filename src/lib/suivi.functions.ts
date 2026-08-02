import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const lookupSchema = z.object({
  reference: z.string().trim().min(1, "Référence requise"),
});

type ReservationStatusRow = {
  reference: string;
  device: string;
  issue: string;
  mode: string;
  payment: string;
  slot_date: string;
  slot_period: "matin" | "apres-midi";
  status: "en_attente" | "confirmee" | "en_cours" | "terminee" | "annulee";
  created_at: string;
};

export const getReservationStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => lookupSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows, error } = await supabaseAdmin.rpc<ReservationStatusRow[]>(
      "get_reservation_status",
      {
        _reference: data.reference,
      },
    );

    if (error) {
      console.error("[suivi] rpc failed", error);
      throw new Error("Impossible de vérifier ce dossier. Réessayez plus tard.");
    }

    if (!rows || rows.length === 0) {
      throw new Error("Dossier introuvable. Vérifiez la référence.");
    }

    return rows[0];
  });
