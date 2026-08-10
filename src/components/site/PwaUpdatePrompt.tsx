import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Detects when a new service worker is installed and prompts the user to refresh.
 * Shows a fixed bottom-left banner with "Mise à jour disponible" + reload button.
 */
export function PwaUpdatePrompt() {
  const [show, setShow] = useState(false);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const onControllerChange = () => {
      window.location.reload();
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

  const handleUpdate = () => {
    waiting?.postMessage({ type: "SKIP_WAITING" });
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-3 rounded-sm border border-primary/30 bg-card p-3 shadow-lg animate-in slide-in-from-bottom-4">
      <RefreshCw className="size-4 text-primary animate-spin" />
      <p className="text-xs font-medium">Mise à jour disponible</p>
      <Button variant="technical" size="sm" onClick={handleUpdate}>
        Actualiser
      </Button>
      <button
        onClick={() => setShow(false)}
        className="p-1 hover:bg-muted rounded-sm"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}
