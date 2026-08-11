import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MobileMoneyBar } from "@/components/site/Blocks";
import { CheckoutStepper, type CheckoutStep } from "@/components/shop/CheckoutStepper";
import { PricingSidebar } from "@/components/shop/PricingSidebar";
import { getDeliveryOptions, FREE_DELIVERY_FROM, useCart } from "@/components/shop/cart";
import { COMPANY, formatFcfa } from "@/data/catalog";
import { submitShopOrder, validatePromoCode } from "@/lib/shop.functions";
import { getOrderPaymentStatus, initiateFlutterwavePayment } from "@/lib/payments.functions";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import { trackPlausibleEvent } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n/locales";

const PAYMENTS = ["MTN MoMo", "Moov Money", "Celtiis", "Espèces à la remise"] as const;
const ONLINE_PAYMENTS = ["MTN MoMo", "Moov Money", "Celtiis"];

type PaymentState = "onPickup" | "redirect" | "paid" | "pending" | "failed" | null;

type Order = { ref: string; total: number; delivery: string; payment: string; name: string };

export const Route = createFileRoute("/$locale/checkout")({
  validateSearch: (search: Record<string, unknown>): { ref?: string; status?: string } => {
    const ref = typeof search["ref"] === "string" ? search["ref"] : undefined;
    const status = typeof search["status"] === "string" ? search["status"] : undefined;
    return { ...(ref ? { ref } : {}), ...(status ? { status } : {}) };
  },
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    return {
      meta: [
        { title: translate(locale, "checkout.meta.title") },
        { name: "description", content: translate(locale, "checkout.meta.description") },
        { property: "og:title", content: translate(locale, "checkout.meta.og.title") },
        {
          property: "og:description",
          content: translate(locale, "checkout.meta.og.description"),
        },
        { name: "robots", content: "noindex, nofollow" },
      ],
    };
  },
  component: Checkout,
});

