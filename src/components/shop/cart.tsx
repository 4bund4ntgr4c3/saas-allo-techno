import { useCallback, useEffect, useMemo, useState } from "react";
import { ACCESSORIES } from "@/data/catalog/accessories";
import {
  CartContext,
  STORAGE_KEY,
  type CartContextValue,
  type CartItem,
  type CartLine,
} from "./cart-store";

export {
  CartContext,
  FREE_DELIVERY_FROM,
  getDeliveryOptions,
  useCart,
  type CartContextValue,
  type CartItem,
  type CartLine,
} from "./cart-store";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setLines(
            parsed
              .filter(
                (l): l is CartLine =>
                  typeof l === "object" &&
                  l !== null &&
                  typeof (l as CartLine).slug === "string" &&
                  typeof (l as CartLine).qty === "number",
              )
              .filter((l) => ACCESSORIES.some((a) => a.slug === l.slug)),
          );
        }
      }
    } catch {
      /* panier illisible : on repart d'un panier vide */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const add = useCallback((slug: string, qty = 1) => {
    const product = ACCESSORIES.find((a) => a.slug === slug);
    if (!product) return;
    setLines((prev) => {
      const found = prev.find((l) => l.slug === slug);
      const max = Math.max(1, product.stock);
      if (!found) return [...prev, { slug, qty: Math.min(qty, max) }];
      return prev.map((l) => (l.slug === slug ? { ...l, qty: Math.min(l.qty + qty, max) } : l));
    });
    setDrawerOpen(true);
  }, []);

  const setQty = useCallback((slug: string, qty: number) => {
    const product = ACCESSORIES.find((a) => a.slug === slug);
    const max = product ? Math.max(1, product.stock) : 99;
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.slug !== slug)
        : prev.map((l) => (l.slug === slug ? { ...l, qty: Math.min(qty, max) } : l)),
    );
  }, []);

  const remove = useCallback((slug: string) => {
    setLines((prev) => prev.filter((l) => l.slug !== slug));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const value = useMemo<CartContextValue>(() => {
    const items = lines
      .map((l) => {
        const accessory = ACCESSORIES.find((a) => a.slug === l.slug);
        return accessory ? { accessory, qty: l.qty } : null;
      })
      .filter((i): i is CartItem => i !== null);

    return {
      lines,
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      subtotal: items.reduce((n, i) => n + i.qty * i.accessory.price, 0),
      hydrated,
      add,
      setQty,
      remove,
      clear,
      drawerOpen,
      openDrawer,
      closeDrawer,
    };
  }, [lines, hydrated, add, setQty, remove, clear, drawerOpen, openDrawer, closeDrawer]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
