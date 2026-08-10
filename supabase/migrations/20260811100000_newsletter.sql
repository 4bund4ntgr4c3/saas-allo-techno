-- Newsletter subscribers table
-- Email collection for marketing, with rate limiting handled in code.

create table if not exists public.newsletter_subscribers (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  locale text not null default 'fr' check (locale in ('fr', 'en')),
  active boolean not null default true,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

-- Unique index on email (already enforced by unique constraint above)
-- RLS: anyone can subscribe (insert), only admin can manage
alter table public.newsletter_subscribers enable row level security;

-- Allow anonymous inserts (newsletter signup)
create policy "Anyone can subscribe to newsletter"
  on public.newsletter_subscribers
  for insert
  with check (true);

-- Allow authenticated users to view (admin dashboard)
create policy "Authenticated users can view newsletter subscribers"
  on public.newsletter_subscribers
  for select
  using (auth.role() = 'authenticated');

-- Index for active subscribers
create index if not exists idx_newsletter_active
  on public.newsletter_subscribers (active)
  where active = true;
