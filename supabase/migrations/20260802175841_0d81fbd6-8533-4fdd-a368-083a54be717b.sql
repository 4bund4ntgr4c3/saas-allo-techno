ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS slot_hour text;

ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_slot_hour_format CHECK (slot_hour IS NULL OR slot_hour ~ '^\d{2}:\d{2}$');

CREATE UNIQUE INDEX IF NOT EXISTS reservations_unique_active_hour
  ON public.reservations (slot_date, slot_hour)
  WHERE slot_hour IS NOT NULL AND status <> 'annulee';

CREATE OR REPLACE FUNCTION public.booked_hours(_from date, _to date)
RETURNS TABLE (slot_date date, slot_hour text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.slot_date, r.slot_hour
  FROM public.reservations r
  WHERE r.slot_hour IS NOT NULL
    AND r.status <> 'annulee'
    AND r.slot_date BETWEEN _from AND _to
$$;

GRANT EXECUTE ON FUNCTION public.booked_hours(date, date) TO anon, authenticated, service_role;

ALTER TABLE public.reservations REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;