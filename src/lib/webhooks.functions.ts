import { createServerFn } from "@tanstack/react-start";
import { rateLimit } from "@/lib/security";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OutboundWebhook = {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string | null;
  active: boolean;
  last_triggered_at: string | null;
  last_status: number | null;
  created_at: string;
};

export type WebhookLog = {
  id: string;
  webhook_id: string;
  event: string;
  payload: Record<string, string | number | boolean | null>;
  status_code: number | null;
  response_body: string | null;
  duration_ms: number | null;
  created_at: string;
};

export const WEBHOOK_EVENTS = [
  "reservation.created",
  "reservation.status_changed",
  "reservation.completed",
  "payment.received",
  "payment.failed",
  "lead.new",
  "review.submitted",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

// ---------------------------------------------------------------------------
// RPCs
// ---------------------------------------------------------------------------

/** Liste tous les webhooks. */
export const listWebhooks = createServerFn({ method: "GET" }).handler(
  async (): Promise<OutboundWebhook[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await rateLimit("list-webhooks", 20))) throw new Error("Trop de demandes.");
    const { data, error } = await supabaseAdmin
      .from("outbound_webhooks" as never)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as OutboundWebhook[];
  },
);

/** Liste les logs d'un webhook. */
export const listWebhookLogs = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { webhook_id } = data as { webhook_id: string };
    return { webhook_id };
  })
  .handler(async ({ data }): Promise<WebhookLog[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await rateLimit("list-webhook-logs", 20))) throw new Error("Trop de demandes.");
    const { data: rows, error } = await supabaseAdmin
      .from("webhook_logs" as never)
      .select("*")
      .eq("webhook_id", data.webhook_id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as WebhookLog[];
  });

/** Crée un webhook. */
export const createWebhook = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const w = data as { name: string; url: string; events: string[]; secret?: string };
    if (!w.name || !w.url) throw new Error("Nom et URL requis.");
    return w;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await rateLimit("create-webhook", 10))) throw new Error("Trop de demandes.");
    const { error } = await supabaseAdmin.from("outbound_webhooks" as never).insert({
      name: data.name,
      url: data.url,
      events: data.events,
      secret: data.secret ?? null,
      active: true,
    } as never);
    if (error) throw new Error(error.message);
    return { created: true };
  });

/** Met à jour un webhook. */
export const updateWebhook = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { id, ...updates } = data as { id: string } & Partial<OutboundWebhook>;
    if (!id) throw new Error("id requis");
    return { id, updates };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await rateLimit("update-webhook", 10))) throw new Error("Trop de demandes.");
    const { error } = await supabaseAdmin
      .from("outbound_webhooks" as never)
      .update(data.updates as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { updated: true };
  });

/** Supprime un webhook. */
export const deleteWebhook = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { id } = data as { id: string };
    return { id };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await rateLimit("delete-webhook", 10))) throw new Error("Trop de demandes.");
    const { error } = await supabaseAdmin
      .from("outbound_webhooks" as never)
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { deleted: true };
  });

/**
 * Déclenche tous les webhooks abonnés à un événement.
 * Appelé côté serveur après chaque action pertinente.
 */
export async function triggerWebhooks(
  event: WebhookEvent,
  payload: Record<string, string | number | boolean | null>,
): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: hooks } = await supabaseAdmin
    .from("outbound_webhooks" as never)
    .select("*")
    .eq("active", true)
    .contains("events", [event]);

  if (!hooks || hooks.length === 0) return;

  const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });

  for (const hook of hooks as unknown as OutboundWebhook[]) {
    const start = Date.now();
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Webhook-Event": event,
      };
      if (hook.secret) {
        const { createHmac } = await import("crypto");
        const sig = createHmac("sha256", hook.secret).update(body).digest("hex");
        headers["X-Webhook-Signature"] = sig;
      }

      const res = await fetch(hook.url, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(10000),
      });

      const duration = Date.now() - start;
      const resBody = await res.text().catch(() => "");

      await supabaseAdmin.from("webhook_logs" as never).insert({
        webhook_id: hook.id,
        event,
        payload,
        status_code: res.status,
        response_body: resBody.slice(0, 1000),
        duration_ms: duration,
      } as never);

      await supabaseAdmin
        .from("outbound_webhooks" as never)
        .update({
          last_triggered_at: new Date().toISOString(),
          last_status: res.status,
        } as never)
        .eq("id", hook.id);
    } catch (err) {
      const duration = Date.now() - start;
      await supabaseAdmin.from("webhook_logs" as never).insert({
        webhook_id: hook.id,
        event,
        payload,
        status_code: 0,
        response_body: err instanceof Error ? err.message : "Unknown error",
        duration_ms: duration,
      } as never);
    }
  }
}
