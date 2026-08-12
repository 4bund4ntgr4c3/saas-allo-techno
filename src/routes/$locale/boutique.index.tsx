import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState, useCallback } from "react";
import { Check, Eye, Heart, Plus, ShoppingBag, GitCompareArrows } from "lucide-react";
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
import { CtaBand, MobileMoneyBar, SectionHeader } from "@/components/site/Blocks";
import { ShopFilterSidebar, type ShopFilters } from "@/components/shop/ShopFilterSidebar";
import { useCart, FREE_DELIVERY_FROM } from "@/components/shop/cart";
import { useWishlist } from "@/components/shop/wishlist";
import { useRecentlyViewed } from "@/components/shop/use-recently-viewed";
import { useCompare, MAX_COMPARE } from "@/components/shop/compare";
import { ACCESSORIES, formatFcfa } from "@/data/catalog";
import { listInventory } from "@/lib/content.functions";
import { ErrorRoute } from "@/components/ErrorRoute";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";
import { localeSeo } from "@/lib/seo";

const QuickView = lazy(() =>
  import("@/components/shop/QuickView").then((m) => ({ default: m.QuickView })),
);

export const Route = createFileRoute("/$locale/boutique/")({
  loader: () => listInventory().then((stock) => ({ stock })),
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const suffix = "/boutique";
    const seo = localeSeo(locale, suffix);
    return {
      meta: [
        { title: translate(locale, "boutique.meta.title") },
        { name: "description", content: translate(locale, "boutique.meta.description") },
        { property: "og:title", content: translate(locale, "boutique.og.title") },
        { property: "og:description", content: translate(locale, "boutique.og.description") },
        ...seo.meta,
      ],
      links: [...seo.links],
    };
  },
  errorComponent: ErrorRoute,
  component: Boutique,
});

const SORTS = [
  { id: "populaire", key: "boutique.sort.populaire" },
  { id: "prix-asc", key: "boutique.sort.prix-asc" },
  { id: "prix-desc", key: "boutique.sort.prix-desc" },
  { id: "stock", key: "boutique.sort.stock" },
] as const;

