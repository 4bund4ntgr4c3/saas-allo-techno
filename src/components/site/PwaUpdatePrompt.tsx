import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

/**
 * Detects when a new service worker is installed and prompts the user to refresh.
 * Shows a fixed bottom-left banner with "Mise à jour disponible" + reload button.
 */
export function PwaUpdatePrompt() {
  const [show, setShow] = useState(false);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Première visite : le SW prend le contrôle (clients.claim) sans recharger.
    // Un rechargement n'est utile que lorsqu'un SW déjà actif est remplacé
    // par une nouvelle version (mise à jour du site).
    const hadController = Boolean(navigator.serviceWorker.controller);

    const onControllerChange = () => {
      if (hadController) window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    void navigator.serviceWorker.ready.then((reg) => {
      if (reg.waiting) {
        setWaiting(reg.waiting);
        setShow(true);
      }

      reg.addEventListener("updatefound", () => {
        const newSw = reg.installing;
        if (!newSw) return;
        newSw.addEventListener("statechange", () => {
          if (newSw.state === "installed" && navigator.serviceWorker.controller) {
            setWaiting(newSw);
            setShow(true);
          }
        });
      });
    });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => setShow(false), 8_000);
    return () => clearTimeout(timer);
  }, [show]);

  const handleUpdate = () => {
    waiting?.postMessage({ type: "SKIP_WAITING" });
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-3 border border-primary/30 bg-card p-3 shadow-lg animate-in slide-in-from-bottom-4">
      <RefreshCw className="size-4 text-primary animate-spin" />
      <p className="text-xs font-medium">{t("pwa.update.available")}</p>
      <Button variant="technical" size="sm" onClick={handleUpdate}>
        {t("pwa.update.refresh")}
      </Button>
      <button
        onClick={() => setShow(false)}
        className="p-1 hover:bg-muted"
        aria-label={t("pwa.close")}
      >
        <X className="size-3" />
      </button>
    </div>
  );
}
