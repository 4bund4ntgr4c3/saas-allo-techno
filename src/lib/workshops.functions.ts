import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface Workshop {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  lat: number;
  lng: number;
  timezone: string;
  active: boolean;
  created_at: string;
}

export const getWorkshops = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("workshops" as never)
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Workshop[];
});

export const createWorkshop = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const w = data as Omit<Workshop, "id" | "created_at">;
    if (!w.name || !w.city) throw new Error("name et city requis");
    return w;
  })
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("workshops" as never).insert(data as never);
    if (error) throw new Error(error.message);
    return { created: true };
  });

export const updateWorkshop = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { id, ...updates } = data as { id: string } & Partial<Workshop>;
    if (!id) throw new Error("id requis");
    return { id, updates };
  })
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("workshops" as never)
      .update(data.updates as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { updated: true };
  });

export const deleteWorkshop = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { id } = data as { id: string };
    return { id };
  })
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("workshops" as never)
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { deleted: true };
  });
