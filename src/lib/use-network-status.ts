import * as React from "react";
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
