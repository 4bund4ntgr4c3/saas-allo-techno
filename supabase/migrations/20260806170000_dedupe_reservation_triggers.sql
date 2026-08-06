-- Correction : doublons de triggers sur reservations.
-- La migration 20260802165746 a recréé les triggers sous le préfixe `trg_*`
-- sans supprimer les originaux (`reservations_*`). Résultat : chaque
-- création/changement de statut écrivait 2 lignes d'historique et mettait
-- `updated_at` à jour deux fois.
--
-- Convention retenue (voir 20260803120000, qui garde `reservations_validate_slot`) :
-- on garde les triggers originaux `reservations_*` et on supprime les doublons `trg_*`.

DROP TRIGGER IF EXISTS trg_reservations_status_history ON public.reservations;
DROP TRIGGER IF EXISTS trg_reservations_updated_at ON public.reservations;
DROP TRIGGER IF EXISTS trg_reservations_validate_slot ON public.reservations;
