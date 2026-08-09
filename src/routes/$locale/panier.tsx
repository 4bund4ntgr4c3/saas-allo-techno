import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MobileMoneyBar } from "@/components/site/Blocks";
import { CheckoutStepper } from "@/components/shop/CheckoutStepper";
import { PricingSidebar } from "@/components/shop/PricingSidebar";
import { useCart } from "@/components/shop/cart";
import { COMPANY, formatFcfa } from "@/data/catalog";
import { getOrderPaymentStatus } from "@/lib/payments.functions";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import { trackPlausibleEvent } from "@/lib/analytics";
import "@/lib/i18n/segments/panier";
import type { Locale } from "@/lib/i18n/locales";

type PaymentState = "onPickup" | "redirect" | "paid" | "pending" | "failed" | null;

type Order = { ref: string; total: number; delivery: string; payment: string; name: string };

export const Route = createFileRoute("/$locale/panier")({
  validateSearch: (search: Record<string, unknown>): { ref?: string; status?: string } => {
    const ref = typeof search["ref"] === "string" ? search["ref"] : undefined;
    const status = typeof search["status"] === "string" ? search["status"] : undefined;
    return { ...(ref ? { ref } : {}), ...(status ? { status } : {}) };
  },
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    return {
      meta: [
        { title: translate(locale, "panier.meta.title") },
        { name: "description", content: translate(locale, "panier.meta.description") },
        { property: "og:title", content: translate(locale, "panier.meta.og.title") },
        {
          property: "og:description",
          content: translate(locale, "panier.meta.og.description"),
        },
        { name: "robots", content: "noindex, nofollow" },
      ],
    };
  },
  component: Panier,
});

