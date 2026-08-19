-- =====================================================
-- 2026-08-26 — Audit 2026-08-19 : C1 + C2
-- C1 : policy UPDATE réservations (client) → uniquement
--      passage en 'annulee', aucune autre colonne modifiable
-- C2 : RLS sur les 8 tables batch22 restées sans RLS
--      (toutes accessibles uniquement via service role)
-- =====================================================

-- ---------- C1 : durcissement de l'annulation client ----------

-- Le WITH CHECK ne peut pas comparer à l'ancienne ligne : seule la
-- restriction de statut y est exprimée. La vraie garantie (aucune
-- colonne autre que `status` modifiable par le propriétaire) est
-- portée par le trigger BEFORE UPDATE ci-dessous, insensible aux
-- colonnes ajoutées ultérieurement (comparaison jsonb).
drop policy if exists "reservations_cancel_own" on public.reservations;
create policy "reservations_cancel_own"
  on public.reservations for update to authenticated
  using (auth.uid() = user_id and status in ('en_attente', 'confirmee'))
  with check (auth.uid() = user_id and status in ('en_attente', 'confirmee', 'annulee'));

create or replace function public.restrict_owner_reservation_update()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  _new jsonb;
  _old jsonb;
begin
  -- Service role (staff/API) et staff authentifié : passage libre.
  if auth.uid() is null or public.is_staff(auth.uid()) then
    return new;
  end if;

  -- Annulation uniquement : status -> 'annulee' depuis en_attente/confirmee.
  if new.status is distinct from old.status then
    if new.status <> 'annulee' or old.status not in ('en_attente', 'confirmee') then
      raise exception 'Changement de statut non autorisé sur cette réservation';
    end if;
  end if;

  -- Aucune autre colonne ne peut changer (updated_at est posé par un
  -- trigger dédié et exclu de la comparaison).
  _new := to_jsonb(new) - 'updated_at';
  _old := to_jsonb(old) - 'updated_at';
  if (_new - 'status') <> (_old - 'status') then
    raise exception 'Modification non autorisée sur cette réservation';
  end if;

  return new;
end;
$$;

create trigger restrict_owner_reservation_update
  before update on public.reservations
  for each row execute function public.restrict_owner_reservation_update();

-- ---------- C2 : RLS sur les tables batch22 ----------

alter table public.sla_configs enable row level security;
create policy "sla_configs_staff_all" on public.sla_configs for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

alter table public.satisfaction_surveys enable row level security;
create policy "satisfaction_surveys_staff_all" on public.satisfaction_surveys for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

alter table public.internal_notifications enable row level security;
create policy "internal_notifications_staff_all" on public.internal_notifications for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

alter table public.extended_warranties enable row level security;
create policy "extended_warranties_staff_all" on public.extended_warranties for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

alter table public.scheduled_reports enable row level security;
create policy "scheduled_reports_staff_all" on public.scheduled_reports for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

alter table public.escalation_rules enable row level security;
create policy "escalation_rules_staff_all" on public.escalation_rules for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

alter table public.escalation_events enable row level security;
create policy "escalation_events_staff_all" on public.escalation_events for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

alter table public.kb_articles enable row level security;
create policy "kb_articles_staff_all" on public.kb_articles for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- Accès anon (API REST non authentifiée) fermé sur les 8 tables
revoke all on public.sla_configs, public.satisfaction_surveys, public.internal_notifications,
  public.extended_warranties, public.scheduled_reports, public.escalation_rules,
  public.escalation_events, public.kb_articles from anon;
