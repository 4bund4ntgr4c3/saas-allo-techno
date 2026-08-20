import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Clock,
  Copy,
  CheckCircle2,
  Heart,
  ShieldCheck,
  Share2,
  ShoppingBag,
  Truck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { MobileMoneyBar } from "@/components/site/Blocks";
import { FREE_DELIVERY_FROM, useCart } from "@/components/shop/cart";
import { useWishlist } from "@/components/shop/wishlist";
import { useRecentlyViewed } from "@/components/shop/use-recently-viewed";
import { ProductReviewsSection } from "@/components/shop/ProductReviews";
import { ImageZoom } from "@/components/shop/ImageZoom";
import { ACCESSORIES } from "@/data/catalog/accessories";
import { formatFcfa } from "@/data/catalog/company";
import { listInventory } from "@/lib/content.functions";
import { ErrorRoute } from "@/components/ErrorRoute";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
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
    const product = loaderData?.product;
    const productSchema =
      product != null
        ? JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: desc,
            image: `https://placehold.co/600x600/f8f9fa/adb5bd?text=${encodeURIComponent(product.name.slice(0, 12))}`,
            brand: { "@type": "Brand", name: "Allô Techno" },
            offers: {
              "@type": "Offer",
              price: product.price,
              priceCurrency: "XOF",
              availability:
                (loaderData?.stock ?? 0) > 0
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
            },
          })
        : null;
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
      scripts: productSchema ? [{ type: "application/ld+json", children: productSchema }] : [],
    };
  },
  errorComponent: ErrorRoute,
  component: Produit,
});

function Produit() {
  const { product, stock } = Route.useLoaderData();
  const [qty, setQty] = useState(1);
  const cart = useCart();
  const wishlist = useWishlist();
  const { track, items: recentItems } = useRecentlyViewed();
  const { locale, t } = useI18n();
  const related = ACCESSORIES.filter(
    (a) => a.category === product.category && a.slug !== product.slug,
  ).slice(0, 3);
  const wished = wishlist.has(product.slug);

  useEffect(() => {
    track({
      slug: product.slug,
      name: product.name,
      category: product.category,
      price: product.price,
    });
  }, [product, track]);

  return (
    <>
      <section className="border-b border-border py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="at-eyebrow">{product.category}</span>
            <Breadcrumb className="rounded-sm border border-border px-2 py-1">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/$locale" params={{ locale }}>
                      {t("action.accueil")}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/$locale/boutique" params={{ locale }}>
                      {t("boutique.title")}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{product.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="mt-8 grid gap-px border border-border bg-border lg:grid-cols-2">
            <div className="bg-surface p-6">
              <ImageZoom
                src={`https://placehold.co/600x600/f8f9fa/adb5bd?text=${encodeURIComponent(product.name.slice(0, 12))}`}
                alt={product.name}
              />
            </div>
            <div className="bg-card p-6 sm:p-8">
              <div className="flex items-start justify-between">
                <span className="at-eyebrow">{product.category}</span>
                <button
                  onClick={() => {
                    wishlist.toggle(product.slug);
                    toast.success(
                      wished ? t("boutique.wishlist-removed") : t("boutique.wishlist-added"),
                    );
                  }}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  aria-label={t("boutique.wishlist")}
                >
                  <Heart
                    className={`size-5 ${wished ? "fill-destructive text-destructive" : ""}`}
                  />
                </button>
              </div>
              <h1 className="at-display mt-3 text-3xl md:text-4xl">{product.name}</h1>
              <div className="mt-6 font-mono text-3xl font-medium text-primary">
                {formatFcfa(product.price)}
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{t("boutique.test")}</p>

              <dl className="mt-6 grid gap-px border border-border bg-border sm:grid-cols-2">
                <div className="bg-surface p-4">
                  <dt className="at-eyebrow">{t("boutique.availability")}</dt>
                  <dd className="mt-1">
                    {stock > 0 ? (
                      <span
                        className={`inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                          stock <= 5
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "border-success/40 bg-success/10 text-success"
                        }`}
                      >
                        <span
                          className={`size-1.5 ${stock <= 5 ? "animate-pulse bg-amber-500" : "bg-success"}`}
                        />
                        {t("boutique.stock-available", [stock])}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 border border-border bg-surface px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        <span className="size-1.5 bg-muted-foreground" />
                        {t("boutique.on-order-72")}
                      </span>
                    )}
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
                  <Clock className="size-4 text-primary" /> {t("boutique.delivery-estimate")}
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" /> {t("boutique.exchange")}
                </li>
              </ul>

              <div className="mt-6 flex flex-wrap gap-2">
                <Button
                  variant="technicalOutline"
                  size="sm"
                  onClick={() => {
                    const url = typeof window !== "undefined" ? window.location.href : "";
                    const text = `${product.name} — ${formatFcfa(product.price)}`;
                    const waUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
                    window.open(waUrl, "_blank", "noopener,noreferrer");
                  }}
                >
                  <Share2 className="size-3" /> WhatsApp
                </Button>
                <Button
                  variant="technicalOutline"
                  size="sm"
                  onClick={() => {
                    const url = typeof window !== "undefined" ? window.location.href : "";
                    navigator.clipboard.writeText(url).then(() => {
                      toast.success(t("boutique.link-copied"));
                    });
                  }}
                >
                  <Copy className="size-3" /> {t("boutique.copy-link")}
                </Button>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-px border border-border bg-border text-center">
                <div className="bg-surface p-3">
                  <Wallet className="mx-auto size-4 text-primary" />
                  <span className="mt-1 block font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    {t("boutique.trust.secure")}
                  </span>
                </div>
                <div className="bg-surface p-3">
                  <ShieldCheck className="mx-auto size-4 text-primary" />
                  <span className="mt-1 block font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    {t("boutique.trust.return")}
                  </span>
                </div>
                <div className="bg-surface p-3">
                  <CheckCircle2 className="mx-auto size-4 text-primary" />
                  <span className="mt-1 block font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    {t("boutique.trust.verified")}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8">
            <MobileMoneyBar />
          </div>
        </div>
      </section>

      <ProductReviewsSection productSlug={product.slug} />

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

      {recentItems.length > 1 && (
        <section className="border-t border-border py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="at-display text-xl">{t("boutique.recently-viewed")}</h2>
            <div className="mt-6 grid gap-px border border-border bg-border sm:grid-cols-3 lg:grid-cols-5">
              {recentItems
                .filter((r) => r.slug !== product.slug)
                .slice(0, 5)
                .map((r) => (
                  <Link
                    key={r.slug}
                    to="/$locale/boutique/$slug"
                    params={{ locale, slug: r.slug }}
                    className="bg-card p-4 transition-colors hover:bg-surface"
                  >
                    <span className="font-mono text-[9px] uppercase text-muted-foreground">
                      {r.category}
                    </span>
                    <h3 className="mt-1 text-xs font-bold tracking-tight">{r.name}</h3>
                    <div className="mt-1 font-mono text-xs text-primary">{formatFcfa(r.price)}</div>
                  </Link>
                ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
