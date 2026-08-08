-- Attribution de conversion : provenance (source) des événements analytics
-- et détail de source des leads (pages quartiers, campagnes ?src= / utm).
-- ========================================================================
-- Les serveur functions écrivent sous service_role ; les colonnes sont
-- nullable et les politiques RLS existantes restent inchangées.

alter table public.analytics_events
  add column if not exists source text;

alter table public.leads
  add column if not exists source_detail text;
