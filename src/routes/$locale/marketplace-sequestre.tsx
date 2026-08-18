import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageBreadcrumb } from "@/components/site/PageBreadcrumb";
import { getEscrowListingsFn, type EscrowListing } from "@/lib/escrow-marketplace.functions";
import { formatFcfa } from "@/data/catalog/company";
import { normalizeLocale, type Locale } from "@/lib/i18n/locales";
import { localeSeo } from "@/lib/seo";

export const Route = createFileRoute("/$locale/marketplace-sequestre")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const seo = localeSeo(locale, "/marketplace-sequestre");
    return {
      meta: [
        { title: "Marketplace d'Occasion Certifiée & Séquestre — Allô Techno" },
        {
          name: "description",
          content:
            "Achetez et vendez vos ordinateurs portables d'occasion en toute sécurité. Contrôle technique en 45 points, fonds bloqués sous séquestre et garantie 6 mois.",
        },
        ...seo.meta,
      ],
      links: [...seo.links],
    };
  },
  component: EscrowMarketplacePage,
});

function EscrowMarketplacePage() {
  const [listings, setListings] = React.useState<EscrowListing[]>([]);

  React.useEffect(() => {
    getEscrowListingsFn()
      .then((res) => setListings(res.listings))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen pb-16">
      {/* ─── Hero Header ─── */}
      <section className="border-b border-border py-12 bg-surface/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="at-eyebrow text-primary font-bold">
              Tiers de Confiance &amp; Séquestre
            </span>
            <PageBreadcrumb items={[{ label: "Marketplace Séquestre" }]} />
          </div>
          <h1 className="at-display text-3xl sm:text-5xl font-extrabold text-foreground">
            Marketplace d'Occasion Certifiée &amp; Séquestre
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl">
            Achetez et vendez sans aucun risque d'arnaque ou de vice caché. L'argent reste bloqué en
            compte séquestre pendant que nos ingénieurs inspectent l'appareil sous microscope.
          </p>
        </div>
      </section>

      {/* ─── How Escrow Works ─── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 mt-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl border border-border bg-card space-y-2">
            <span className="size-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center font-mono">
              1
            </span>
            <h3 className="font-bold text-sm text-foreground">Fonds Bloqués sous Séquestre</h3>
            <p className="text-xs text-muted-foreground">
              L'acheteur règle par Mobile Money ou virement. Les fonds sont consignés sur un compte
              séquestre sécurisé.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card space-y-2">
            <span className="size-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center font-mono">
              2
            </span>
            <h3 className="font-bold text-sm text-foreground">Contrôle Technique en 45 Points</h3>
            <p className="text-xs text-muted-foreground">
              Le vendeur dépose le PC en atelier. Nous testons la carte mère, la batterie, l'écran,
              le SSD et l'authenticité des pièces.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card space-y-2">
            <span className="size-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center font-mono">
              3
            </span>
            <h3 className="font-bold text-sm text-foreground">
              Paiement Vendeur &amp; Garantie 6 Mois
            </h3>
            <p className="text-xs text-muted-foreground">
              L'acheteur reçoit un appareil certifié avec garantie contractuelle 6 mois. Les fonds
              sont instantanément virés au vendeur.
            </p>
          </div>
        </div>

        {/* ─── Verified Listings ─── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              Matériels Récemment Certifiés &amp; Disponibles
            </h2>
            <Badge
              variant="outline"
              className="font-mono text-xs text-emerald-600 border-emerald-600/40 bg-emerald-600/10"
            >
              Contrôle 45/45 Points Validé
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {listings.map((item) => (
              <div
                key={item.listingId}
                className="border border-border bg-card p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-sm hover:border-border/80 transition-all"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-primary font-bold bg-primary/10 px-2 py-0.5 rounded">
                      {item.listingId}
                    </span>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      {item.sellerType}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-sm text-foreground leading-snug">
                    {item.deviceTitle}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.specsSummary}
                  </p>

                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Garantie Allô Techno :</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <ShieldCheck className="size-3.5" /> {item.warrantyMonths} Mois Pièces &amp;
                      M.O.
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-baseline justify-between">
                    <strong className="text-lg font-mono font-extrabold text-primary">
                      {formatFcfa(item.askingPriceFcfa)}
                    </strong>
                    <span className="text-[11px] text-muted-foreground line-through">
                      {formatFcfa(item.marketEstimatedPriceFcfa)}
                    </span>
                  </div>

                  <Button
                    asChild
                    variant="technical"
                    size="sm"
                    className="w-full text-xs font-bold uppercase tracking-wider h-8"
                  >
                    <a
                      href={`https://wa.me/22960000000?text=${encodeURIComponent(
                        `Bonjour Allô Techno Séquestre, je souhaite réserver le matériel vérifié "${item.deviceTitle}" (${item.listingId}) à ${formatFcfa(
                          item.askingPriceFcfa,
                        )}.`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Acheter sous Séquestre &rarr;
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
