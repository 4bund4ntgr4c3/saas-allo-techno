REVOKE ALL ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_reservation_slot() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.next_reservation_reference() FROM public, anon;