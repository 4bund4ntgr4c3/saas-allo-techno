-- =====================================================
-- 2026-08-23 — Durcissement RLS : clôture des accès anon
-- Réf. audit sécurité : S1-S4 + élévés (reviews PII,
-- product_reviews, storage device-photos, commentaires,
-- policy UPDATE réservations trop large)
-- =====================================================

-- 1. chat_messages : RLS absente → staff only
alter table public.chat_messages enable row level security;

create policy "chat_messages_staff_all"
  on public.chat_messages for all
  to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

revoke all on public.chat_messages from anon;

-- 2. referrals : RLS absente → lecteur : soi-même ; tout : staff
alter table public.referrals enable row level security;

create policy "referrals_read_own"
  on public.referrals for select
  to authenticated
  using (referrer_id = auth.uid());

create policy "referrals_staff_all"
  on public.referrals for all
  to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

revoke all on public.referrals from anon;

-- 3. saved_reports : RLS absente → staff only
alter table public.saved_reports enable row level security;

create policy "saved_reports_staff_all"
  on public.saved_reports for all
  to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

revoke all on public.saved_reports from anon;

-- 4. google_reviews_cache : RLS absente → staff only (le site lit via service role)
alter table public.google_reviews_cache enable row level security;

create policy "google_reviews_cache_staff_all"
  on public.google_reviews_cache for all
  to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

revoke all on public.google_reviews_cache from anon;

-- 5. marketing_campaigns / campaign_sends : policies `using (true)` sans TO → PUBLIC
drop policy if exists "Staff can manage campaigns" on public.marketing_campaigns;
create policy "marketing_campaigns_staff_all"
  on public.marketing_campaigns for all
  to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

drop policy if exists "Staff can manage sends" on public.campaign_sends;
create policy "campaign_sends_staff_all"
  on public.campaign_sends for all
  to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

revoke all on public.marketing_campaigns, public.campaign_sends from anon;

-- 6. outbound_webhooks (colonne `secret`) / webhook_logs : policies publiques → staff only
drop policy if exists "Staff can manage webhooks" on public.outbound_webhooks;
create policy "outbound_webhooks_staff_all"
  on public.outbound_webhooks for all
  to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

drop policy if exists "Staff can read webhook logs" on public.webhook_logs;
drop policy if exists "Staff can insert webhook logs" on public.webhook_logs;
create policy "webhook_logs_staff_all"
  on public.webhook_logs for all
  to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

revoke all on public.outbound_webhooks, public.webhook_logs from anon;

-- 7. get_client_segments / get_segment_counts : `security definer` exécutables par anon
--    → revoke + garde jwt (service role passe, anon bloqué, authenticated non-staff bloqué)
revoke execute on function public.get_client_segments() from anon, public;
revoke execute on function public.get_segment_counts() from anon, public;
grant execute on function public.get_client_segments() to authenticated;
grant execute on function public.get_segment_counts() to authenticated;

create or replace function public.get_client_segments()
returns json
language sql
security definer
set search_path = public
as $$
  select case
    when coalesce(auth.jwt() ->> 'role', '') = 'anon' then null
    when coalesce(auth.jwt() ->> 'role', '') = 'authenticated'
         and not public.is_staff(auth.uid()) then null
    else (
      with client_stats as (
        select
          phone,
          customer_name,
          email,
          count(*) as frequency,
          max(created_at) as last_order,
          extract(day from now() - max(created_at)) as recency_days,
          coalesce(sum(case when payment_status = 'paid' then quote_amount else 0 end), 0) as monetary
        from reservations
        where phone is not null and phone != ''
          and status not in ('annulee')
        group by phone, customer_name, email
      ),
      segmented as (
        select
          *,
          case
            when frequency >= 5 and monetary >= 200000 then 'vip'
            when frequency >= 3 then 'loyal'
            when recency_days <= 90 then 'active'
            when recency_days > 180 then 'inactive'
            else 'new'
          end as segment
        from client_stats
      )
      select json_agg(json_build_object(
        'phone', phone,
        'customer_name', customer_name,
        'email', email,
        'frequency', frequency,
        'recency_days', recency_days::int,
        'monetary', monetary,
        'segment', segment
      ) order by
        case segment
          when 'vip' then 1
          when 'loyal' then 2
          when 'active' then 3
          when 'new' then 4
          when 'inactive' then 5
        end,
        monetary desc)
      from segmented
    )
  end;
