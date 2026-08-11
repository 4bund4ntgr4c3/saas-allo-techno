-- Un ticket « panne » passe l'équipement en en_panne (si actif) avec historique.
-- La mise à jour est faite directement ici (pas via set_equipment_status qui
-- exige un admin d'organisation) : le signalement par un membre suffit.

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
  v_org_phone text;
  v_reference text;
  v_id uuid;
  v_equipment_name text;
  v_equipment_status public.equipment_status;
begin
  if v_uid is null then
    raise exception 'Non authentifié' using errcode = '42501';
  end if;

  if not public.org_is_member(_org_id) then
    raise exception 'Accès refusé : vous n''êtes pas membre de cette organisation' using errcode = '42501';
  end if;

  if _equipment_id is not null then
    select name, status into v_equipment_name, v_equipment_status
    from public.equipment
    where id = _equipment_id and org_id = _org_id;

    if v_equipment_name is null then
      raise exception 'Équipement invalide pour cette organisation' using errcode = 'P0001';
    end if;
  end if;

  select name, phone into v_org_name, v_org_phone from public.organizations where id = _org_id;
  v_reference := public.next_reservation_reference();

  insert into public.reservations (
    org_id, user_id, reference, customer_name, phone, email,
    device, issue, mode, payment, slot_date, slot_period,
    message, source, equipment_id, ticket_type, priority, location
  ) values (
    _org_id, v_uid, v_reference,
    coalesce(_customer_name, nullif(v_org_name, '')),
    coalesce(_contact_phone, v_org_phone, 'contact'),
    _contact_email,
    coalesce(v_equipment_name, 'Équipement organisation'),
    _issue, 'boutique', 'especes', now()::date, 'matin',
    _message, 'b2b', _equipment_id, _ticket_type, _priority, _location
  )
  returning id into v_id;

  -- Un signalement de panne sur un équipement « actif » le passe en panne.
  if _ticket_type = 'panne' and _equipment_id is not null and v_equipment_status = 'actif' then
    update public.equipment
    set status = 'en_panne', updated_at = now()
    where id = _equipment_id;

    insert into public.equipment_history (equipment_id, event, description, created_by)
    values (_equipment_id, 'status_change',
      'Signalé en panne via le ticket ' || v_reference, v_uid);
  end if;

  return jsonb_build_object('id', v_id, 'reference', v_reference);
end;
$$;

revoke all on function public.create_b2b_ticket(uuid, text, uuid, public.b2b_ticket_type, public.b2b_ticket_priority, text, text, text, text, text) from public, anon;
grant execute on function public.create_b2b_ticket(uuid, text, uuid, public.b2b_ticket_type, public.b2b_ticket_priority, text, text, text, text, text) to authenticated, service_role;
