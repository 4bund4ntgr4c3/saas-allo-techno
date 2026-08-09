import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "at-recently-viewed";
const MAX_ITEMS = 5;

export type RecentlyViewedItem = {
  slug: string;
  name: string;
  category: string;
  price: number;
  viewedAt: number;
};

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setItems(
            parsed.filter(
              (i): i is RecentlyViewedItem =>
                typeof i === "object" &&
                i !== null &&
                typeof (i as RecentlyViewedItem).slug === "string",
            ),
          );
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const track = useCallback(
    (product: { slug: string; name: string; category: string; price: number }) => {
      setItems((prev) => {
        const filtered = prev.filter((i) => i.slug !== product.slug);
        return [{ ...product, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
      });
    },
    [],
  );

  const clear = useCallback(() => setItems([]), []);

  const recent = useMemo(() => items.slice(0, MAX_ITEMS), [items]);

  return { items: recent, track, clear, count: recent.length };
}
