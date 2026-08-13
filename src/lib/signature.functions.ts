import { createServerFn } from "@tanstack/react-start";
import { requireStaff } from "@/lib/rbac";
import { rateLimit } from "@/lib/security";

export type HandoffSignature = {
  id: string;
  reservation_id: string;
  customer_name: string;
  signature_data_url: string;
  signed_at: string;
  ip_address: string | null;
};

const SIGNATURE_URL_PATTERN = /^data:image\/(png|jpe?g|webp);base64,[a-zA-Z0-9+/=]+$/;
const SIGNATURE_MAX_CHARS = 2_000_000;

/** Enregistre une signature de remise pour un dossier (réservé au personnel). */
export const saveHandoffSignature = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as {
      reservation_id: string;
      customer_name: string;
      signature_data_url: string;
    };
    if (!d.reservation_id || !d.signature_data_url) {
      throw new Error("reservation_id et signature requis.");
    }
    if (d.signature_data_url.length > SIGNATURE_MAX_CHARS) {
      throw new Error("Signature trop volumineuse.");
    }
    if (!SIGNATURE_URL_PATTERN.test(d.signature_data_url)) {
      throw new Error("Signature invalide : image base64 attendue.");
    }
    return d;
  })
  .handler(
    async ({
      data,
    }: {
      data: { reservation_id: string; customer_name: string; signature_data_url: string };
    }) => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await requireStaff(supabaseAdmin);
      if (!(await rateLimit("save-signature", 10))) throw new Error("Trop de demandes.");

      const { error } = await supabaseAdmin.from("handoff_signatures" as never).insert({
        reservation_id: data.reservation_id,
        customer_name: data.customer_name,
        signature_data_url: data.signature_data_url,
      } as never);
      if (error) throw new Error(error.message);
      return { saved: true };
    },
  );

/** Récupère la signature d'un dossier (réservé au personnel). */
export const getHandoffSignature = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { reservation_id } = data as { reservation_id: string };
    return { reservation_id };
  })
  .handler(
    async ({ data }: { data: { reservation_id: string } }): Promise<HandoffSignature | null> => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await requireStaff(supabaseAdmin);
      if (!(await rateLimit("get-signature", 20))) throw new Error("Trop de demandes.");

      const { data: row, error } = await supabaseAdmin
        .from("handoff_signatures" as never)
        .select("*")
        .eq("reservation_id", data.reservation_id)
        .single();
      if (error && error.code !== "PGRST116") throw new Error(error.message);
      return (row as unknown as HandoffSignature) ?? null;
    },
  );
