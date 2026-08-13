import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireStaff } from "@/lib/rbac";

export interface Supplier {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  speciality: string;
  rating: number;
  active: boolean;
  created_at: string;
}

export interface SupplierOrder {
  id: string;
  supplier_id: string;
  parts: { name: string; quantity: number; unit_price: number }[];
  total: number;
  status: "pending" | "ordered" | "shipped" | "received" | "cancelled";
  expected_delivery: string | null;
  received_at: string | null;
  created_at: string;
}

export const getSuppliers = createServerFn({ method: "GET" }).handler(async () => {
  await requireStaff(supabaseAdmin);
  const { data, error } = await supabaseAdmin
    .from("suppliers" as never)
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Supplier[];
});

export const createSupplier = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const s = data as Omit<Supplier, "id" | "created_at">;
    if (!s.name || !s.phone) throw new Error("name et phone requis");
    return s;
  })
  .handler(async ({ data }) => {
    await requireStaff(supabaseAdmin);
    const { error } = await supabaseAdmin.from("suppliers" as never).insert(data as never);
    if (error) throw new Error(error.message);
    return { created: true };
  });

export const getSupplierOrders = createServerFn({ method: "GET" }).handler(async () => {
  await requireStaff(supabaseAdmin);
  const { data, error } = await supabaseAdmin
    .from("supplier_orders" as never)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as SupplierOrder[];
});

export const createSupplierOrder = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const o = data as Omit<SupplierOrder, "id" | "created_at">;
    if (!o.supplier_id || !o.parts?.length) throw new Error("supplier_id et parts requis");
    return o;
  })
  .handler(async ({ data }) => {
    await requireStaff(supabaseAdmin);
    const { error } = await supabaseAdmin.from("supplier_orders" as never).insert(data as never);
    if (error) throw new Error(error.message);
    return { created: true };
  });

export const updateSupplierOrderStatus = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { id, status } = data as { id: string; status: SupplierOrder["status"] };
    return { id, status };
  })
  .handler(async ({ data }) => {
    await requireStaff(supabaseAdmin);
    const updates: Record<string, unknown> = { status: data.status };
    if (data.status === "received") {
      updates["received_at"] = new Date().toISOString();
    }
    const { error } = await supabaseAdmin
      .from("supplier_orders" as never)
      .update(updates as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { updated: true };
  });
