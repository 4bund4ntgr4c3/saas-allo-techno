-- Parcours de réparation : étapes intermédiaires du suivi client.
-- Les statuts existants (en_attente, confirmee, en_cours, terminee, annulee) sont conservés
-- pour les dossiers déjà en base ; les nouveaux jalons s'y insèrent dans l'ordre du parcours.

alter type public.reservation_status add value if not exists 'pieces';
alter type public.reservation_status add value if not exists 'pret';
alter type public.reservation_status add value if not exists 'livre';
