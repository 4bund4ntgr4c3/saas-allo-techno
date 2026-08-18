-- RLS hardening — restreindre les tables sensibles au personnel (admin/staff).
-- À appliquer via `supabase db push` ou l'éditeur SQL du dashboard.

-- 1. Marketing : campagnes et envois (PII, envoi massif) — staff uniquement.
drop policy if exists "Staff can manage campaigns" on public.marketing_campaigns;
create policy "staff_manage_campaigns"
  on public.marketing_campaigns
  for all to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

drop policy if exists "Staff can manage sends" on public.campaign_sends;
create policy "staff_manage_campaign_sends"
  on public.campaign_sends
  for all to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

-- 2. Signatures de remise (nom client + signature + IP) — staff uniquement.
drop policy if exists "Staff can manage signatures" on public.handoff_signatures;
drop policy if exists "Clients can read their reservation signature" on public.handoff_signatures;
create policy "staff_manage_signatures"
  on public.handoff_signatures
  for all to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

-- 3. Newsletter : lecture des emails — staff uniquement (l'insertion anonyme reste ouverte).
drop policy if exists "Authenticated users can view newsletter subscribers" on public.newsletter_subscribers;
create policy "staff_read_newsletter_subscribers"
  on public.newsletter_subscribers
  for select to authenticated
  using (public.is_staff(auth.uid()));

-- 4. Recherche : lecture des requêtes — staff uniquement (l'insertion anonyme reste ouverte).
drop policy if exists "Authenticated users can view search queries" on public.search_queries;
create policy "staff_read_search_queries"
  on public.search_queries
  for select to authenticated
  using (public.is_staff(auth.uid()));

-- 5. Commentaires de réservation : insertion limitée au staff ou au client
--    porteur de la référence dans ses claims JWT (les écritures applicatives
--    passent par le RPC add_reservation_comment sous service_role).
drop policy if exists "reservation_comments_insert" on public.reservation_comments;
create policy "reservation_comments_insert_scoped"
  on public.reservation_comments
  for insert
  with check (
    public.is_staff(auth.uid())
    or reservation_id in (
      select id from public.reservations
      where reference = current_setting('request.jwt.claims', true)::json->>'reservation_reference'
    )
  );