import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface InternalNotification {
  id: string;
  type:
    "sla_breach" | "new_reservation" | "payment_received" | "escalation" | "low_stock" | "system";
  title: string;
  message: string;
  reservation_id: string | null;
  read: boolean;
  created_at: string;
}

export const getInternalNotifications = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("internal_notifications" as never)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as InternalNotification[];
});

export const markNotificationRead = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { id } = data as { id: string };
    return { id };
  })
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("internal_notifications" as never)
      .update({ read: true } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { marked: true };
  });

export const markAllRead = createServerFn({ method: "POST" }).handler(async () => {
  const { error } = await supabaseAdmin
    .from("internal_notifications" as never)
    .update({ read: true } as never)
    .eq("read", false);
  if (error) throw new Error(error.message);
  return { marked: true };
});

export const createNotification = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const n = data as Omit<InternalNotification, "id" | "read" | "created_at">;
    return n;
  })
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("internal_notifications" as never)
      .insert({ ...data, read: false } as never);
    if (error) throw new Error(error.message);
    return { created: true };
  });

export const getUnreadCount = createServerFn({ method: "GET" }).handler(async () => {
  const { count } = await supabaseAdmin
    .from("internal_notifications" as never)
    .select("*", { count: "exact", head: true })
    .eq("read", false);
  return count ?? 0;
});
