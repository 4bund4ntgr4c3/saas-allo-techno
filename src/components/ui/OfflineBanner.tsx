import { WifiOff, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useNetworkStatus } from "@/lib/use-network-status";

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const [dismissed, setDismissed] = useState(false);

  // Reset dismiss quand on repasse hors-ligne
  useEffect(() => {
    if (!isOnline) setDismissed(false);
  }, [isOnline]);

  if (isOnline || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-2.5 rounded-lg border shadow-lg backdrop-blur-md text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200 bg-amber-500/90 text-amber-950 border-amber-600/40 dark:bg-amber-950/90 dark:text-amber-200"
    >
      <WifiOff className="size-4 shrink-0 animate-pulse" />
      <span>Mode hors-ligne · Vos actions seront synchronisées à la reconnexion.</span>
      <button
        type="button"
        aria-label="Fermer"
        onClick={() => setDismissed(true)}
        className="ml-1 rounded p-1 hover:bg-black/10 dark:hover:bg-white/10"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