function Boutique() {
  const { stock } = Route.useLoaderData();

  function stockOf(slug: string): number {
    return Object.prototype.hasOwnProperty.call(stock, slug)
      ? (stock[slug] ?? 0)
      : (ACCESSORIES.find((a) => a.slug === slug)?.stock ?? 0);
  }

  const [sp] = useState(() => {
    if (typeof window === "undefined") return {} as Record<string, string>;
    return Object.fromEntries(new URLSearchParams(window.location.search));
  });

  const [filters, setFiltersState] = useState<ShopFilters>({
    category: sp["category"] ?? "toutes",
    priceRange: [Number(sp["priceMin"]) || 0, Number(sp["priceMax"]) || Infinity],
    inStock: sp["inStock"] === "1",
    sort: (sp["sort"] as ShopFilters["sort"]) ?? "populaire",
  });
  const [q, setQ] = useState(sp["q"] ?? "");
  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);
  const cart = useCart();
  const wishlist = useWishlist();
  const compare = useCompare();
  const { items: recentItems } = useRecentlyViewed();
  const { locale, t } = useI18n();

  const setFilters = useCallback(
    (next: ShopFilters | ((prev: ShopFilters) => ShopFilters)) => {
      const resolved = typeof next === "function" ? next(filters) : next;
      setFiltersState(resolved);
      const params = new URLSearchParams();
      if (resolved.category !== "toutes") params.set("category", resolved.category);
      if (resolved.priceRange[0] > 0) params.set("priceMin", String(resolved.priceRange[0]));
      if (resolved.priceRange[1] < Infinity) params.set("priceMax", String(resolved.priceRange[1]));
      if (resolved.inStock) params.set("inStock", "1");
      if (resolved.sort !== "populaire") params.set("sort", resolved.sort);
      if (q.trim()) params.set("q", q.trim());
      const qs = params.toString();
      const url = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
      window.history.replaceState(null, "", url);
    },
    [filters, q],
  );

  const quickViewProduct = quickViewSlug ? ACCESSORIES.find((a) => a.slug === quickViewSlug) : null;

  const products = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = ACCESSORIES.filter(
      (a) =>
        (filters.category === "toutes" || a.category === filters.category) &&
        (!term || a.name.toLowerCase().includes(term) || a.category.toLowerCase().includes(term)) &&
        a.price >= filters.priceRange[0] &&
        a.price <= filters.priceRange[1] &&
        (!filters.inStock || stockOf(a.slug) > 0),
    );
    const sorted = [...list];
    if (filters.sort === "prix-asc") sorted.sort((a, b) => a.price - b.price);
    if (filters.sort === "prix-desc") sorted.sort((a, b) => b.price - a.price);
    if (filters.sort === "stock") sorted.sort((a, b) => stockOf(b.slug) - stockOf(a.slug));
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, q, stock]);

  const recentProducts = recentItems
    .map((ri) => ACCESSORIES.find((a) => a.slug === ri.slug))
    .filter((a): a is (typeof ACCESSORIES)[number] => a !== undefined);

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="at-eyebrow">{t("boutique.eyebrow")}</span>
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
                  <BreadcrumbPage>{t("boutique.title")}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <h1 className="at-display text-4xl md:text-6xl">{t("boutique.title")}</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">
            {t("boutique.hero", [formatFcfa(FREE_DELIVERY_FROM)])}
          </p>
          <div className="mt-8">
            <MobileMoneyBar />
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow={t(products.length > 1 ? "boutique.refs" : "boutique.refs.one", [
              products.length,
            ])}
            title={t("boutique.catalogue")}
            text={t("boutique.catalogue.text")}
            right={
              <Button asChild variant="technical" size="lg">
                <Link to="/$locale/panier" params={{ locale }}>
                  <ShoppingBag className="size-4" /> {t("boutique.cart", [cart.count])}
                </Link>
              </Button>
            }
          />

          <div className="mt-8 flex flex-col gap-6 lg:flex-row">
            <ShopFilterSidebar filters={filters} onChange={setFilters} mode="shop" />

            <div className="flex-1">
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="search"
                  placeholder={t("boutique.search.placeholder")}
                  value={q}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQ(val);
                    const params = new URLSearchParams();
                    if (filters.category !== "toutes") params.set("category", filters.category);
                    if (filters.priceRange[0] > 0)
                      params.set("priceMin", String(filters.priceRange[0]));
                    if (filters.priceRange[1] < Infinity)
                      params.set("priceMax", String(filters.priceRange[1]));
                    if (filters.inStock) params.set("inStock", "1");
                    if (filters.sort !== "populaire") params.set("sort", filters.sort);
                    if (val.trim()) params.set("q", val.trim());
                    const qs = params.toString();
                    const url = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
                    window.history.replaceState(null, "", url);
                  }}
                  aria-label={t("boutique.search.placeholder")}
                  className="w-full border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <select
                  value={filters.sort}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilters({ ...filters, sort: val as ShopFilters["sort"] });
                  }}
                  aria-label={t("boutique.sort")}
                  className="w-44 shrink-0 border border-border bg-card px-3 py-2 text-xs font-medium focus:outline-none"
                >
                  {SORTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {t(s.key)}
                    </option>
                  ))}
                </select>
              </div>

              {products.length === 0 ? (
                <p className="border border-border bg-card p-8 text-sm text-muted-foreground">
                  {t("boutique.no-results")}
                </p>
              ) : (
                <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((p) => {
                    const inCart = cart.items.find((i) => i.accessory.slug === p.slug)?.qty ?? 0;
                    const available = stockOf(p.slug);
                    const wished = wishlist.has(p.slug);
                    return (
                      <article key={p.slug} className="flex flex-col bg-card p-6">
                        <div className="flex items-start justify-between">
                          <span className="at-eyebrow">{p.category}</span>
                          <button
                            onClick={() => {
                              wishlist.toggle(p.slug);
                              toast.success(
                                wished
                                  ? t("boutique.wishlist-removed")
                                  : t("boutique.wishlist-added"),
                              );
                            }}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            aria-label={t("boutique.wishlist")}
                          >
                            <Heart
                              className={`size-4 ${wished ? "fill-destructive text-destructive" : ""}`}
                            />
                          </button>
                        </div>
                        <h3 className="mt-3 text-base font-bold tracking-tight">
                          <Link
                            to="/$locale/boutique/$slug"
                            params={{ locale, slug: p.slug }}
                            className="hover:text-primary"
                          >
                            {p.name}
                          </Link>
                        </h3>
                        <div className="mt-4 font-mono text-xl font-medium text-primary">
                          {formatFcfa(p.price)}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          {available <= 0 ? (
                            <span className="inline-flex items-center gap-1.5 border border-border bg-surface px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                              <span className="size-1.5 bg-muted-foreground" />
                              {t("boutique.on-order")}
                            </span>
                          ) : available <= 5 ? (
                            <span className="inline-flex items-center gap-1.5 border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400">
                              <span className="size-1.5 animate-pulse bg-amber-500" />
                              {t("boutique.low-stock", [available])}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 border border-success/40 bg-success/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-success">
                              <span className="size-1.5 bg-success" />
                              {t("boutique.in-stock", [available])}
                            </span>
                          )}
                        </div>
                        <div className="mt-6 flex flex-wrap gap-2">
                          <Button
                            variant="technical"
                            size="sm"
                            disabled={available <= 0}
                            onClick={() => {
                              cart.add(p.slug);
                              toast.success(t("boutique.toast.added", [p.name]));
                            }}
                          >
                            {inCart > 0 ? (
                              <Check className="size-4" />
                            ) : (
                              <Plus className="size-4" />
                            )}
                            {available <= 0
                              ? t("boutique.unavailable")
                              : inCart > 0
                                ? t("boutique.in-cart", [inCart])
                                : t("boutique.add")}
                          </Button>
                          <Button
                            variant="technicalOutline"
                            size="sm"
                            onClick={() => setQuickViewSlug(p.slug)}
                          >
                            <Eye className="size-3" /> {t("boutique.quick-view")}
                          </Button>
                          <Button
                            variant="technicalOutline"
                            size="sm"
                            disabled={compare.has(p.slug) || compare.slugs.length >= MAX_COMPARE}
                            onClick={() => {
                              if (compare.has(p.slug)) {
                                toast.info(t("boutique.toast.compare-exists"));
                              } else if (compare.slugs.length >= MAX_COMPARE) {
                                toast.info(t("boutique.toast.compare-max"));
                              } else {
                                compare.add(p.slug);
                                toast.success(t("boutique.toast.compare-added", [p.name]));
                              }
                            }}
                          >
                            <GitCompareArrows className="size-3" /> {t("boutique.compare")}
                          </Button>
                          <Button asChild variant="technicalOutline" size="sm">
                            <Link to="/$locale/boutique/$slug" params={{ locale, slug: p.slug }}>
                              {t("boutique.details")}
                            </Link>
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {recentProducts.length > 0 && (
        <section className="border-t border-border py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="at-display text-xl">{t("boutique.recently-viewed")}</h2>
            <div className="mt-6 grid gap-px border border-border bg-border sm:grid-cols-3 lg:grid-cols-5">
              {recentProducts.map((p) => (
                <Link
                  key={p.slug}
                  to="/$locale/boutique/$slug"
                  params={{ locale, slug: p.slug }}
                  className="bg-card p-4 transition-colors hover:bg-surface"
                >
                  <span className="at-eyebrow text-[9px]">{p.category}</span>
                  <h3 className="mt-1 text-xs font-bold tracking-tight line-clamp-2">{p.name}</h3>
                  <div className="mt-2 font-mono text-sm text-primary">{formatFcfa(p.price)}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <CtaBand />

      {quickViewProduct && (
        <Suspense fallback={null}>
          <QuickView
            product={quickViewProduct}
            stock={stockOf(quickViewProduct.slug)}
            open={true}
            onClose={() => setQuickViewSlug(null)}
          />
        </Suspense>
      )}
    </>
  );
}
