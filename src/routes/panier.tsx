import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MobileMoneyBar } from "@/components/site/Blocks";
import { DELIVERY_OPTIONS, FREE_DELIVERY_FROM, useCart } from "@/components/shop/cart";
import { COMPANY, formatFcfa } from "@/data/catalog";

export const Route = createFileRoute("/panier")({
  head: () => ({
    meta: [
      { title: "Panier & commande d'accessoires — Allô Techno" },
      {
        name: "description",
        content:
          "Validez votre commande d'accessoires : retrait en boutique à Abomey-Calavi ou livraison, paiement MTN MoMo, Moov Money ou espèces.",
      },
      { property: "og:title", content: "Panier — Allô Techno" },
      {
        property: "og:description",
        content: "Commande d'accessoires avec retrait ou livraison au Bénin.",
      },
    ],
  }),
  component: Panier,
});

const PAYMENTS = ["MTN MoMo", "Moov Money", "Celtiis", "Espèces à la remise"] as const;

type Order = { ref: string; total: number; delivery: string; payment: string; name: string };

function Panier() {
  const cart = useCart();
  const [delivery, setDelivery] = useState<string>(DELIVERY_OPTIONS[0].id);
  const [payment, setPayment] = useState<string>(PAYMENTS[0]);
  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "" });
  const [errors, setErrors] = useState<{ name?: string; phone?: string; address?: string }>({});
  const [order, setOrder] = useState<Order | null>(null);

  const option = DELIVERY_OPTIONS.find((o) => o.id === delivery) ?? DELIVERY_OPTIONS[0];
  const freeShipping = cart.subtotal >= FREE_DELIVERY_FROM;
  const shipping = freeShipping ? 0 : option.fee;
  const total = cart.subtotal + shipping;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: { name?: string; phone?: string; address?: string } = {};
    if (form.name.trim().length < 3) next.name = "Indiquez votre nom complet.";
    if (!/^[+0-9\s]{8,}$/.test(form.phone.trim())) next.phone = "Numéro de téléphone invalide.";
    if (option.id !== "retrait" && form.address.trim().length < 6)
      next.address = "Précisez l'adresse de livraison.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const ref = `AC-2026-${Math.floor(100 + Math.random() * 900)}`;
    setOrder({ ref, total, delivery: option.label, payment, name: form.name.trim() });
    cart.clear();
    toast.success(`Commande ${ref} enregistrée`);
  };

  if (order) {
    return (
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="border border-border bg-card p-8">
            <CheckCircle2 className="size-8 text-primary" />
            <h1 className="at-display mt-6 text-3xl">Commande enregistrée</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Merci {order.name}. Un conseiller vous confirme la disponibilité par WhatsApp au{" "}
              {COMPANY.whatsapp} dans les 30 minutes ouvrées.
            </p>
            <dl className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-2">
              <div className="bg-surface p-4">
                <dt className="at-eyebrow">Numéro de commande</dt>
                <dd className="mt-1 font-mono text-sm">{order.ref}</dd>
              </div>
              <div className="bg-surface p-4">
                <dt className="at-eyebrow">Montant à régler</dt>
                <dd className="mt-1 font-mono text-sm">{formatFcfa(order.total)}</dd>
              </div>
              <div className="bg-surface p-4">
                <dt className="at-eyebrow">Mode de réception</dt>
                <dd className="mt-1 font-mono text-xs">{order.delivery}</dd>
              </div>
              <div className="bg-surface p-4">
                <dt className="at-eyebrow">Paiement</dt>
                <dd className="mt-1 font-mono text-xs">{order.payment}</dd>
              </div>
            </dl>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="technical">
                <Link to="/boutique">Continuer mes achats</Link>
              </Button>
              <Button asChild variant="technicalOutline">
                <Link to="/">Retour à l'accueil</Link>
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
        <span className="at-eyebrow mb-4 block">Boutique</span>
        <h1 className="at-display text-4xl md:text-5xl">Votre panier</h1>

        {cart.items.length === 0 ? (
          <div className="mt-10 border border-border bg-card p-10 text-center">
            <ShoppingBag className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              Votre panier est vide pour le moment.
            </p>
            <Button asChild variant="technical" className="mt-6">
              <Link to="/boutique">Voir les accessoires</Link>
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
                        to="/boutique/$slug"
                        params={{ slug: accessory.slug }}
                        className="hover:text-primary"
                      >
                        {accessory.name}
                      </Link>
                    </h2>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {formatFcfa(accessory.price)} l'unité
                    </div>
                  </div>
                  <div className="flex items-center border border-border">
                    <button
                      aria-label={`Diminuer ${accessory.name}`}
                      onClick={() => cart.setQty(accessory.slug, qty - 1)}
                      className="size-10 font-mono text-sm"
                    >
                      −
                    </button>
                    <span className="w-9 text-center font-mono text-sm">{qty}</span>
                    <button
                      aria-label={`Augmenter ${accessory.name}`}
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
                    aria-label={`Retirer ${accessory.name}`}
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
                <h2 className="at-display text-xl">Récapitulatif</h2>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Sous-total</dt>
                    <dd className="font-mono">{formatFcfa(cart.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Livraison ({option.eta})</dt>
                    <dd className="font-mono">{shipping === 0 ? "Offerte" : formatFcfa(shipping)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                    <dt>Total</dt>
                    <dd className="font-mono text-primary">{formatFcfa(total)}</dd>
                  </div>
                </dl>
                {!freeShipping && (
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Livraison offerte dès {formatFcfa(FREE_DELIVERY_FROM)}
                  </p>
                )}
              </div>

              <fieldset className="bg-card p-6">
                <legend className="at-eyebrow mb-3">Mode de réception</legend>
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
                        {o.fee === 0 ? "gratuit" : formatFcfa(o.fee)}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="bg-card p-6">
                <h3 className="at-eyebrow mb-3">Vos coordonnées</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="mb-1 block text-xs font-semibold">
                      Nom complet
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
                      Téléphone / WhatsApp
                    </label>
                    <input
                      id="phone"
                      inputMode="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                    {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
                  </div>
                  {option.id !== "retrait" && (
                    <div>
                      <label htmlFor="address" className="mb-1 block text-xs font-semibold">
                        Adresse de livraison
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
                      Moyen de paiement
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
                      Précisions (modèle d'appareil, couleur…)
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
                <Button type="submit" variant="technical" size="lg" className="mt-6 w-full">
                  Valider la commande — {formatFcfa(total)}
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
