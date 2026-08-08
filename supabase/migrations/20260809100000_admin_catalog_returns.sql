-- Administration du catalogue + retours clients
-- ====================================================================
-- 1. RPC staff pour la gestion du catalogue (marques, catégories,
--    appareils, pannes, photos) — les tables catalog_* ne sont lisibles
--    qu'en public ; toutes les écritures passent par ces fonctions
--    SECURITY DEFINER qui vérifient is_staff(auth.uid()).
-- 2. Bucket privé « catalog-images » pour les photos d'appareils
--    téléversées par l'atelier.
-- 3. Table public.returns + RPC return_set_status pour le suivi des
--    retours commandes (staff uniquement).

-- ====================================================================
-- 1. Catalogue — RPC d'écriture staff
-- ====================================================================

-- Marque (upsert sur le slug)
create or replace function public.catalog_upsert_brand(
  _slug text,
  _name text,
  _tag text default '',
  _sort smallint default 0,
  _active boolean default true
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Action réservée au personnel';
  end if;
  insert into public.catalog_brands (slug, name, tag, sort, active)
  values (_slug, _name, coalesce(_tag, ''), coalesce(_sort, 0), coalesce(_active, true))
  on conflict (slug) do update
    set name = excluded.name,
        tag = excluded.tag,
        sort = excluded.sort,
        active = excluded.active;
  return true;
end;
$$;

revoke all on function public.catalog_upsert_brand(text, text, text, smallint, boolean) from public;
grant execute on function public.catalog_upsert_brand(text, text, text, smallint, boolean) to authenticated;

-- Catégorie (upsert sur le slug)
create or replace function public.catalog_upsert_category(
  _slug text,
  _label text,
  _sort smallint default 0,
  _active boolean default true
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Action réservée au personnel';
  end if;
  insert into public.catalog_categories (slug, label, sort, active)
  values (_slug, _label, coalesce(_sort, 0), coalesce(_active, true))
  on conflict (slug) do update
    set label = excluded.label,
        sort = excluded.sort,
        active = excluded.active;
  return true;
end;
$$;

revoke all on function public.catalog_upsert_category(text, text, smallint, boolean) from public;
grant execute on function public.catalog_upsert_category(text, text, smallint, boolean) to authenticated;

-- Appareil (upsert sur le slug)
create or replace function public.catalog_upsert_device(
  _slug text,
  _name text,
  _brand_slug text,
  _category_slug text,
  _series text default '',
  _year integer default 0,
  _sort smallint default 0,
  _active boolean default true
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Action réservée au personnel';
  end if;
  insert into public.catalog_devices (slug, name, brand_slug, category_slug, series, year, sort, active)
  values (_slug, _name, _brand_slug, _category_slug, coalesce(_series, ''), coalesce(_year, 0), coalesce(_sort, 0), coalesce(_active, true))
  on conflict (slug) do update
    set name = excluded.name,
        brand_slug = excluded.brand_slug,
        category_slug = excluded.category_slug,
        series = excluded.series,
        year = excluded.year,
        sort = excluded.sort,
        active = excluded.active,
        updated_at = now();
  return true;
end;
$$;

revoke all on function public.catalog_upsert_device(text, text, text, text, text, integer, smallint, boolean) from public;
grant execute on function public.catalog_upsert_device(text, text, text, text, text, integer, smallint, boolean) to authenticated;

-- Panne (insert si _id null, sinon mise à jour par id ; l'upsert se
-- replie sur l'unicité (device_slug, slug))
create or replace function public.catalog_upsert_fault(
  _id integer default null,
  _device_slug text,
  _slug text,
  _label text,
  _price integer default 0,
  _duration text default '',
  _warranty text default '',
  _part text default '',
  _sort smallint default 0
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Action réservée au personnel';
  end if;
  if _id is null then
    insert into public.catalog_faults (device_slug, slug, label, price, duration, warranty, part, sort)
    values (_device_slug, _slug, _label, coalesce(_price, 0), coalesce(_duration, ''), coalesce(_warranty, ''), coalesce(_part, ''), coalesce(_sort, 0))
    on conflict (device_slug, slug) do update
      set label = excluded.label,
          price = excluded.price,
          duration = excluded.duration,
          warranty = excluded.warranty,
          part = excluded.part,
          sort = excluded.sort;
  else
    update public.catalog_faults
       set device_slug = _device_slug,
           slug = _slug,
           label = _label,
           price = coalesce(_price, 0),
           duration = coalesce(_duration, ''),
           warranty = coalesce(_warranty, ''),
           part = coalesce(_part, ''),
           sort = coalesce(_sort, 0)
     where id = _id;
    if not found then
      raise exception 'Panne introuvable';
    end if;
  end if;
  return true;
end;
$$;

revoke all on function public.catalog_upsert_fault(integer, text, text, text, integer, text, text, text, smallint) from public;
grant execute on function public.catalog_upsert_fault(integer, text, text, text, integer, text, text, text, smallint) to authenticated;

-- Photo (ajout / suppression — les tables catalog_photos n'autorisent
-- que la lecture côté client, les écritures passent par RPC staff)
create or replace function public.catalog_add_photo(
  _device_slug text,
  _url text,
  _alt text default '',
  _sort smallint default 0
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Action réservée au personnel';
  end if;
  insert into public.catalog_photos (device_slug, url, alt, sort)
  values (_device_slug, _url, coalesce(_alt, ''), coalesce(_sort, 0));
  return true;
end;
$$;

revoke all on function public.catalog_add_photo(text, text, text, smallint) from public;
grant execute on function public.catalog_add_photo(text, text, text, smallint) to authenticated;

create or replace function public.catalog_delete_photo(_id integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Action réservée au personnel';
  end if;
  delete from public.catalog_photos where id = _id;
  if not found then
    raise exception 'Photo introuvable';
  end if;
  return true;
end;
$$;

revoke all on function public.catalog_delete_photo(integer) from public;
grant execute on function public.catalog_delete_photo(integer) to authenticated;

-- Suppressions (les clés étrangères cascadent les appareils/pannes/photos)
create or replace function public.catalog_delete_brand(_slug text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Action réservée au personnel';
  end if;
  delete from public.catalog_brands where slug = _slug;
  if not found then
    raise exception 'Marque introuvable';
  end if;
  return true;
end;
$$;

revoke all on function public.catalog_delete_brand(text) from public;
grant execute on function public.catalog_delete_brand(text) to authenticated;

create or replace function public.catalog_delete_category(_slug text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Action réservée au personnel';
  end if;
  delete from public.catalog_categories where slug = _slug;
  if not found then
    raise exception 'Catégorie introuvable';
  end if;
  return true;
end;
$$;

revoke all on function public.catalog_delete_category(text) from public;
grant execute on function public.catalog_delete_category(text) to authenticated;

create or replace function public.catalog_delete_device(_slug text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Action réservée au personnel';
  end if;
  delete from public.catalog_devices where slug = _slug;
  if not found then
    raise exception 'Appareil introuvable';
  end if;
  return true;
end;
$$;

revoke all on function public.catalog_delete_device(text) from public;
grant execute on function public.catalog_delete_device(text) to authenticated;

create or replace function public.catalog_delete_fault(_id integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Action réservée au personnel';
  end if;
  delete from public.catalog_faults where id = _id;
  if not found then
    raise exception 'Panne introuvable';
  end if;
  return true;
end;
$$;

revoke all on function public.catalog_delete_fault(integer) from public;
grant execute on function public.catalog_delete_fault(integer) to authenticated;

-- ====================================================================
-- 2. Bucket privé « catalog-images » (photos téléversées par l'atelier)
-- ====================================================================

insert into storage.buckets (id, name, public)
values ('catalog-images', 'catalog-images', false)
on conflict (id) do nothing;

drop policy if exists "catalog-images-staff-insert" on storage.objects;
create policy "catalog-images-staff-insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'catalog-images' and public.is_staff(auth.uid()));

drop policy if exists "catalog-images-staff-select" on storage.objects;
create policy "catalog-images-staff-select"
  on storage.objects for select to authenticated
  using (bucket_id = 'catalog-images' and public.is_staff(auth.uid()));

-- ====================================================================
-- 3. Retours commandes boutique
-- ====================================================================

create table if not exists public.returns (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,                 -- RT-YYYY-NNNN
  customer_name text not null,
  phone text not null,
  email text,
  order_reference text,                           -- commande d'origine AC-YYYY-NNNN
  item text,                                      -- article concerné
  reason text not null,
  status text not null default 'nouveau',         -- nouveau | en_cours | accepte | refuse | cloture
  note text,                                      -- note interne de l'atelier
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.returns enable row level security;

-- Lecture / écriture réservées au personnel (service_role via server functions).
drop policy if exists "returns_staff_all" on public.returns;
create policy "returns_staff_all"
  on public.returns for all to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

revoke all on public.returns from anon, authenticated;
grant select, insert, update, delete on public.returns to authenticated;

-- Référence unique RT-YYYY-NNNN
create sequence if not exists public.returns_ref_seq;
create or replace function public.next_return_reference()
returns text
language plpgsql
set search_path = public
as $$
declare
  n bigint := nextval('public.returns_ref_seq');
begin
  return 'RT-' || to_char(now(), 'YYYY') || '-' || lpad(n::text, GREATEST(4, length(n::text)), '0');
end;
$$;
revoke all on function public.next_return_reference() from public;
grant execute on function public.next_return_reference() to service_role;

-- Changement de statut (et note) par le personnel, avec contrôle is_staff
create or replace function public.return_set_status(_reference text, _status text, _note text default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Action réservée au personnel';
  end if;
  update public.returns
     set status = _status,
         note = coalesce(_note, note),
         updated_at = now()
   where reference = _reference;
  if not found then
    raise exception 'Retour introuvable';
  end if;
  return true;
end;
$$;

revoke all on function public.return_set_status(text, text, text) from public;
grant execute on function public.return_set_status(text, text, text) to authenticated;
