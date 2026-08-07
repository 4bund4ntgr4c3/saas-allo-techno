-- Contenu éditable + inventaire boutique
-- ====================================================================
-- Trois blocs :
--   1. blog_posts : articles de blog gérés via le backoffice (charge dynamique,
--      avec repli sur les données statiques si la table est vide).
--   2. reviews : avis clients éditables (au lieu des REVIEWS statiques).
--   3. inventory : stock réel par accessoire + RPC de décrément atomique.

-- --------------------------------------------------------------------
-- 1. Articles de blog
-- --------------------------------------------------------------------
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null,
  date date not null,
  category text not null default 'Guides',
  reading_time text not null default '5 min',
  body text not null default '[]' -- tableau JSON de paragraphes (compat Post[])
);

alter table public.blog_posts enable row level security;

-- Lecture publique (le blog est non connecté). Écriture réservée au
-- service_role (server functions), jamais exposée à anon/authenticated.
drop policy if exists "blog_posts_public_read" on public.blog_posts;
create policy "blog_posts_public_read"
  on public.blog_posts for select using (true);

revoke all on public.blog_posts from anon, authenticated;
grant select on public.blog_posts to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Avis clients (éditables)
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null default '',
  rating int not null check (rating between 1 and 5),
  text text not null,
  device text not null default '',
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read"
  on public.reviews for select using (true);

revoke all on public.reviews from anon, authenticated;
grant select on public.reviews to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Inventaire boutique
-- ---------------------------------------------------------------------------
create table if not exists public.inventory (
  slug text primary key,             -- = Accessory.slug (src/data/catalog/accessories.ts)
  quantity int not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now()
);

alter table public.inventory enable row level security;

drop policy if exists "inventory_public_read" on public.inventory;
create policy "inventory_public_read"
  on public.inventory for select using (true);

revoke all on public.inventory from anon, authenticated;
grant select on public.inventory to anon, authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_inventory_updated_at
  before update on public.inventory
  for each row execute function public.set_updated_at();

-- Décrément atomique sécurisé du stock: échoue si quantité insuffisante.
-- Utilisé par la server function submitShopOrder (service_role) pour réserver
-- la quantité réellement commandée côté boutique.
--
-- Règles : si aucun produit n'est suivi en inventaire (ligne absente) on accepte
-- la commande ; si le produit est suivi et que le stock est insuffisant on
-- refuse (retour false). Contrat renvoyé -- true=accepté, false=stock insuffisant.
create or replace function public.decrement_inventory(_slug text, _qty int)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  updated int;
begin
  if _slug is null or trim(_slug) = '' or _qty <= 0 then
    raise exception 'Quantité invalide';
  end if;

  update public.inventory
     set quantity = quantity - _qty
   where slug = _slug and quantity >= _qty
   returning 1 into updated;

  -- Aucune ligne : produit non suivi -> on accepte la commande.
  if updated is null then
    if not exists (select 1 from public.inventory where slug = _slug) then
      return true;
    end if;
    return false;
  end if;

  return true;
end;
$$;

revoke all on function public.decrement_inventory(text, int) from public;
grant execute on function public.decrement_inventory(text, int) to service_role;