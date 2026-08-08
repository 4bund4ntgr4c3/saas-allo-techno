-- Rappels automatisés (WhatsApp + e-mail) — table de déduplication.
-- ====================================================================
-- Chaque dossier n'est notifié qu'une fois par type de rappel : l'unicité
-- (type, ref) sert de verrou anti-doublon même si le job tourne en parallèle
-- (insertion AVANT l'envoi ; conflit 23505 ⇒ dossier déjà traité, ignoré).
-- L'écriture se fait sous service_role via l'API cron ; personne d'autre
-- n'a besoin d'accéder à cette table.

create table if not exists public.scheduled_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,                              -- rdv_reminder | quote_relance | ready_alert
  ref text not null,                               -- référence du dossier (AT-YYYY-NNNN)
  created_at timestamptz not null default now(),
  constraint scheduled_notifications_type_ref_key unique (type, ref)
);

alter table public.scheduled_notifications enable row level security;

revoke all on public.scheduled_notifications from anon, authenticated;

create index if not exists scheduled_notifications_type_idx
  on public.scheduled_notifications (type);
