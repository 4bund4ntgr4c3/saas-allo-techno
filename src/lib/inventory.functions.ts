import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface Part {
  id: string;
  name: string;
  sku: string;
  category: string;
  brand: string;
  model: string;
  quantity: number;
  min_quantity: number;
  unit_price: number;
  supplier_id: string | null;
  location: string;
  active: boolean;
  created_at: string;
}

export interface StockMovement {
  id: string;
  part_id: string;
  type: "in" | "out" | "adjustment" | "return";
  quantity: number;
  reason: string;
  reservation_id: string | null;
  performed_by: string;
  created_at: string;
}

export const getInventory = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("inventory_parts" as never)
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Part[];
});

export const getLowStockParts = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("inventory_parts" as never)
    .select("*")
    .order("quantity");
  if (error) throw new Error(error.message);
  const parts = (data ?? []) as unknown as Part[];
  return parts.filter((p) => p.quantity <= p.min_quantity);
});

export const createPart = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const p = data as Omit<Part, "id" | "created_at">;
    if (!p.name || !p.sku) throw new Error("name et sku requis");
    return p;
  })
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("inventory_parts" as never).insert(data as never);
    if (error) throw new Error(error.message);
    return { created: true };
  });

export const updatePart = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { id, ...updates } = data as { id: string } & Partial<Part>;
    if (!id) throw new Error("id requis");
    return { id, updates };
  })
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("inventory_parts" as never)
      .update(data.updates as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { updated: true };
  });

export const recordMovement = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const m = data as Omit<StockMovement, "id" | "created_at">;
    if (!m.part_id || !m.type || m.quantity <= 0) throw new Error("Invalid movement");
    return m;
  })
  .handler(async ({ data }) => {
    const { error: movErr } = await supabaseAdmin
      .from("stock_movements" as never)
      .insert(data as never);
    if (movErr) throw new Error(movErr.message);

    const delta = data.type === "in" || data.type === "return" ? data.quantity : -data.quantity;
    const { error: partErr } = await supabaseAdmin.rpc(
      "update_stock_quantity" as never,
      {
        _part_id: data.part_id,
        _delta: delta,
      } as never,
    );
    if (partErr) {
      console.warn("rpc update_stock_quantity failed, falling back to direct update");
      const { data: part } = await supabaseAdmin
        .from("inventory_parts" as never)
        .select("quantity")
        .eq("id", data.part_id)
        .single();
      const current = (part as { quantity?: number } | null)?.quantity ?? 0;
      await supabaseAdmin
        .from("inventory_parts" as never)
        .update({ quantity: Math.max(0, current + delta) } as never)
        .eq("id", data.part_id);
    }
    return { recorded: true };
  });

export const getStockMovements = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { part_id } = data as { part_id: string };
    return { part_id };
  })
  .handler(async ({ data }) => {
    const { data: movements, error } = await supabaseAdmin
      .from("stock_movements" as never)
      .select("*")
      .eq("part_id", data.part_id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (movements ?? []) as unknown as StockMovement[];
  });

export const deletePart = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { id } = data as { id: string };
    return { id };
  })
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("inventory_parts" as never)
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { deleted: true };
  });
