import * as React from "react";
import { getOfflineQueue } from "@/lib/offline-sync";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [pendingSyncCount, setPendingSyncCount] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;

    const verifyOnline = async (hint: boolean) => {
      if (!hint) {
        if (!cancelled) setIsOnline(false);
        return;
      }
      // navigator dit online — on vérifie par un vrai fetch (évite faux positif)
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 3000);
        const res = await fetch("/api/healthz", {
          method: "GET",
          cache: "no-store",
          signal: ctrl.signal,
        });
        clearTimeout(t);
        if (!cancelled) setIsOnline(res.ok);
      } catch {
        if (!cancelled) setIsOnline(false);
      }
    };

    const handleOnline = () => void verifyOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Vérification initiale réelle
    void verifyOnline(navigator.onLine);
    const heartbeat = setInterval(() => void verifyOnline(navigator.onLine), 30_000);

    const updateCount = () => setPendingSyncCount(getOfflineQueue().length);
    updateCount();
    const interval = setInterval(updateCount, 4000);

    return () => {
      cancelled = true;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
      clearInterval(heartbeat);
    };
  }, []);

  return { isOnline, pendingSyncCount };
}
