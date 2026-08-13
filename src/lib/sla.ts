import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireStaff } from "@/lib/rbac";

export interface SLAConfig {
  id: string;
  status_from: string;
  status_to: string;
  target_hours: number;
  alert_hours: number;
  active: boolean;
}

export interface SLABreach {
  reservation_id: string;
  reference: string;
  customer_name: string;
  device: string;
  status: string;
  entered_at: string;
  elapsed_hours: number;
  target_hours: number;
  breach_severity: "warning" | "critical";
}

const DEFAULT_SLA: SLAConfig[] = [
  {
    id: "1",
    status_from: "en_attente",
    status_to: "confirmee",
    target_hours: 2,
    alert_hours: 1,
    active: true,
  },
  {
    id: "2",
    status_from: "confirmee",
    status_to: "en_cours",
    target_hours: 24,
    alert_hours: 18,
    active: true,
  },
  {
    id: "3",
    status_from: "en_cours",
    status_to: "pret",
    target_hours: 48,
    alert_hours: 36,
    active: true,
  },
  {
    id: "4",
    status_from: "pret",
    status_to: "livre",
    target_hours: 8,
    alert_hours: 4,
    active: true,
  },
];

export const getSLAConfig = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await supabaseAdmin
    .from("sla_configs" as never)
    .select("*")
    .eq("active", true);
  return (data?.length ? data : DEFAULT_SLA) as unknown as SLAConfig[];
});

export const getSLABreaches = createServerFn({ method: "GET" }).handler(async () => {
  await requireStaff(supabaseAdmin);
  const { data: configs } = await supabaseAdmin
    .from("sla_configs" as never)
    .select("*")
    .eq("active", true);
  const slaList = (configs?.length ? configs : DEFAULT_SLA) as unknown as SLAConfig[];

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

  const breaches: SLABreach[] = [];
  const now = Date.now();

  for (const r of rows) {
    const sla = slaList.find((s) => s.status_from === r.status);
    if (!sla) continue;
    const elapsed = (now - new Date(r.created_at).getTime()) / (1000 * 60 * 60);
    if (elapsed > sla.alert_hours) {
      breaches.push({
        reservation_id: r.id,
        reference: r.reference,
        customer_name: r.customer_name,
        device: r.device,
        status: r.status,
        entered_at: r.created_at,
        elapsed_hours: Math.round(elapsed * 10) / 10,
        target_hours: sla.target_hours,
        breach_severity: elapsed > sla.target_hours ? "critical" : "warning",
      });
    }
  }

  breaches.sort((a, b) => b.elapsed_hours - a.elapsed_hours);
  return breaches;
});

export const getSLAStats = createServerFn({ method: "GET" }).handler(async () => {
  await requireStaff(supabaseAdmin);
  const { data: history } = await supabaseAdmin
    .from("reservation_status_history" as never)
    .select("reservation_id, status, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  const rows = (history ?? []) as { reservation_id: string; status: string; created_at: string }[];

  const byReservation = new Map<string, { status: string; created_at: string }[]>();
  for (const r of rows) {
    const list = byReservation.get(r.reservation_id) ?? [];
    list.push(r);
    byReservation.set(r.reservation_id, list);
  }

  const stageTimes: Record<string, number[]> = {};
  for (const events of byReservation.values()) {
    events.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    for (let i = 1; i < events.length; i++) {
      const prev = events[i - 1]!;
      const curr = events[i]!;
      const hours =
        (new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime()) /
        (1000 * 60 * 60);
      const key = `${prev.status}→${curr.status}`;
      if (!stageTimes[key]) stageTimes[key] = [];
      stageTimes[key]!.push(hours);
    }
  }

  return Object.entries(stageTimes).map(([stage, times]) => ({
    stage,
    avg_hours: Math.round((times.reduce((s, t) => s + t, 0) / times.length) * 10) / 10,
    p90_hours:
      Math.round((times.sort((a, b) => a - b)[Math.floor(times.length * 0.9)] ?? 0) * 10) / 10,
    count: times.length,
  }));
});
