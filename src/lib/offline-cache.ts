const CACHE_KEY = "at-offline-data";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface OfflineCache {
  reservations: unknown[];
  loyalty: unknown;
  timestamp: number;
}

export function saveOfflineData(data: { reservations?: unknown[]; loyalty?: unknown }) {
  try {
    const existing = getOfflineData();
    const cache: OfflineCache = {
      reservations: data.reservations ?? existing?.reservations ?? [],
      loyalty: data.loyalty ?? existing?.loyalty ?? null,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage might be full or unavailable
  }
}

export function getOfflineData(): OfflineCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw) as OfflineCache;
    if (Date.now() - cache.timestamp > CACHE_TTL) return null;
    return cache;
  } catch {
    return null;
  }
}

export function getOfflineCacheTimestamp(): number | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw) as OfflineCache;
    return cache.timestamp;
  } catch {
    return null;
  }
}

export function clearOfflineData() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CACHE_KEY);
}
