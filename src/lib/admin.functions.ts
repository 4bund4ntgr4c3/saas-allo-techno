import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import type { Enums } from "@/integrations/supabase/types";

const setStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    "en_attente",
    "confirmee",
    "pieces",
    "en_cours",
    "pret",
    "livre",
    "terminee",
    "annulee",
  ]),
  note: z.string().trim().max(500).optional(),
});

/**
 * Changement de statut d'un dossier par le personnel : délègue au RPC
 * PostgreSQL (historique + contrôles), puis notifie le client (e-mail +
 * WhatsApp). L'appelant doit être membre du staff — vérifié côté serveur.
 */
export const setReservationStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => setStatusSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const authHeader = getRequestHeader("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    let userId: string | null = null;
    if (token) {
      const { data: claimsData } = await supabaseAdmin.auth.getClaims(token);
      const sub = claimsData?.claims?.sub;
      userId = typeof sub === "string" ? sub : null;
    }
    if (!userId) throw new Error("Non authentifié");

    const { data: staff, error: staffError } = await supabaseAdmin.rpc("is_staff", {
      _user_id: userId,
    });
    if (staffError || !staff) {
      const { data: isTech, error: techError } = await supabaseAdmin.rpc("has_role", {
        _user_id: userId,
        _role: "technicien",
      });
      if (techError || !isTech) throw new Error("Action non autorisée sur ce dossier");
      const { error: techRpcError } = await supabaseAdmin.rpc(
        "technician_set_reservation_status",
        {
          _reservation_id: data.id,
          _status: data.status,
          ...(data.note ? { _note: data.note } : {}),
        },
      );
      if (techRpcError) {
        console.error("[admin] technician set status failed", techRpcError);
        throw new Error(techRpcError.message);
      }
    } else {
      const { error } = await supabaseAdmin.rpc("staff_set_reservation_status", {
        _reservation_id: data.id,
        _status: data.status,
        ...(data.note ? { _note: data.note } : {}),
      });
      if (error) {
        console.error("[admin] set status failed", error);
        throw new Error(error.message);
      }
    }

    const { data: row } = await supabaseAdmin
      .from("reservations")
      .select(
        "reference, customer_name, email, phone, device, issue, mode, payment, slot_date, slot_period, slot_hour, status",
      )
      .eq("id", data.id)
      .maybeSingle();

    if (row) {
      const { notifyReservationStatusChanged } = await import("@/lib/notifications");
      void notifyReservationStatusChanged(row);
    }

    return true;
  });

export type SetStatusInput = z.infer<typeof setStatusSchema>;
export type SetStatusResult = boolean;
export type Status = Enums<"reservation_status">;
