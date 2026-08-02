CREATE OR REPLACE FUNCTION public.get_reservation_status(_reference text)
RETURNS TABLE(
  reference text,
  device text,
  issue text,
  mode text,
  payment text,
  slot_date date,
  slot_period public.slot_period,
  status public.reservation_status,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.reference,
    r.device,
    r.issue,
    r.mode,
    r.payment,
    r.slot_date,
    r.slot_period,
    r.status,
    r.created_at
  FROM public.reservations r
  WHERE r.reference = _reference;
$$;

REVOKE ALL ON FUNCTION public.get_reservation_status(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_reservation_status(text) TO anon, authenticated, service_role;