import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "@/components/shop/cart";
import { useI18n } from "@/lib/i18n/context";
import { formatFcfa } from "@/data/catalog";

export function CartDrawer() {
  const { items, count, subtotal, setQty, remove, drawerOpen, closeDrawer } = useCart();
  const { locale, t } = useI18n();

  if (!drawerOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/40 transition-opacity"
        onClick={closeDrawer}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("panier.title")}
        className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col border-l border-border bg-background shadow-2xl animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-extrabold uppercase tracking-tight">
            {t("panier.title")}
            {count > 0 && (
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                ({count})
              </span>
            )}
          </h2>
          <button
            onClick={closeDrawer}
            className="grid size-8 place-items-center border border-border text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Fermer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <ShoppingBag className="size-8 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">{t("panier.empty")}</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map(({ accessory, qty }) => (
                <li key={accessory.slug} className="flex gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-tight">
                      {accessory.name}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                      {accessory.category}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center border border-border">
                        <button
                          onClick={() => setQty(accessory.slug, qty - 1)}
                          className="size-7 font-mono text-xs"
                          aria-label={t("panier.decrease", [accessory.name])}
                        >
                          <Minus className="mx-auto size-3" />
                        </button>
                        <span className="w-7 text-center font-mono text-xs">{qty}</span>
                        <button
                          onClick={() => setQty(accessory.slug, qty + 1)}
                          className="size-7 font-mono text-xs"
                          aria-label={t("panier.increase", [accessory.name])}
                        >
                          <Plus className="mx-auto size-3" />
                        </button>
                      </div>
                      <span className="font-mono text-xs font-medium">
                        {formatFcfa(accessory.price * qty)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => remove(accessory.slug)}
                    className="shrink-0 self-start text-muted-foreground hover:text-destructive"
                    aria-label={t("panier.remove", [accessory.name])}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase">{t("panier.subtotal")}</span>
              <span className="text-lg font-bold text-primary">{formatFcfa(subtotal)}</span>
            </div>
            <div className="mt-4 grid gap-2">
              <Link
                to="/$locale/panier"
                params={{ locale }}
                onClick={closeDrawer}
                className="flex items-center justify-center gap-2 border border-border bg-card px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-surface"
              >
                <ShoppingBag className="size-3.5" />
                {t("cart.widget.checkout")}
              </Link>
              <Link
                to="/$locale/checkout"
                params={{ locale }}
                onClick={closeDrawer}
                className="flex items-center justify-center gap-2 bg-primary px-4 py-3 text-xs font-extrabold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                {t("checkout.proceed")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
