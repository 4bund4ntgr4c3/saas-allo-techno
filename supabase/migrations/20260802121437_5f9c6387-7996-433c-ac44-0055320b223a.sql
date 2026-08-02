CREATE TYPE public.slot_period AS ENUM ('matin', 'apres-midi');
CREATE TYPE public.reservation_status AS ENUM ('en_attente', 'confirmee', 'en_cours', 'terminee', 'annulee');

-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  phone text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone',
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- capacity per weekday / period (0 = Sunday .. 6 = Saturday)
CREATE TABLE public.slot_capacity (
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  period public.slot_period NOT NULL,
  capacity smallint NOT NULL DEFAULT 0 CHECK (capacity >= 0),
  PRIMARY KEY (weekday, period)
);
GRANT SELECT ON public.slot_capacity TO anon, authenticated;
GRANT ALL ON public.slot_capacity TO service_role;
ALTER TABLE public.slot_capacity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "slot_capacity_public_read" ON public.slot_capacity FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.slot_capacity (weekday, period, capacity) VALUES
  (0, 'matin', 0), (0, 'apres-midi', 0),
  (1, 'matin', 6), (1, 'apres-midi', 6),
  (2, 'matin', 6), (2, 'apres-midi', 6),
  (3, 'matin', 6), (3, 'apres-midi', 6),
  (4, 'matin', 6), (4, 'apres-midi', 6),
  (5, 'matin', 6), (5, 'apres-midi', 6),
  (6, 'matin', 4), (6, 'apres-midi', 4);

-- reservations
CREATE SEQUENCE public.reservation_ref_seq;
GRANT USAGE, SELECT ON SEQUENCE public.reservation_ref_seq TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.next_reservation_reference()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT 'AT-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.reservation_ref_seq')::text, 4, '0');
$$;

CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  reference text NOT NULL UNIQUE DEFAULT public.next_reservation_reference(),
  customer_name text NOT NULL,
  phone text NOT NULL,
  email text,
  device text NOT NULL,
  issue text NOT NULL,
  mode text NOT NULL DEFAULT 'boutique',
  payment text NOT NULL DEFAULT 'mtn',
  slot_date date NOT NULL,
  slot_period public.slot_period NOT NULL,
  status public.reservation_status NOT NULL DEFAULT 'en_attente',
  message text,
  staff_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reservations_slot_idx ON public.reservations (slot_date, slot_period);
CREATE INDEX reservations_user_idx ON public.reservations (user_id);

GRANT SELECT, INSERT, UPDATE ON public.reservations TO authenticated;
GRANT ALL ON public.reservations TO service_role;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reservations_select_own" ON public.reservations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "reservations_insert_own" ON public.reservations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reservations_cancel_own" ON public.reservations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status IN ('en_attente', 'confirmee'))
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER reservations_set_updated_at BEFORE UPDATE ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- validation: no bookings in the past, capacity must exist
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
  WHERE weekday = EXTRACT(DOW FROM NEW.slot_date)::smallint AND period = NEW.slot_period;

  IF cap IS NULL OR cap = 0 THEN
    RAISE EXCEPTION 'Créneau indisponible';
  END IF;

  SELECT count(*) INTO taken
  FROM public.reservations r
  WHERE r.slot_date = NEW.slot_date
    AND r.slot_period = NEW.slot_period
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

-- public availability view function
CREATE OR REPLACE FUNCTION public.slot_availability(_from date, _to date)
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
          AND r.status <> 'annulee'
      )
    )::smallint AS remaining
  FROM generate_series(_from, LEAST(_to, _from + 60), interval '1 day') AS d
  JOIN public.slot_capacity c ON c.weekday = EXTRACT(DOW FROM d)::smallint
  ORDER BY 1, 2;
$$;

REVOKE ALL ON FUNCTION public.slot_availability(date, date) FROM public;
GRANT EXECUTE ON FUNCTION public.slot_availability(date, date) TO anon, authenticated, service_role;