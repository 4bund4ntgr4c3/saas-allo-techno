import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Clock, ShieldCheck, Star, Timer, Wrench } from "lucide-react";
import { CategoryPicker } from "@/components/site/DeviceSearch";
import {
  CtaBand,
  MobileMoneyBar,
  ProcessSteps,
  ReviewsGrid,
  SectionHeader,
  TrustStats,
} from "@/components/site/Blocks";
import { BRANDS, COMPANY, DEVICES, REVIEWS, absoluteUrl, formatFcfa } from "@/data/catalog";
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
      {
        property: "og:title",
        content: "Allô Techno — Réparation d'appareils électroniques au Bénin",
      },
      {
        property: "og:description",
        content: "Diagnostic gratuit, devis en 15 minutes, réparation express à Abomey-Calavi.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/") }],
  }),
  component: Home,
});

const POPULAR = DEVICES.flatMap((d) =>
  d.faults.slice(0, 1).map((f) => ({ device: d, fault: f })),
).slice(0, 8);

function Home() {
  const navigate = useNavigate();
  const avgRating = REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-12">
        <div className="at-grid-lines pointer-events-none absolute inset-0 -z-10 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left: text */}
            <div>
              <span className="at-in at-eyebrow mb-6 block [animation-delay:50ms]">
                Atelier certifié · {COMPANY.city}
              </span>
              <h1 className="at-in at-display max-w-2xl text-5xl text-balance [animation-delay:150ms] md:text-7xl">
                Votre appareil réparé{" "}
                <span className="bg-gradient-to-r from-primary via-amber-400 to-primary bg-clip-text font-extrabold text-transparent drop-shadow-[0_0_12px_oklch(0.68_0.19_38_/_0.4)]">
                  aujourd'hui
                </span>
                ,<br />
                pas la semaine prochaine.
              </h1>
              <p className="at-in mt-6 max-w-xl text-lg text-pretty text-muted-foreground [animation-delay:250ms]">
                Smartphones, tablettes, ordinateurs, MacBook, consoles et montres connectées. Prix
                affiché avant démontage, garantie jusqu'à 6 mois, paiement Mobile Money.
              </p>
              <div className="at-in mt-8 flex flex-wrap gap-6 [animation-delay:350ms]">
                {[
                  { icon: Wrench, t: "Diagnostic gratuit" },
                  { icon: Timer, t: "Express dès 25 min" },
                  { icon: ShieldCheck, t: "Garantie jusqu'à 12 mois" },
                ].map((i) => (
                  <div
                    key={i.t}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                  >
                    <i.icon className="size-4 text-primary" />
                    {i.t}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: tracking card */}
            <div className="at-in [animation-delay:200ms] flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md">
                {/* Floating badge: rating */}
                <div className="absolute -top-6 -left-6 z-10 animate-[slide-up_0.5s_var(--ease-precision)_0.6s_both] rounded-lg border border-border bg-card px-4 py-3 shadow-lg transition-shadow hover:shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                      <Star className="size-4 fill-primary text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">
                        {avgRating.toFixed(1).replace(".", ",")} / 5
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {REVIEWS.length} avis vérifiés
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating badge: technicians */}
                <div className="absolute -bottom-6 -right-6 z-10 animate-[slide-up_0.5s_var(--ease-precision)_0.8s_both] rounded-lg border border-border bg-card px-4 py-3 shadow-lg transition-shadow hover:shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                      <Wrench className="size-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">3 techniciens</div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        dont 1 microsoudure
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main card */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]">
                  {/* Header */}
                  <div className="mb-6 flex items-center justify-between border-b border-border pb-5">
                    <span className="font-mono text-sm font-bold uppercase tracking-widest text-muted-foreground">
                      AT-7K3M9Q
                    </span>
                    <span className="flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-success">
                      <span className="size-1.5 rounded-full bg-success animate-pulse" />
                      Prêt
                    </span>
                  </div>

                  {/* Steps */}
                  <div className="space-y-0">
                    {[
                      { label: "Reçu à l'atelier", time: "Lun 09:12" },
                      { label: "Diagnostic terminé", time: "Lun 09:38" },
                      { label: "Écran remplacé", time: "Lun 10:24" },
                      { label: "Contrôle qualité", time: "Lun 10:51" },
                      { label: "Prêt à récupérer", time: "Lun 11:03", current: true },
                    ].map((step, i) => (
                      <div
                        key={step.label}
                        className="flex items-start gap-3 animate-[slide-up_0.4s_var(--ease-precision)_both]"
                        style={{ animationDelay: `${0.3 + i * 0.1}s` }}
                      >
                        <div className="flex flex-col items-center">
                          {step.current ? (
                            <div className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/30 transition-transform duration-200 hover:scale-110">
                              <Check className="size-3.5" strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors duration-200 hover:bg-primary/20 hover:text-primary">
                              <Check className="size-3.5" strokeWidth={3} />
                            </div>
                          )}
                          {i < 4 && (
                            <div className="my-0.5 w-px flex-1 bg-border transition-colors duration-300" />
                          )}
                        </div>
                        <div className="flex flex-1 items-center justify-between pb-4">
                          <span
                            className={`text-sm transition-colors duration-200 ${step.current ? "font-bold text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                          >
                            {step.label}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {step.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="mt-4 rounded-lg border border-border bg-surface p-4 transition-all duration-200 hover:bg-muted/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">iPhone 13 · Écran</span>
                      <span className="font-mono text-sm font-bold text-foreground">
                        48 000 F CFA
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5" />1 h 51 au total
                      </span>
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="size-3.5" />
                        Garanti 6 mois
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Catégories */}
      <section className="border-y border-border bg-surface py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="at-in [animation-delay:200ms]">
            <span className="at-eyebrow mb-3 block">Choisissez par catégorie</span>
            <CategoryPicker
              onSelect={(c) => navigate({ to: "/reparations", search: { categorie: c } })}
            />
            <p className="mt-4 text-xs text-muted-foreground">
              Vous continuerez sur la page réparation pour choisir la marque, le modèle et le
              créneau.
            </p>
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
                <span className="block text-sm font-extrabold uppercase tracking-tight">
                  {b.name}
                </span>
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
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Stock disponible
                </span>
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
