import { useEffect, useRef } from "react";
import { useCart } from "@/components/shop/cart";

export function AddToCartWidget() {
  const { items, openDrawer, hydrated } = useCart();
  const isInitialized = useRef(false);
  const prevCount = useRef(items.length);

  useEffect(() => {
    if (!hydrated) return;

    if (!isInitialized.current) {
      isInitialized.current = true;
      prevCount.current = items.length;
      return;
    }

    if (items.length > prevCount.current) {
      openDrawer();
    }
    prevCount.current = items.length;
  }, [items.length, openDrawer, hydrated]);

  return null;
}
