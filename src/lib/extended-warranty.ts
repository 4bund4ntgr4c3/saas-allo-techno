import { createServerFn } from "@tanstack/react-start";
import { requireStaff } from "@/lib/rbac";
import { rateLimit } from "@/lib/security";

export interface ExtendedWarranty {
  id: string;
  reservation_id: string;
  customer_name: string;
  phone: string;
  device: string;
  warranty_months: number;
  price: number;
  start_date: string;
  end_date: string;
  status: "active" | "expired" | "claimed";
  created_at: string;
}

export const WARRANTY_OPTIONS = [
  { months: 6, price: 5000, label: "6 mois" },
  { months: 12, price: 10000, label: "12 mois" },
  { months: 24, price: 18000, label: "24 mois" },
] as const;

export const createExtendedWarranty = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { reservation_id, customer_name, phone, device, warranty_months, price } = data as {
      reservation_id: string;
      customer_name: string;
      phone: string;
      device: string;
      warranty_months: number;
      price: number;
    };
    if (!reservation_id || !customer_name)
      throw new Error("reservation_id et customer_name requis");
    return { reservation_id, customer_name, phone, device, warranty_months, price };
  })
  .handler(async ({ data }) => {
    if (!(await rateLimit("create-extended-warranty", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireStaff(supabaseAdmin);
    const start = new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + data.warranty_months);

    const { error } = await supabaseAdmin.from("extended_warranties" as never).insert({
      reservation_id: data.reservation_id,
      customer_name: data.customer_name,
      phone: data.phone,
      device: data.device,
      warranty_months: data.warranty_months,
      price: data.price,
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      status: "active",
    } as never);
    if (error) throw new Error(error.message);
    return { created: true };
  });

export const getExtendedWarranties = createServerFn({ method: "GET" }).handler(async () => {
  if (!(await rateLimit("get-extended-warranties", 60))) {
    throw new Error("Trop de demandes. Réessayez dans une minute.");
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await requireStaff(supabaseAdmin);
  const { data, error } = await supabaseAdmin
    .from("extended_warranties" as never)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ExtendedWarranty[];
});

export const getActiveWarranties = createServerFn({ method: "GET" }).handler(async () => {
  if (!(await rateLimit("get-active-warranties", 60))) {
    throw new Error("Trop de demandes. Réessayez dans une minute.");
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await requireStaff(supabaseAdmin);
  const { data } = await supabaseAdmin
    .from("extended_warranties" as never)
    .select("*")
    .eq("status", "active")
    .order("end_date");
  return (data ?? []) as unknown as ExtendedWarranty[];
});

export const claimWarranty = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { id } = data as { id: string };
    return { id };
  })
  .handler(async ({ data }) => {
    if (!(await rateLimit("claim-warranty", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireStaff(supabaseAdmin);
    const { error } = await supabaseAdmin
      .from("extended_warranties" as never)
      .update({ status: "claimed" } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { claimed: true };
  });
