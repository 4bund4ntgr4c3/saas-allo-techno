REVOKE EXECUTE ON FUNCTION public.get_reservation_status(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_reservation_status(text) TO service_role;