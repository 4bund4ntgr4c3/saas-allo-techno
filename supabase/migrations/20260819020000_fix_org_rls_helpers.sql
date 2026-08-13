-- Répare les policies de facturation/maintenance B2B
-- (20260818000000_b2b_billing_maintenance.sql) qui appellent
-- org_is_member(org_id, auth.uid()) et org_is_admin(org_id, auth.uid()) à
-- DEUX arguments, alors que les helpers (20260815000000_b2b_organizations.sql)
-- n'existaient qu'à UN argument (_org_id). Toute évaluation de policy levait
-- une erreur (« function does not exist ») et verrouillait complètement
-- organization_invoices, organization_invoice_items et
-- equipment_maintenance_schedules.
-- On ajoute ici les surcharges à deux arguments (organisation + utilisateur).

create or replace function public.org_is_member(_org_id uuid, _user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = _org_id and user_id = _user_id
  );
$$;

create or replace function public.org_is_admin(_org_id uuid, _user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = _org_id and user_id = _user_id and role = 'admin_org'
  );
$$;
