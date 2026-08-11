import { useEffect, useState } from "react";
import { WifiOff, Clock, Database } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

/**
 * Enhanced offline indicator — shows offline status, cached data indicator,
 * and last sync timestamp. Shows a subtle bottom bar when offline.
 */
export function OfflineIndicator() {
  const { t } = useI18n();
  const [isOffline, setIsOffline] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [hasCache, setHasCache] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOffline(!navigator.onLine);

    const checkCache = () => {
      try {
        const data = localStorage.getItem("at-offline-data");
        if (data) {
          const parsed = JSON.parse(data) as { timestamp?: number };
          if (parsed.timestamp) {
            const ago = Date.now() - parsed.timestamp;
            if (ago < 5 * 60 * 1000) {
              setLastSync(new Date(parsed.timestamp).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              }));
              setHasCache(true);
              return;
            }
          }
        }
      } catch { /* ignore */ }
      setHasCache(false);
      setLastSync(null);
    };

    checkCache();
    const interval = setInterval(checkCache, 30_000);

    const handleOnline = () => {
      setIsOffline(false);
      checkCache();
    };
    const handleOffline = () => {
      setIsOffline(true);
      checkCache();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-amber-300 bg-amber-50 px-4 py-2.5 shadow-lg dark:border-amber-800 dark:bg-amber-950/50">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <WifiOff className="size-4 text-amber-600 dark:text-amber-400" />
          <span className="font-medium text-amber-800 dark:text-amber-200">
            {t("offline.title")}
          </span>
        </div>
        {hasCache && lastSync && (
          <div className="flex items-center gap-3 text-[10px] text-amber-700 dark:text-amber-300">
            <span className="flex items-center gap-1">
              <Database className="size-3" />
              {t("offline.cache")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              Sync: {lastSync}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
