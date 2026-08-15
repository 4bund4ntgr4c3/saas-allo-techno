import { createContext, useContext } from "react";
import { type Accessory } from "@/data/catalog/accessories";

export const STORAGE_KEY = "at-cart";

export type CartLine = { slug: string; qty: number };
export type CartItem = { accessory: Accessory; qty: number };

export type CartContextValue = {
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

export const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé dans un CartProvider");
  return ctx;
}

export const FREE_DELIVERY_FROM = 50000;

export function getDeliveryOptions(t: (key: string) => string) {
  return [
    {
      id: "retrait",
      label: t("shop.delivery.retrait"),
      fee: 0,
      eta: t("shop.delivery.eta.retrait"),
    },
    {
      id: "calavi",
      label: t("shop.delivery.calavi"),
      fee: 1000,
      eta: t("shop.delivery.eta.calavi"),
    },
    {
      id: "cotonou",
      label: t("shop.delivery.cotonou"),
      fee: 2000,
      eta: t("shop.delivery.eta.cotonou"),
    },
    {
      id: "interieur",
      label: t("shop.delivery.interior"),
      fee: 2000,
      eta: t("shop.delivery.eta.interior"),
    },
  ] as const;
}
