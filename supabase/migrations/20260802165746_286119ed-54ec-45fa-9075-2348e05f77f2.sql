-- 1. Missing triggers on reservations
DROP TRIGGER IF EXISTS trg_reservations_updated_at ON public.reservations;
CREATE TRIGGER trg_reservations_updated_at
BEFORE UPDATE ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_reservations_validate_slot ON public.reservations;
CREATE TRIGGER trg_reservations_validate_slot
BEFORE INSERT OR UPDATE OF slot_date, slot_period ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.validate_reservation_slot();

DROP TRIGGER IF EXISTS trg_reservations_status_history ON public.reservations;
CREATE TRIGGER trg_reservations_status_history
AFTER INSERT OR UPDATE OF status ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.log_reservation_status_change();

-- 2. Staff action: change stage + attach a customer-visible note
CREATE OR REPLACE FUNCTION public.staff_set_reservation_status(
  _reservation_id uuid,
  _status reservation_status,
  _note text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare
  hist_id uuid;
  changed boolean;
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Action réservée au personnel';
  end if;

  select (r.status is distinct from _status) into changed
  from public.reservations r where r.id = _reservation_id;

  if changed is null then
    raise exception 'Dossier introuvable';
  end if;

  update public.reservations
  set status = _status
  where id = _reservation_id;

  if changed and _note is not null and length(btrim(_note)) > 0 then
    select h.id into hist_id
    from public.reservation_status_history h
    where h.reservation_id = _reservation_id
    order by h.created_at desc
    limit 1;

    if hist_id is not null then
      update public.reservation_status_history
      set note = btrim(_note)
      where id = hist_id;
    end if;
  end if;

  return true;
end;
$$;

REVOKE ALL ON FUNCTION public.staff_set_reservation_status(uuid, reservation_status, text) FROM public;
GRANT EXECUTE ON FUNCTION public.staff_set_reservation_status(uuid, reservation_status, text) TO authenticated;

-- 3. Public timeline lookup by reference
CREATE OR REPLACE FUNCTION public.get_reservation_timeline(_reference text)
RETURNS TABLE(old_status reservation_status, new_status reservation_status, note text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT h.old_status, h.new_status, h.note, h.created_at
  FROM public.reservation_status_history h
  JOIN public.reservations r ON r.id = h.reservation_id
  WHERE r.reference = _reference
  ORDER BY h.created_at ASC;
$$;

REVOKE ALL ON FUNCTION public.get_reservation_timeline(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_reservation_timeline(text) TO anon, authenticated, service_role;

-- 4. Realtime
ALTER TABLE public.reservations REPLICA IDENTITY FULL;
ALTER TABLE public.reservation_status_history REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reservation_status_history;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;