-- Ticket B2B (item 4) : les organisations clientes signalent un problème sur un
-- équipement enregistré. Le ticket est une reservation avec org_id + equipment_id.
--
-- Réutilisations :
--   * reservations  -> le ticket lui-même (reference AT-YYYY-NNNN, RLS org)
--   * reservation_status_history -> timeline (trigger auto existant)
--   * reservation_attachments -> photos/pièces jointes du signalement
--
-- Accès :
--   * membre de l'org -> lecture des tickets, création (via RPC)
--   * admin de l'org -> lecture/écriture (policy reservations_org_admin_all)
--   * staff Allô Techno -> tout (policies staff existantes)

-- 1. Enums
do $$ begin
  create type public.b2b_ticket_type as enum ('panne', 'maintenance', 'diagnostic', 'installation', 'autre');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.b2b_ticket_priority as enum ('faible', 'normale', 'haute', 'critique');
exception when duplicate_object then null; end $$;

-- 2. Colonnes tickets sur reservations
alter table public.reservations
  add column if not exists equipment_id uuid references public.equipment(id) on delete set null,
  add column if not exists ticket_type public.b2b_ticket_type,
  add column if not exists priority public.b2b_ticket_priority not null default 'normale',
  add column if not exists location text;

create index if not exists idx_reservations_equipment on public.reservations (equipment_id) where equipment_id is not null;
create index if not exists idx_reservations_ticket_type on public.reservations (ticket_type) where ticket_type is not null;

-- 3. RLS : lecture/insertion par les membres de l'organisation
drop policy if exists "reservations_org_member_read" on public.reservations;
create policy "reservations_org_member_read"
on public.reservations for select to authenticated
using (org_id is not null and public.org_is_member(org_id));

drop policy if exists "reservations_org_member_insert" on public.reservations;
create policy "reservations_org_member_insert"
on public.reservations for insert to authenticated
with check (org_id is not null and public.org_is_member(org_id));

-- Timeline : un membre de l'org voit l'historique des tickets de son org
drop policy if exists "status_history_org_member_read" on public.reservation_status_history;
create policy "status_history_org_member_read"
on public.reservation_status_history for select to authenticated
using (
  exists (
    select 1 from public.reservations r
    where r.id = reservation_status_history.reservation_id
      and r.org_id is not null
      and public.org_is_member(r.org_id)
  )
);

-- Pièces jointes : lecture + ajout pour les membres (via la réservation liée)
drop policy if exists "attachments_org_member_read" on public.reservation_attachments;
create policy "attachments_org_member_read"
on public.reservation_attachments for select to authenticated
using (
  exists (
    select 1 from public.reservations r
    where r.id = reservation_attachments.reservation_id
      and r.org_id is not null
      and public.org_is_member(r.org_id)
  )
);

drop policy if exists "attachments_org_member_insert" on public.reservation_attachments;
create policy "attachments_org_member_insert"
on public.reservation_attachments for insert to authenticated
with check (
  exists (
    select 1 from public.reservations r
    where r.id = reservation_attachments.reservation_id
      and r.org_id is not null
      and public.org_is_member(r.org_id)
  )
);

-- 4. RPC : création d'un ticket (validation org + equipment)
create or replace function public.create_b2b_ticket(
  _org_id uuid,
  _issue text,
  _equipment_id uuid default null,
  _ticket_type public.b2b_ticket_type default 'panne',
  _priority public.b2b_ticket_priority default 'normale',
  _location text default null,
  _contact_phone text default null,
  _contact_email text default null,
  _message text default null,
  _customer_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_org_name text;
  v_reference text;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'Non authentifié' using errcode = '42501';
  end if;

  if not public.org_is_member(_org_id) then
    raise exception 'Accès refusé : vous n''êtes pas membre de cette organisation' using errcode = '42501';
  end if;

  if _equipment_id is not null then
    if not exists (
      select 1 from public.equipment e
      where e.id = _equipment_id and e.org_id = _org_id
    ) then
      raise exception 'Équipement invalide pour cette organisation' using errcode = 'P0001';
    end if;
  end if;

  select name into v_org_name from public.organizations where id = _org_id;
  v_reference := public.next_reservation_reference();

  insert into public.reservations (
    org_id, user_id, reference, customer_name, phone, email,
    device, issue, mode, payment, slot_date, slot_period,
    message, source, equipment_id, ticket_type, priority, location
  ) values (
    _org_id, v_uid, v_reference,
    coalesce(_customer_name, nullif(v_org_name, '')),
    _contact_phone, _contact_email,
    coalesce((select name from public.equipment where id = _equipment_id), 'Équipement organisation'),
    _issue, 'boutique', 'especes', now()::date, 'matin',
    _message, 'b2b', _equipment_id, _ticket_type, _priority, _location
  )
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'reference', v_reference);
end;
$$;

