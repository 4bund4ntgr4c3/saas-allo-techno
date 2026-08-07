-- Suivi de livraison pour les dossiers en enlèvement à domicile (mode 'domicile')
-- ====================================================================
-- Ajoute l'adresse d'enlèvement / livraison et un statut de livraison,
-- suivi dans la page /suivi et géré depuis l'admin (onglet dossiers).

-- 1. Statut de livraison
do $$
begin
  if not exists (select 1 from pg_type where typname = 'delivery_status') then
    create type public.delivery_status as enum ('non_applicable', 'a_planifier', 'en_route', 'livre');
  end if;
end
$$;

-- 2. Colonnes sur reservations
alter table public.reservations
  add column if not exists delivery_address text,
  add column if not exists delivery_status public.delivery_status not null default 'non_applicable';

-- 3. RPC : mise à jour de la livraison (staff/technicien via server function)
create or replace function public.set_delivery_status(_reservation_id uuid, _status text, _address text)
returns boolean
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('admin', 'staff')
  ) then
    return false;
  end if;

  update public.reservations
     set delivery_status = _status::public.delivery_status,
         delivery_address = coalesce(_address, delivery_address),
         updated_at = now()
   where id = _reservation_id;
  return true;
end;
$$;

revoke all on function public.set_delivery_status(uuid, text, text) from public;
grant execute on function public.set_delivery_status(uuid, text, text) to service_role;

-- 4. Notification client à la livraison : réutilise le mécanisme existant
-- (notifyReservationStatusChanged est déclenché côté server functions, pas ici).
