import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ACCESSORIES, type Accessory } from "@/data/catalog/accessories";

const STORAGE_KEY = "at-cart";

export type CartLine = { slug: string; qty: number };
export type CartItem = { accessory: Accessory; qty: number };

type CartContextValue = {
  lines: CartLine[];
  items: CartItem[];
  count: number;
  subtotal: number;
  hydrated: boolean;
  add: (slug: string, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

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

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé dans un CartProvider");
  return ctx;
}

export const FREE_DELIVERY_FROM = 50000;

export function getDeliveryOptions(t: (key: string) => string) {
  return [
    { id: "retrait", label: t("shop.delivery.retrait"), fee: 0, eta: t("shop.delivery.eta.retrait") },
    { id: "calavi", label: t("shop.delivery.calavi"), fee: 1000, eta: t("shop.delivery.eta.calavi") },
    { id: "cotonou", label: t("shop.delivery.cotonou"), fee: 2000, eta: t("shop.delivery.eta.cotonou") },
    { id: "interieur", label: t("shop.delivery.interior"), fee: 2000, eta: t("shop.delivery.eta.interior") },
  ] as const;
}
