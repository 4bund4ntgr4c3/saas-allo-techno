-- =====================================================
-- 2026-08-24 — Restriction KPI et codes promo
-- Réf. audit sécurité : v_kpi_summary lisible par tout
-- client connecté (CA total payé + volumes), promo_codes
-- en SELECT public (codes énumérables par scrappers).
-- Aucune utilisation applicative directe de ces accès
-- (tout passe par service role / RPC validate_promo).
-- =====================================================

-- v_kpi_summary : agrégats financiers internes → retiré aux clients
revoke select on public.v_kpi_summary from anon, authenticated;

-- promo_codes : la validation passe par le RPC validate_promo
-- (exécutable service role uniquement) ; le SELECT public expose les codes.
drop policy if exists "promo_codes_public_read" on public.promo_codes;
revoke select on public.promo_codes from anon;