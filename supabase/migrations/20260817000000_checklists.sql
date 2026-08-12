-- Batch 37: Intake & QA Checklist on reservations table
-- =======================================================

alter table public.reservations 
  add column if not exists intake_checklist jsonb default null,
  add column if not exists qa_checklist jsonb default null;

-- Index for searching reservations with completed/pending checklists
create index if not exists idx_reservations_intake_checklist 
  on public.reservations using gin (intake_checklist)
  where intake_checklist is not null;

create index if not exists idx_reservations_qa_checklist 
  on public.reservations using gin (qa_checklist)
  where qa_checklist is not null;
