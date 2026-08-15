import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { rateLimit } from "@/lib/security";

const deliverySchema = z.object({
  reservationId: z.string().uuid(),
  status: z.enum(["non_applicable", "a_planifier", "en_route", "livre"]),
  address: z.string().trim().max(300).optional(),
});

async function currentUserId(supabaseAdmin: SupabaseClient<Database>): Promise<string> {
  const authHeader = getRequestHeader("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  let userId: string | null = null;
  if (token) {
    const { data: claimsData } = await supabaseAdmin.auth.getClaims(token);
    const sub = claimsData?.claims?.sub;
    userId = typeof sub === "string" ? sub : null;
  }
  if (!userId) throw new Error("Non authentifié");
  return userId;
}

/**
 * Changement du statut de livraison d'un dossier (enlèvement à domicile) :
 * délègue au RPC PostgreSQL, puis notifie le client. L'appelant doit être
 * membre du staff — vérifié côté serveur.
 */
export const setDeliveryStatus = createServerFn({ method: "POST" })
  .validator((data: unknown) => deliverySchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("delivery-status", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const userId = await currentUserId(supabaseAdmin);

    const { data: staff, error: staffError } = await supabaseAdmin.rpc("is_staff", {
      _user_id: userId,
    });
    if (staffError || !staff) throw new Error("Action non autorisée");

    const { data: ok, error } = await supabaseAdmin.rpc("set_delivery_status", {
      _reservation_id: data.reservationId,
      _status: data.status,
      _address: data.address ?? "",
    });
    if (error) {
      console.error("[delivery] set status failed", error);
      throw new Error(error.message);
    }
    if (!ok) {
      throw new Error("Le statut de livraison n'a pas pu être mis à jour (dossier introuvable).");
    }

    const { data: row } = await supabaseAdmin
      .from("reservations")
      .select(
        "reference, customer_name, email, phone, device, issue, mode, payment, slot_date, slot_period, slot_hour, status",
      )
      .eq("id", data.reservationId)
      .maybeSingle();

    if (row) {
      try {
        const { notifyDeliveryStatusChanged } = await import("@/lib/notifications");
        await notifyDeliveryStatusChanged({
          ...row,
          delivery_status: data.status,
          delivery_address: data.address ?? null,
        });
      } catch (err) {
        console.error("[delivery] notification failed", err);
      }
    }

    return true;
  });

export type SetDeliveryInput = z.infer<typeof deliverySchema>;
