-- Atelier : assignation d'un technicien à chaque dossier de réparation.
-- La colonne vit sur reservations (et non sur technician_assignments) pour
-- que le tableau kanban de l'atelier puisse la lire et la mettre à jour
-- simplement, avec un index pour le filtrage par technicien.
-- Si le compte technicien est supprimé, le dossier redevient non assigné.

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS assigned_technician_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_assigned_technician
  ON public.reservations (assigned_technician_id);
