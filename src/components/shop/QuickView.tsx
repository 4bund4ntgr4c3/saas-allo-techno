import { useEffect, useState } from "react";
import { Check, Plus, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/shop/cart";
import { type Accessory, formatFcfa } from "@/data/catalog";
import { useI18n } from "@/lib/i18n/context";

type QuickViewProps = {
  product: Accessory;
  stock: number;
  open: boolean;
  onClose: () => void;
};

export function QuickView({ product, stock, open, onClose }: QuickViewProps) {
  const [qty, setQty] = useState(1);
  const cart = useCart();
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className="relative z-10 w-full max-w-lg border border-border bg-card shadow-xl"
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          aria-label="Fermer"
        >
          <X className="size-5" />
        </button>

        <div className="grid gap-px border-border bg-border sm:grid-cols-2">
          <div className="at-grid-lines grid min-h-[200px] place-items-center bg-surface p-8">
            <span className="at-display text-4xl text-muted-foreground/50">
              {product.name.slice(0, 2).toUpperCase()}
            </span>
          </div>

          <div className="bg-card p-6">
            <span className="at-eyebrow">{product.category}</span>
            <h2 className="mt-2 text-lg font-bold tracking-tight">{product.name}</h2>
            <div className="mt-3 font-mono text-xl font-medium text-primary">
              {formatFcfa(product.price)}
            </div>

            <div className="mt-3">
              {stock > 0 ? (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                    stock <= 5
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "border-success/40 bg-success/10 text-success"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${stock <= 5 ? "animate-pulse bg-amber-500" : "bg-success"}`}
                  />
                  {stock} pcs
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-sm border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Sur commande
                </span>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <div className="flex items-center border border-border">
                <button
                  onClick={() => setQty((n) => Math.max(1, n - 1))}
                  className="size-9 font-mono text-sm"
                  aria-label={t("boutique.qty.decrease")}
                >
                  −
                </button>
                <span className="w-8 text-center font-mono text-sm">{qty}</span>
                <button
                  onClick={() => setQty((n) => Math.min(Math.max(1, stock), n + 1))}
                  className="size-9 font-mono text-sm"
                  aria-label={t("boutique.qty.increase")}
                >
                  +
                </button>
              </div>
              <Button
                variant="technical"
                size="sm"
                disabled={stock <= 0}
                onClick={() => {
                  cart.add(product.slug, qty);
                  toast.success(t("boutique.toast.added-qty", [qty, product.name]));
                  onClose();
                }}
                className="flex-1"
              >
                {cart.items.find((i) => i.accessory.slug === product.slug) ? (
                  <Check className="size-4" />
                ) : (
                  <Plus className="size-4" />
                )}
                <ShoppingBag className="size-4 ml-1" />
                {stock <= 0 ? t("boutique.unavailable") : t("boutique.add-to-cart")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
