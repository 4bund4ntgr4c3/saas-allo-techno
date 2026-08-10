-- Batch 30: Intégrations tierces — iCal, webhooks sortants, Google Calendar

-- 1. Table des webhooks configurés
create table if not exists outbound_webhooks (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  url text not null,
  events text[] not null default '{}',
  secret text,
  active boolean default true,
  last_triggered_at timestamptz,
  last_status integer,
  created_at timestamptz default now() not null
);

-- 2. Table des logs de webhooks
create table if not exists webhook_logs (
  id uuid default gen_random_uuid() primary key,
  webhook_id uuid references outbound_webhooks(id) on delete cascade not null,
  event text not null,
  payload jsonb not null,
  status_code integer,
  response_body text,
  duration_ms integer,
  created_at timestamptz default now() not null
);

create index if not exists idx_webhook_logs_webhook on webhook_logs (webhook_id);
create index if not exists idx_webhook_logs_created on webhook_logs (created_at desc);

-- 3. RLS
alter table outbound_webhooks enable row level security;
alter table webhook_logs enable row level security;

create policy "Staff can manage webhooks"
  on outbound_webhooks for all
  using (true);

create policy "Staff can read webhook logs"
  on webhook_logs for select
  using (true);

create policy "Staff can insert webhook logs"
  on webhook_logs for insert
  with check (true);

-- 4. Événements disponibles :
--    reservation.created, reservation.status_changed, reservation.completed,
--    payment.received, payment.failed, lead.new, review.submitted
