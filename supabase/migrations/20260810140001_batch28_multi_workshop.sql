-- Batch 28: Multi-ateliers avancé — transfert dossiers, charge travail
-- Ajout workshop_id sur reservations + RPC transfert + vue charge

-- 1. Colonne workshop_id sur reservations (nullable = pas encore assigné)
alter table reservations add column if not exists workshop_id uuid references workshops(id) on delete set null;
create index if not exists idx_reservations_workshop on reservations (workshop_id) where workshop_id is not null;

-- 2. RPC: transférer un dossier vers un autre atelier
create or replace function transfer_reservation(
  _reservation_id uuid,
  _target_workshop_id uuid
)
returns json
language plpgsql
security definer
as $$
declare
  _old_workshop uuid;
  _target_name text;
begin
  -- Vérifier que le target existe
  select name into _target_name from workshops where id = _target_workshop_id and active = true;
  if _target_name is null then
    return json_build_object('ok', false, 'error', 'Atelier cible introuvable ou inactif.');
  end if;

  -- Récupérer l'ancien atelier
  select workshop_id into _old_workshop from reservations where id = _reservation_id;
  if not found then
    return json_build_object('ok', false, 'error', 'Dossier introuvable.');
  end if;

  -- Si même atelier, rien à faire
  if _old_workshop = _target_workshop_id then
    return json_build_object('ok', false, 'error', 'Le dossier est déjà dans cet atelier.');
  end if;

  -- Transférer
  update reservations set workshop_id = _target_workshop_id where id = _reservation_id;

  -- Historiser dans status_history
  insert into status_history (reservation_id, old_status, new_status, changed_by, notes)
  select _reservation_id, status, status, auth.uid(),
    'Transfert vers atelier : ' || _target_name;

  return json_build_object(
    'ok', true,
    'old_workshop', _old_workshop,
    'new_workshop', _target_workshop_id,
    'target_name', _target_name
  );
end;
$$;

-- 3. RPC: charge de travail par atelier (nombre de dossiers actifs)
create or replace function get_workshop_load()
returns json
language sql
security definer
as $$
  select json_agg(json_build_object(
    'id', w.id,
    'name', w.name,
    'city', w.city,
    'active', w.active,
    'active_count', coalesce(rc.cnt, 0),
    'in_progress_count', coalesce(rc.in_progress, 0),
    'pending_count', coalesce(rc.pending, 0)
  ) order by w.name)
  from workshops w
  left join (
    select
      workshop_id,
      count(*) as cnt,
      count(*) filter (where status = 'en_cours') as in_progress,
      count(*) filter (where status in ('en_attente', 'confirmee', 'pieces')) as pending
    from reservations
    where workshop_id is not null
      and status not in ('livre', 'terminee', 'annulee')
    group by workshop_id
  ) rc on rc.workshop_id = w.id;
$$;
