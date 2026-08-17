import { createServerFn } from "@tanstack/react-start";
import { orgClient } from "./org-client";
import { rateLimit } from "@/lib/security";

export interface OrgInvoice {
  id: string;
  org_id: string;
  reference: string;
  period_month: string;
  total_ht: number;
  total_ttc: number;
  tax_rate: number;
  status: "draft" | "sent" | "paid" | "cancelled";
  issued_at: string;
  paid_at: string | null;
  pdf_url: string | null;
  notes: string | null;
  created_at: string;
}

export const getOrgInvoices = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { org_id } = data as { org_id: string };
    if (!org_id) throw new Error("org_id requis");
    return { org_id };
  })
  .handler(async ({ data }): Promise<OrgInvoice[]> => {
    if (!(await rateLimit("g-et-or-gi-nv-oi-ce-s", 60))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const client = await orgClient();
    const { data: invoices, error } = await client
      .from("organization_invoices" as never)
      .select("*")
      .eq("org_id", data.org_id)
      .order("issued_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (invoices ?? []) as unknown as OrgInvoice[];
  });

export const createOrgInvoice = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as {
      org_id: string;
      period_month: string;
      notes?: string;
    };
    if (!d.org_id || !d.period_month) throw new Error("org_id et period_month requis");
    return d;
  })
  .handler(async ({ data }) => {
    if (!(await rateLimit("c-re-at-eo-rg-in-vo-ic-e", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const client = await orgClient();
    const { data: reservations } = await client
      .from("reservations")
      .select("id, reference, device, quote_amount")
      .eq("org_id", data.org_id)
      .eq("status", "terminee");

    const items = (reservations ?? []).map((r) => ({
      reservation_id: r.id,
      description: `Intervention ${r.device} (${r.reference})`,
      quantity: 1,
      unit_price: r.quote_amount ?? 15000,
      total_price: r.quote_amount ?? 15000,
    }));

    const total_ht = items.reduce((sum, item) => sum + item.total_price, 0) || 50000;
    const tax_rate = 0.18;
    const total_ttc = Math.round(total_ht * (1 + tax_rate));
    const ref = `FACT-${data.period_month}-${Date.now().toString().slice(-4)}`;

    const { data: invoice, error } = await client
      .from("organization_invoices" as never)
      .insert({
        org_id: data.org_id,
        reference: ref,
        period_month: data.period_month,
        total_ht,
        total_ttc,
        tax_rate,
        status: "sent",
        notes: data.notes ?? null,
      } as never)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return invoice as unknown as OrgInvoice;
  });

export interface EquipmentMaintenanceSchedule {
  id: string;
  org_id: string;
  equipment_id: string;
  task_title: string;
  task_description: string | null;
  interval_months: number;
  last_performed_at: string | null;
  next_due_at: string;
  status: "scheduled" | "in_progress" | "completed" | "overdue";
  performed_by: string | null;
  notes: string | null;
  equipment?: {
    name: string;
    brand: string | null;
    model: string | null;
    asset_tag: string | null;
    serial_number: string | null;
  };
}

export const getOrgMaintenanceSchedules = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { org_id } = data as { org_id: string };
    if (!org_id) throw new Error("org_id requis");
    return { org_id };
  })
  .handler(async ({ data }): Promise<EquipmentMaintenanceSchedule[]> => {
    if (!(await rateLimit("g-et-or-gm-ai-nt-en-an-ce-sc-he-du-le-s", 60))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const client = await orgClient();
    const { data: schedules, error } = await client
      .from("equipment_maintenance_schedules" as never)
      .select("*, equipment:equipment_id(name, brand, model, asset_tag, serial_number)")
      .eq("org_id", data.org_id)
      .order("next_due_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (schedules ?? []) as unknown as EquipmentMaintenanceSchedule[];
  });

export const scheduleMaintenance = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as {
      org_id: string;
      equipment_id: string;
      task_title: string;
      task_description?: string;
      interval_months: number;
      next_due_at: string;
    };
    if (!d.org_id || !d.equipment_id || !d.task_title || !d.next_due_at) {
      throw new Error("Paramètres de maintenance incomplets");
    }
    return d;
  })
  .handler(async ({ data }) => {
    if (!(await rateLimit("s-ch-ed-ul-em-ai-nt-en-an-ce", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const client = await orgClient();
    const { data: schedule, error } = await client
      .from("equipment_maintenance_schedules" as never)
      .insert({
        org_id: data.org_id,
        equipment_id: data.equipment_id,
        task_title: data.task_title,
        task_description: data.task_description ?? null,
        interval_months: data.interval_months,
        next_due_at: data.next_due_at,
        status: "scheduled",
      } as never)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return schedule as unknown as EquipmentMaintenanceSchedule;
  });

export const completeMaintenanceTask = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as {
      schedule_id: string;
      org_id: string;
      notes?: string;
    };
    if (!d.schedule_id || !d.org_id) throw new Error("schedule_id requis");
    return d;
  })
  .handler(async ({ data }) => {
    if (!(await rateLimit("c-om-pl-et-em-ai-nt-en-an-ce-ta-sk", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const now = new Date();
    const nextDate = new Date(now);
    nextDate.setMonth(nextDate.getMonth() + 3);
    const nextDue = nextDate.toISOString().slice(0, 10);

    const client = await orgClient();
    const { error } = await client
      .from("equipment_maintenance_schedules" as never)
      .update({
        status: "scheduled",
        last_performed_at: now.toISOString(),
        next_due_at: nextDue,
        notes: data.notes ?? null,
        updated_at: now.toISOString(),
      } as never)
      .eq("id", data.schedule_id);

    if (error) throw new Error(error.message);
    return { ok: true, nextDue };
  });
