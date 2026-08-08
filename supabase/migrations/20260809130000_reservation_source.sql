-- Attribution des réservations (source) + vidéos dans le bucket device-photos.

-- 1. Source d'attribution (ex : « quartier-zogbadje », « blog-ecran-fissure ») :
--    transmise depuis le paramètre d'URL `src` du wizard de réservation.
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS source text;

-- 2. Bucket device-photos : autorise désormais les vidéos (MP4, WebM).
--    La limite passe à 25 Mo (les photos restent limitées à 5 Mo côté serveur,
--    dans getDevicePhotoUpload).
UPDATE storage.buckets
SET file_size_limit = 26214400,
    allowed_mime_types = ARRAY[
      'image/jpeg','image/png','image/webp','image/heic','image/heif',
      'video/mp4','video/webm'
    ]
WHERE id = 'device-photos';

-- 3. Politiques d'insertion : le chemin reste restreint à uploads/ (le contrôle
--    des types MIME est assuré par le bucket + la validation serveur).
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
