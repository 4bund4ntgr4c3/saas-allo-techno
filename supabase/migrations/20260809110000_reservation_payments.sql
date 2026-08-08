-- Paiement en ligne des devis approuvés (réservations) — Flutterwave Mobile Money
-- ====================================================================
-- Réutilise la table `payments` existante (source='reservation') pour stocker
-- l'initiation et le statut des paiements (MTN MoMo, Moov Money, Celtiis) des
-- devis approuvés. Le statut est aussi reporté sur la réservation pour le
-- tableau de bord client. Le webhook Flutterwave (route /api/flutterwave-webhook)
-- met à jour le statut côté serveur via la RPC ci-dessous.

-- 1. Statut de paiement + référence sur la réservation
alter table public.reservations
  add column if not exists payment_status text not null default 'pending',  -- pending | paid | failed
  add column if not exists payment_ref text;                                -- id du paiement (payments.id)

-- 2. Mise à jour du statut depuis le webhook (service_role uniquement)
--    Met à jour le paiement (source='reservation') et reporte le statut sur la
--    réservation correspondante. Fonction idempotente : si la réservation est
--    introuvable, elle ne fait rien.
create or replace function public.update_reservation_payment(_reference text, _status text, _tx_id text)
returns void
language plpgsql
set search_path = public
as $$
declare
  p public.payments;
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

  update public.reservations
     set payment_status = _status,
         payment_ref = p.id::text,
         updated_at = now()
   where reference = _reference;
end;
$$;

revoke all on function public.update_reservation_payment(text, text, text) from public;
grant execute on function public.update_reservation_payment(text, text, text) to service_role;
