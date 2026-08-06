-- Commandes boutique : référence AC-YYYY-XXXX côté serveur et enregistrement
-- réel dans `leads` (source 'boutique'). Remplace le numéro aléatoire client.

CREATE SEQUENCE public.shop_ref_seq;
GRANT USAGE, SELECT ON SEQUENCE public.shop_ref_seq TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.next_shop_reference()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $$
DECLARE
  n bigint := nextval('public.shop_ref_seq');
BEGIN
  RETURN 'AC-' || to_char(now(), 'YYYY') || '-' || lpad(n::text, GREATEST(4, length(n::text)), '0');
END;
$$;

REVOKE ALL ON FUNCTION public.next_shop_reference() FROM public;
GRANT EXECUTE ON FUNCTION public.next_shop_reference() TO anon, authenticated, service_role;
