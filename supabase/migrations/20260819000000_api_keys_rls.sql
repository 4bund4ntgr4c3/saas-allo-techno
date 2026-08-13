-- Sécurise la table api_keys (créée sans RLS dans batch21) :
-- - la table n'était lisible par personne via PostgREST (anon/authenticated),
--   exposant les empreintes de clés, noms et scopes ;
-- - le portage de l'API /api/v1/* compare désormais key_hash (SHA-256 de la
--   clé présentée) : la colonne user_id (propriétaire) fait défaut dans le
--   schéma d'origine et la requête échouait en 401 permanent.

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.api_keys FROM anon, authenticated;
GRANT ALL ON public.api_keys TO service_role;

CREATE POLICY "api_keys_service_only"
  ON public.api_keys
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON public.api_keys (user_id);
