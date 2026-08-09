import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, ShoppingBag, X } from "lucide-react";
import { useCart, type CartItem } from "@/components/shop/cart";
import { useI18n } from "@/lib/i18n/context";
import { formatFcfa } from "@/data/catalog";

export function AddToCartWidget() {
  const { items } = useCart();
  const { locale, t } = useI18n();
  const [lastAdded, setLastAdded] = useState<CartItem | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (items.length === 0) return undefined;
    const latest = items[items.length - 1];
    if (latest && latest !== lastAdded) {
      setLastAdded(latest);
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 4000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [items, lastAdded]);

  if (!visible || !lastAdded) return null;

  return (
    <div className="fixed bottom-24 right-4 z-50 w-80 animate-in slide-in-from-right-4 rounded-lg border border-border bg-card p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-success/10">
          <Check className="size-5 text-success" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">{t("cart.widget.added")}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {lastAdded.accessory.name}
          </p>
          <div className="mt-1 font-mono text-sm font-medium text-primary">
            {formatFcfa(lastAdded.accessory.price)}
          </div>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Fermer"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <Link
          to="/$locale/panier"
          params={{ locale }}
          onClick={() => setVisible(false)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-sm bg-primary px-3 py-2 text-[10px] font-extrabold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <ShoppingBag className="size-3" />
          {t("cart.widget.checkout")}
        </Link>
        <button
          onClick={() => setVisible(false)}
          className="rounded-sm border border-border px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("cart.widget.continue")}
        </button>
      </div>
    </div>
  );
}
