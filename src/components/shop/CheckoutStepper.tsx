import { Check, ShoppingBag, MapPin, CreditCard } from "lucide-react";

const STEPS = [
  { key: "cart", icon: ShoppingBag, label: "Panier" },
  { key: "address", icon: MapPin, label: "Adresse" },
  { key: "payment", icon: CreditCard, label: "Paiement" },
] as const;

export type CheckoutStep = "cart" | "address" | "payment";

export function CheckoutStepper({ current }: { current: CheckoutStep }) {
  const idx = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex flex-wrap gap-1 rounded-sm border border-border bg-surface p-1">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = i < idx;
        const active = i === idx;
        return (
          <span
            key={step.key}
            className={`flex flex-1 items-center justify-center gap-2 rounded-sm px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              active
                ? "bg-primary/10 text-primary shadow-sm"
                : done
                  ? "bg-card text-foreground"
                  : "text-muted-foreground"
            }`}
          >
            {done ? (
              <Check className="size-3.5" />
            ) : (
              <Icon className="size-3.5" />
            )}
            {step.label}
          </span>
        );
      })}
    </div>
  );
}
