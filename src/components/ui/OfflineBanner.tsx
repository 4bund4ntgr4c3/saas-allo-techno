import * as React from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { getOfflineQueue } from "@/lib/offline-sync";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [pendingSyncCount, setPendingSyncCount] = React.useState(0);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const updateCount = () => setPendingSyncCount(getOfflineQueue().length);
    updateCount();
    const interval = setInterval(updateCount, 4000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  return { isOnline, pendingSyncCount };
}

export function OfflineBanner() {
  const { isOnline, pendingSyncCount } = useNetworkStatus();

  if (isOnline && pendingSyncCount === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-2.5 rounded-lg border shadow-lg backdrop-blur-md text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200 ${
        !isOnline
          ? "bg-amber-500/90 text-amber-950 border-amber-600/40 dark:bg-amber-950/90 dark:text-amber-200"
          : "bg-blue-500/90 text-white border-blue-600/40"
      }`}
    >
      {!isOnline ? (
        <>
          <WifiOff className="size-4 shrink-0 animate-pulse" />
          <span>
            Mode Hors-Ligne actif · Vos actions locales seront synchronisées dès reconnexion.
          </span>
        </>
      ) : (
        <>
          <RefreshCw className="size-4 shrink-0 animate-spin" />
          <span>{pendingSyncCount} action(s) en cours de synchronisation...</span>
        </>
      )}
    </div>
  );
}
