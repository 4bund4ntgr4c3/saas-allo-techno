-- Le secret TOTP admin ne doit JAMAIS être lisible depuis le client :
-- PostgREST permettait à un administrateur authentifié de lire le secret en
-- clair (GRANT SELECT + policy admin_otp_owner) et de régénérer les OTP.
-- Désormais, lecture/écriture exclusivement via les server functions
-- (service_role) : la 2FA n'est plus contournable en cas de session volée.

REVOKE ALL ON public.admin_otp FROM anon, authenticated;
DROP POLICY IF EXISTS "admin_otp_owner" ON public.admin_otp;
GRANT ALL ON public.admin_otp TO service_role;
