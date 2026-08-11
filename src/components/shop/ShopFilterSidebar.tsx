import { useState, useEffect, useRef } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACCESSORY_CATEGORIES, formatFcfa } from "@/data/catalog";
import { FREE_DELIVERY_FROM } from "@/components/shop/cart";
import { useI18n } from "@/lib/i18n/context";

export type ShopFilters = {
  category: string;
  priceRange: [number, number];
  inStock: boolean;
  sort: string;
};

const PRICE_RANGES: { label: string; value: [number, number] }[] = [
  { label: "Tous les prix", value: [0, Infinity] },
  { label: "< 10 000 FCFA", value: [0, 10000] },
  { label: "10 000 – 30 000 FCFA", value: [10000, 30000] },
  { label: "30 000 – 100 000 FCFA", value: [30000, 100000] },
  { label: "> 100 000 FCFA", value: [100000, Infinity] },
];

export function ShopFilterSidebar({
  filters,
  onChange,
  mode = "shop",
}: {
  filters: ShopFilters;
  onChange: (f: ShopFilters) => void;
  mode?: "shop" | "refurbished";
}) {
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const categories = mode === "refurbished"
    ? ["Reconditionnés"]
    : ACCESSORY_CATEGORIES;

  // Focus trap + Escape for mobile drawer
  useEffect(() => {
    if (!mobileOpen) return;
    const drawer = drawerRef.current;
    if (!drawer) return;

    // Focus the close button on open
    closeRef.current?.focus();

    // Trap focus inside drawer
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileOpen(false);
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = drawer!.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  const content = (
    <div className="space-y-8">
      {/* Category */}
      <div>
        <h3 className="at-eyebrow mb-3">{t("shop.filter.category")}</h3>
        <div className="space-y-1.5">
          <button
            onClick={() => onChange({ ...filters, category: "toutes" })}
            className={`block w-full rounded-sm px-3 py-2 text-left text-xs font-medium transition-colors ${
              filters.category === "toutes"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            {t("shop.filter.all")}
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => onChange({ ...filters, category: c })}
              className={`block w-full rounded-sm px-3 py-2 text-left text-xs font-medium transition-colors ${
                filters.category === c
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h3 className="at-eyebrow mb-3">{t("shop.filter.price")}</h3>
        <div className="space-y-1.5">
          {PRICE_RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() => onChange({ ...filters, priceRange: range.value })}
              className={`block w-full rounded-sm px-3 py-2 text-left text-xs font-medium transition-colors ${
                filters.priceRange[0] === range.value[0] && filters.priceRange[1] === range.value[1]
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* In stock */}
      {mode === "shop" && (
        <div>
          <h3 className="at-eyebrow mb-3">{t("shop.filter.availability")}</h3>
          <label className="flex items-center gap-2 text-xs font-medium">
            <input
              type="checkbox"
              checked={filters.inStock}
              onChange={(e) => onChange({ ...filters, inStock: e.target.checked })}
              className="size-4 rounded border-border"
            />
            {t("shop.filter.in-stock-only")}
          </label>
        </div>
      )}

      {/* Free delivery hint */}
      <div className="rounded-sm border border-border bg-card p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {t("shop.filter.free-delivery")}
        </p>
        <p className="mt-1 font-mono text-sm font-medium text-primary">
          {formatFcfa(FREE_DELIVERY_FROM)}
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground">{t("shop.filter.free-delivery.hint")}</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="outline"
        size="sm"
        className="lg:hidden"
        onClick={() => setMobileOpen(true)}
      >
        <SlidersHorizontal className="size-4" /> {t("shop.filter.open")}
      </Button>

      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 lg:block">{content}</aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("shop.filter.title")}
            className="absolute inset-y-0 left-0 w-72 bg-background p-6 shadow-xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold">{t("shop.filter.title")}</h2>
              <button ref={closeRef} onClick={() => setMobileOpen(false)} aria-label="Fermer">
                <X className="size-5" />
              </button>
            </div>
            {content}
          </div>
        </div>
      )}
    </>
  );
}