function Checkout() {
  const cart = useCart();
  const { locale, t } = useI18n();
  const search = Route.useSearch();
  const placeOrder = useServerFn(submitShopOrder);
  const initPayment = useServerFn(initiateFlutterwavePayment);
  const checkPayment = useServerFn(getOrderPaymentStatus);
  const checkPromo = useServerFn(validatePromoCode);

  const [step, setStep] = useState<CheckoutStep>("address");
  const [delivery, setDelivery] = useState<string>(getDeliveryOptions(t)[0].id);
  const [manualDelivery, setManualDelivery] = useState(false);
  const [payment, setPayment] = useState<string>(PAYMENTS[0]);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", note: "" });
  const [errors, setErrors] = useState<{ name?: string; phone?: string; address?: string }>({});
  const [createAccount, setCreateAccount] = useState(false);
  const [differentAddress, setDifferentAddress] = useState(false);
  const [altAddress, setAltAddress] = useState({ street: "", city: "", zip: "" });
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>(null);
  const [payLink, setPayLink] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<{
    code: string;
    percent: number;
    label: string;
    discount: number;
  } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoChecking, setPromoChecking] = useState(false);

  const detectZone = (addr: string): string => {
    const lower = addr.toLowerCase();
    if (/(zogb|calavi|abomey)/i.test(lower)) return "calavi";
    if (/(cotonou|godomey)/i.test(lower)) return "cotonou";
    return "interieur";
  };

  useEffect(() => {
    if (manualDelivery) return;
    const raw = differentAddress
      ? `${altAddress.street} ${altAddress.city}`
      : form.address;
    if (raw.length < 3) return;
    const detected = detectZone(raw);
    setDelivery((prev) => (prev !== detected ? detected : prev));
  }, [form.address, altAddress, differentAddress, manualDelivery]);

  const option = getDeliveryOptions(t).find((o) => o.id === delivery) ?? getDeliveryOptions(t)[0];
  const freeShipping = cart.subtotal >= FREE_DELIVERY_FROM;
  const shipping = freeShipping ? 0 : option.fee;
  const total = cart.subtotal + shipping;
  const promoDiscount = promoApplied?.discount ?? 0;
  const discountTotal = Math.max(0, total - promoDiscount);

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

  const applyPromo = async () => {
    const code = promoCode.trim();
    if (!code) {
      setPromoError(t("panier.promo.required"));
      return;
    }
    if (promoChecking) return;
    setPromoChecking(true);
    setPromoError(null);
    try {
      const res = await checkPromo({ data: { code } });
      if (res.valid) {
        const discount = Math.floor((total * res.percent) / 100);
        setPromoApplied({
          code: code.toUpperCase(),
          percent: res.percent,
          label: res.label,
          discount,
        });
        setPromoCode(code.toUpperCase());
      } else {
        setPromoApplied(null);
        setPromoError(
          res.reason ? t(`panier.promo.reason.${res.reason}`) : t("panier.promo.error"),
        );
      }
    } catch {
      setPromoError(t("panier.promo.error"));
    } finally {
      setPromoChecking(false);
    }
  };

  const removePromo = () => {
    setPromoApplied(null);
    setPromoError(null);
    setPromoCode("");
  };

  const goToPayment = () => {
    const next: { name?: string; phone?: string; address?: string } = {};
    if (form.name.trim().length < 3) next.name = t("panier.error.name");
    if (!/^[+0-9\s]{8,}$/.test(form.phone.trim())) next.phone = t("panier.error.phone");
    if (option.id !== "retrait" && form.address.trim().length < 6)
      next.address = t("panier.error.address");
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setStep("payment");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const { reference, finalTotal } = await placeOrder({
        data: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email,
          address: form.address.trim(),
          delivery: option.label,
          payment,
          total,
          promoCode: promoApplied?.code ?? "",
          lines: cart.items.map((i) => ({
            slug: i.accessory.slug,
            label: i.accessory.name,
            qty: i.qty,
            price: i.accessory.price,
          })),
        },
      });

      const payTotal = typeof finalTotal === "number" ? finalTotal : discountTotal;
      const newOrder: Order = {
        ref: reference,
        total: payTotal,
        delivery: option.label,
        payment,
        name: form.name.trim(),
      };
      setOrder(newOrder);
      cart.clear();

      if (ONLINE_PAYMENTS.includes(payment)) {
        setRedirecting(true);
        try {
          sessionStorage.setItem("at-order", JSON.stringify(newOrder));
          const res = await initPayment({
            data: {
              reference,
              amount: payTotal,
              customer: {
                email: form.email,
                name: form.name.trim(),
                phone: form.phone.trim(),
              },
            },
          });
          if (res.available && res.link) {
            setPayLink(res.link);
            setPaymentState("redirect");
            window.location.href = res.link;
            return;
          }
        } catch {
          /* fallback to on-pickup */
        }
        setRedirecting(false);
        setPaymentState("onPickup");
      } else {
        setPaymentState("onPickup");
      }
      toast.success(t("panier.confirmed.toast", [reference]));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("panier.error.submit"));
    } finally {
      setSubmitting(false);
    }
  };

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
                {payLink && (
                  <Button
                    asChild
                    variant="technical"
                    className="mt-8"
                    onClick={() => {
                      window.location.href = payLink;
                    }}
                  >
                    <a href={payLink}>{t("panier.redirect.btn")}</a>
                  </Button>
                )}
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

  if (cart.items.length === 0) {
    return (
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <ShoppingBag className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">{t("panier.empty")}</p>
          <Button asChild variant="technical" className="mt-6">
            <Link to="/$locale/boutique" params={{ locale }}>
              {t("panier.browse")}
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Link
            to="/$locale/panier"
            params={{ locale }}
            className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" /> {t("checkout.back-to-cart")}
          </Link>
          <div className="mt-6">
            <span className="at-eyebrow mb-4 block">{t("checkout.eyebrow")}</span>
            <h1 className="at-display text-4xl md:text-6xl">{t("checkout.title")}</h1>
            <p className="mt-6 max-w-xl text-muted-foreground">{t("checkout.hero")}</p>
          </div>
          <div className="mt-8">
            <CheckoutStepper current={step} />
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-start gap-8 lg:grid-cols-[1.6fr_1fr]">
            {step === "address" ? (
              <>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    goToPayment();
                  }}
                  className="space-y-px border border-border bg-border"
                >
                  <div className="bg-card p-6">
                    <h3 className="at-eyebrow mb-3">{t("checkout.address.title")}</h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="name" className="mb-1 block text-xs font-semibold">
                          {t("checkout.address.name")}
                        </label>
                        <input
                          id="name"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                        />
                        {errors.name && (
                          <p className="mt-1 text-xs text-destructive">{errors.name}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="phone" className="mb-1 block text-xs font-semibold">
                          {t("checkout.address.phone")}
                        </label>
                        <input
                          id="phone"
                          inputMode="tel"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                        />
                        {errors.phone && (
                          <p className="mt-1 text-xs text-destructive">{errors.phone}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="email" className="mb-1 block text-xs font-semibold">
                          {t("checkout.address.email")}{" "}
                          <span className="font-normal text-muted-foreground">
                            {t("checkout.address.emailOptional")}
                          </span>
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label htmlFor="address" className="mb-1 block text-xs font-semibold">
                          {t("checkout.address.street")}
                        </label>
                        <input
                          id="address"
                          value={form.address}
                          onChange={(e) => setForm({ ...form, address: e.target.value })}
                          className="w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                        />
                        {errors.address && (
                          <p className="mt-1 text-xs text-destructive">{errors.address}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-card p-6">
                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={createAccount}
                        onChange={(e) => setCreateAccount(e.target.checked)}
                        className="accent-[var(--primary)]"
                      />
                      <span className="font-semibold">{t("checkout.create-account")}</span>
                    </label>
                  </div>

                  <div className="bg-card p-6">
                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={differentAddress}
                        onChange={(e) => setDifferentAddress(e.target.checked)}
                        className="accent-[var(--primary)]"
                      />
                      <span className="font-semibold">{t("checkout.different-address")}</span>
                    </label>
                    {differentAddress && (
                      <div className="mt-4 space-y-4 border-t border-border pt-4">
                        <div>
                          <label htmlFor="alt-street" className="mb-1 block text-xs font-semibold">
                            {t("checkout.address.street")}
                          </label>
                          <input
                            id="alt-street"
                            value={altAddress.street}
                            onChange={(e) => setAltAddress({ ...altAddress, street: e.target.value })}
                            className="w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="alt-city" className="mb-1 block text-xs font-semibold">
                              {t("checkout.address.city")}
                            </label>
                            <input
                              id="alt-city"
                              value={altAddress.city}
                              onChange={(e) => setAltAddress({ ...altAddress, city: e.target.value })}
                              className="w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                            />
                          </div>
                          <div>
                            <label htmlFor="alt-zip" className="mb-1 block text-xs font-semibold">
                              {t("checkout.address.zip")}
                            </label>
                            <input
                              id="alt-zip"
                              value={altAddress.zip}
                              onChange={(e) => setAltAddress({ ...altAddress, zip: e.target.value })}
                              className="w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-card p-6">
                    <label htmlFor="note" className="mb-1 block text-xs font-semibold">
                      {t("checkout.address.note")}
                    </label>
                    <textarea
                      id="note"
                      rows={3}
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      className="w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </form>

              <PricingSidebar
                items={cart.items}
                t={t}
                onContinue={goToPayment}
                continueLabel={t("checkout.address.continue")}
                showCoupon={false}
                showDelivery
                deliveryOptions={getDeliveryOptions(t)}
                selectedDelivery={delivery}
                onSelectDelivery={(id) => { setManualDelivery(true); setDelivery(id); }}
                shippingFee={shipping}
                shippingLabel={t("panier.delivery", [option.eta])}
                discount={promoDiscount}
                discountLabel={
                  promoApplied
                    ? t("panier.promo.discount", [promoApplied.code])
                    : undefined
                }
              />
              </>
            ) : (
              <>
                <div className="space-y-px border border-border bg-border">
                  <div className="bg-card p-6">
                    <h3 className="at-eyebrow mb-4">{t("checkout.payment.title")}</h3>
                    <div className="flex flex-wrap gap-1 rounded-sm border border-border bg-surface p-1">
                      {PAYMENTS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPayment(p)}
                          className={`flex-1 rounded-sm px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                            payment === p
                              ? "bg-card text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    <div className="mt-6">
                      {ONLINE_PAYMENTS.includes(payment) ? (
                        <div>
                          <label htmlFor="momo-phone" className="mb-1 block text-xs font-semibold">
                            {t("checkout.payment.phone-label")}
                          </label>
                          <input
                            id="momo-phone"
                            type="tel"
                            inputMode="tel"
                            placeholder={t("checkout.payment.phone-placeholder")}
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {t("checkout.payment.cash-desc")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-card p-6">
                    <Button
                      type="button"
                      variant="technicalOutline"
                      size="sm"
                      onClick={() => setStep("address")}
                    >
                      <ArrowLeft className="mr-1 size-3" />
                      {t("checkout.back-to-cart")}
                    </Button>

                    <fieldset className="mt-6">
                      <legend className="at-eyebrow mb-3">{t("panier.promo")}</legend>
                      {promoApplied ? (
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-primary">
                            {t("panier.promo.applied", [promoApplied.label, promoApplied.code])}
                          </span>
                          <button
                            type="button"
                            onClick={removePromo}
                            className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground underline hover:text-destructive"
                          >
                            {t("panier.promo.remove")}
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            placeholder={t("panier.promo.placeholder")}
                            className="w-full border border-border bg-background px-3 py-2 text-sm uppercase outline-none focus:border-primary"
                          />
                          <Button
                            type="button"
                            variant="technicalOutline"
                            size="sm"
                            disabled={promoChecking}
                            onClick={() => void applyPromo()}
                          >
                            {promoChecking ? (
                              <>
                                <Loader2 className="size-4 animate-spin" />
                                {t("panier.promo.checking")}
                              </>
                            ) : (
                              t("panier.promo.apply")
                            )}
                          </Button>
                        </div>
                      )}
                      {promoError && <p className="mt-2 text-xs text-destructive">{promoError}</p>}
                    </fieldset>
                  </div>
                </div>

                <PricingSidebar
                  items={cart.items}
                  t={t}
                  onContinue={() => void submit({ preventDefault: () => {} } as React.FormEvent)}
                  continueLabel={t("checkout.payment.place-order", [formatFcfa(discountTotal)])}
                  showCoupon={false}
                  showDelivery
                  deliveryOptions={getDeliveryOptions(t)}
                  selectedDelivery={delivery}
                onSelectDelivery={(id) => { setManualDelivery(true); setDelivery(id); }}
                  shippingFee={shipping}
                  shippingLabel={t("panier.delivery", [option.eta])}
                  discount={promoDiscount}
                  discountLabel={
                    promoApplied
                      ? t("panier.promo.discount", [promoApplied.code])
                      : undefined
                  }
                  loading={submitting || redirecting}
                  disabled={submitting}
                />
              </>
            )}
          </div>

          <div className="mt-10">
            <MobileMoneyBar />
          </div>
        </div>
      </section>
    </>
  );
}
