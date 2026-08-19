-- =====================================================
-- 2026-08-26 — Audit 2026-08-19 : M3
-- Consommation des codes promo : used_count n'était
-- jamais incrémenté (single-use utilisable à l'infini).
-- =====================================================

-- Incrément atomique (garde single_use dans le WHERE) : la fonction
-- retourne false si le code est inconnu ou déjà utilisé — aucun risque
-- de course entre deux commandes concurrentes.
create or replace function public.consume_promo(_code text)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  _used int;
begin
  update public.promo_codes
     set used_count = used_count + 1
   where code = upper(trim(_code))
     and (not single_use or used_count < 1)
  returning used_count into _used;

  return _used is not null;
end;
$$;

-- Appelé par la server function (via service role) uniquement, comme validate_promo.
revoke all on function public.consume_promo(text) from public;
grant execute on function public.consume_promo(text) to service_role;
