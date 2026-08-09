import { useEffect, useRef } from "react";
import { useCart } from "@/components/shop/cart";

export function AddToCartWidget() {
  const { items, openDrawer } = useCart();
  const prevCount = useRef(items.length);

  useEffect(() => {
    if (items.length > prevCount.current) {
      openDrawer();
    }
    prevCount.current = items.length;
  }, [items.length, openDrawer]);

  return null;
}
