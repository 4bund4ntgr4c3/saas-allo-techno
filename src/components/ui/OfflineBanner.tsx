import { WifiOff, RefreshCw } from "lucide-react";
import { useNetworkStatus } from "@/lib/use-network-status";

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
