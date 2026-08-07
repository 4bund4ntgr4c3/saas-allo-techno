import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MobileMoneyBar } from "@/components/site/Blocks";
import { DELIVERY_OPTIONS, FREE_DELIVERY_FROM, useCart } from "@/components/shop/cart";
import { COMPANY, formatFcfa } from "@/data/catalog";
import { submitShopOrder } from "@/lib/shop.functions";
import { getOrderPaymentStatus, initiateFlutterwavePayment } from "@/lib/payments.functions";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import "@/lib/i18n/segments/panier";
import type { Locale } from "@/lib/i18n/locales";

const PAYMENTS = ["MTN MoMo", "Moov Money", "Celtiis", "Espèces à la remise"] as const;
const ONLINE_PAYMENTS = ["MTN MoMo", "Moov Money", "Celtiis"];

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
  const search = Route.useSearch();
  const placeOrder = useServerFn(submitShopOrder);
  const initPayment = useServerFn(initiateFlutterwavePayment);
  const checkPayment = useServerFn(getOrderPaymentStatus);
  const [delivery, setDelivery] = useState<string>(DELIVERY_OPTIONS[0].id);
  const [payment, setPayment] = useState<string>(PAYMENTS[0]);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", note: "" });
  const [errors, setErrors] = useState<{ name?: string; phone?: string; address?: string }>({});
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>(null);
  const [payLink, setPayLink] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const option = DELIVERY_OPTIONS.find((o) => o.id === delivery) ?? DELIVERY_OPTIONS[0];
  const freeShipping = cart.subtotal >= FREE_DELIVERY_FROM;
  const shipping = freeShipping ? 0 : option.fee;
  const total = cart.subtotal + shipping;

  // Retour de la page de paiement Flutterwave (status=redirect) : on restaure
  // la commande depuis sessionStorage et on interroge le statut du paiement.
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
          toast.success(t("panier.paid.title"));
          return;
        }
        if (res.status === "failed") {
          setPaymentState("failed");
          return;
        }
      } catch {
        // réseau : on réessaie
      }
      await new Promise((r) => setTimeout(r, 4000));
    }
    setPaymentState("pending");
  }, [search.ref, search.status, checkPayment, t]);

  useEffect(() => {
    void restoreFromSearch();
  }, [restoreFromSearch]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: { name?: string; phone?: string; address?: string } = {};
    if (form.name.trim().length < 3) next.name = t("panier.error.name");
    if (!/^[+0-9\s]{8,}$/.test(form.phone.trim())) next.phone = t("panier.error.phone");
    if (option.id !== "retrait" && form.address.trim().length < 6)
      next.address = t("panier.error.address");
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    if (submitting) return;

    setSubmitting(true);
    try {
      const { reference } = await placeOrder({
        data: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email,
          address: form.address.trim(),
          delivery: option.label,
          payment,
          total,
          lines: cart.items.map((i) => ({
            slug: i.accessory.slug,
            label: i.accessory.name,
            qty: i.qty,
            price: i.accessory.price,
          })),
        },
      });

      const newOrder: Order = {
        ref: reference,
        total,
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
              amount: total,
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
          // échec d'initiation : on garde la commande, paiement à la remise
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

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <span className="at-eyebrow mb-4 block">{t("panier.shop")}</span>
        <h1 className="at-display text-4xl md:text-5xl">{t("panier.title")}</h1>

        {cart.items.length === 0 ? (
          <div className="mt-10 border border-border bg-card p-10 text-center">
            <ShoppingBag className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">{t("panier.empty")}</p>
            <Button asChild variant="technical" className="mt-6">
              <Link to="/$locale/boutique" params={{ locale }}>
                {t("panier.browse")}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1.6fr_1fr]">
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

            <form onSubmit={submit} className="space-y-px border border-border bg-border">
              <div className="bg-card p-6">
                <h2 className="at-display text-xl">{t("panier.summary")}</h2>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t("panier.subtotal")}</dt>
                    <dd className="font-mono">{formatFcfa(cart.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t("panier.delivery", [option.eta])}</dt>
                    <dd className="font-mono">
                      {shipping === 0 ? t("panier.free") : formatFcfa(shipping)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                    <dt>{t("panier.total")}</dt>
                    <dd className="font-mono text-primary">{formatFcfa(total)}</dd>
                  </div>
                </dl>
                {!freeShipping && (
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t("panier.freeDelivery", [formatFcfa(FREE_DELIVERY_FROM)])}
                  </p>
                )}
              </div>

              <fieldset className="bg-card p-6">
                <legend className="at-eyebrow mb-3">{t("panier.deliveryMethod")}</legend>
                <div className="space-y-2">
                  {DELIVERY_OPTIONS.map((o) => (
                    <label key={o.id} className="flex items-center gap-3 text-sm">
                      <input
                        type="radio"
                        name="delivery"
                        value={o.id}
                        checked={delivery === o.id}
                        onChange={() => setDelivery(o.id)}
                        className="accent-[var(--primary)]"
                      />
                      <span className="flex-1">{o.label}</span>
                      <span className="font-mono text-[10px] uppercase text-muted-foreground">
                        {o.fee === 0 ? t("panier.freeShipping") : formatFcfa(o.fee)}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="bg-card p-6">
                <h3 className="at-eyebrow mb-3">{t("panier.contact")}</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="mb-1 block text-xs font-semibold">
                      {t("panier.name")}
                    </label>
                    <input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                    {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="phone" className="mb-1 block text-xs font-semibold">
                      {t("panier.phone")}
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
                      {t("panier.email")}{" "}
                      <span className="font-normal text-muted-foreground">
                        {t("panier.emailOptional")}
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
                  {option.id !== "retrait" && (
                    <div>
                      <label htmlFor="address" className="mb-1 block text-xs font-semibold">
                        {t("panier.address")}
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
                  )}
                  <div>
                    <label htmlFor="payment" className="mb-1 block text-xs font-semibold">
                      {t("panier.paymentMethod")}
                    </label>
                    <select
                      id="payment"
                      value={payment}
                      onChange={(e) => setPayment(e.target.value)}
                      className="w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    >
                      {PAYMENTS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="note" className="mb-1 block text-xs font-semibold">
                      {t("panier.note")}
                    </label>
                    <textarea
                      id="note"
                      rows={3}
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      className="w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  variant="technical"
                  size="lg"
                  className="mt-6 w-full"
                  disabled={submitting}
                >
                  {submitting || redirecting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {redirecting ? t("panier.redirecting") : t("panier.saving")}
                    </>
                  ) : (
                    <>{t("panier.submit", [formatFcfa(total)])}</>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="mt-10">
          <MobileMoneyBar />
        </div>
      </div>
    </section>
  );
}
