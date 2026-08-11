-- Phase 0 B2B : RPC organisations — cycle de vie complet
-- Tous les RPC vérifient auth.uid() (JWT de la requête) et les droits
-- d'organisation côté base, jamais uniquement côté client.

-- Créer une organisation : l'appelant devient admin_org automatiquement.
create or replace function public.create_organization(
  _name text,
  _trade_name text default null,
  _registration_number text default null,
  _address text default null,
  _country text default 'Bénin',
  _phone text default null,
  _email text default null,
  _sector text default null,
  _size text default null,
  _site_count int default null,
  _equipment_count int default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _org_id uuid;
begin
  if _uid is null then
    raise exception 'Non authentifié';
  end if;
  if _name is null or trim(_name) = '' then
    raise exception 'Le nom de l''entreprise est requis';
  end if;

  insert into public.organizations (
    name, trade_name, registration_number, address, country, phone, email,
    sector, size, site_count, equipment_count, created_by
  )
  values (
    _name, _trade_name, _registration_number, _address, coalesce(_country, 'Bénin'), _phone, _email,
    _sector, _size, _site_count, _equipment_count, _uid
  )
  returning id into _org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (_org_id, _uid, 'admin_org');

  return _org_id;
end;
$$;

-- Mettre à jour une organisation (admin de l'org ou staff).
create or replace function public.update_organization(
  _org_id uuid,
  _name text default null,
  _trade_name text default null,
  _registration_number text default null,
  _address text default null,
  _country text default null,
  _phone text default null,
  _email text default null,
  _sector text default null,
  _size text default null,
  _site_count int default null,
  _equipment_count int default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.org_is_admin(_org_id) or public.is_staff(auth.uid())) then
    raise exception 'Action non autorisée — administrateur de l''organisation requis';
  end if;
  if _name is not null and trim(_name) = '' then
    raise exception 'Le nom de l''entreprise ne peut pas être vide';
  end if;

  update public.organizations set
    name = coalesce(_name, name),
    trade_name = coalesce(_trade_name, trade_name),
    registration_number = coalesce(_registration_number, registration_number),
    address = coalesce(_address, address),
    country = coalesce(_country, country),
    phone = coalesce(_phone, phone),
    email = coalesce(_email, email),
    sector = coalesce(_sector, sector),
    size = coalesce(_size, size),
    site_count = coalesce(_site_count, site_count),
    equipment_count = coalesce(_equipment_count, equipment_count)
  where id = _org_id;

  return found;
end;
$$;

-- Liste des organisations de l'utilisateur courant (avec son rôle).
create or replace function public.get_user_orgs()
returns json
language sql
security definer
set search_path = public
as $$
  select coalesce(json_agg(json_build_object(
    'id', o.id,
    'name', o.name,
    'trade_name', o.trade_name,
    'registration_number', o.registration_number,
    'address', o.address,
    'country', o.country,
    'phone', o.phone,
    'email', o.email,
    'sector', o.sector,
    'size', o.size,
    'site_count', o.site_count,
    'equipment_count', o.equipment_count,
    'status', o.status,
    'member_role', m.role,
    'member_count', (select count(*) from public.organization_members mm where mm.organization_id = o.id),
    'created_at', o.created_at
  ) order by o.created_at desc), '[]'::json)
  from public.organizations o
  join public.organization_members m on m.organization_id = o.id
  where m.user_id = auth.uid();
$$;

-- Membres d'une organisation (admin de l'org ou staff uniquement).
create or replace function public.get_org_members(_org_id uuid)
returns json
language sql
security definer
set search_path = public
as $$
  select coalesce(json_agg(json_build_object(
    'user_id', m.user_id,
    'role', m.role,
    'email', u.email,
    'full_name', p.full_name,
    'created_at', m.created_at
  ) order by m.created_at), '[]'::json)
  from public.organization_members m
  left join auth.users u on u.id = m.user_id
  left join public.profiles p on p.id = m.user_id
  where m.organization_id = _org_id
  and (public.org_is_admin(_org_id) or public.is_staff(auth.uid()));
$$;

-- Inviter un membre existant par email (admin de l'org ou staff).
-- Si l'utilisateur est déjà membre, son rôle est mis à jour.
create or replace function public.invite_org_member(
  _org_id uuid,
  _email text,
  _role public.org_role default 'membre'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid;
begin
  if not (public.org_is_admin(_org_id) or public.is_staff(auth.uid())) then
    raise exception 'Action non autorisée — administrateur de l''organisation requis';
  end if;
  if _email is null or trim(_email) = '' then
    raise exception 'Un email est requis';
  end if;

  select id into _uid from auth.users where lower(email) = lower(trim(_email));
  if _uid is null then
    raise exception 'Aucun compte trouvé pour cet email — l''utilisateur doit d''abord créer un compte sur le site';
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (_org_id, _uid, _role)
  on conflict (organization_id, user_id) do update set role = excluded.role;

  return true;
end;
$$;

-- Changer le rôle d'un membre (admin de l'org ou staff).
create or replace function public.set_org_member_role(
  _org_id uuid,
  _user_id uuid,
  _role public.org_role
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.org_is_admin(_org_id) or public.is_staff(auth.uid())) then
    raise exception 'Action non autorisée — administrateur de l''organisation requis';
  end if;

  update public.organization_members
  set role = _role
  where organization_id = _org_id and user_id = _user_id;

  return found;
end;
$$;

-- Retirer un membre (admin de l'org ou staff). Protège le dernier admin.
create or replace function public.remove_org_member(_org_id uuid, _user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _admin_count int;
begin
  if not (public.org_is_admin(_org_id) or public.is_staff(auth.uid())) then
    raise exception 'Action non autorisée — administrateur de l''organisation requis';
  end if;

  select count(*) into _admin_count
  from public.organization_members
  where organization_id = _org_id and role = 'admin_org';

  if _admin_count <= 1 and exists (
    select 1 from public.organization_members
    where organization_id = _org_id and user_id = _user_id and role = 'admin_org'
  ) then
    raise exception 'Impossible de retirer le dernier administrateur de l''organisation';
  end if;

  delete from public.organization_members
  where organization_id = _org_id and user_id = _user_id;

  return found;
end;
$$;

-- Droits d'exécution : jamais anon/public, uniquement authenticated.
revoke execute on function public.create_organization(text, text, text, text, text, text, text, text, text, int, int) from anon, public;
revoke execute on function public.update_organization(uuid, text, text, text, text, text, text, text, text, text, int, int) from anon, public;
revoke execute on function public.get_user_orgs() from anon, public;
revoke execute on function public.get_org_members(uuid) from anon, public;
revoke execute on function public.invite_org_member(uuid, text, public.org_role) from anon, public;
revoke execute on function public.set_org_member_role(uuid, uuid, public.org_role) from anon, public;
revoke execute on function public.remove_org_member(uuid, uuid) from anon, public;
grant execute on function public.create_organization(text, text, text, text, text, text, text, text, text, int, int) to authenticated;
grant execute on function public.update_organization(uuid, text, text, text, text, text, text, text, text, text, int, int) to authenticated;
grant execute on function public.get_user_orgs() to authenticated;
grant execute on function public.get_org_members(uuid) to authenticated;
grant execute on function public.invite_org_member(uuid, text, public.org_role) to authenticated;
grant execute on function public.set_org_member_role(uuid, uuid, public.org_role) to authenticated;
grant execute on function public.remove_org_member(uuid, uuid) to authenticated;
