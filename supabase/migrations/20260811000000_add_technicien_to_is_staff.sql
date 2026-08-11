-- L'espace /admin/dossiers (kanban / atelier) est destiné aussi aux techniciens.
-- is_staff() contrôlait l'accès à tout le back-office avec les seuls rôles admin/staff ;
-- on ajoute 'technicien' pour que l'équipe technique puisse traiter les dossiers.

create or replace function public.is_staff(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role in ('admin','staff','technicien')
  )
$$;
