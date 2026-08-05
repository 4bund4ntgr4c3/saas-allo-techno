-- U1 — Fondations : rôles étendus, leads, analytics, techniciens, pièces
-- jointes, catalogue en base, SLA.

-- 1. Rôle « technicien » (admin / staff / user existants)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'technicien';

-- 2. Attribution de rôle par un administrateur (remplace la ligne existante)
CREATE OR REPLACE FUNCTION public.set_user_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL OR NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = uid AND role = 'admin') THEN
    RAISE EXCEPTION 'Action réservée aux administrateurs';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
  DELETE FROM public.user_roles WHERE user_id = _user_id AND role <> _role;
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.set_user_role(uuid, public.app_role) FROM public;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, public.app_role) TO authenticated;

-- 3. Leads (devis, contact, assistance suivi)
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  reference text,
  name text,
  phone text,
  email text,
  message text,
  status text NOT NULL DEFAULT 'nouveau',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX leads_created_idx ON public.leads (created_at DESC);
GRANT SELECT, INSERT ON public.leads TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_public_insert" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "leads_staff_read" ON public.leads FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "leads_staff_update" ON public.leads FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 4. Événements analytics (parcours wizard, conversions)
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  step smallint,
  category text,
  brand text,
  device text,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX analytics_events_created_idx ON public.analytics_events (created_at DESC);
GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analytics_public_insert" ON public.analytics_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "analytics_staff_read" ON public.analytics_events FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- 5. Assignations de technicien (historique des réaffectations)
CREATE TABLE public.technician_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  technician_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX technician_assignments_reservation_idx ON public.technician_assignments (reservation_id, created_at DESC);
GRANT SELECT, INSERT ON public.technician_assignments TO authenticated;
GRANT ALL ON public.technician_assignments TO service_role;
ALTER TABLE public.technician_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assignments_staff_read" ON public.technician_assignments FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "assignments_staff_insert" ON public.technician_assignments FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

-- 6. Pièces jointes par étape (photos / vidéos des techniciens, photo appareil)
CREATE TABLE public.reservation_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  stage text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'photo',
  url text NOT NULL,
  caption text,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reservation_attachments_reservation_idx ON public.reservation_attachments (reservation_id, created_at DESC);
GRANT SELECT ON public.reservation_attachments TO authenticated;
GRANT INSERT ON public.reservation_attachments TO authenticated;
GRANT ALL ON public.reservation_attachments TO service_role;
ALTER TABLE public.reservation_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attachments_staff_all" ON public.reservation_attachments FOR ALL TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "attachments_owner_read" ON public.reservation_attachments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.reservations r WHERE r.id = reservation_attachments.reservation_id AND r.user_id = auth.uid()));

-- 7. SLA — date de restitution estimée par dossier
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS estimated_delivery date;

-- 8. Catalogue en base (source de vérité pour l'admin)
CREATE TABLE public.catalog_categories (
  slug text PRIMARY KEY,
  label text NOT NULL,
  sort smallint NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true
);
CREATE TABLE public.catalog_brands (
  slug text PRIMARY KEY,
  name text NOT NULL,
  tag text NOT NULL DEFAULT '',
  sort smallint NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true
);
CREATE TABLE public.catalog_devices (
  slug text PRIMARY KEY,
  name text NOT NULL,
  brand_slug text NOT NULL REFERENCES public.catalog_brands(slug) ON DELETE CASCADE,
  category_slug text NOT NULL REFERENCES public.catalog_categories(slug) ON DELETE CASCADE,
  series text NOT NULL DEFAULT '',
  year integer NOT NULL DEFAULT 0,
  sort smallint NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX catalog_devices_brand_idx ON public.catalog_devices (brand_slug);
CREATE INDEX catalog_devices_category_idx ON public.catalog_devices (category_slug);
CREATE TABLE public.catalog_faults (
  id serial PRIMARY KEY,
  device_slug text NOT NULL REFERENCES public.catalog_devices(slug) ON DELETE CASCADE,
  slug text NOT NULL,
  label text NOT NULL,
  price integer NOT NULL DEFAULT 0,
  duration text NOT NULL DEFAULT '',
  warranty text NOT NULL DEFAULT '',
  part text NOT NULL DEFAULT '',
  sort smallint NOT NULL DEFAULT 0,
  UNIQUE (device_slug, slug)
);
CREATE TABLE public.catalog_photos (
  id serial PRIMARY KEY,
  device_slug text NOT NULL REFERENCES public.catalog_devices(slug) ON DELETE CASCADE,
  url text NOT NULL,
  alt text NOT NULL DEFAULT '',
  sort smallint NOT NULL DEFAULT 0
);

GRANT SELECT ON public.catalog_categories, public.catalog_brands, public.catalog_devices, public.catalog_faults, public.catalog_photos TO anon, authenticated;
GRANT ALL ON public.catalog_categories, public.catalog_brands, public.catalog_devices, public.catalog_faults, public.catalog_photos TO service_role;
ALTER TABLE public.catalog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_faults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "catalog_public_read" ON public.catalog_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "catalog_brands_public_read" ON public.catalog_brands FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "catalog_devices_public_read" ON public.catalog_devices FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "catalog_faults_public_read" ON public.catalog_faults FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "catalog_photos_public_read" ON public.catalog_photos FOR SELECT TO anon, authenticated USING (true);

-- Realtime pour la gestion de catalogue multi-écran
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
