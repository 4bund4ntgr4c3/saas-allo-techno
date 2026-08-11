-- Phase 0 B2B : colonnes org_id sur les tables qui deviendront tennantisées.
-- Nullable : l'activité Allô Techno propre (org_id NULL) et l'activité des
-- organisations clientes coexistent. Les admins d'organisation peuvent
-- lire/écrire les lignes de leur organisation ; le staff voit tout.
--
-- NOTE : les tables sont testées via to_regclass car certaines migrations
-- ultérieures (batch21+, workshops/inventory/suppliers...) n'ont pas encore
-- été appliquées sur toutes les bases distantes. Cette migration reste donc
-- exécutable partout et prendra effet sur les tables présentes.

-- 1. reservations (tickets B2B à venir)
alter table public.reservations add column if not exists org_id uuid references public.organizations(id) on delete cascade;
create index if not exists idx_reservations_org on public.reservations (org_id) where org_id is not null;

create policy "reservations_org_admin_all"
on public.reservations for all to authenticated
using (org_id is not null and public.org_is_admin(org_id))
with check (org_id is not null and public.org_is_admin(org_id));

-- 2. workshops (sites des organisations) — si la table existe
do $$
begin
  if to_regclass('public.workshops') is not null then
    alter table public.workshops add column if not exists org_id uuid references public.organizations(id) on delete cascade;
    create index if not exists idx_workshops_org on public.workshops (org_id) where org_id is not null;
    alter table public.workshops enable row level security;

    create policy "workshops_select_org_member"
    on public.workshops for select to authenticated
    using (org_id is null or public.org_is_member(org_id));

    create policy "workshops_org_admin_all"
    on public.workshops for all to authenticated
    using (org_id is not null and public.org_is_admin(org_id))
    with check (org_id is not null and public.org_is_admin(org_id));
  end if;
end $$;

-- 3. leads (prospects B2B)
alter table public.leads add column if not exists org_id uuid references public.organizations(id) on delete cascade;
create index if not exists idx_leads_org on public.leads (org_id) where org_id is not null;

create policy "leads_org_admin_all"
on public.leads for all to authenticated
using (org_id is not null and public.org_is_admin(org_id))
with check (org_id is not null and public.org_is_admin(org_id));

-- 4. inventory_parts + stock_movements (pièces par organisation) — si tables existantes
do $$
begin
  if to_regclass('public.inventory_parts') is not null then
    alter table public.inventory_parts add column if not exists org_id uuid references public.organizations(id) on delete cascade;
    create index if not exists idx_inventory_parts_org on public.inventory_parts (org_id) where org_id is not null;

    alter table public.inventory_parts enable row level security;

    create policy "inventory_parts_select_org_member"
    on public.inventory_parts for select to authenticated
    using (org_id is null or public.org_is_member(org_id));

    create policy "inventory_parts_org_admin_all"
    on public.inventory_parts for all to authenticated
    using (org_id is not null and public.org_is_admin(org_id))
    with check (org_id is not null and public.org_is_admin(org_id));
  end if;
end $$;

do $$
begin
  if to_regclass('public.stock_movements') is not null then
    alter table public.stock_movements add column if not exists org_id uuid references public.organizations(id) on delete cascade;
    create index if not exists idx_stock_movements_org on public.stock_movements (org_id) where org_id is not null;

    alter table public.stock_movements enable row level security;

    create policy "stock_movements_select_org_member"
    on public.stock_movements for select to authenticated
    using (org_id is null or public.org_is_member(org_id));

    create policy "stock_movements_org_admin_all"
    on public.stock_movements for all to authenticated
    using (org_id is not null and public.org_is_admin(org_id))
    with check (org_id is not null and public.org_is_admin(org_id));
  end if;
end $$;

-- 5. suppliers + supplier_orders (fournisseurs par organisation) — si tables existantes
do $$
begin
  if to_regclass('public.suppliers') is not null then
    alter table public.suppliers add column if not exists org_id uuid references public.organizations(id) on delete cascade;
    create index if not exists idx_suppliers_org on public.suppliers (org_id) where org_id is not null;

    alter table public.suppliers enable row level security;

    create policy "suppliers_select_org_member"
    on public.suppliers for select to authenticated
    using (org_id is null or public.org_is_member(org_id));

    create policy "suppliers_org_admin_all"
    on public.suppliers for all to authenticated
    using (org_id is not null and public.org_is_admin(org_id))
    with check (org_id is not null and public.org_is_admin(org_id));
  end if;
end $$;

do $$
begin
  if to_regclass('public.supplier_orders') is not null then
    alter table public.supplier_orders add column if not exists org_id uuid references public.organizations(id) on delete cascade;
    create index if not exists idx_supplier_orders_org on public.supplier_orders (org_id) where org_id is not null;

    alter table public.supplier_orders enable row level security;

    create policy "supplier_orders_select_org_member"
    on public.supplier_orders for select to authenticated
    using (org_id is null or public.org_is_member(org_id));

    create policy "supplier_orders_org_admin_all"
    on public.supplier_orders for all to authenticated
    using (org_id is not null and public.org_is_admin(org_id))
    with check (org_id is not null and public.org_is_admin(org_id));
  end if;
end $$;
