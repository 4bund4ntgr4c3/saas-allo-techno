import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Check, Clock, Package, ShieldCheck } from "lucide-react";
import { CtaBand, SectionHeader } from "@/components/site/Blocks";
import {
  brandName,
  deviceBySlug,
  devicesOfBrand,
  formatFcfa,
  type Device,
} from "@/data/catalog";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/appareil/$slug")({
  loader: ({ params }): { device: Device; siblings: Device[] } => {
    const device = deviceBySlug(params.slug);
    if (!device) throw notFound();
    return {
      device,
      siblings: devicesOfBrand(device.brand).filter((d) => d.slug !== device.slug),
    };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Appareil introuvable — Allô Techno" }, { name: "robots", content: "noindex" }],
      };
    }
    const d = loaderData.device;
    const min = Math.min(...d.faults.map((f) => f.price));
    return {
      meta: [
        { title: `Réparation ${d.name} — tarifs & délais | Allô Techno` },
        {
          name: "description",
          content: `Réparation ${d.name} à Abomey-Calavi : ${d.faults
            .slice(0, 3)
            .map((f) => f.label.toLowerCase())
            .join(", ")}. À partir de ${formatFcfa(min)}, garantie incluse.`,
        },
        { property: "og:title", content: `Réparation ${d.name} — Allô Techno` },
        {
          property: "og:description",
          content: `${d.faults.length} pannes prises en charge, pièces certifiées, garantie jusqu'à 12 mois.`,
        },
        { property: "og:type", content: "product" },
        { property: "og:url", content: `/appareil/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/appareil/${params.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            serviceType: `Réparation ${d.name}`,
            provider: { "@type": "LocalBusiness", name: "Allô Techno" },
            areaServed: "Abomey-Calavi, Bénin",
            offers: d.faults.map((f) => ({
              "@type": "Offer",
              name: f.label,
              price: f.price,
              priceCurrency: "XOF",
            })),
          }),
        },
      ],
    };
  },
  component: DevicePage,
});

function DevicePage() {
  const { device, siblings } = Route.useLoaderData() as { device: Device; siblings: Device[] };
  const min = Math.min(...device.faults.map((f) => f.price));

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <nav className="mb-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <Link to="/reparations" className="hover:text-primary">Réparations</Link> /{" "}
            <Link to="/reparations/$brand" params={{ brand: device.brand }} className="hover:text-primary">
              {brandName(device.brand)}
            </Link>{" "}
            / {device.name}
          </nav>
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <h1 className="at-display text-4xl md:text-6xl">{device.name}</h1>
              <p className="mt-4 font-mono text-xs uppercase text-muted-foreground">
                {brandName(device.brand)} · {device.category} · {device.year}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="technical" size="lg">
                <Link to="/reservation" search={{ device: device.slug }}>
                  Réserver cette réparation
                </Link>
              </Button>
              <Button asChild variant="technicalOutline" size="lg">
                <Link to="/devis">Devis instantané</Link>
              </Button>
            </div>
          </div>
          <p className="mt-8 font-mono text-sm">
            Interventions à partir de <span className="text-primary">{formatFcfa(min)}</span>
          </p>
        </div>
      </section>

      {/* Pannes & tarifs */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow="Pannes disponibles"
            title="Tarifs, délais, garanties & pièces"
            text="Prix indicatifs incluant la pièce et la main-d'œuvre. Devis ferme après diagnostic gratuit."
          />
          <div className="overflow-hidden border border-border">
            <div className="hidden grid-cols-12 gap-4 border-b border-border bg-surface p-4 md:grid">
              <span className="at-eyebrow col-span-5">Intervention</span>
              <span className="at-eyebrow col-span-2">Délai</span>
              <span className="at-eyebrow col-span-2">Garantie</span>
              <span className="at-eyebrow col-span-2">Pièce</span>
              <span className="at-eyebrow col-span-1 text-right">Prix</span>
            </div>
            {device.faults.map((f) => (
              <div
                key={f.slug}
                className="grid gap-2 border-b border-border p-5 transition-colors last:border-0 hover:bg-surface md:grid-cols-12 md:gap-4"
              >
                <span className="font-bold md:col-span-5">{f.label}</span>
                <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground md:col-span-2">
                  <Clock className="size-3.5" /> {f.duration}
                </span>
                <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground md:col-span-2">
                  <ShieldCheck className="size-3.5" /> {f.warranty}
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-muted-foreground md:col-span-2">
                  <Package className="size-3.5 shrink-0" /> {f.part}
                </span>
                <span className="font-mono text-sm font-medium text-primary md:col-span-1 md:text-right">
                  {formatFcfa(f.price)}
                </span>
              </div>
            ))}
          </div>

          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "Diagnostic gratuit avant toute intervention",
              "Facture PDF et garantie remises à la restitution",
              "Paiement MTN MoMo, Moov Money ou espèces",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-success" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ appareil */}
      <section className="border-t border-border bg-surface py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHeader eyebrow="Questions fréquentes" title={`${device.name} — vos questions`} />
          <Accordion type="single" collapsible className="border border-border bg-card">
            <AccordionItem value="1" className="px-6">
              <AccordionTrigger>Mes données sont-elles conservées ?</AccordionTrigger>
              <AccordionContent>
                Un remplacement d'écran, de batterie ou de connecteur ne touche pas vos données. Pour
                les interventions sur carte mère, une sauvegarde préalable est recommandée.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="2" className="px-6">
              <AccordionTrigger>Quelles pièces utilisez-vous sur ce modèle ?</AccordionTrigger>
              <AccordionContent>
                La catégorie exacte est indiquée dans la colonne « Pièce » ci-dessus et rappelée sur
                votre devis : service pack, grade A+ ou compatible selon la disponibilité.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="3" className="px-6">
              <AccordionTrigger>Puis-je attendre sur place ?</AccordionTrigger>
              <AccordionContent>
                Oui pour les interventions de moins d'une heure. Un espace d'attente est disponible à
                l'atelier d'Abomey-Calavi.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="4" className="px-6">
              <AccordionTrigger>Que couvre la garantie ?</AccordionTrigger>
              <AccordionContent>
                Les défauts de pièce et de main-d'œuvre. Les chutes, l'oxydation et les interventions
                par un tiers ne sont pas couvertes.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {siblings.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeader eyebrow="Même marque" title={`Autres modèles ${brandName(device.brand)}`} />
            <div className="grid gap-px border border-border bg-border md:grid-cols-3">
              {siblings.map((d) => (
                <Link
                  key={d.slug}
                  to="/appareil/$slug"
                  params={{ slug: d.slug }}
                  className="bg-card p-6 transition-colors hover:bg-surface"
                >
                  <span className="font-bold">{d.name}</span>
                  <span className="mt-2 block font-mono text-[10px] uppercase text-muted-foreground">
                    {d.category} · dès {formatFcfa(Math.min(...d.faults.map((x) => x.price)))}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <CtaBand />
    </>
  );
}
