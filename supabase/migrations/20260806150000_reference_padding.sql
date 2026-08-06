-- Référence de dossier : padding adaptatif.
-- La séquence reservation_ref_seq est globale (bigint) : après 9 999 réservations
-- cumulées, `lpad(..., 4, '0')` produisait `AT-2026-10000` (5 chiffres), rompant
-- le format AT-YYYY-XXXX affiché aux clients. On étend le padding au-delà de 4.

CREATE OR REPLACE FUNCTION public.next_reservation_reference()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $$
DECLARE
  n bigint := nextval('public.reservation_ref_seq');
BEGIN
  RETURN 'AT-' || to_char(now(), 'YYYY') || '-' || lpad(n::text, GREATEST(4, length(n::text)), '0');
END;
$$;

REVOKE ALL ON FUNCTION public.next_reservation_reference() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.next_reservation_reference() TO authenticated, service_role;
