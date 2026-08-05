-- U6 — Techniciens : assignation aux dossiers + accès restreint.

-- 1. Le technicien consulte uniquement les dossiers qui lui sont assignés
CREATE POLICY "reservations_technician_assigned_select" ON public.reservations FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'technicien'::public.app_role)
    AND EXISTS (
      SELECT 1 FROM public.technician_assignments ta
      WHERE ta.reservation_id = reservations.id
        AND ta.technician_id = auth.uid()
    )
  );

-- 2. Historique visible par le technicien assigné
CREATE POLICY "history_technician_assigned_select" ON public.reservation_status_history FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'technicien'::public.app_role)
    AND EXISTS (
      SELECT 1 FROM public.technician_assignments ta
      WHERE ta.reservation_id = reservation_status_history.reservation_id
        AND ta.technician_id = auth.uid()
    )
  );

-- 3. Le technicien lit ses assignations
CREATE POLICY "assignments_technician_read" ON public.technician_assignments FOR SELECT TO authenticated
  USING (technician_id = auth.uid());

-- 4. Changement de statut par le technicien assigné (sinon staff)
CREATE OR REPLACE FUNCTION public.technician_set_reservation_status(
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
  if not (
    public.is_staff(auth.uid())
    or (
      public.has_role(auth.uid(), 'technicien'::public.app_role)
      and exists (
        select 1 from public.technician_assignments ta
        where ta.reservation_id = _reservation_id
          and ta.technician_id = auth.uid()
      )
    )
  ) then
    raise exception 'Action non autorisée sur ce dossier';
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

REVOKE ALL ON FUNCTION public.technician_set_reservation_status(uuid, reservation_status, text) FROM public;
GRANT EXECUTE ON FUNCTION public.technician_set_reservation_status(uuid, reservation_status, text) TO authenticated;
