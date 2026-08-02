-- Roles
create type public.app_role as enum ('admin', 'staff', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create policy "Users can view their own roles"
on public.user_roles for select to authenticated
using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role in ('admin','staff')
  )
$$;

-- Status history
create table public.reservation_status_history (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  old_status public.reservation_status,
  new_status public.reservation_status not null,
  note text,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index reservation_status_history_reservation_idx
  on public.reservation_status_history (reservation_id, created_at desc);

grant select on public.reservation_status_history to authenticated;
grant all on public.reservation_status_history to service_role;

alter table public.reservation_status_history enable row level security;

create policy "Staff can view all status history"
on public.reservation_status_history for select to authenticated
using (public.is_staff(auth.uid()));

create policy "Owners can view their reservation history"
on public.reservation_status_history for select to authenticated
using (
  exists (
    select 1 from public.reservations r
    where r.id = reservation_status_history.reservation_id
      and r.user_id = auth.uid()
  )
);

-- Log status changes automatically
create or replace function public.log_reservation_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.reservation_status_history (reservation_id, old_status, new_status, changed_by)
    values (new.id, null, new.status, auth.uid());
  elsif new.status is distinct from old.status then
    insert into public.reservation_status_history (reservation_id, old_status, new_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger reservations_log_status_insert
after insert on public.reservations
for each row execute function public.log_reservation_status_change();

create trigger reservations_log_status_update
after update of status on public.reservations
for each row execute function public.log_reservation_status_change();

-- Backfill initial history for existing reservations
insert into public.reservation_status_history (reservation_id, old_status, new_status, created_at)
select id, null, status, created_at from public.reservations;

-- Staff access to reservations
create policy "Staff can view all reservations"
on public.reservations for select to authenticated
using (public.is_staff(auth.uid()));

create policy "Staff can update reservations"
on public.reservations for update to authenticated
using (public.is_staff(auth.uid()))
with check (public.is_staff(auth.uid()));