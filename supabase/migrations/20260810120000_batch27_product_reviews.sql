-- Batch 27: Product reviews for accessories
-- Table product_reviews + RPCs

create table if not exists product_reviews (
  id uuid default gen_random_uuid() primary key,
  product_slug text not null,
  name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  text text not null,
  created_at timestamptz default now() not null
);

-- Index for fast lookups by product
create index if not exists idx_product_reviews_slug on product_reviews (product_slug);

-- RLS: anyone can read, anyone can insert (anonymous reviews)
alter table product_reviews enable row level security;

create policy "Anyone can read product reviews"
  on product_reviews for select
  using (true);

create policy "Anyone can insert product reviews"
  on product_reviews for insert
  with check (true);

-- RPC: get reviews for a product
create or replace function get_product_reviews(_product_slug text)
returns setof product_reviews
language sql stable
as $$
  select * from product_reviews
  where product_slug = _product_slug
  order by created_at desc
  limit 50;
$$;

-- RPC: get average rating for a product
create or replace function get_product_rating(_product_slug text)
returns json
language sql stable
as $$
  select json_build_object(
    'avg', coalesce(round(avg(rating)::numeric, 1), 0),
    'count', count(*)::int
  )
  from product_reviews
  where product_slug = _product_slug;
$$;
