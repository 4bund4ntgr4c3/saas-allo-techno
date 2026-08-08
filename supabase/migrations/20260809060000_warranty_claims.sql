-- Réclamations de garantie en ligne
-- ====================================================================
-- Permet à un client de déclarer un problème sous garantie via un
-- formulaire public, puis à l'atelier de traiter la prise en charge
-- depuis l'admin. Les serveur functions écrivent sous service_role ;
-- la lecture côté admin passe par une RLS dédiée au staff.

-- 1. Table des réclamations
create table if not exists public.warranty_claims (
  id uuid primary key default gen_random_uuid(),
  reference text not null,                 -- CL-2026-NNNN (numéro de dossier)
  reservation_reference text,              -- dossier AT-YYYY-NNNN si le client le connaît
  name text not null,
  phone text not null,
  email text,
  device text,                             -- appareil concerné (libre)
  message text not null,                   -- description du problème
  status text not null default 'nouveau',  -- nouveau | en_cours | acceptee | refuse | cloturee
  staff_note text,                          -- note / réponse de l'atelier
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.warranty_claims enable row level security;

-- Lecture réservée au staff (admin/technicien) et au service_role.
drop policy if exists "warranty_claims_staff_read" on public.warranty_claims;
create policy "warranty_claims_staff_read"
  on public.warranty_claims for select
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role in ('admin', 'staff')
    )
  );

revoke all on public.warranty_claims from anon, authenticated;

-- 2. Référence unique CL-YYYY-NNNN
create sequence if not exists public.warranty_claim_ref_seq;
create or replace function public.next_claim_reference()
returns text
language plpgsql
set search_path = public
as $$
declare
  n bigint := nextval('public.warranty_claim_ref_seq');
begin
  return 'CL-' || to_char(now(), 'YYYY') || '-' || lpad(n::text, GREATEST(4, length(n::text)), '0');
end;
$$;
revoke all on function public.next_claim_reference() from public;
grant execute on function public.next_claim_reference() to service_role;

-- 3. Mise à jour du traitement (statut + note) par le staff via serveur function
--    (service_role) : pas de RPC dédiée nécessaire, la TS vérifie is_staff.