-- 5. RPC : liste des tickets d'une organisation (filtres optionnels)
create or replace function public.get_org_tickets(
  _org_id uuid,
  _status public.reservation_status default null,
  _priority public.b2b_ticket_priority default null,
  _ticket_type public.b2b_ticket_type default null,
  _limit int default 100
)
returns setof jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.org_is_member(_org_id) then
    raise exception 'Accès refusé : vous n''êtes pas membre de cette organisation' using errcode = '42501';
  end if;

  return query
  select jsonb_build_object(
    'id', r.id,
    'reference', r.reference,
    'status', r.status,
    'ticket_type', r.ticket_type,
    'priority', r.priority,
    'issue', r.issue,
    'location', r.location,
    'customer_name', r.customer_name,
    'phone', r.phone,
    'created_at', r.created_at,
    'updated_at', r.updated_at,
    'equipment', case when e.id is not null then
      jsonb_build_object('id', e.id, 'name', e.name, 'brand', e.brand, 'model', e.model,
                         'serial_number', e.serial_number, 'asset_tag', e.asset_tag,
                         'type', e.type, 'qr_id', e.qr_id, 'location', e.location)
    else null end
  )
  from public.reservations r
  left join public.equipment e on e.id = r.equipment_id
  where r.org_id = _org_id
    and (_status is null or r.status = _status)
    and (_priority is null or r.priority = _priority)
    and (_ticket_type is null or r.ticket_type = _ticket_type)
  order by
    case r.priority when 'critique' then 0 when 'haute' then 1 when 'normale' then 2 else 3 end,
    r.created_at desc
  limit greatest(1, least(_limit, 500));
end;
$$;

-- 6. RPC : détail d'un ticket (timeline + pièces jointes)
create or replace function public.get_org_ticket(_ticket_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket jsonb;
  v_org_id uuid;
begin
  select org_id into v_org_id from public.reservations where id = _ticket_id;

  if v_org_id is null then
    raise exception 'Ticket introuvable' using errcode = 'P0001';
  end if;

  if not public.org_is_member(v_org_id) then
    raise exception 'Accès refusé : vous n''êtes pas membre de cette organisation' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'id', r.id,
    'reference', r.reference,
    'status', r.status,
    'ticket_type', r.ticket_type,
    'priority', r.priority,
    'issue', r.issue,
    'location', r.location,
    'customer_name', r.customer_name,
    'phone', r.phone,
    'email', r.email,
    'message', r.message,
    'staff_notes', r.staff_notes,
    'created_at', r.created_at,
    'updated_at', r.updated_at,
    'equipment', case when e.id is not null then
      jsonb_build_object('id', e.id, 'name', e.name, 'brand', e.brand, 'model', e.model,
                         'serial_number', e.serial_number, 'asset_tag', e.asset_tag,
                         'type', e.type, 'qr_id', e.qr_id, 'location', e.location,
                         'status', e.status, 'warranty_expires_at', e.warranty_expires_at)
    else null end,
    'timeline', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', h.id, 'old_status', h.old_status, 'new_status', h.new_status,
        'note', h.note, 'created_at', h.created_at
      ) order by h.created_at desc)
      from public.reservation_status_history h
      where h.reservation_id = r.id
    ), '[]'::jsonb),
    'attachments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id, 'stage', a.stage, 'kind', a.kind, 'url', a.url,
        'caption', a.caption, 'uploaded_by', a.uploaded_by, 'created_at', a.created_at
      ) order by a.created_at)
      from public.reservation_attachments a
      where a.reservation_id = r.id
    ), '[]'::jsonb)
  ) into v_ticket
  from public.reservations r
  left join public.equipment e on e.id = r.equipment_id
  where r.id = _ticket_id;

  return v_ticket;
end;
$$;

-- 7. Droits d'exécution
revoke all on function public.create_b2b_ticket(uuid, text, uuid, public.b2b_ticket_type, public.b2b_ticket_priority, text, text, text, text, text) from public, anon;
revoke all on function public.get_org_tickets(uuid, public.reservation_status, public.b2b_ticket_priority, public.b2b_ticket_type, int) from public, anon;
revoke all on function public.get_org_ticket(uuid) from public, anon;

grant execute on function public.create_b2b_ticket(uuid, text, uuid, public.b2b_ticket_type, public.b2b_ticket_priority, text, text, text, text, text) to authenticated, service_role;
grant execute on function public.get_org_tickets(uuid, public.reservation_status, public.b2b_ticket_priority, public.b2b_ticket_type, int) to authenticated, service_role;
grant execute on function public.get_org_ticket(uuid) to authenticated, service_role;
