-- Phase 0 B2B : organisations (multi-tenant) — tables + RLS
-- Chaque entreprise cliente = une organisation ; les membres sont liés par
-- organization_members avec un rôle spécifique (org_role).
-- L'existant (dossiers, ateliers...) reste utilisable avec org_id NULL
-- (activité Allô Techno propre) ; les organisations clientes ajouteront
-- progressivement des lignes org_id non nul.

-- 1. Enums
create type public.org_role as enum (
  'admin_org',
  'responsable_maintenance',
  'responsable_site',
  'comptabilite',
  'lecture_seule',
  'membre'
);

create type public.org_status as enum ('pending', 'active', 'suspended');

-- 2. Table organisations
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trade_name text,
  registration_number text,
  address text,
  country text not null default 'Bénin',
  phone text,
  email text,
  sector text,
  size text,
  site_count int,
  equipment_count int,
  status public.org_status not null default 'pending',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.org_role not null default 'membre',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index if not exists idx_organizations_created_by on public.organizations (created_by);
create index if not exists idx_org_members_organization on public.organization_members (organization_id);
create index if not exists idx_org_members_user on public.organization_members (user_id);

-- 3. Helpers RLS (définis ici pour être utilisables par les policies)
create or replace function public.org_role_of(_org_id uuid)
returns public.org_role
language sql
security definer
set search_path = public
as $$
  select role
  from public.organization_members
  where organization_id = _org_id and user_id = auth.uid();
$$;

create or replace function public.org_is_admin(_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = _org_id and user_id = auth.uid() and role = 'admin_org'
  );
$$;

create or replace function public.org_is_member(_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = _org_id and user_id = auth.uid()
  );
$$;

revoke execute on function public.org_role_of(uuid) from anon, public;
revoke execute on function public.org_is_admin(uuid) from anon, public;
revoke execute on function public.org_is_member(uuid) from anon, public;
grant execute on function public.org_role_of(uuid) to authenticated;
grant execute on function public.org_is_admin(uuid) to authenticated;
grant execute on function public.org_is_member(uuid) to authenticated;

-- 4. RLS
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

-- organizations : lecture si membre ou staff interne ; création par tout
-- utilisateur authentifié ; modification par l'admin de l'org ou staff ;
-- suppression réservée au staff.
create policy "organizations_select_member_or_staff"
on public.organizations for select to authenticated
using (public.org_is_member(id) or public.is_staff(auth.uid()));

create policy "organizations_insert_authenticated"
on public.organizations for insert to authenticated
with check (created_by = auth.uid());

create policy "organizations_update_admin_or_staff"
on public.organizations for update to authenticated
using (public.org_is_admin(id) or public.is_staff(auth.uid()))
with check (public.org_is_admin(id) or public.is_staff(auth.uid()));

create policy "organizations_delete_staff"
on public.organizations for delete to authenticated
using (public.is_staff(auth.uid()));

-- organization_members : lecture si membre de l'org ou staff ;
-- gestion (insert/update/delete) par l'admin de l'org ou staff.
create policy "org_members_select_member_or_staff"
on public.organization_members for select to authenticated
using (public.org_is_member(organization_id) or public.is_staff(auth.uid()));

create policy "org_members_admin_all"
on public.organization_members for all to authenticated
using (public.org_is_admin(organization_id) or public.is_staff(auth.uid()))
with check (public.org_is_admin(organization_id) or public.is_staff(auth.uid()));

-- 5. Triggers updated_at
create or replace function public.set_org_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_org_updated_at();
