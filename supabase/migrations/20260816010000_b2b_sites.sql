-- Phase 1 B2B : sites (extension de workshops)
-- Les organisations clientes rattachent leurs sites à leur compte ; les
-- ateliers historiques (org_id NULL) restent publics comme avant.
-- La colonne site_id de public.equipment référence déjà public.workshops(id).

alter table public.workshops add column if not exists org_id uuid
  references public.organizations(id) on delete cascade;

alter table public.workshops add column if not exists manager text;
alter table public.workshops add column if not exists opening_hours jsonb;
alter table public.workshops add column if not exists departments text[] not null default '{}';

create index if not exists workshops_org_idx on public.workshops (org_id);

-- RLS : les ateliers historiques (org_id NULL) restent publics ;
-- les sites d'organisation sont isolés (membres en lecture, admin en écriture)
alter table public.workshops enable row level security;

create policy "workshops_public_or_org_read" on public.workshops
  for select to authenticated, anon
  using (org_id is null or public.org_is_member(org_id) or public.is_staff(auth.uid()));

create policy "workshops_org_or_staff_write" on public.workshops
  for all to authenticated
  using (org_id is null or public.org_is_admin(org_id) or public.is_staff(auth.uid()))
  with check (org_id is null or public.org_is_admin(org_id) or public.is_staff(auth.uid()));

-- RPC — gestion des sites d'une organisation
create or replace function public.get_org_sites(_org_id uuid)
returns table (
  id uuid,
  name text,
  address text,
  city text,
  phone text,
  manager text,
  departments text[],
  active boolean,
  equipment_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.org_is_member(_org_id) or public.is_staff(auth.uid())) then
    raise exception 'Action non autorisée — membre de l''organisation requis';
  end if;

  return query
    select w.id, w.name, w.address, w.city, w.phone, w.manager, w.departments, w.active,
      (select count(*) from public.equipment e where e.site_id = w.id)
    from public.workshops w
    where w.org_id = _org_id
    order by w.name;
end;
$$;

create or replace function public.create_org_site(
  _org_id uuid,
  _name text,
  _address text default null,
  _city text default null,
  _phone text default null,
  _email text default null,
  _manager text default null,
  _opening_hours jsonb default null,
  _departments text[] default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _site_id uuid;
begin
  if not (public.org_is_admin(_org_id) or public.is_staff(auth.uid())) then
    raise exception 'Action non autorisée — administrateur de l''organisation requis';
  end if;
  if _name is null or trim(_name) = '' then
    raise exception 'Le nom du site est requis';
  end if;

  insert into public.workshops (
    org_id, name, address, city, phone, email, manager, opening_hours, departments, active
  )
  values (
    _org_id, _name, _address, coalesce(_city, 'Cotonou'), _phone, _email,
    _manager, _opening_hours, coalesce(_departments, '{}'), true
  )
  returning id into _site_id;

  return _site_id;
end;
$$;

create or replace function public.update_org_site(
  _site_id uuid,
  _name text default null,
  _address text default null,
  _city text default null,
  _phone text default null,
  _email text default null,
  _manager text default null,
  _opening_hours jsonb default null,
  _departments text[] default null,
  _active boolean default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _org_id uuid;
begin
  select org_id into _org_id from public.workshops where id = _site_id;
  if _org_id is null then
    raise exception 'Site introuvable';
  end if;
  if not (public.org_is_admin(_org_id) or public.is_staff(auth.uid())) then
    raise exception 'Action non autorisée — administrateur de l''organisation requis';
  end if;

  update public.workshops set
    name = coalesce(_name, name),
    address = coalesce(_address, address),
    city = coalesce(_city, city),
    phone = coalesce(_phone, phone),
    email = coalesce(_email, email),
    manager = coalesce(_manager, manager),
    opening_hours = coalesce(_opening_hours, opening_hours),
    departments = coalesce(_departments, departments),
    active = coalesce(_active, active)
  where id = _site_id;

  return true;
end;
$$;

create or replace function public.delete_org_site(_site_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _org_id uuid;
begin
  select org_id into _org_id from public.workshops where id = _site_id;
  if _org_id is null then
    raise exception 'Site introuvable';
  end if;
  if not (public.org_is_admin(_org_id) or public.is_staff(auth.uid())) then
    raise exception 'Action non autorisée — administrateur de l''organisation requis';
  end if;

  update public.equipment set site_id = null where site_id = _site_id;
  delete from public.workshops where id = _site_id;
  return true;
end;
$$;

revoke all on function public.get_org_sites(uuid) from public;
grant execute on function public.get_org_sites(uuid) to authenticated;
revoke all on function public.create_org_site(uuid, text, text, text, text, text, text, jsonb, text[]) from public;
grant execute on function public.create_org_site(uuid, text, text, text, text, text, text, jsonb, text[]) to authenticated;
revoke all on function public.update_org_site(uuid, text, text, text, text, text, text, jsonb, text[], boolean) from public;
grant execute on function public.update_org_site(uuid, text, text, text, text, text, text, jsonb, text[], boolean) to authenticated;
revoke all on function public.delete_org_site(uuid) from public;
grant execute on function public.delete_org_site(uuid) to authenticated;
