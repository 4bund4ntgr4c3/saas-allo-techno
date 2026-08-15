import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { rateLimit } from "@/lib/security";

const getAuditLogsSchema = z.object({
  limit: z.number().int().min(1).max(200).optional().default(100),
  offset: z.number().int().min(0).optional().default(0),
});

const logAuditEntrySchema = z.object({
  action: z.enum([
    "reservation.status_changed",
    "reservation.cancelled",
    "reservation.assigned",
    "quote.sent",
    "quote.approved",
    "quote.declined",
    "payment.confirmed",
    "payment.refunded",
    "review.published",
    "review.hidden",
    "lead.status_changed",
    "claim.status_changed",
    "user.role_changed",
    "stock.updated",
    "blog.post_created",
    "blog.post_updated",
  ]),
  entity: z.string().min(1).max(64),
  entity_id: z.string().max(64).nullable().optional(),
  details: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const logAuditEntry = createServerFn({ method: "POST" })
  .validator((data: unknown) => logAuditEntrySchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("audit-write", 30))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const userId = await currentUserId(supabaseAdmin);
    const { data: staff } = await supabaseAdmin.rpc("is_staff", { _user_id: userId });
    if (!staff) throw new Error("Action non autorisée");

    const { error } = await supabaseAdmin.from("audit_log" as never).insert({
      user_id: userId,
      action: data.action,
      entity: data.entity,
      entity_id: data.entity_id ?? null,
      details: data.details ?? null,
    } as never);
    if (error) throw new Error(error.message);
    return { logged: true };
  });

export type AuditLogRow = {
  id: string;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  details: Record<string, string> | null;
  ip_address: string | null;
  created_at: string;
  user_name: string | null;
};

async function currentUserId(supabaseAdmin: SupabaseClient<Database>): Promise<string> {
  const { getRequestHeader } = await import("@tanstack/react-start/server");
  const authHeader = getRequestHeader("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) throw new Error("Non authentifié");
  const { data: claimsData } = await supabaseAdmin.auth.getClaims(token);
  const sub = claimsData?.claims?.sub;
  if (typeof sub !== "string") throw new Error("Non authentifié");
  return sub;
}

export const getAuditLogs = createServerFn({ method: "POST" })
  .validator((data: unknown) => getAuditLogsSchema.parse(data))
  .handler(async ({ data }): Promise<AuditLogRow[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("audit-logs", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const userId = await currentUserId(supabaseAdmin);
    const { data: staff } = await supabaseAdmin.rpc("is_staff", { _user_id: userId });
    if (!staff) throw new Error("Action non autorisée");

    const { data: logs, error } = await supabaseAdmin
      .from("audit_log" as never)
      .select("*")
      .order("created_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);

    if (error) {
      console.error("[audit] fetch failed", error);
      throw new Error("Impossible de charger le journal d'audit.");
    }

    const rows = (logs ?? []) as unknown as AuditLogRow[];

    // Resolve user names for the audit entries
    const userIds = [...new Set(rows.map((r) => r.user_id).filter((id): id is string => !!id))];
    let userNameMap = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      userNameMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? ""]));
    }

    return rows.map((r) => ({
      ...r,
      user_name: r.user_id ? (userNameMap.get(r.user_id) ?? null) : null,
    }));
  });
