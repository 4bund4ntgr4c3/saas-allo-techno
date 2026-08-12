import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BadgePercent,
  BatteryCharging,
  Check,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CtaBand, MobileMoneyBar, SectionHeader } from "@/components/site/Blocks";
import { ShopFilterSidebar, type ShopFilters } from "@/components/shop/ShopFilterSidebar";
import { useCart } from "@/components/shop/cart";
import { ACCESSORIES, formatFcfa } from "@/data/catalog";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";
import { localeSeo } from "@/lib/seo";

export const Route = createFileRoute("/$locale/reconditionnes")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const suffix = "/reconditionnes";
    const seo = localeSeo(locale, suffix);
    return {
      meta: [
        { title: translate(locale, "reconditionnes.meta.title") },
        { name: "description", content: translate(locale, "reconditionnes.meta.description") },
        { property: "og:title", content: translate(locale, "reconditionnes.og.title") },
        { property: "og:description", content: translate(locale, "reconditionnes.og.description") },
        ...seo.meta,
      ],
      links: [...seo.links],
    };
  },
  component: Reconditionnes,
});

const WHY: { icon: LucideIcon; key: string }[] = [
  { icon: ShieldCheck, key: "b1" },
  { icon: BatteryCharging, key: "b2" },
  { icon: BadgePercent, key: "b3" },
  { icon: Wrench, key: "b4" },
];

function Reconditionnes() {
  const cart = useCart();
  const { locale, t } = useI18n();
  const allProducts = ACCESSORIES.filter((a) => a.category === "Reconditionnés");

  const [filters, setFilters] = useState<ShopFilters>({
    category: "toutes",
    priceRange: [0, Infinity],
    inStock: false,
    sort: "populaire",
  });

  const products = useMemo(() => {
    const list = allProducts.filter(
      (a) =>
        a.price >= filters.priceRange[0] &&
        a.price <= filters.priceRange[1] &&
        (!filters.inStock || a.stock > 0),
    );
    const sorted = [...list];
    if (filters.sort === "prix-asc") sorted.sort((a, b) => a.price - b.price);
    if (filters.sort === "prix-desc") sorted.sort((a, b) => b.price - a.price);
    if (filters.sort === "stock") sorted.sort((a, b) => b.stock - a.stock);
    return sorted;
  }, [allProducts, filters]);

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">{t("reconditionnes.eyebrow")}</span>
          <h1 className="at-display text-4xl md:text-6xl">{t("reconditionnes.title")}</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">{t("reconditionnes.hero")}</p>
          <div className="mt-8">
            <MobileMoneyBar />
          </div>
        </div>
      </section>

      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow={t("reconditionnes.why.eyebrow")}
            title={t("reconditionnes.why.title")}
            text={t("reconditionnes.why.text")}
          />
          <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((w) => {
              const Icon = w.icon;
              return (
                <div key={w.key} className="flex flex-col bg-card p-6">
                  <Icon className="size-6 text-primary" strokeWidth={1.5} />
                  <h2 className="mt-4 text-base font-bold tracking-tight">
                    {t(`reconditionnes.why.${w.key}`)}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t(`reconditionnes.why.${w.key}.text`)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow={t("reconditionnes.catalogue.eyebrow")}
            title={t("reconditionnes.catalogue.title")}
            text={t("reconditionnes.catalogue.text")}
            right={
              <Button asChild variant="technical" size="lg">
                <Link to="/$locale/panier" params={{ locale }}>
                  <ShoppingBag className="size-4" /> {t("reconditionnes.cart", [cart.count])}
                </Link>
              </Button>
            }
          />

          <div className="mt-8 flex flex-col gap-6 lg:flex-row">
            <ShopFilterSidebar filters={filters} onChange={setFilters} mode="refurbished" />

            <div className="flex-1">
              {products.length === 0 ? (
                <p className="border border-border bg-card p-8 text-sm text-muted-foreground">
                  {t("boutique.no-results")}
                </p>
              ) : (
                <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((p) => {
                    const inCart = cart.items.find((i) => i.accessory.slug === p.slug)?.qty ?? 0;
                    const available = p.stock;
                    return (
                      <article key={p.slug} className="flex flex-col bg-card p-6">
                        <div className="flex flex-wrap items-center gap-2">
                          {p.gb && (
                            <span className="border border-border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider">
                              {p.gb}
                            </span>
                          )}
                          {p.grade && (
                            <span className="border border-border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                              {t("reconditionnes.grade.tile", [p.grade])}
                            </span>
                          )}
                        </div>
                        <span className="at-eyebrow mt-4">
                          {t("reconditionnes.warranty.tile", [
                            p.warranty ?? t("reconditionnes.default-warranty"),
                          ])}
                        </span>
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
                            ? t("reconditionnes.unavailable")
                            : available <= 3
                              ? t("reconditionnes.low-stock", [available])
                              : t("reconditionnes.stock", [available])}
                        </div>
                        <div className="mt-6 flex flex-wrap gap-2">
                          <Button
                            variant="technical"
                            size="sm"
                            disabled={available <= 0}
                            onClick={() => {
                              cart.add(p.slug, 1);
                              toast.success(t("reconditionnes.toast.added", [p.name]));
                            }}
                          >
                            {inCart > 0 ? (
                              <Check className="size-4" />
                            ) : (
                              <Plus className="size-4" />
                            )}
                            {available <= 0
                              ? t("reconditionnes.unavailable")
                              : inCart > 0
                                ? t("reconditionnes.in-cart", [inCart])
                                : t("reconditionnes.add")}
                          </Button>
                          <Button asChild variant="technicalOutline" size="sm">
                            <Link to="/$locale/boutique/$slug" params={{ locale, slug: p.slug }}>
                              {t("reconditionnes.details")}
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

      <CtaBand />
    </>
  );
}
