import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireStaff } from "@/lib/rbac";

export interface ScheduledReport {
  id: string;
  name: string;
  frequency: "daily" | "weekly" | "monthly";
  recipients: string[];
  metrics: string[];
  last_sent_at: string | null;
  next_send_at: string;
  active: boolean;
  created_at: string;
}

export const getScheduledReports = createServerFn({ method: "GET" }).handler(async () => {
  await requireStaff(supabaseAdmin);
  const { data, error } = await supabaseAdmin
    .from("scheduled_reports" as never)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ScheduledReport[];
});

export const createScheduledReport = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const r = data as Omit<ScheduledReport, "id" | "last_sent_at" | "created_at">;
    if (!r.name || !r.recipients?.length) throw new Error("name et recipients requis");
    return r;
  })
  .handler(async ({ data }) => {
    await requireStaff(supabaseAdmin);
    const next = new Date();
    if (data.frequency === "weekly") next.setDate(next.getDate() + 7);
    else if (data.frequency === "monthly") next.setMonth(next.getMonth() + 1);
    else next.setDate(next.getDate() + 1);

    const { error } = await supabaseAdmin
      .from("scheduled_reports" as never)
      .insert({ ...data, next_send_at: next.toISOString() } as never);
    if (error) throw new Error(error.message);
    return { created: true };
  });

export const deleteScheduledReport = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { id } = data as { id: string };
    return { id };
  })
  .handler(async ({ data }) => {
    await requireStaff(supabaseAdmin);
    const { error } = await supabaseAdmin
      .from("scheduled_reports" as never)
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { deleted: true };
  });

export const toggleScheduledReport = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { id, active } = data as { id: string; active: boolean };
    return { id, active };
  })
  .handler(async ({ data }) => {
    await requireStaff(supabaseAdmin);
    const { error } = await supabaseAdmin
      .from("scheduled_reports" as never)
      .update({ active: data.active } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { updated: true };
  });
