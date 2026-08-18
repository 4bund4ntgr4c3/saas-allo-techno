-- La requete B2B "tickets" (b2b-reminders.functions.ts) selectionne reservations.description
-- pour libeller les tickets de maintenance. La colonne n'a jamais ete creee.
alter table public.reservations
  add column if not exists description text default null;