function Panier() {
  const cart = useCart();
  const { locale, t } = useI18n();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const checkPayment = useServerFn(getOrderPaymentStatus);
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>(null);

  const restoreFromSearch = useCallback(async () => {
    if (!search.ref || search.status !== "redirect") return;
    let stored: Order | null = null;
    try {
      const raw = sessionStorage.getItem("at-order");
      if (raw) stored = JSON.parse(raw) as Order;
    } catch {
      stored = null;
    }
    if (!stored) return;
    setOrder(stored);
    setPaymentState("pending");

    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        const res = await checkPayment({ data: { reference: search.ref } });
        if (res.status === "paid") {
          setPaymentState("paid");
          trackPlausibleEvent("payment_completed");
          toast.success(t("panier.paid.title"));
          return;
        }
        if (res.status === "failed") {
          setPaymentState("failed");
          return;
        }
      } catch {
        /* retry */
      }
      await new Promise((r) => setTimeout(r, 4000));
    }
    setPaymentState("pending");
  }, [search.ref, search.status, checkPayment, t]);

  useEffect(() => {
    void restoreFromSearch();
  }, [restoreFromSearch]);

  if (order) {
    return (
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="border border-border bg-card p-8">
            {paymentState === "redirect" ? (
              <>
                <Loader2 className="size-8 animate-spin text-primary" />
                <h1 className="at-display mt-6 text-3xl">{t("panier.redirect.title")}</h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  {t("panier.redirect.text", [order.ref])}
                </p>
                <Button
                  variant="technical"
                  className="mt-8"
                  onClick={() => {
                    navigate({ to: "/$locale/panier", search: { ref: order.ref, status: "redirect" }, params: { locale } });
                  }}
                >
                  {t("panier.redirect.btn")}
                </Button>
              </>
            ) : paymentState === "paid" ? (
              <>
                <CheckCircle2 className="size-8 text-primary" />
                <h1 className="at-display mt-6 text-3xl">{t("panier.paid.title")}</h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  {t("panier.paid.text", [order.name, formatFcfa(order.total), order.ref])}
                </p>
              </>
            ) : paymentState === "pending" ? (
              <>
                <Loader2 className="size-8 animate-spin text-primary" />
                <h1 className="at-display mt-6 text-3xl">{t("panier.pending.title")}</h1>
                <p className="mt-3 text-sm text-muted-foreground">{t("panier.pending.text")}</p>
                <Button
                  variant="technical"
                  className="mt-8"
                  onClick={() => {
                    void restoreFromSearch();
                  }}
                >
                  {t("panier.pending.retry")}
                </Button>
              </>
            ) : paymentState === "failed" ? (
              <>
                <CheckCircle2 className="size-8 text-primary" />
                <h1 className="at-display mt-6 text-3xl">{t("panier.failed.title")}</h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  {t("panier.failed.text", [order.ref, COMPANY.whatsapp])}
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-8 text-primary" />
                <h1 className="at-display mt-6 text-3xl">{t("panier.confirmed.title")}</h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  {t("panier.confirmed.text", [order.name, COMPANY.whatsapp])}
                </p>
                {paymentState === "onPickup" && (
                  <p className="mt-2 text-sm text-muted-foreground">{t("panier.pay.onPickup")}</p>
                )}
              </>
            )}
            <dl className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-2">
              <div className="bg-surface p-4">
                <dt className="at-eyebrow">{t("panier.confirmed.orderRef")}</dt>
                <dd className="mt-1 font-mono text-sm">{order.ref}</dd>
              </div>
              <div className="bg-surface p-4">
                <dt className="at-eyebrow">{t("panier.confirmed.amount")}</dt>
                <dd className="mt-1 font-mono text-sm">{formatFcfa(order.total)}</dd>
              </div>
              <div className="bg-surface p-4">
                <dt className="at-eyebrow">{t("panier.confirmed.delivery")}</dt>
                <dd className="mt-1 font-mono text-xs">{order.delivery}</dd>
              </div>
              <div className="bg-surface p-4">
                <dt className="at-eyebrow">{t("panier.confirmed.payment")}</dt>
                <dd className="mt-1 font-mono text-xs">{order.payment}</dd>
              </div>
            </dl>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="technical">
                <Link to="/$locale/boutique" params={{ locale }}>
                  {t("panier.continue")}
                </Link>
              </Button>
              <Button asChild variant="technicalOutline">
                <Link to="/">{t("action.retour-accueil")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">{t("panier.shop")}</span>
          <h1 className="at-display text-4xl md:text-6xl">{t("panier.title")}</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">{t("panier.hero")}</p>
          <div className="mt-8">
            <CheckoutStepper current="cart" />
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {cart.items.length === 0 ? (
            <div className="border border-border bg-card p-10 text-center">
              <ShoppingBag className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">{t("panier.empty")}</p>
              <Button asChild variant="technical" className="mt-6">
                <Link to="/$locale/boutique" params={{ locale }}>
                  {t("panier.browse")}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid items-start gap-8 lg:grid-cols-[1.6fr_1fr]">
              <div className="divide-y divide-border border border-border bg-card">
                {cart.items.map(({ accessory, qty }) => (
                  <div key={accessory.slug} className="flex flex-wrap items-center gap-4 p-5">
                    <div className="min-w-0 flex-1">
                      <span className="at-eyebrow">{accessory.category}</span>
                      <h2 className="mt-1 text-sm font-bold tracking-tight">
                        <Link
                          to="/$locale/boutique/$slug"
                          params={{ locale, slug: accessory.slug }}
                          className="hover:text-primary"
                        >
                          {accessory.name}
                        </Link>
                      </h2>
                      <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {formatFcfa(accessory.price)} {t("panier.perUnit")}
                      </div>
                    </div>
                    <div className="flex items-center border border-border">
                      <button
                        aria-label={t("panier.decrease", [accessory.name])}
                        onClick={() => cart.setQty(accessory.slug, qty - 1)}
                        className="size-10 font-mono text-sm"
                      >
                        −
                      </button>
                      <span className="w-9 text-center font-mono text-sm">{qty}</span>
                      <button
                        aria-label={t("panier.increase", [accessory.name])}
                        onClick={() => cart.setQty(accessory.slug, qty + 1)}
                        className="size-10 font-mono text-sm"
                      >
                        +
                      </button>
                    </div>
                    <div className="w-28 text-right font-mono text-sm font-medium">
                      {formatFcfa(accessory.price * qty)}
                    </div>
                    <button
                      aria-label={t("panier.remove", [accessory.name])}
                      onClick={() => cart.remove(accessory.slug)}
                      className="grid size-10 place-items-center border border-border text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>

              <PricingSidebar
                items={cart.items}
                t={t}
                onContinue={() => {
                  navigate({ to: "/$locale/checkout", params: { locale } });
                }}
                continueLabel={t("checkout.proceed")}
                showCoupon={false}
                shippingFee={0}
                shippingLabel={t("panier.shipping-estimate.text", ["estimée"])}
              />
            </div>
          )}

          <div className="mt-10">
            <MobileMoneyBar />
          </div>
        </div>
      </section>
    </>
  );
}
