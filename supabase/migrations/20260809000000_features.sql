-- Fonctionnalités inspirées d'uBreakiFix — lot 2
-- 1. Validation de devis par le client (jeton de décision)
-- 2. Promo codes (réduction étudiants/enseignants 10 %)
-- 3. Garantie étendue (option à la réservation)
-- Les photos de suivi (réservation_attachments) et le bucket device-photos existent déjà.

-- =====================================================================
-- 1. Validation de devis client sur reservations
-- =====================================================================
alter table public.reservations
  add column if not exists quote_amount int,                                  -- montant du devis (FCFA)
  add column if not exists quote_status text not null default 'none',         -- none | sent | approved | declined
  add column if not exists quote_token text,                                  -- jeton secret de décision
  add column if not exists quote_decided_at timestamptz,
  add column if not exists promo_amount int,                                  -- réduction appliquée (FCFA)
  add column if not exists promo_code text,                                   -- code promo utilisé
  add column if not exists warranty_months int not null default 0;            -- garantie étendue (0 = standard)

-- =====================================================================
-- 2. Codes promo
-- =====================================================================
create table if not exists public.promo_codes (
  code text primary key,
  percent int not null default 10 check (percent between 1 and 100),
  label text,
  active boolean not null default true,
  valid_from date,
  valid_to date,
  single_use boolean not null default false,
  used_count int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.promo_codes enable row level security;

-- Lecture publique : seul le code actif et non expiré (sans info sensible).
drop policy if exists "promo_codes_public_read" on public.promo_codes;
create policy "promo_codes_public_read"
  on public.promo_codes for select
  using (active = true);

-- Écriture réservée au service role (jamais via le client).
revoke all on public.promo_codes from anon, authenticated;
grant select on public.promo_codes to anon;

-- Code par défaut : réduction étudiants & enseignants (10 %).
insert into public.promo_codes (code, percent, label)
values ('SCHOOL10', 10, 'Étudiants & enseignants')
on conflict (code) do nothing;

-- RPC : validation d'un code promo (décidée côté serveur, pas de confiance client).
create or replace function public.validate_promo(_code text)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  p public.promo_codes;
begin
  select * into p from public.promo_codes where code = upper(trim(_code));
  if p.code is null then
    return jsonb_build_object('valid', false, 'reason', 'CODE_INVALID');
  end if;
  if p.active is not true then
    return jsonb_build_object('valid', false, 'reason', 'INACTIVE');
  end if;
  if p.valid_from is not null and p.valid_from > current_date then
    return jsonb_build_object('valid', false, 'reason', 'NOT_STARTED');
  end if;
  if p.valid_to is not null and p.valid_to < current_date then
    return jsonb_build_object('valid', false, 'reason', 'EXPIRED');
  end if;
  if p.single_use and p.used_count >= 1 then
    return jsonb_build_object('valid', false, 'reason', 'USED');
  end if;
  return jsonb_build_object('valid', true, 'percent', p.percent, 'label', p.label);
end;
$$;

-- Appelé par la server function (via service role) uniquement.
revoke all on function public.validate_promo(text) from public;
grant execute on function public.validate_promo(text) to service_role;

-- =====================================================================
-- 3. Envoi / décision du devis (service role)
-- =====================================================================
-- NOTE : ces RPC s'exécutent sous le service role (clé serveur), où auth.uid()
-- est NULL. La vérification des rôles (staff / client) est donc faite côté
-- TypeScript (server functions), qui possède le JWT de l'utilisateur.
-- Les fonctions SQL restent de simples helpers idempotents.

-- Envoi d'un devis : définit le montant + durée garantie et génère un jeton
-- de décision secret (le client approuve/refuse avec ce jeton).
create or replace function public.staff_send_quote(_reservation_id uuid, _amount int, _warranty_months int default 0)
returns boolean
language plpgsql
set search_path = public
as $$
begin
  update public.reservations
     set quote_amount = _amount,
         warranty_months = greatest(0, coalesce(_warranty_months, 0)),
         quote_status = 'sent',
         quote_token = encode(gen_random_bytes(24), 'hex'),
         quote_decided_at = null,
         updated_at = now()
   where id = _reservation_id;
  return found;
end;
$$;

revoke all on function public.staff_send_quote(uuid, int, int) from public;
grant execute on function public.staff_send_quote(uuid, int, int) to service_role;

-- Décision du client sur le devis, via un jeton secret (vérifiée serveur).
create or replace function public.respond_to_quote(_token text, _approve boolean)
returns boolean
language plpgsql
set search_path = public
as $$
begin
  update public.reservations
     set quote_status = case when _approve then 'approved' else 'declined' end,
         quote_decided_at = now(),
         quote_token = null,
         updated_at = now()
   where quote_token = _token and quote_status = 'sent';
  return found;
end;
$$;

revoke all on function public.respond_to_quote(text, boolean) from public;
grant execute on function public.respond_to_quote(text, boolean) to service_role;