import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AuditAction =
  | "reservation.status_changed"
  | "reservation.cancelled"
  | "reservation.assigned"
  | "quote.sent"
  | "quote.approved"
  | "quote.declined"
  | "payment.confirmed"
  | "payment.refunded"
  | "review.published"
  | "review.hidden"
  | "lead.status_changed"
  | "claim.status_changed"
  | "user.role_changed"
  | "stock.updated"
  | "blog.post_created"
  | "blog.post_updated";

interface AuditEntry {
  user_id: string;
  action: AuditAction;
  entity: string;
  entity_id?: string | null;
  details?: Record<string, unknown>;
  ip_address?: string;
}

export async function logAudit(
  supabaseAdmin: SupabaseClient<Database>,
  entry: AuditEntry,
): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin as any).from("audit_log").insert({
      user_id: entry.user_id,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entity_id ?? null,
      details: entry.details ?? null,
      ip_address: entry.ip_address ?? null,
    });
  } catch (err) {
    console.error("[audit] failed to log", err);
  }
}
