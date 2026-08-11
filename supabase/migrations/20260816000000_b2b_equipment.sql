-- Phase 1 B2B : parc matériel (équipements)
-- Tables equipment / equipment_history / equipment_documents / warranties,
-- RLS d'isolation par organisation (org_is_member / org_is_admin) et RPC CRUD.
-- L'activité existante (org_id NULL sur les autres tables) coexiste avec les
-- organisations clientes.

-- Statut d'un équipement (valeurs sans accents, convention du projet)
create type public.equipment_status as enum (
  'actif', 'en_panne', 'maintenance', 'garantie', 'retire'
);

create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid null references public.workshops(id) on delete set null,
  asset_tag text null,
  name text not null,
  type text not null default 'autre',
  brand text null,
  model text null,
  serial_number text null,
  status public.equipment_status not null default 'actif',
  purchase_date date null,
  warranty_expires_at timestamptz null,
  assigned_to text null,
  location text null,
  notes text null,
  qr_id text not null unique default ('EQ-' || upper(substr(md5(gen_random_uuid()::text), 1, 10))),
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un asset_tag est unique au sein d'une organisation
create unique index if not exists equipment_org_asset_tag_idx
  on public.equipment (org_id, asset_tag) where asset_tag is not null;

create index if not exists equipment_org_idx on public.equipment (org_id);
create index if not exists equipment_org_status_idx on public.equipment (org_id, status);

