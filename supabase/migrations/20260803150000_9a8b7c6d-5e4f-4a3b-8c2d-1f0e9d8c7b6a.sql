-- U5 — Équipe & sécurité : accès staff aux profils, 2FA TOTP admin.

-- 1. Le staff peut consulter les profils (liste d'équipe)
DROP POLICY IF EXISTS "profiles_staff_read" ON public.profiles;
CREATE POLICY "profiles_staff_read" ON public.profiles FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

-- 1b. Le staff peut consulter les rôles de toute l'équipe
DROP POLICY IF EXISTS "user_roles_staff_read" ON public.user_roles;
CREATE POLICY "user_roles_staff_read" ON public.user_roles FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

-- 2. 2FA TOTP — secrets par administrateur
CREATE TABLE public.admin_otp (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  secret text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_otp TO authenticated;
GRANT ALL ON public.admin_otp TO service_role;
ALTER TABLE public.admin_otp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_otp_owner" ON public.admin_otp FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
