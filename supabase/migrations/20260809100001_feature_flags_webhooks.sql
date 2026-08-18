-- Feature flags table
create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  description text,
  updated_at timestamptz not null default now()
);

grant all on public.feature_flags to service_role;
grant select on public.feature_flags to authenticated;

alter table public.feature_flags enable row level security;

create policy "feature_flags_staff_read" on public.feature_flags
  for select to authenticated
  using (public.is_staff(auth.uid()));

create policy "feature_flags_staff_write" on public.feature_flags
  for all to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

-- Webhook configs table
create table if not exists public.webhook_configs (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  events text[] not null default '{}',
  secret text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  last_triggered_at timestamptz
);

grant all on public.webhook_configs to service_role;

alter table public.webhook_configs enable row level security;

create policy "webhook_configs_staff_read" on public.webhook_configs
  for select to authenticated
  using (public.is_staff(auth.uid()));

create policy "webhook_configs_staff_write" on public.webhook_configs
  for all to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));
