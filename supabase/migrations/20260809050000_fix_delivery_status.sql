-- Correctif : le RPC set_delivery_status vérifiait auth.uid() dans user_roles,
-- or il est appelé par la server function via le service role, où auth.uid()
-- est NULL — le statut de livraison n'était donc jamais mis à jour (return false).
-- La vérification de rôle est déjà faite côté TypeScript (is_staff). On publie
-- une version sans vérification SQL redondante et nullement fiable.
create or replace function public.set_delivery_status(_reservation_id uuid, _status text, _address text)
returns boolean
language plpgsql
set search_path = public
as $$
begin
  update public.reservations
     set delivery_status = _status::public.delivery_status,
         delivery_address = coalesce(_address, delivery_address),
         updated_at = now()
   where id = _reservation_id;
  return found;
end;
$$;