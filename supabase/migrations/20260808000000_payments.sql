-- Paiements en ligne (Flutterwave) pour les commandes boutique
-- ====================================================================
-- Stocke l'initiation et le statut des paiements mobiles money (MTN MoMo,
-- Moov Money, Celtiis) initiés depuis le panier. Le webhook Flutterwave
-- (route /api/flutterwave-webhook) met à jour le statut côté serveur.

-- 1. Statut de paiement
do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');
  end if;
end
$$;

-- 2. Table des paiements
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  reference text not null,                 -- réf. commande AC-YYYY-NNNN
  source text not null default 'boutique',
  amount int not null check (amount > 0),  -- montant en FCFA (XOF)
  currency text not null default 'XOF',
  method text not null default 'MTN MoMo',
  status public.payment_status not null default 'pending',
  tx_ref text unique,                      -- tx_ref Flutterwave (AT-<reference>)
  tx_id text,                              -- identifiant de transaction Flutterwave
  webhook_payload jsonb,                   -- payload brut du webhook
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments enable row level security;

-- Lecture réservée au staff et au service_role (écritures via server functions).
drop policy if exists "payments_staff_read" on public.payments;
create policy "payments_staff_read"
  on public.payments for select
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role in ('admin', 'staff')
    )
  );

revoke all on public.payments from anon, authenticated;
grant select on public.payments to authenticated;

-- 3. Trigger updated_at
create or replace function public.set_payment_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at
  before update on public.payments
  for each row execute function public.set_payment_updated_at();

-- 4. Mise à jour du statut depuis le webhook (service_role uniquement)
create or replace function public.update_payment_status(_reference text, _status text, _tx_id text)
returns void
language plpgsql
set search_path = public
as $$
begin
  update public.payments
     set status = _status::public.payment_status,
         tx_id = coalesce(_tx_id, tx_id)
   where reference = _reference
     and id = (
       select id from public.payments
       where reference = _reference
       order by created_at desc
       limit 1
     );
end;
$$;

revoke all on function public.update_payment_status(text, text, text) from public;
grant execute on function public.update_payment_status(text, text, text) to service_role;
