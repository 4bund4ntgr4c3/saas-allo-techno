import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MobileMoneyBar } from "@/components/site/Blocks";
import { FREE_DELIVERY_FROM, useCart } from "@/components/shop/cart";
import { ACCESSORIES, formatFcfa } from "@/data/catalog";
import { listInventory } from "@/lib/content.functions";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import "@/lib/i18n/segments/boutique";
import type { Locale } from "@/lib/i18n/locales";

export const Route = createFileRoute("/$locale/boutique/$slug")({
  loader: async ({ params }) => {
    const product = ACCESSORIES.find((a) => a.slug === params.slug);
    if (!product) throw notFound();
    const stock = await listInventory();
    const real = Object.prototype.hasOwnProperty.call(stock, params.slug)
      ? stock[params.slug]
      : null;
    return { product, stock: real ?? product.stock };
  },
  head: ({ params, loaderData }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const name = loaderData?.product.name ?? translate(locale, "boutique.accessory");
    const desc = translate(locale, "boutique.meta.detail.description", [name]);
    return {
      meta: [
        { title: translate(locale, "boutique.meta.detail.title", [name]) },
        { name: "description", content: desc },
        {
          property: "og:title",
          content: translate(locale, "boutique.meta.detail.og.title", [name]),
        },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: Produit,
});

function Produit() {
  const { product, stock } = Route.useLoaderData();
  const [qty, setQty] = useState(1);
  const cart = useCart();
  const { locale, t } = useI18n();
  const related = ACCESSORIES.filter(
    (a) => a.category === product.category && a.slug !== product.slug,
  ).slice(0, 3);

  return (
    <>
      <section className="border-b border-border py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Link
            to="/$locale/boutique"
            params={{ locale }}
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" /> {t("boutique.back")}
          </Link>
          <div className="mt-8 grid gap-px border border-border bg-border lg:grid-cols-2">
            <div className="at-grid-lines grid min-h-[280px] place-items-center bg-surface p-10">
              <span className="at-display text-5xl text-muted-foreground/50">
                {product.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="bg-card p-8">
              <span className="at-eyebrow">{product.category}</span>
              <h1 className="at-display mt-3 text-3xl md:text-4xl">{product.name}</h1>
              <div className="mt-6 font-mono text-3xl font-medium text-primary">
                {formatFcfa(product.price)}
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{t("boutique.test")}</p>

              <dl className="mt-6 grid gap-px border border-border bg-border sm:grid-cols-2">
                <div className="bg-surface p-4">
                  <dt className="at-eyebrow">{t("boutique.availability")}</dt>
                  <dd className="mt-1 font-mono text-xs">
                    {stock > 0 ? t("boutique.stock-available", [stock]) : t("boutique.on-order-72")}
                  </dd>
                </div>
                <div className="bg-surface p-4">
                  <dt className="at-eyebrow">{t("boutique.reference")}</dt>
                  <dd className="mt-1 font-mono text-xs uppercase">{product.slug}</dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="flex items-center border border-border">
                  <button
                    aria-label={t("boutique.qty.decrease")}
                    onClick={() => setQty((n) => Math.max(1, n - 1))}
                    className="size-11 font-mono text-sm"
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-mono text-sm">{qty}</span>
                  <button
                    aria-label={t("boutique.qty.increase")}
                    onClick={() => setQty((n) => Math.min(Math.max(1, stock), n + 1))}
                    className="size-11 font-mono text-sm"
                  >
                    +
                  </button>
                </div>
                <Button
                  variant="technical"
                  size="lg"
                  disabled={stock <= 0}
                  onClick={() => {
                    cart.add(product.slug, qty);
                    toast.success(t("boutique.toast.added-qty", [qty, product.name]));
                  }}
                >
                  <ShoppingBag className="size-4" /> {t("boutique.add-to-cart")}
                </Button>
                <Button asChild variant="technicalOutline" size="lg">
                  <Link to="/$locale/panier" params={{ locale }}>
                    {t("boutique.view-cart", [cart.count])}
                  </Link>
                </Button>
              </div>

              <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Truck className="size-4 text-primary" />{" "}
                  {t("boutique.free-delivery", [formatFcfa(FREE_DELIVERY_FROM)])}
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" /> {t("boutique.exchange")}
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8">
            <MobileMoneyBar />
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="at-display text-2xl">{t("boutique.related")}</h2>
            <div className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to="/$locale/boutique/$slug"
                  params={{ locale, slug: r.slug }}
                  className="bg-card p-6 transition-colors hover:bg-surface"
                >
                  <span className="at-eyebrow">{r.category}</span>
                  <h3 className="mt-3 text-sm font-bold tracking-tight">{r.name}</h3>
                  <div className="mt-3 font-mono text-base text-primary">{formatFcfa(r.price)}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
