import { Tag, Truck, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatFcfa } from "@/data/catalog";
import type { CartItem } from "@/components/shop/cart";

interface DeliveryOption {
  id: string;
  label: string;
  fee: number;
  eta: string;
}

interface PricingSidebarProps {
  items: CartItem[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, params?: any) => string;
  onContinue: () => void;
  continueLabel: string;
  showCoupon?: boolean;
  showDelivery?: boolean;
  deliveryOptions?: readonly DeliveryOption[];
  selectedDelivery?: string;
  onSelectDelivery?: (id: string) => void;
  shippingFee?: number;
  shippingLabel?: string;
  discount?: number;
  discountLabel?: string | undefined;
  loading?: boolean;
  disabled?: boolean;
}

export function PricingSidebar({
  items,
  t,
  onContinue,
  continueLabel,
  showCoupon = true,
  showDelivery = false,
  deliveryOptions,
  selectedDelivery,
  onSelectDelivery,
  shippingFee = 0,
  shippingLabel,
  discount = 0,
  discountLabel,
  loading = false,
  disabled = false,
}: PricingSidebarProps) {
  const subtotal = items.reduce((s, i) => s + i.accessory.price * i.qty, 0);
  const total = subtotal + shippingFee - discount;

  return (
    <div className="sticky top-24 border border-border bg-card p-5">
      <div className="mb-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {t("panier.summary")}
        </p>
      </div>

      <div className="space-y-2.5 border-b border-border pb-4">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{item.accessory.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {item.accessory.category} · ×{item.qty}
              </p>
            </div>
            <span className="text-xs font-medium">
              {formatFcfa(item.accessory.price * item.qty)}
            </span>
          </div>
        ))}
      </div>

      {showDelivery && deliveryOptions && selectedDelivery && onSelectDelivery && (
        <div className="border-b border-border py-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {t("checkout.address.delivery-speed")}
          </p>
          <div className="space-y-2">
            {deliveryOptions.map((o) => (
              <label key={o.id} className="flex items-center gap-3 text-sm">
                <input
                  type="radio"
                  name="delivery"
                  value={o.id}
                  checked={selectedDelivery === o.id}
                  onChange={() => onSelectDelivery(o.id)}
                  className="accent-[var(--primary)]"
                />
                <span className="flex-1">{o.label}</span>
                <span className="font-mono text-[10px] uppercase text-muted-foreground">
                  {o.fee === 0 ? t("panier.freeShipping") : formatFcfa(o.fee)}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2 border-b border-border py-4 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("panier.subtotal")}</span>
          <span>{formatFcfa(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            <Truck className="mr-1 inline size-3" />
            {shippingLabel || t("panier.shipping-estimate", [""])}
          </span>
          <span className={shippingFee === 0 ? "text-green-600" : ""}>
            {shippingFee === 0 ? t("panier.freeShipping") : formatFcfa(shippingFee)}
          </span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>{discountLabel || t("panier.promo.discount", [""])}</span>
            <span>−{formatFcfa(discount)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between py-4">
        <span className="text-sm font-bold">{t("panier.total")}</span>
        <span className="text-lg font-bold text-primary">{formatFcfa(total)}</span>
      </div>

      {showCoupon && (
        <div className="mb-4 flex gap-2">
          <Input
            placeholder={t("panier.promo.placeholder", ["Code promo"])}
            className="flex-1 border-border bg-surface text-xs"
          />
          <Button variant="outline" size="sm" className="rounded-sm border-primary text-primary">
            <Tag className="mr-1 size-3" />
            {t("panier.promo.apply")}
          </Button>
        </div>
      )}

      <Button
        onClick={onContinue}
        className="w-full bg-primary font-bold text-primary-foreground hover:bg-primary-hover"
        size="lg"
        disabled={disabled || loading}
      >
        <CreditCard className="mr-2 size-4" />
        {continueLabel}
      </Button>
    </div>
  );
}
