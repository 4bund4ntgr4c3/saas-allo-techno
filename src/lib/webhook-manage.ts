import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireStaff } from "@/lib/rbac";
import { isSafeOutboundUrl, rateLimit } from "@/lib/security";

export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
  last_triggered_at: string | null;
}

const WEBHOOK_COLUMNS = "id, url, events, active, created_at, last_triggered_at";

export const getWebhooks = createServerFn({ method: "GET" }).handler(async () => {
  if (!(await rateLimit("get-webhooks", 60))) {
    throw new Error("Trop de demandes. Réessayez dans une minute.");
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await requireStaff(supabaseAdmin);
  const { data, error } = await supabaseAdmin
    .from("webhook_configs" as never)
    .select(WEBHOOK_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as WebhookConfig[];
});

const webhookSchema = z.object({
  url: z.string().url().refine(isSafeOutboundUrl, {
    message: "URL invalide : HTTPS requis et pas d'adresse privée ou locale",
  }),
  events: z.array(z.string()).min(1),
  secret: z.string().min(8),
});

export const createWebhook = createServerFn({ method: "POST" })
  .validator((data: unknown) => webhookSchema.parse(data))
  .handler(async ({ data }) => {
    if (!(await rateLimit("create-webhook", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireStaff(supabaseAdmin);
    const { error } = await supabaseAdmin.from("webhook_configs" as never).insert({
      url: data.url,
      events: data.events,
      secret: data.secret,
      active: true,
    } as never);
    if (error) throw new Error(error.message);
    return { created: true };
  });

export const toggleWebhook = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { id, active } = data as { id: string; active: boolean };
    return { id, active };
  })
  .handler(async ({ data }) => {
    if (!(await rateLimit("toggle-webhook", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireStaff(supabaseAdmin);
    const { error } = await supabaseAdmin
      .from("webhook_configs" as never)
      .update({ active: data.active } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { toggled: true };
  });

export const deleteWebhook = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { id } = data as { id: string };
    return { id };
  })
  .handler(async ({ data }) => {
    if (!(await rateLimit("delete-webhook", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireStaff(supabaseAdmin);
    const { error } = await supabaseAdmin
      .from("webhook_configs" as never)
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { deleted: true };
  });

export const testWebhook = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { id } = data as { id: string };
    return { id };
  })
  .handler(async ({ data }) => {
    if (!(await rateLimit("test-webhook", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireStaff(supabaseAdmin);
    const { data: webhook } = await supabaseAdmin
      .from("webhook_configs" as never)
      .select(WEBHOOK_COLUMNS)
      .eq("id", data.id)
      .single();
    if (!webhook) throw new Error("Webhook introuvable");

    const wh = webhook as unknown as WebhookConfig;
    if (!isSafeOutboundUrl(wh.url)) throw new Error("URL du webhook non autorisée");
    try {
      const res = await fetch(wh.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "test",
          timestamp: new Date().toISOString(),
          data: { message: "Test webhook from Allô Techno" },
        }),
      });
      return { success: res.ok, status: res.status };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });
