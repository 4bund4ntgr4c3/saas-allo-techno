-- Batch 29: Marketing auto — campagnes email/SMS, segmentation RFM, templates

-- 1. Table des campagnes
create table if not exists marketing_campaigns (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null check (type in ('email', 'sms', 'whatsapp')),
  template_id text,
  subject text,
  body text not null,
  segment_filter jsonb default '{}',
  status text not null default 'draft' check (status in ('draft', 'sending', 'sent', 'failed')),
  sent_count integer default 0,
  open_count integer default 0,
  click_count integer default 0,
  error_count integer default 0,
  sent_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null
);

-- 2. Table des envois individuels (pour tracking)
create table if not exists campaign_sends (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references marketing_campaigns(id) on delete cascade not null,
  recipient_phone text,
  recipient_email text,
  recipient_name text,
  status text not null default 'pending' check (status in ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz default now() not null
);

create index if not exists idx_campaign_sends_campaign on campaign_sends (campaign_id);
create index if not exists idx_campaign_sends_status on campaign_sends (status);

-- 3. Vue RFM segments (calculée à la volée via RPC)
-- R = Recency (jours depuis dernier achat), F = Frequency (nb dossiers), M = Monetary (total dépensé)
-- Segments : vip (F≥5 & M≥200000), loyal (F≥3), active (R≤90), inactive (R>180), new (F=1)

-- 4. RPC: calcul des segments RFM pour tous les clients
create or replace function get_client_segments()
returns json
language sql
security definer
as $$
  with client_stats as (
    select
      phone,
      customer_name,
      email,
      count(*) as frequency,
      max(created_at) as last_order,
      extract(day from now() - max(created_at)) as recency_days,
      coalesce(sum(case when payment_status = 'paid' then quote_amount else 0 end), 0) as monetary
    from reservations
    where phone is not null and phone != ''
      and status not in ('annulee')
    group by phone, customer_name, email
  ),
  segmented as (
    select
      *,
      case
        when frequency >= 5 and monetary >= 200000 then 'vip'
        when frequency >= 3 then 'loyal'
        when recency_days <= 90 then 'active'
        when recency_days > 180 then 'inactive'
        else 'new'
      end as segment
    from client_stats
  )
  select json_agg(json_build_object(
    'phone', phone,
    'customer_name', customer_name,
    'email', email,
    'frequency', frequency,
    'recency_days', recency_days::int,
    'monetary', monetary,
    'segment', segment
  ) order by
    case segment
      when 'vip' then 1
      when 'loyal' then 2
      when 'active' then 3
      when 'new' then 4
      when 'inactive' then 5
    end,
    monetary desc)
  from segmented;
$$;

-- 5. RPC: compter les clients par segment
create or replace function get_segment_counts()
returns json
language sql
security definer
as $$
  with client_stats as (
    select
      phone,
      count(*) as frequency,
      max(created_at) as last_order,
      extract(day from now() - max(created_at)) as recency_days,
      coalesce(sum(case when payment_status = 'paid' then quote_amount else 0 end), 0) as monetary
    from reservations
    where phone is not null and phone != ''
      and status not in ('annulee')
    group by phone
  ),
  segmented as (
    select
      case
        when frequency >= 5 and monetary >= 200000 then 'vip'
        when frequency >= 3 then 'loyal'
        when recency_days <= 90 then 'active'
        when recency_days > 180 then 'inactive'
        else 'new'
      end as segment
    from client_stats
  )
  select json_build_object(
    'vip', count(*) filter (where segment = 'vip'),
    'loyal', count(*) filter (where segment = 'loyal'),
    'active', count(*) filter (where segment = 'active'),
    'new', count(*) filter (where segment = 'new'),
    'inactive', count(*) filter (where segment = 'inactive'),
    'total', count(*)
  )
  from segmented;
$$;

-- 6. RLS
alter table marketing_campaigns enable row level security;
alter table campaign_sends enable row level security;

create policy "Staff can manage campaigns"
  on marketing_campaigns for all
  using (true);

create policy "Staff can manage sends"
  on campaign_sends for all
  using (true);
