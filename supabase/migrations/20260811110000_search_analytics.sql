-- Search analytics: log user search queries for insights.

create table if not exists public.search_queries (
  id uuid default gen_random_uuid() primary key,
  query text not null,
  locale text not null default 'fr',
  result_count integer not null default 0,
  searched_at timestamptz not null default now()
);

alter table public.search_queries enable row level security;

-- Anonymous can insert (search tracking)
create policy "Anyone can log searches"
  on public.search_queries
  for insert
  with check (true);

-- Only authenticated (admin) can read
create policy "Authenticated users can view search queries"
  on public.search_queries
  for select
  using (auth.role() = 'authenticated');

-- Index for popular searches
create index if not exists idx_search_queries_query
  on public.search_queries (query);

create index if not exists idx_search_queries_date
  on public.search_queries (searched_at desc);
