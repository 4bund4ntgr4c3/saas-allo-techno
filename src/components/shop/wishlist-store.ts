import { createContext, useContext } from "react";

export const STORAGE_KEY = "at-wishlist";

export type WishlistContextValue = {
  slugs: string[];
  has: (slug: string) => boolean;
  toggle: (slug: string) => void;
  add: (slug: string) => void;
  remove: (slug: string) => void;
  count: number;
};

export const WishlistContext = createContext<WishlistContextValue | null>(null);

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist doit être utilisé dans un WishlistProvider");
  return ctx;
}
