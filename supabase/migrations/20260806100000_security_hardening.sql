-- Hardening sécurité (correctifs critiques)
-- 1. Code de suivi par réservation (empêche l'énumération des références séquentielles)
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS tracking_code_hash text;

-- 2. 2FA : horodatage de la dernière vérification TOTP réussie (verrou serveur)
ALTER TABLE public.admin_otp ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- 3. Leads : l'écriture passe par la server function `submitLead` (service role).
--    Suppression de l'insert anon qui contournait la validation Zod et floodait le staff.
DROP POLICY IF EXISTS "leads_public_insert" ON public.leads;
REVOKE INSERT ON public.leads FROM anon;
REVOKE INSERT ON public.leads FROM authenticated;
GRANT SELECT, UPDATE ON public.leads TO authenticated;

-- 4. Analytics : l'écriture passe par la server function (validation + rate limit).
DROP POLICY IF EXISTS "analytics_public_insert" ON public.analytics_events;
REVOKE INSERT ON public.analytics_events FROM anon;
REVOKE INSERT ON public.analytics_events FROM authenticated;
GRANT SELECT ON public.analytics_events TO authenticated;

-- 5. Timeline de suivi : plus d'exécution anon (appelé par la server function via service role).
REVOKE EXECUTE ON FUNCTION public.get_reservation_timeline(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_reservation_timeline(text) FROM authenticated;

-- 6. Stockage : bucket privé, limite de taille (5 Mo) et types MIME autorisés.
--    Les uploads passent par une URL présignée générée côté serveur (validation du code de suivi).
UPDATE storage.buckets
SET public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif']
WHERE id = 'device-photos';

DROP POLICY IF EXISTS "device-photos-public-read" ON storage.objects;
DROP POLICY IF EXISTS "device-photos-anon-insert" ON storage.objects;
DROP POLICY IF EXISTS "device-photos-auth-insert" ON storage.objects;
DROP POLICY IF EXISTS "device-photos-auth-update" ON storage.objects;
