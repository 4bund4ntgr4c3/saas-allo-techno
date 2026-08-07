import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CtaBand, MobileMoneyBar, SectionHeader } from "@/components/site/Blocks";
import { useCart, FREE_DELIVERY_FROM } from "@/components/shop/cart";
import { ACCESSORIES, ACCESSORY_CATEGORIES, absoluteUrl, formatFcfa } from "@/data/catalog";
import { listInventory } from "@/lib/content.functions";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import "@/lib/i18n/segments/boutique";
import type { Locale } from "@/lib/i18n/locales";

export const Route = createFileRoute("/$locale/boutique/")({
  loader: () => listInventory().then((stock) => ({ stock })),
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    return {
      meta: [
        { title: translate(locale, "boutique.meta.title") },
        { name: "description", content: translate(locale, "boutique.meta.description") },
        { property: "og:title", content: translate(locale, "boutique.og.title") },
        { property: "og:description", content: translate(locale, "boutique.og.description") },
        { property: "og:url", content: "/boutique" },
      ],
      links: [{ rel: "canonical", href: absoluteUrl("/boutique") }],
    };
  },
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
  const [category, setCategory] = useState("toutes");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("populaire");
  const cart = useCart();
  const { locale, t } = useI18n();

  const products = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = ACCESSORIES.filter(
      (a) =>
        (category === "toutes" || a.category === category) &&
        (!term || a.name.toLowerCase().includes(term) || a.category.toLowerCase().includes(term)),
    );
    const sorted = [...list];
    if (sort === "prix-asc") sorted.sort((a, b) => a.price - b.price);
    if (sort === "prix-desc") sorted.sort((a, b) => b.price - a.price);
    if (sort === "stock") sorted.sort((a, b) => stockOf(b.slug) - stockOf(a.slug));
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, q, sort, stock]);

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">{t("boutique.eyebrow")}</span>
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

          <div className="mb-8 grid gap-px border border-border bg-border md:grid-cols-3">
            <label className="bg-card p-4">
              <span className="at-eyebrow mb-2 block">{t("boutique.search")}</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("boutique.search.placeholder")}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </label>
            <label className="bg-card p-4">
              <span className="at-eyebrow mb-2 block">{t("boutique.family")}</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              >
                <option value="toutes">{t("boutique.all-families")}</option>
                {ACCESSORY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="bg-card p-4">
              <span className="at-eyebrow mb-2 block">{t("boutique.sort")}</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as (typeof SORTS)[number]["id"])}
                className="w-full bg-transparent text-sm outline-none"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {t(s.key)}
                  </option>
                ))}
              </select>
            </label>
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
                return (
                  <article key={p.slug} className="flex flex-col bg-card p-6">
                    <span className="at-eyebrow">{p.category}</span>
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
                    <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {available <= 0
                        ? t("boutique.on-order")
                        : available > 10
                          ? t("boutique.in-stock", [available])
                          : t("boutique.low-stock", [available])}
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
                        {inCart > 0 ? <Check className="size-4" /> : <Plus className="size-4" />}
                        {available <= 0
                          ? t("boutique.unavailable")
                          : inCart > 0
                            ? t("boutique.in-cart", [inCart])
                            : t("boutique.add")}
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
      </section>

      <CtaBand />
    </>
  );
}
