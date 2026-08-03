import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Timer, Wrench } from "lucide-react";
import { CategoryPicker } from "@/components/site/DeviceSearch";
import {
  CtaBand,
  MobileMoneyBar,
  ProcessSteps,
  ReviewsGrid,
  SectionHeader,
  TrustStats,
} from "@/components/site/Blocks";
import { BRANDS, COMPANY, DEVICES, formatFcfa } from "@/data/catalog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Allô Techno — Réparation smartphone & ordinateur à Abomey-Calavi" },
      {
        name: "description",
        content:
          "Réparation experte de smartphones, tablettes, MacBook, iMac, consoles et montres connectées à Abomey-Calavi. Diagnostic gratuit, pièces certifiées, garantie 6 mois.",
      },
      { property: "og:title", content: "Allô Techno — Réparation d'appareils électroniques au Bénin" },
      {
        property: "og:description",
        content: "Diagnostic gratuit, devis en 15 minutes, réparation express à Abomey-Calavi.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

const POPULAR = DEVICES.flatMap((d) =>
  d.faults.slice(0, 1).map((f) => ({ device: d, fault: f })),
).slice(0, 8);

function Home() {
  const navigate = useNavigate();
  return (
    <>
      {/* Hero + sélecteur de type d'appareil */}
      <section className="relative overflow-hidden pt-16 pb-24">
        <div className="at-grid-lines pointer-events-none absolute inset-0 -z-10 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="at-in mb-12 max-w-3xl">
            <span className="at-eyebrow mb-6 block">
              {COMPANY.city} · {COMPANY.country}
            </span>
            <h1 className="at-display text-5xl text-balance md:text-7xl">
              L'art de la précision
              <br />à votre portée.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-pretty text-muted-foreground">
              Réparation experte de smartphones, tablettes, MacBook, iMac, consoles et montres
              connectées à Calavi. Pièces certifiées, résultats garantis.
            </p>
          </div>

          <div className="at-in [animation-delay:150ms]">
            <span className="at-eyebrow mb-3 block">Quel type d'appareil ?</span>
            <CategoryPicker
              onSelect={(c) =>
                navigate({ to: "/reparations", search: { categorie: c } })
              }
            />
            <p className="mt-4 text-xs text-muted-foreground">
              Vous continuerez sur la page réparation pour choisir la marque, le modèle et le
              créneau.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-6">
            {[
              { icon: Wrench, t: "Diagnostic gratuit" },
              { icon: Timer, t: "Express dès 25 min" },
              { icon: ShieldCheck, t: "Garantie jusqu'à 12 mois" },
            ].map((i) => (
              <div key={i.t} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <i.icon className="size-4 text-primary" />
                {i.t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marques */}
      <section className="border-t border-border bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow="Catalogue"
            title="Réparation par marque"
            text="Toutes les marques majeures du marché béninois, des flagships Apple aux modèles Tecno, Infinix et Itel."
            right={
              <Button asChild variant="technicalOutline">
                <Link to="/reparations">
                  Voir toutes les marques <ArrowRight className="size-4" />
                </Link>
              </Button>
            }
          />
          <div className="grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-4 lg:grid-cols-7">
            {BRANDS.map((b) => (
              <Link
                key={b.slug}
                to="/reparations/$brand"
                params={{ brand: b.slug }}
                className="group bg-card p-6 transition-colors hover:bg-foreground hover:text-background"
              >
                <span className="block text-sm font-extrabold uppercase tracking-tight">{b.name}</span>
                <span className="mt-2 block font-mono text-[10px] uppercase text-muted-foreground group-hover:text-background/60">
                  {b.tag}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Tarifs */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow="Transparence"
            title="Tarifs transparents"
            text="Aucun frais caché. Nos prix incluent la main-d'œuvre et la pièce. Devis ferme après diagnostic."
            right={
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
                <span className="size-2 animate-pulse rounded-full bg-success" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Stock disponible</span>
              </div>
            }
          />
          <div className="grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-2">
            {POPULAR.map(({ device, fault }) => (
              <Link
                key={device.slug + fault.slug}
                to="/appareil/$slug"
                params={{ slug: device.slug }}
                className="bg-card p-6 transition-colors hover:bg-surface"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-bold">
                    {device.name} — {fault.label}
                  </span>
                  <span className="font-mono text-sm font-medium text-primary">
                    {formatFcfa(fault.price)}
                  </span>
                </div>
                <div className="mt-2 flex gap-4 font-mono text-[10px] uppercase text-muted-foreground">
                  <span>{fault.duration}</span>
                  <span>Garantie {fault.warranty}</span>
                  <span>{fault.part}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8">
            <Button asChild variant="technical">
              <Link to="/tarifs">Grille tarifaire complète</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Processus */}
      <section className="border-t border-border bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader eyebrow="Méthode" title="Trois étapes, zéro surprise" />
          <ProcessSteps />
          <div className="mt-12">
            <TrustStats />
          </div>
        </div>
      </section>

      {/* Suivi + Mobile Money */}
      <section className="py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 md:grid-cols-2">
          <div className="rounded-sm bg-foreground p-10 text-background">
            <h2 className="at-display mb-6 text-2xl">Suivre mon dossier</h2>
            <p className="mb-6 text-sm text-background/70">
              Chaque dépôt génère un numéro de dossier. Suivez chaque étape en temps réel, du
              diagnostic à la restitution.
            </p>
            <Button asChild variant="primaryBlock" size="lg" className="w-full">
              <Link to="/suivi">Vérifier le statut</Link>
            </Button>
            <div className="mt-8 flex items-center justify-between border-t border-background/10 pt-8">
              <span className="font-mono text-[10px] font-bold uppercase text-background/50">
                Paiements acceptés
              </span>
              <div className="flex gap-4 font-mono text-[10px] font-bold uppercase">
                <span>MTN MoMo</span>
                <span>Moov Money</span>
                <span>Celtiis</span>
              </div>
            </div>
          </div>
          <div>
            <SectionHeader
              eyebrow="Atelier"
              title="Un atelier, pas un dépannage"
              text="Station de micro-soudure, bain à ultrasons, alimentation de laboratoire, presse à écran et testeurs de batterie. Nos techniciens sont formés sur chaque famille d'appareils."
            />
            <MobileMoneyBar />
          </div>
        </div>
      </section>

      {/* Avis */}
      <section className="border-t border-border bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow="Avis clients"
            title="Ils nous confient leurs appareils"
            right={
              <Button asChild variant="technicalOutline">
                <Link to="/avis">Tous les avis</Link>
              </Button>
            }
          />
          <ReviewsGrid limit={6} />
        </div>
      </section>

      <CtaBand />
    </>
  );
}
