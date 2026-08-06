import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CtaBand, MobileMoneyBar, SectionHeader } from "@/components/site/Blocks";
import { useCart, FREE_DELIVERY_FROM } from "@/components/shop/cart";
import { ACCESSORIES, ACCESSORY_CATEGORIES, absoluteUrl, formatFcfa } from "@/data/catalog";

export const Route = createFileRoute("/boutique/")({
  head: () => ({
    meta: [
      { title: "Boutique accessoires — Coques, chargeurs, batteries | Allô Techno" },
      {
        name: "description",
        content:
          "Accessoires testés en atelier à Abomey-Calavi : coques, verres trempés, chargeurs rapides, câbles, batteries externes et écouteurs. Prix en FCFA, retrait ou livraison.",
      },
      { property: "og:title", content: "Boutique d'accessoires — Allô Techno" },
      {
        property: "og:description",
        content: "Coques, chargeurs, batteries et écouteurs disponibles en stock à Abomey-Calavi.",
      },
      { property: "og:url", content: "/boutique" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/boutique") }],
  }),
  component: Boutique,
});

const SORTS = [
  { id: "populaire", label: "Pertinence" },
  { id: "prix-asc", label: "Prix croissant" },
  { id: "prix-desc", label: "Prix décroissant" },
  { id: "stock", label: "Stock disponible" },
] as const;

function Boutique() {
  const [category, setCategory] = useState("toutes");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("populaire");
  const cart = useCart();

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
    if (sort === "stock") sorted.sort((a, b) => b.stock - a.stock);
    return sorted;
  }, [category, q, sort]);

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">Boutique · stock atelier</span>
          <h1 className="at-display text-4xl md:text-6xl">Accessoires testés en atelier</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">
            Chaque référence est contrôlée par nos techniciens avant mise en vente. Retrait immédiat
            à Zogbadjè ou livraison — offerte dès {formatFcfa(FREE_DELIVERY_FROM)} d'achat.
          </p>
          <div className="mt-8">
            <MobileMoneyBar />
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow={`${products.length} référence${products.length > 1 ? "s" : ""}`}
            title="Catalogue"
            text="Filtrez par famille de produit, comparez les prix et ajoutez au panier."
            right={
              <Button asChild variant="technical" size="lg">
                <Link to="/panier">
                  <ShoppingBag className="size-4" /> Panier ({cart.count})
                </Link>
              </Button>
            }
          />

          <div className="mb-8 grid gap-px border border-border bg-border md:grid-cols-3">
            <label className="bg-card p-4">
              <span className="at-eyebrow mb-2 block">Recherche</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Coque, chargeur 20W, câble…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </label>
            <label className="bg-card p-4">
              <span className="at-eyebrow mb-2 block">Famille</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              >
                <option value="toutes">Toutes les familles</option>
                {ACCESSORY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="bg-card p-4">
              <span className="at-eyebrow mb-2 block">Tri</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as (typeof SORTS)[number]["id"])}
                className="w-full bg-transparent text-sm outline-none"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {products.length === 0 ? (
            <p className="border border-border bg-card p-8 text-sm text-muted-foreground">
              Aucun accessoire ne correspond à cette recherche. Contactez-nous : nous commandons sur
              demande sous 72 h.
            </p>
          ) : (
            <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => {
                const inCart = cart.items.find((i) => i.accessory.slug === p.slug)?.qty ?? 0;
                return (
                  <article key={p.slug} className="flex flex-col bg-card p-6">
                    <span className="at-eyebrow">{p.category}</span>
                    <h3 className="mt-3 text-base font-bold tracking-tight">
                      <Link
                        to="/boutique/$slug"
                        params={{ slug: p.slug }}
                        className="hover:text-primary"
                      >
                        {p.name}
                      </Link>
                    </h3>
                    <div className="mt-4 font-mono text-xl font-medium text-primary">
                      {formatFcfa(p.price)}
                    </div>
                    <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {p.stock > 10
                        ? `En stock · ${p.stock} pcs`
                        : p.stock > 0
                          ? `Stock limité · ${p.stock} pcs`
                          : "Sur commande"}
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2">
                      <Button
                        variant="technical"
                        size="sm"
                        onClick={() => {
                          cart.add(p.slug);
                          toast.success(`${p.name} ajouté au panier`);
                        }}
                      >
                        {inCart > 0 ? <Check className="size-4" /> : <Plus className="size-4" />}
                        {inCart > 0 ? `Au panier (${inCart})` : "Ajouter"}
                      </Button>
                      <Button asChild variant="technicalOutline" size="sm">
                        <Link to="/boutique/$slug" params={{ slug: p.slug }}>
                          Détails
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
