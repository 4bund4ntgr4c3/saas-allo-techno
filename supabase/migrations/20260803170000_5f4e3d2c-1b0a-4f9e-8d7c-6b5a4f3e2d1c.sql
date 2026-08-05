-- U9 — Stockage des photos d'appareils (wizard) + événements analytics.

-- 1. Bucket public « device-photos » (photos envoyées par les clients)
INSERT INTO storage.buckets (id, name, public)
VALUES ('device-photos', 'device-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "device-photos-public-read" ON storage.objects;
CREATE POLICY "device-photos-public-read" ON storage.objects FOR SELECT
  USING (bucket_id = 'device-photos');

DROP POLICY IF EXISTS "device-photos-anon-insert" ON storage.objects;
CREATE POLICY "device-photos-anon-insert" ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'device-photos' AND (storage.foldername(name))[1] = 'uploads');

DROP POLICY IF EXISTS "device-photos-auth-insert" ON storage.objects;
CREATE POLICY "device-photos-auth-insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'device-photos' AND (storage.foldername(name))[1] = 'uploads');

DROP POLICY IF EXISTS "device-photos-auth-update" ON storage.objects;
CREATE POLICY "device-photos-auth-update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'device-photos')
  WITH CHECK (bucket_id = 'device-photos');
