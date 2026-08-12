-- Batch 38: B2B Phase 3 - Invoicing & Preventive Maintenance
-- ==========================================================

-- 1. Invoices table for B2B Organizations
create table if not exists public.organization_invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  reference text not null unique,
  period_month text not null, -- e.g. "2026-08"
  total_ht numeric not null default 0,
  total_ttc numeric not null default 0,
  tax_rate numeric not null default 0.18, -- 18% TVA Bénin
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'cancelled')),
  issued_at timestamptz not null default now(),
  paid_at timestamptz default null,
  pdf_url text default null,
  notes text default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Invoice line items
create table if not exists public.organization_invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.organization_invoices(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete set null,
  description text not null,
  quantity integer not null default 1,
  unit_price numeric not null default 0,
  total_price numeric not null default 0,
  created_at timestamptz not null default now()
);

-- 2. Preventive Maintenance Schedules for Equipment
create table if not exists public.equipment_maintenance_schedules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  task_title text not null,
  task_description text default null,
  interval_months integer not null default 3, -- e.g. every 3 months
  last_performed_at timestamptz default null,
  next_due_at date not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed', 'overdue')),
  performed_by text default null,
  notes text default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.organization_invoices enable row level security;
alter table public.organization_invoice_items enable row level security;
alter table public.equipment_maintenance_schedules enable row level security;

-- Policies for organization_invoices
create policy "Org members can view invoices"
  on public.organization_invoices for select
  using (public.org_is_member(org_id, auth.uid()));

create policy "Org admins can manage invoices"
  on public.organization_invoices for all
  using (public.org_is_admin(org_id, auth.uid()));

-- Policies for organization_invoice_items
create policy "Org members can view invoice items"
  on public.organization_invoice_items for select
  using (
    exists (
      select 1 from public.organization_invoices inv
      where inv.id = organization_invoice_items.invoice_id
      and public.org_is_member(inv.org_id, auth.uid())
    )
  );

-- Policies for equipment_maintenance_schedules
create policy "Org members can view maintenance schedules"
  on public.equipment_maintenance_schedules for select
  using (public.org_is_member(org_id, auth.uid()));

create policy "Org admins can manage maintenance schedules"
  on public.equipment_maintenance_schedules for all
  using (public.org_is_admin(org_id, auth.uid()));

-- Indexes
create index if not exists idx_org_invoices_org_id on public.organization_invoices(org_id);
create index if not exists idx_org_invoices_status on public.organization_invoices(status);
create index if not exists idx_maint_schedules_org_eq on public.equipment_maintenance_schedules(org_id, equipment_id);
create index if not exists idx_maint_schedules_due on public.equipment_maintenance_schedules(next_due_at);
