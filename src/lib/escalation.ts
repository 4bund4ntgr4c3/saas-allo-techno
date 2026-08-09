import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface EscalationRule {
  id: string;
  sla_stage: string;
  escalate_after_hours: number;
  notify_roles: string[];
  auto_reassign: boolean;
  active: boolean;
}

export interface EscalationEvent {
  id: string;
  reservation_id: string;
  reference: string;
  customer_name: string;
  device: string;
  from_status: string;
  triggered_at: string;
  notified_roles: string[];
  reassigned_to: string | null;
}

const DEFAULT_RULES: EscalationRule[] = [
  {
    id: "1",
    sla_stage: "en_attente",
    escalate_after_hours: 4,
    notify_roles: ["admin", "staff"],
    auto_reassign: false,
    active: true,
  },
  {
    id: "2",
    sla_stage: "confirmee",
    escalate_after_hours: 36,
    notify_roles: ["admin"],
    auto_reassign: true,
    active: true,
  },
  {
    id: "3",
    sla_stage: "en_cours",
    escalate_after_hours: 72,
    notify_roles: ["admin", "staff"],
    auto_reassign: true,
    active: true,
  },
];

export const getEscalationRules = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await supabaseAdmin.from("escalation_rules" as never).select("*");
  return (data?.length ? data : DEFAULT_RULES) as unknown as EscalationRule[];
});

export const checkEscalations = createServerFn({ method: "GET" }).handler(async () => {
  const { data: rules } = await supabaseAdmin
    .from("escalation_rules" as never)
    .select("*")
    .eq("active", true);
  const rulesList = (rules?.length ? rules : DEFAULT_RULES) as unknown as EscalationRule[];

  const { data: reservations } = await supabaseAdmin
    .from("reservations")
    .select("id, reference, customer_name, device, status, created_at")
    .not("status", "in", "(terminee,annulee,livre)")
    .order("created_at", { ascending: true })
    .limit(200);

  const rows = (reservations ?? []) as {
    id: string;
    reference: string;
    customer_name: string;
    device: string;
    status: string;
    created_at: string;
  }[];

  const escalations: EscalationEvent[] = [];
  const now = Date.now();

  for (const r of rows) {
    const rule = rulesList.find((rl) => rl.sla_stage === r.status);
    if (!rule) continue;
    const elapsed = (now - new Date(r.created_at).getTime()) / (1000 * 60 * 60);
    if (elapsed > rule.escalate_after_hours) {
      escalations.push({
        id: `esc-${r.id}`,
        reservation_id: r.id,
        reference: r.reference,
        customer_name: r.customer_name,
        device: r.device,
        from_status: r.status,
        triggered_at: new Date().toISOString(),
        notified_roles: rule.notify_roles,
        reassigned_to: rule.auto_reassign ? "auto" : null,
      });
    }
  }

  return escalations;
});

export const getEscalationHistory = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("escalation_events" as never)
    .select("*")
    .order("triggered_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as EscalationEvent[];
});
