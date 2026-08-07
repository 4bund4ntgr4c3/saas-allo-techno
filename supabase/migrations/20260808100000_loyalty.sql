-- Programme de fidélité & parrainage
-- ====================================================================
-- Ajoute au profil : points de fidélité, code de parrainage et parrain.
-- Les points sont crédités à la clôture d'un dossier (status 'terminee').

-- 1. Colonnes sur profiles
alter table public.profiles
  add column if not exists loyalty_points int not null default 0 check (loyalty_points >= 0),
  add column if not exists referral_code text,
  add column if not exists referred_by uuid references public.profiles(id);

-- Code de parrainage unique (créé au premier besoin via server function).
create unique index if not exists profiles_referral_code_key on public.profiles(referral_code);

-- 2. Sécurité : un utilisateur ne lit qu'entre son propre code et ses points.
drop policy if exists "profiles_loyalty_read" on public.profiles;
create policy "profiles_loyalty_read"
  on public.profiles for select
  using (auth.uid() = id);

-- Les écritures (points, parrain) passent par server functions (service_role).
revoke all on public.profiles from anon;

-- 3. Historique des crédits / débits de points
create table if not exists public.loyalty_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  delta int not null,                     -- positif = crédit, négatif = débit
  reason text not null,                   -- 'referral' | 'repair_completed'
  reference text,                         -- réf. de l'événement (dossier AT-…)
  created_at timestamptz not null default now()
);

alter table public.loyalty_ledger enable row level security;

drop policy if exists "loyalty_ledger_own_read" on public.loyalty_ledger;
create policy "loyalty_ledger_own_read"
  on public.loyalty_ledger for select
  using (auth.uid() = user_id);

revoke all on public.loyalty_ledger from anon, authenticated;
grant select on public.loyalty_ledger to authenticated;

-- 4. RPC : créditer des points (service_role uniquement)
create or replace function public.add_loyalty_points(_user_id uuid, _delta int, _reason text, _reference text)
returns void
language plpgsql
set search_path = public
as $$
begin
  update public.profiles
     set loyalty_points = greatest(0, loyalty_points + _delta),
         updated_at = now()
   where id = _user_id;

  insert into public.loyalty_ledger (user_id, delta, reason, reference)
  values (_user_id, _delta, _reason, _reference);
end;
$$;

revoke all on function public.add_loyalty_points(uuid, int, text, text) from public;
grant execute on function public.add_loyalty_points(uuid, int, text, text) to service_role;

-- 5. RPC : attribuer un code de parrainage au premier besoin
create or replace function public.ensure_referral_code(_user_id uuid, _code text)
returns text
language plpgsql
set search_path = public
as $$
declare
  existing text;
begin
  select referral_code into existing from public.profiles where id = _user_id;
  if existing is not null then
    return existing;
  end if;

  -- échoue silencieusement (retourne NULL) si le code est déjà pris
  update public.profiles
     set referral_code = _code, updated_at = now()
   where id = _user_id and (referral_code is null or referral_code = '');
  if not found then
    return null;
  end if;
  return _code;
end;
$$;

revoke all on function public.ensure_referral_code(uuid, text) from public;
grant execute on function public.ensure_referral_code(uuid, text) to service_role;
