import { useCallback, useEffect, useMemo, useState } from "react";
import { WishlistContext, STORAGE_KEY, type WishlistContextValue } from "./wishlist-store";

export { useWishlist, type WishlistContextValue } from "./wishlist-store";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSlugs(parsed.filter((s): s is string => typeof s === "string"));
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  }, [slugs, hydrated]);

  const has = useCallback((slug: string) => slugs.includes(slug), [slugs]);

  const toggle = useCallback((slug: string) => {
    setSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }, []);

  const add = useCallback((slug: string) => {
    setSlugs((prev) => (prev.includes(slug) ? prev : [...prev, slug]));
  }, []);

  const remove = useCallback((slug: string) => {
    setSlugs((prev) => prev.filter((s) => s !== slug));
  }, []);

  const value = useMemo<WishlistContextValue>(
    () => ({ slugs, has, toggle, add, remove, count: slugs.length }),
    [slugs, has, toggle, add, remove],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
