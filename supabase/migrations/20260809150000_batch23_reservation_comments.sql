-- Batch 23: reservation comments (customer + staff)
-- =====================================================

create table if not exists public.reservation_comments (
  id          uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  author      text not null default 'customer',  -- 'customer' | 'staff'
  author_name text,
  body        text not null,
  created_at  timestamptz not null default now()
);

alter table public.reservation_comments enable row level security;

-- Customers can read comments on their own reservations
create policy "reservation_comments_read_own"
  on public.reservation_comments
  for select
  using (
    reservation_id in (
      select id from public.reservations
      where reference = current_setting('request.jwt.claims', true)::json->>'reservation_reference'
    )
  );

-- Staff can read all comments
create policy "reservation_comments_read_staff"
  on public.reservation_comments
  for select
  using (public.is_staff());

-- Anyone can insert (rate-limited server-side)
create policy "reservation_comments_insert"
  on public.reservation_comments
  for insert
  with check (true);

-- Index for fast lookup by reservation
create index if not exists reservation_comments_reservation_idx
  on public.reservation_comments (reservation_id, created_at asc);

-- Public RPC: list comments for a reservation (by reference + tracking code)
create or replace function public.get_reservation_comments(
  _reference text,
  _code      text
)
returns table (
  id         uuid,
  author     text,
  author_name text,
  body       text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  _reservations_id uuid;
  _hash            text;
begin
  select id, tracking_code_hash
    into _reservations_id, _hash
  from public.reservations
  where reference = _reference;

  if _reservations_id is null then
    return;
  end if;

  -- Verify tracking code
  if not public.verify_tracking_code(_code, _hash) then
    return;
  end if;

  return query
    select rc.id, rc.author, rc.author_name, rc.body, rc.created_at
    from public.reservation_comments rc
    where rc.reservation_id = _reservations_id
    order by rc.created_at asc;
end;
$$;

-- Public RPC: add a comment
create or replace function public.add_reservation_comment(
  _reference  text,
  _code       text,
  _author     text default 'customer',
  _author_name text default null,
  _body       text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _reservations_id uuid;
  _hash            text;
  _comment_id      uuid;
begin
  select id, tracking_code_hash
    into _reservations_id, _hash
  from public.reservations
  where reference = _reference;

  if _reservations_id is null then
    raise exception 'Reservation not found';
  end if;

  if not public.verify_tracking_code(_code, _hash) then
    raise exception 'Invalid tracking code';
  end if;

  insert into public.reservation_comments (reservation_id, author, author_name, body)
  values (_reservations_id, _author, _author_name, _body)
  returning id into _comment_id;

  return _comment_id;
end;
$$;

grant execute on function public.get_reservation_comments(text, text) to anon, authenticated;
grant execute on function public.add_reservation_comment(text, text, text, text, text) to anon, authenticated;