$$;

create or replace function public.get_segment_counts()
returns json
language sql
security definer
set search_path = public
as $$
  select case
    when coalesce(auth.jwt() ->> 'role', '') = 'anon' then null
    when coalesce(auth.jwt() ->> 'role', '') = 'authenticated'
         and not public.is_staff(auth.uid()) then null
    else (
      with client_stats as (
        select
          phone,
          count(*) as frequency,
          max(created_at) as last_order,
          extract(day from now() - max(created_at)) as recency_days,
          coalesce(sum(case when payment_status = 'paid' then quote_amount else 0 end), 0) as monetary
        from reservations
        where phone is not null and phone != ''
          and status not in ('annulee')
        group by phone
      ),
      segmented as (
        select
          case
            when frequency >= 5 and monetary >= 200000 then 'vip'
            when frequency >= 3 then 'loyal'
            when recency_days <= 90 then 'active'
            when recency_days > 180 then 'inactive'
            else 'new'
          end as segment
        from client_stats
      )
      select json_build_object(
        'vip', count(*) filter (where segment = 'vip'),
        'loyal', count(*) filter (where segment = 'loyal'),
        'active', count(*) filter (where segment = 'active'),
        'new', count(*) filter (where segment = 'new'),
        'inactive', count(*) filter (where segment = 'inactive'),
        'total', count(*)
      )
      from segmented
    )
  end;
$$;

-- 8. reviews : le SELECT public expose phone/email → staff only (le site lit via service role)
drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_staff_read"
  on public.reviews for select
  to authenticated
  using (public.is_staff(auth.uid()));

revoke select on public.reviews from anon;

-- 9. product_reviews : INSERT anon `with check (true)` → authenticated only
drop policy if exists "Anyone can insert product reviews" on public.product_reviews;
create policy "product_reviews_insert_auth"
  on public.product_reviews for insert
  to authenticated
  with check (true);

create policy "product_reviews_staff_delete"
  on public.product_reviews for delete
  to authenticated
  using (public.is_staff(auth.uid()));

revoke insert, update, delete on public.product_reviews from anon;

-- 10. Storage device-photos : anon INSERT (spam) et UPDATE global (tampering) retirés
drop policy if exists "device-photos-anon-insert" on storage.objects;
drop policy if exists "device-photos-auth-update" on storage.objects;

-- 11. reservation_comments : INSERT `with check (true)` → authenticated only
drop policy if exists "reservation_comments_insert" on public.reservation_comments;
create policy "reservation_comments_insert_auth"
  on public.reservation_comments for insert
  to authenticated
  with check (true);

-- 12. add_reservation_comment : garde jwt (anon bloqué), _author forcé côté serveur
create or replace function public.add_reservation_comment(
  _reference  text,
  _code       text,
  _body       text,
  _author     text default 'customer',
  _author_name text default null
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
  if coalesce(auth.jwt() ->> 'role', '') = 'anon' then
    raise exception 'Not allowed';
  end if;

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

  -- _author est toujours forcé côté serveur : un appelant direct ne peut pas
  -- s'usurper 'staff'
  _author := 'customer';

  insert into public.reservation_comments (reservation_id, author, author_name, body)
  values (_reservations_id, _author, _author_name, _body)
  returning id into _comment_id;

  return _comment_id;
end;
$$;

revoke execute on function public.add_reservation_comment(text, text, text, text, text) from anon;
revoke execute on function public.get_reservation_comments(text, text) from anon;

-- 13. Policy UPDATE réservations : is_staff inclut 'technicien' → un technicien peut
--     modifier n'importe quelle réservation. Restreint à admin/staff (le technicien
--     passe par le RPC technician_set_reservation_status qui vérifie l'affectation).
drop policy if exists "Staff can update reservations" on public.reservations;
create policy "admin_staff_can_update_reservations"
  on public.reservations for update to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'))
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'));