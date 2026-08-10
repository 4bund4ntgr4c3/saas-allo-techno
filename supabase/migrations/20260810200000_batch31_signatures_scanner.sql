-- Batch 31: Signatures de remise + scan QR/barcode

-- 1. Table des signatures
create table if not exists handoff_signatures (
  id uuid default gen_random_uuid() primary key,
  reservation_id uuid references reservations(id) on delete cascade not null,
  customer_name text not null,
  signature_data_url text not null,
  signed_at timestamptz default now() not null,
  ip_address text,
  unique(reservation_id)
);

create index if not exists idx_handoff_sig_reservation on handoff_signatures (reservation_id);

-- 2. RLS
alter table handoff_signatures enable row level security;

create policy "Staff can manage signatures"
  on handoff_signatures for all
  using (true);

create policy "Clients can read their reservation signature"
  on handoff_signatures for select
  using (true);

-- 3. RPC pour vérifier si un dossier a une signature
create or replace function has_handoff_signature(_reservation_id uuid)
returns boolean
language sql stable
as $$
  select exists (
    select 1 from handoff_signatures where reservation_id = _reservation_id
  );
$$;
