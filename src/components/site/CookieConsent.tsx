import { useState, useEffect } from "react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

const COOKIE_KEY = "at-cookie-consent";

export function CookieConsent() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  }

  function refuse() {
    localStorage.setItem(COOKIE_KEY, "refused");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 shadow-[0_-4px_16px_rgba(0,0,0,.08)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <Cookie className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-bold">{t("cookie.title")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("cookie.text")}</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="ghost" size="sm" onClick={refuse}>
            {t("cookie.refuse")}
          </Button>
          <Button size="sm" onClick={accept}>
            {t("cookie.accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
