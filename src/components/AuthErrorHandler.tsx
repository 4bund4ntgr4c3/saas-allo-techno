import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n/context";

export function AuthErrorHandler() {
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
        toast.error(t("auth.session.expired"), {
          duration: 5000,
          action: {
            label: t("nav.connexion"),
            onClick: () => {
              navigate({ to: "/auth" });
            },
          },
        });

        // Redirect after a short delay to allow the toast to be seen
        setTimeout(() => {
          navigate({ to: "/auth" });
        }, 2000);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, t]);

  return null;
}