-- Historique d'un équipement (statuts, interventions, notes…)
create table if not exists public.equipment_history (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  event text not null,
  description text null,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists equipment_history_equipment_idx
  on public.equipment_history (equipment_id, created_at desc);

-- Documents d'un équipement (factures, garanties, manuels…)
create table if not exists public.equipment_documents (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  name text not null,
  url text not null,
  mime text null,
  size bigint null,
  created_at timestamptz not null default now()
);

create index if not exists equipment_documents_equipment_idx
  on public.equipment_documents (equipment_id);

-- Garanties (fournisseur / vendeur)
create table if not exists public.warranties (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  provider text null,
  start_date date null,
  end_date date null,
  coverage text null,
  created_at timestamptz not null default now()
);

create index if not exists warranties_equipment_idx on public.warranties (equipment_id);

-- RLS — isolation par organisation
alter table public.equipment enable row level security;
alter table public.equipment_history enable row level security;
alter table public.equipment_documents enable row level security;
alter table public.warranties enable row level security;

create policy "equipment_org_read" on public.equipment
  for select to authenticated
  using (public.org_is_member(org_id) or public.is_staff(auth.uid()));

create policy "equipment_org_write" on public.equipment
  for all to authenticated
  using (public.org_is_admin(org_id) or public.is_staff(auth.uid()))
  with check (public.org_is_admin(org_id) or public.is_staff(auth.uid()));

create policy "equipment_history_org_read" on public.equipment_history
  for select to authenticated
  using (
    exists (
      select 1 from public.equipment e
      where e.id = equipment_id
        and (public.org_is_member(e.org_id) or public.is_staff(auth.uid()))
    )
  );

create policy "equipment_history_org_write" on public.equipment_history
  for all to authenticated
  using (
    exists (
      select 1 from public.equipment e
      where e.id = equipment_id
        and (public.org_is_admin(e.org_id) or public.is_staff(auth.uid()))
    )
  )
  with check (
    exists (
      select 1 from public.equipment e
      where e.id = equipment_id
        and (public.org_is_admin(e.org_id) or public.is_staff(auth.uid()))
    )
  );

create policy "equipment_documents_org_read" on public.equipment_documents
  for select to authenticated
  using (
    exists (
      select 1 from public.equipment e
      where e.id = equipment_id
        and (public.org_is_member(e.org_id) or public.is_staff(auth.uid()))
    )
  );

create policy "equipment_documents_org_write" on public.equipment_documents
  for all to authenticated
  using (
    exists (
      select 1 from public.equipment e
      where e.id = equipment_id
        and (public.org_is_admin(e.org_id) or public.is_staff(auth.uid()))
    )
  )
  with check (
    exists (
      select 1 from public.equipment e
      where e.id = equipment_id
        and (public.org_is_admin(e.org_id) or public.is_staff(auth.uid()))
    )
  );

create policy "warranties_org_read" on public.warranties
  for select to authenticated
  using (
    exists (
      select 1 from public.equipment e
      where e.id = equipment_id
        and (public.org_is_member(e.org_id) or public.is_staff(auth.uid()))
    )
  );

create policy "warranties_org_write" on public.warranties
  for all to authenticated
  using (
    exists (
      select 1 from public.equipment e
      where e.id = equipment_id
        and (public.org_is_admin(e.org_id) or public.is_staff(auth.uid()))
    )
  )
  with check (
    exists (
      select 1 from public.equipment e
      where e.id = equipment_id
        and (public.org_is_admin(e.org_id) or public.is_staff(auth.uid()))
    )
  );

grant select on public.equipment, public.equipment_history, public.equipment_documents, public.warranties to authenticated;
grant all on public.equipment, public.equipment_history, public.equipment_documents, public.warranties to service_role;

-- RPC — cycle de vie du parc (sécurité vérifiée côté base)
-- Créer un équipement (admin de l'org ou staff)
create or replace function public.create_equipment(
  _org_id uuid,
  _name text,
  _type text default 'autre',
  _brand text default null,
  _model text default null,
  _serial_number text default null,
  _asset_tag text default null,
  _site_id uuid default null,
  _purchase_date date default null,
  _warranty_expires_at timestamptz default null,
  _assigned_to text default null,
  _location text default null,
  _notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _equipment_id uuid;
begin
  if not (public.org_is_admin(_org_id) or public.is_staff(_uid)) then
    raise exception 'Action non autorisée — administrateur de l''organisation requis';
  end if;
  if _name is null or trim(_name) = '' then
    raise exception 'Le nom de l''équipement est requis';
  end if;

  insert into public.equipment (
    org_id, site_id, asset_tag, name, type, brand, model, serial_number,
    purchase_date, warranty_expires_at, assigned_to, location, notes, created_by
  )
  values (
    _org_id, _site_id, _asset_tag, _name, _type, _brand, _model, _serial_number,
    _purchase_date, _warranty_expires_at, _assigned_to, _location, _notes, _uid
  )
  returning id into _equipment_id;

  insert into public.equipment_history (equipment_id, event, description, created_by)
  values (_equipment_id, 'created', 'Équipement ajouté au parc', _uid);

  return _equipment_id;
end;
$$;

-- Mettre à jour un équipement
create or replace function public.update_equipment(
  _equipment_id uuid,
  _name text default null,
  _type text default null,
  _brand text default null,
  _model text default null,
  _serial_number text default null,
  _asset_tag text default null,
  _site_id uuid default null,
  _purchase_date date default null,
  _warranty_expires_at timestamptz default null,
  _assigned_to text default null,
  _location text default null,
  _notes text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _org_id uuid;
begin
  select org_id into _org_id from public.equipment where id = _equipment_id;
  if _org_id is null then
    raise exception 'Équipement introuvable';
  end if;
  if not (public.org_is_admin(_org_id) or public.is_staff(auth.uid())) then
    raise exception 'Action non autorisée — administrateur de l''organisation requis';
  end if;

  update public.equipment set
    name = coalesce(_name, name),
    type = coalesce(_type, type),
    brand = coalesce(_brand, brand),
    model = coalesce(_model, model),
    serial_number = coalesce(_serial_number, serial_number),
    asset_tag = coalesce(_asset_tag, asset_tag),
    site_id = coalesce(_site_id, site_id),
    purchase_date = coalesce(_purchase_date, purchase_date),
    warranty_expires_at = coalesce(_warranty_expires_at, warranty_expires_at),
    assigned_to = coalesce(_assigned_to, assigned_to),
    location = coalesce(_location, location),
    notes = coalesce(_notes, notes),
    updated_at = now()
  where id = _equipment_id;

  return true;
end;
$$;

-- Changer le statut (journalisé dans l'historique)
create or replace function public.set_equipment_status(
  _equipment_id uuid,
  _status public.equipment_status,
  _reason text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _org_id uuid;
  _previous public.equipment_status;
begin
  select org_id, status into _org_id, _previous
  from public.equipment where id = _equipment_id;
  if _org_id is null then
    raise exception 'Équipement introuvable';
  end if;
  if not (public.org_is_admin(_org_id) or public.is_staff(auth.uid())) then
    raise exception 'Action non autorisée — administrateur de l''organisation requis';
  end if;

  update public.equipment set status = _status, updated_at = now()
  where id = _equipment_id;

  insert into public.equipment_history (equipment_id, event, description, created_by)
  values (_equipment_id, 'status_change',
    coalesce(_reason, 'Statut : ' || _previous || ' → ' || _status), auth.uid());

  return true;
end;
$$;

-- Supprimer un équipement (admin de l'org ou staff)
create or replace function public.delete_equipment(_equipment_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _org_id uuid;
begin
  select org_id into _org_id from public.equipment where id = _equipment_id;
  if _org_id is null then
    raise exception 'Équipement introuvable';
  end if;
  if not (public.org_is_admin(_org_id) or public.is_staff(auth.uid())) then
    raise exception 'Action non autorisée — administrateur de l''organisation requis';
  end if;

  delete from public.equipment where id = _equipment_id;
  return true;
end;
$$;

-- Ajouter une entrée d'historique (admin de l'org ou staff)
create or replace function public.add_equipment_history(
  _equipment_id uuid,
  _event text,
  _description text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _org_id uuid;
  _history_id uuid;
begin
  select org_id into _org_id from public.equipment where id = _equipment_id;
  if _org_id is null then
    raise exception 'Équipement introuvable';
  end if;
  if not (public.org_is_admin(_org_id) or public.is_staff(auth.uid())) then
    raise exception 'Action non autorisée — administrateur de l''organisation requis';
  end if;

  insert into public.equipment_history (equipment_id, event, description, created_by)
  values (_equipment_id, _event, _description, auth.uid())
  returning id into _history_id;

  return _history_id;
end;
$$;

-- Ajouter / supprimer une garantie
create or replace function public.upsert_warranty(
  _equipment_id uuid,
  _warranty_id uuid default null,
  _provider text default null,
  _start_date date default null,
  _end_date date default null,
  _coverage text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _org_id uuid;
  _result uuid;
begin
  select org_id into _org_id from public.equipment where id = _equipment_id;
  if _org_id is null then
    raise exception 'Équipement introuvable';
  end if;
  if not (public.org_is_admin(_org_id) or public.is_staff(auth.uid())) then
    raise exception 'Action non autorisée — administrateur de l''organisation requis';
  end if;

  if _warranty_id is null then
    insert into public.warranties (equipment_id, provider, start_date, end_date, coverage)
    values (_equipment_id, _provider, _start_date, _end_date, _coverage)
    returning id into _result;
  else
    update public.warranties set
      provider = coalesce(_provider, provider),
      start_date = coalesce(_start_date, start_date),
      end_date = coalesce(_end_date, end_date),
      coverage = coalesce(_coverage, coverage)
    where id = _warranty_id and equipment_id = _equipment_id
    returning id into _result;
    if _result is null then
      raise exception 'Garantie introuvable';
    end if;
  end if;

  return _result;
end;
$$;

create or replace function public.delete_warranty(_warranty_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _org_id uuid;
begin
  select e.org_id into _org_id
  from public.warranties w
  join public.equipment e on e.id = w.equipment_id
  where w.id = _warranty_id;
  if _org_id is null then
    raise exception 'Garantie introuvable';
  end if;
  if not (public.org_is_admin(_org_id) or public.is_staff(auth.uid())) then
    raise exception 'Action non autorisée — administrateur de l''organisation requis';
  end if;

  delete from public.warranties where id = _warranty_id;
  return true;
end;
$$;

-- Lister le parc d'une organisation (recherche + filtre statut)
create or replace function public.get_org_equipment(
  _org_id uuid,
  _search text default null,
  _status public.equipment_status default null
)
returns table (
  id uuid,
  asset_tag text,
  name text,
  type text,
  brand text,
  model text,
  serial_number text,
  status public.equipment_status,
  site_name text,
  location text,
  assigned_to text,
  qr_id text,
  created_at timestamptz
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
    select
      e.id,
      e.asset_tag,
      e.name,
      e.type,
      e.brand,
      e.model,
      e.serial_number,
      e.status,
      w.name as site_name,
      e.location,
      e.assigned_to,
      e.qr_id,
      e.created_at
    from public.equipment e
    left join public.workshops w on w.id = e.site_id
    where e.org_id = _org_id
      and (_search is null or
           e.name ilike '%' || _search || '%' or
           e.brand ilike '%' || _search || '%' or
           e.model ilike '%' || _search || '%' or
           e.serial_number ilike '%' || _search || '%' or
           e.asset_tag ilike '%' || _search || '%')
      and (_status is null or e.status = _status)
    order by e.created_at desc;
end;
$$;

-- Fiche complète d'un équipement (avec historique, documents, garanties)
create or replace function public.get_equipment(_equipment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _org_id uuid;
  _result jsonb;
begin
  select org_id into _org_id from public.equipment where id = _equipment_id;
  if _org_id is null then
    raise exception 'Équipement introuvable';
  end if;
  if not (public.org_is_member(_org_id) or public.is_staff(auth.uid())) then
    raise exception 'Action non autorisée — membre de l''organisation requis';
  end if;

  select jsonb_build_object(
    'equipment', to_jsonb(e),
    'history', (select coalesce(jsonb_agg(h order by h.created_at desc), '[]'::jsonb)
                from public.equipment_history h where h.equipment_id = e.id),
    'documents', (select coalesce(jsonb_agg(d order by d.created_at desc), '[]'::jsonb)
                  from public.equipment_documents d where d.equipment_id = e.id),
    'warranties', (select coalesce(jsonb_agg(w order by w.start_date), '[]'::jsonb)
                   from public.warranties w where w.equipment_id = e.id)
  ) into _result
  from public.equipment e
  where e.id = _equipment_id;

  return _result;
end;
$$;

-- Récupérer un équipement par son identifiant QR (lecture membre de l'org)
create or replace function public.get_equipment_by_qr(_qr_id text)
returns table (
  id uuid,
  org_id uuid,
  org_name text,
  name text,
  brand text,
  model text,
  type text,
  status public.equipment_status,
  qr_id text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select e.id, e.org_id, o.name as org_name, e.name, e.brand, e.model, e.type, e.status, e.qr_id
    from public.equipment e
    join public.organizations o on o.id = e.org_id
    where e.qr_id = _qr_id
      and (public.org_is_member(e.org_id) or public.is_staff(auth.uid()));
end;
$$;

revoke all on function public.create_equipment(uuid, text, text, text, text, text, text, uuid, date, timestamptz, text, text, text) from public;
grant execute on function public.create_equipment(uuid, text, text, text, text, text, text, uuid, date, timestamptz, text, text, text) to authenticated;
revoke all on function public.update_equipment(uuid, text, text, text, text, text, text, uuid, date, timestamptz, text, text, text) from public;
grant execute on function public.update_equipment(uuid, text, text, text, text, text, text, uuid, date, timestamptz, text, text, text) to authenticated;
revoke all on function public.set_equipment_status(uuid, public.equipment_status, text) from public;
grant execute on function public.set_equipment_status(uuid, public.equipment_status, text) to authenticated;
revoke all on function public.delete_equipment(uuid) from public;
grant execute on function public.delete_equipment(uuid) to authenticated;
revoke all on function public.add_equipment_history(uuid, text, text) from public;
grant execute on function public.add_equipment_history(uuid, text, text) to authenticated;
revoke all on function public.upsert_warranty(uuid, uuid, text, date, date, text) from public;
grant execute on function public.upsert_warranty(uuid, uuid, text, date, date, text) to authenticated;
revoke all on function public.delete_warranty(uuid) from public;
grant execute on function public.delete_warranty(uuid) to authenticated;
revoke all on function public.get_org_equipment(uuid, text, public.equipment_status) from public;
grant execute on function public.get_org_equipment(uuid, text, public.equipment_status) to authenticated;
revoke all on function public.get_equipment(uuid) from public;
grant execute on function public.get_equipment(uuid) to authenticated;
revoke all on function public.get_equipment_by_qr(text) from public;
grant execute on function public.get_equipment_by_qr(text) to authenticated;
