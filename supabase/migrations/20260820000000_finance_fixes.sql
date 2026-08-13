-- Correctifs finance/bloc F2-F3-H1 de l'audit (2026-08-20)
-- ========================================================
-- 1. increment_inventory : restitution du stock (annulation / échec de commande)
-- 2. update_reservation_payment : gestion des acomptes (statut 'partial' quand le
--    total réglé n'atteint pas le devis, et non plus seulement 'paid'/'failed').

-- 1. Restitution du stock (miroir de decrement_inventory)
create or replace function public.increment_inventory(_slug text, _qty int)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  updated int;
begin
  if _slug is null or trim(_slug) = '' or _qty <= 0 then
    raise exception 'Quantite invalide';
  end if;

  update public.inventory
     set quantity = quantity + _qty
   where slug = _slug
   returning 1 into updated;

  if updated is null then
    return false;
  end if;

  return true;
end;
$$;

revoke all on function public.increment_inventory(text, int) from public;
grant execute on function public.increment_inventory(text, int) to service_role;

-- 2. Paiement partiel (acompte) : le statut reporté sur la réservation est
--    calculé d'après la somme des paiements confirmés, pas d'après le dernier
--    événement seul :
--      - total réglé >= devis  -> 'paid'
--      - total réglé > 0       -> 'partial' (acompte, solde à la remise)
--      - aucun règlement       -> _status (failed / refunded / …)
--    Un paiement en échec n'efface plus un acompte déjà versé.
create or replace function public.update_reservation_payment(_reference text, _status text, _tx_id text)
returns void
language plpgsql
set search_path = public
as $$
declare
  p public.payments;
  v_quote_amount numeric;
  v_paid numeric;
begin
  select * into p
    from public.payments
   where reference = _reference and source = 'reservation'
   order by created_at desc
   limit 1;

  if p.id is null then
    return;
  end if;

  update public.payments
     set status = _status::public.payment_status,
         tx_id = coalesce(_tx_id, tx_id)
   where id = p.id;

  select quote_amount into v_quote_amount
    from public.reservations
   where reference = _reference;

  select coalesce(sum(amount), 0) into v_paid
    from public.payments
   where reference = _reference and source = 'reservation' and status = 'paid';

  if _status = 'paid' then
    update public.reservations
       set payment_status = case
             when v_paid >= coalesce(v_quote_amount, v_paid) then 'paid'
             else 'partial'
           end,
           payment_ref = p.id::text,
           updated_at = now()
     where reference = _reference;
  elsif _status = 'failed' and v_paid > 0 then
    update public.reservations
       set payment_status = 'partial',
           payment_ref = p.id::text,
           updated_at = now()
     where reference = _reference;
  else
    update public.reservations
       set payment_status = _status,
           payment_ref = p.id::text,
           updated_at = now()
     where reference = _reference;
  end if;
end;
$$;

revoke all on function public.update_reservation_payment(text, text, text) from public;
grant execute on function public.update_reservation_payment(text, text, text) to service_role;
