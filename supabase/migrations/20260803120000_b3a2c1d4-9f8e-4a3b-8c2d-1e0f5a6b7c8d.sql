-- Capacité des créneaux par mode de dépôt (boutique / domicile).

ALTER TABLE public.slot_capacity
  ADD COLUMN mode text NOT NULL DEFAULT 'boutique'
    CHECK (mode IN ('boutique', 'domicile'));

ALTER TABLE public.slot_capacity DROP CONSTRAINT slot_capacity_pkey;
ALTER TABLE public.slot_capacity ADD PRIMARY KEY (weekday, period, mode);

INSERT INTO public.slot_capacity (weekday, period, mode, capacity) VALUES
  (0, 'matin', 'domicile', 0), (0, 'apres-midi', 'domicile', 0),
  (1, 'matin', 'domicile', 3), (1, 'apres-midi', 'domicile', 3),
  (2, 'matin', 'domicile', 3), (2, 'apres-midi', 'domicile', 3),
  (3, 'matin', 'domicile', 3), (3, 'apres-midi', 'domicile', 3),
  (4, 'matin', 'domicile', 3), (4, 'apres-midi', 'domicile', 3),
  (5, 'matin', 'domicile', 3), (5, 'apres-midi', 'domicile', 3),
  (6, 'matin', 'domicile', 2), (6, 'apres-midi', 'domicile', 2);

-- La validation des créneaux prend le mode en compte.
DROP TRIGGER IF EXISTS reservations_validate_slot ON public.reservations;
DROP FUNCTION IF EXISTS public.validate_reservation_slot();

CREATE OR REPLACE FUNCTION public.validate_reservation_slot()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  cap smallint;
  taken integer;
BEGIN
  IF NEW.slot_date < (now() AT TIME ZONE 'UTC')::date THEN
    RAISE EXCEPTION 'Date de réservation dans le passé';
  END IF;

  SELECT capacity INTO cap
  FROM public.slot_capacity
  WHERE weekday = EXTRACT(DOW FROM NEW.slot_date)::smallint
    AND period = NEW.slot_period
    AND mode = NEW.mode;

  IF cap IS NULL OR cap = 0 THEN
    RAISE EXCEPTION 'Créneau indisponible';
  END IF;

  SELECT count(*) INTO taken
  FROM public.reservations r
  WHERE r.slot_date = NEW.slot_date
    AND r.slot_period = NEW.slot_period
    AND r.mode = NEW.mode
    AND r.status <> 'annulee'
    AND (TG_OP = 'INSERT' OR r.id <> NEW.id);

  IF taken >= cap THEN
    RAISE EXCEPTION 'Créneau complet';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER reservations_validate_slot
BEFORE INSERT ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.validate_reservation_slot();

-- Disponibilités par mode (défaut : boutique, pour compatibilité).
CREATE OR REPLACE FUNCTION public.slot_availability(_from date, _to date, _mode text DEFAULT 'boutique')
RETURNS TABLE (slot_date date, period public.slot_period, capacity smallint, remaining smallint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    d::date AS slot_date,
    c.period,
    c.capacity,
    GREATEST(
      0,
      c.capacity - (
        SELECT count(*)
        FROM public.reservations r
        WHERE r.slot_date = d::date
          AND r.slot_period = c.period
          AND r.mode = _mode
          AND r.status <> 'annulee'
      )
    )::smallint AS remaining
  FROM generate_series(_from, LEAST(_to, _from + 60), interval '1 day') AS d
  JOIN public.slot_capacity c
    ON c.weekday = EXTRACT(DOW FROM d)::smallint
   AND c.mode = _mode
  ORDER BY 1, 2;
$$;

REVOKE ALL ON FUNCTION public.slot_availability(date, date) FROM public;
GRANT EXECUTE ON FUNCTION public.slot_availability(date, date) TO anon, authenticated, service_role;

-- Les heures déjà prises sont aussi filtrées par mode.
CREATE OR REPLACE FUNCTION public.booked_hours(_from date, _to date, _mode text DEFAULT 'boutique')
RETURNS TABLE (slot_date date, slot_hour text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.slot_date, r.slot_hour
  FROM public.reservations r
  WHERE r.slot_hour IS NOT NULL
    AND r.mode = _mode
    AND r.status <> 'annulee'
    AND r.slot_date BETWEEN _from AND _to
$$;

GRANT EXECUTE ON FUNCTION public.booked_hours(date, date) TO anon, authenticated, service_role;
