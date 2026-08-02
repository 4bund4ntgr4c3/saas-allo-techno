import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MobileMoneyBar } from "@/components/site/Blocks";
import { FREE_DELIVERY_FROM, useCart } from "@/components/shop/cart";
import { ACCESSORIES, formatFcfa } from "@/data/catalog";

export const Route = createFileRoute("/boutique/$slug")({
  loader: ({ params }) => {
    const product = ACCESSORIES.find((a) => a.slug === params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.product.name ?? "Accessoire";
    const desc = `${name} — accessoire contrôlé en atelier, disponible à Abomey-Calavi. Retrait immédiat ou livraison, paiement Mobile Money.`;
    return {
      meta: [
        { title: `${name} — Boutique Allô Techno` },
        { name: "description", content: desc },
        { property: "og:title", content: `${name} — Allô Techno` },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: Produit,
});

function Produit() {
  const { product } = Route.useLoaderData();
  const [qty, setQty] = useState(1);
  const cart = useCart();
  const related = ACCESSORIES.filter(
    (a) => a.category === product.category && a.slug !== product.slug,
  ).slice(0, 3);

  return (
    <>
      <section className="border-b border-border py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Link
            to="/boutique"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" /> Retour à la boutique
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
              <p className="mt-4 text-sm text-muted-foreground">
                Référence testée par nos techniciens avant mise en rayon. Garantie d'échange 14 jours
                en cas de défaut constaté.
              </p>

              <dl className="mt-6 grid gap-px border border-border bg-border sm:grid-cols-2">
                <div className="bg-surface p-4">
                  <dt className="at-eyebrow">Disponibilité</dt>
                  <dd className="mt-1 font-mono text-xs">
                    {product.stock > 0 ? `${product.stock} pcs en stock` : "Sur commande (72 h)"}
                  </dd>
                </div>
                <div className="bg-surface p-4">
                  <dt className="at-eyebrow">Référence</dt>
                  <dd className="mt-1 font-mono text-xs uppercase">{product.slug}</dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="flex items-center border border-border">
                  <button
                    aria-label="Diminuer la quantité"
                    onClick={() => setQty((n) => Math.max(1, n - 1))}
                    className="size-11 font-mono text-sm"
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-mono text-sm">{qty}</span>
                  <button
                    aria-label="Augmenter la quantité"
                    onClick={() => setQty((n) => Math.min(Math.max(1, product.stock), n + 1))}
                    className="size-11 font-mono text-sm"
                  >
                    +
                  </button>
                </div>
                <Button
                  variant="technical"
                  size="lg"
                  onClick={() => {
                    cart.add(product.slug, qty);
                    toast.success(`${qty} × ${product.name} ajouté au panier`);
                  }}
                >
                  <ShoppingBag className="size-4" /> Ajouter au panier
                </Button>
                <Button asChild variant="technicalOutline" size="lg">
                  <Link to="/panier">Voir le panier ({cart.count})</Link>
                </Button>
              </div>

              <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Truck className="size-4 text-primary" /> Livraison offerte dès{" "}
                  {formatFcfa(FREE_DELIVERY_FROM)}
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" /> Échange 14 jours, facture fournie
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
            <h2 className="at-display text-2xl">Dans la même famille</h2>
            <div className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to="/boutique/$slug"
                  params={{ slug: r.slug }}
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
