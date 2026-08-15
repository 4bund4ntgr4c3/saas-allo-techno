import { createServerFn } from "@tanstack/react-start";
import { requireStaff } from "@/lib/rbac";
import { rateLimit } from "@/lib/security";

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
  if (!(await rateLimit("get-internal-notifications", 60))) {
    throw new Error("Trop de demandes. Réessayez dans une minute.");
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await requireStaff(supabaseAdmin);
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
    if (!(await rateLimit("mark-notification-read", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireStaff(supabaseAdmin);
    const { error } = await supabaseAdmin
      .from("internal_notifications" as never)
      .update({ read: true } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { marked: true };
  });

export const markAllRead = createServerFn({ method: "POST" }).handler(async () => {
  if (!(await rateLimit("mark-all-read", 20))) {
    throw new Error("Trop de demandes. Réessayez dans une minute.");
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await requireStaff(supabaseAdmin);
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
    if (!(await rateLimit("create-notification", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireStaff(supabaseAdmin);
    const { error } = await supabaseAdmin
      .from("internal_notifications" as never)
      .insert({ ...data, read: false } as never);
    if (error) throw new Error(error.message);
    return { created: true };
  });

export const getUnreadCount = createServerFn({ method: "GET" }).handler(async () => {
  if (!(await rateLimit("get-unread-count", 60))) {
    throw new Error("Trop de demandes. Réessayez dans une minute.");
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await requireStaff(supabaseAdmin);
  const { count } = await supabaseAdmin
    .from("internal_notifications" as never)
    .select("*", { count: "exact", head: true })
    .eq("read", false);
  return count ?? 0;
});
