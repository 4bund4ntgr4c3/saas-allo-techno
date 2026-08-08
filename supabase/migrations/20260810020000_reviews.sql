-- Avis clients vérifiés + invitations
-- ====================================================================
-- Deux blocs :
--   1. reviews : avis clients issus d'invitations après livraison,
--      modérés par l'atelier (en attente → publié / masqué).
--   2. review_invites : liens secrets uniques envoyés aux clients après
--      livraison (même mécanique que le jeton de devis : un seul avis
--      par dossier, aucune session requise).
--
-- La table `reviews` (ancien schéma name/city/text/device, éditée en
-- backoffice) est migrée vers le nouveau schéma : les avis existants
-- deviennent « publiés » (ils étaient déjà visibles publiquement) et les
-- nouvelles colonnes NOT NULL sont complétées depuis l'ancien schéma.

-- --------------------------------------------------------------------
-- 1. Reviews — nouveau schéma modéré
-- --------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid null references public.reservations(id) on delete set null,
  customer_name text not null,
  phone text not null,
  email text null,
  rating int not null check (rating between 1 and 5),
  comment text not null check (char_length(comment) between 3 and 2000),
  status text not null default 'pending' check (status in ('pending', 'published', 'hidden')),
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- Migration de l'ancien schéma (si la table existait déjà).
alter table public.reviews
  add column if not exists reservation_id uuid references public.reservations(id) on delete set null,
  add column if not exists customer_name text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists comment text,
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'published', 'hidden')),
  add column if not exists verified boolean not null default false;

-- Reprise des avis existants (ancien schéma) en « publiés ».
update public.reviews
   set customer_name = name,
       phone = '',
       comment = text,
       status = 'published'
 where customer_name is null;

alter table public.reviews
  alter column customer_name set not null,
  alter column phone set not null,
  alter column comment set not null;

-- Suppression des colonnes de l'ancien schéma.
alter table public.reviews
  drop column if exists name,
  drop column if exists city,
  drop column if exists device,
  drop column if exists text;

-- Lecture publique restreinte aux avis publiés. L'insertion passe
-- exclusivement par les server functions (service_role) : aucune policy
-- INSERT pour anon/authenticated.
alter table public.reviews enable row level security;

drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read"
  on public.reviews for select
  using (status = 'published');

revoke all on public.reviews from anon, authenticated;
grant select on public.reviews to anon, authenticated;

create index if not exists reviews_status_created_idx
  on public.reviews (status, created_at desc);

-- --------------------------------------------------------------------
-- 2. Invitations à laisser un avis
-- --------------------------------------------------------------------
create table if not exists public.review_invites (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  token text not null unique,
  sent_at timestamptz not null default now(),
  used_at timestamptz null,
  created_at timestamptz not null default now()
);

alter table public.review_invites enable row level security;

-- Aucun accès anon/authenticated : le jeton ne se valide que via les
-- server functions (service_role), comme le jeton de devis.
revoke all on public.review_invites from anon, authenticated;
grant all on public.review_invites to service_role;

create index if not exists review_invites_reservation_idx
  on public.review_invites (reservation_id);
