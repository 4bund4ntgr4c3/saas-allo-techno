import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Clock, ShieldCheck, Star, Timer, Wrench } from "lucide-react";
import { CategoryPicker } from "@/components/site/CategoryPicker";
import {
  CtaBand,
  MobileMoneyBar,
  ProcessSteps,
  ReviewsGrid,
  SectionHeader,
  TrustStats,
} from "@/components/site/Blocks";
import { BRANDS, REVIEWS } from "@/data/catalog/static";
import { COMPANY, absoluteUrl, formatFcfa } from "@/data/catalog/company";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale, type Locale } from "@/lib/i18n/locales";

export const Route = createFileRoute("/$locale/")({
  head: ({ params }) => ({
    meta: [
      { title: translate(headLocale(params), "home.meta.title") },
      {
        name: "description",
        content: translate(headLocale(params), "home.meta.description"),
      },
      {
        property: "og:title",
        content: translate(headLocale(params), "home.og.title"),
      },
      {
        property: "og:description",
        content: translate(headLocale(params), "home.og.description"),
      },
      { property: "og:url", content: "/$locale/" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/$locale/") }],
  }),
  component: Home,
});

function headLocale(params: { locale?: unknown; [key: string]: unknown }): Locale {
  return normalizeLocale(params.locale);
}

// Réparations populaires — équivalent statique de
// DEVICES.flatMap(d => d.faults.slice(0,1)).slice(0,8) calculé sur les 8
// premiers appareils du catalogue. On évite ainsi d'importer tout le catalogue
// de données (~500 Ko) dans le bundle du premier rendu : les liens mènent
// vers les pages /appareil/$slug qui, elles, chargent le catalogue en lazy.
const POPULAR: {
  device: { slug: string; name: string };
  fault: {
    slug: string;
    label: string;
    price: number;
    duration: string;
    warranty: string;
    part: string;
  };
}[] = [
  {
    device: { slug: "infinix-smart-5", name: "Infinix Smart 5" },
    fault: {
      slug: "ecran",
      label: "Écran complet",
      price: 15000,
      duration: "40 min",
      warranty: "3 mois",
      part: "Écran compatible",
    },
  },
  {
    device: { slug: "infinix-smart-6", name: "Infinix Smart 6" },
    fault: {
      slug: "ecran",
      label: "Écran complet",
      price: 18000,
      duration: "40 min",
      warranty: "3 mois",
      part: "Écran compatible",
    },
  },
  {
    device: { slug: "infinix-smart-7", name: "Infinix Smart 7" },
    fault: {
      slug: "ecran",
      label: "Écran complet",
      price: 18000,
      duration: "40 min",
      warranty: "3 mois",
      part: "Écran compatible",
    },
  },
  {
    device: { slug: "infinix-hot-10", name: "Infinix Hot 10" },
    fault: {
      slug: "ecran",
      label: 'Écran IPS LCD 6.82"',
      price: 22000,
      duration: "40 min",
      warranty: "3 mois",
      part: "Écran compatible",
    },
  },
  {
    device: { slug: "infinix-hot-10-play", name: "Infinix Hot 10 Play" },
    fault: {
      slug: "ecran",
      label: 'Écran IPS LCD 6.82"',
      price: 20000,
      duration: "40 min",
      warranty: "3 mois",
      part: "Écran compatible",
    },
  },
  {
    device: { slug: "infinix-hot-10s", name: "Infinix Hot 10S" },
    fault: {
      slug: "ecran",
      label: 'Écran IPS LCD 6.82" 90Hz',
      price: 25000,
      duration: "40 min",
      warranty: "3 mois",
      part: "Écran compatible",
    },
  },
  {
    device: { slug: "infinix-hot-11", name: "Infinix Hot 11" },
    fault: {
      slug: "ecran",
      label: 'Écran IPS LCD 6.78" FHD+',
      price: 28000,
      duration: "40 min",
      warranty: "3 mois",
      part: "Écran compatible",
    },
  },
  {
    device: { slug: "infinix-hot-11-play", name: "Infinix Hot 11 Play" },
    fault: {
      slug: "ecran",
      label: 'Écran IPS LCD 6.82"',
      price: 25000,
      duration: "40 min",
      warranty: "3 mois",
      part: "Écran compatible",
    },
  },
];

function Home() {
  const navigate = useNavigate();
  const { locale, t } = useI18n();
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
                {t("home.hero.badge", [COMPANY.city])}
              </span>
              <h1 className="at-in at-display max-w-2xl text-5xl text-balance [animation-delay:150ms] md:text-7xl">
                {t("home.hero.h1.a")}{" "}
                <span className="bg-gradient-to-r from-primary via-amber-400 to-primary bg-clip-text font-extrabold text-transparent drop-shadow-[0_0_12px_oklch(0.68_0.19_38_/_0.4)]">
                  {t("home.hero.h1.highlight")}
                </span>
                {t("home.hero.h1.b")}
              </h1>
              <p className="at-in mt-6 max-w-xl text-lg text-pretty text-muted-foreground [animation-delay:250ms]">
                {t("home.hero.text")}
              </p>
              <div className="at-in mt-8 flex flex-wrap gap-6 [animation-delay:350ms]">
                {[
                  { icon: Wrench, label: t("home.hero.f1") },
                  { icon: Timer, label: t("home.hero.f2") },
                  { icon: ShieldCheck, label: t("home.hero.f3") },
                ].map((i) => (
                  <div
                    key={i.label}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                  >
                    <i.icon className="size-4 text-primary" />
                    {i.label}
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
                        {REVIEWS.length} {t("home.hero.rating")}
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
                      <div className="text-sm font-bold text-foreground">
                        {t("home.hero.techs")}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {t("home.hero.techs.sub")}
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
                      {t("home.hero.tracking.ref")}
                    </span>
                  </div>

                  {/* Steps */}
                  <div className="space-y-0">
                    {[
                      { label: t("home.hero.step1"), time: "Lun 09:12" },
                      { label: t("home.hero.step2"), time: "Lun 09:38" },
                      { label: t("home.hero.step3"), time: "Lun 10:24" },
                      { label: t("home.hero.step4"), time: "Lun 10:51" },
                      { label: t("home.hero.step5"), time: "Lun 11:03", current: true },
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
                      <span className="text-sm font-medium text-foreground">
                        {t("home.hero.summary.label")}
                      </span>
                      <span className="font-mono text-sm font-bold text-foreground">
                        48 000 F CFA
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        {t("home.hero.summary.total")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="size-3.5" />
                        {t("home.hero.summary.warranty")}
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
            <span className="at-eyebrow mb-3 block">{t("home.cats.eyebrow")}</span>
            <CategoryPicker
              onSelect={(c) =>
                navigate({
                  to: "/$locale/reparations",
                  params: { locale },
                  search: { categorie: c },
                })
              }
            />
            <p className="mt-4 text-xs text-muted-foreground">{t("home.cats.hint")}</p>
          </div>
        </div>
      </section>

      {/* Marques */}
      <section className="border-t border-border bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow={t("home.brands.eyebrow")}
            title={t("home.brands.title")}
            text={t("home.brands.text")}
            right={
              <Button asChild variant="technicalOutline">
                <Link to="/$locale/reparations" params={{ locale }}>
                  {t("home.brands.cta")} <ArrowRight className="size-4" />
                </Link>
              </Button>
            }
          />
          <div className="grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-4 lg:grid-cols-7">
            {BRANDS.map((b) => (
              <Link
                key={b.slug}
                to="/$locale/reparations/$brand"
                params={{ locale, brand: b.slug }}
                className="group bg-card p-6 transition-colors hover:bg-foreground hover:text-background"
              >
                <span className="block text-sm font-extrabold uppercase tracking-tight">
                  {b.name}
                </span>
                <span className="mt-2 block font-mono text-[10px] uppercase text-muted-foreground group-hover:text-background/60">
                  {t(b.tag)}
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
            eyebrow={t("home.prices.eyebrow")}
            title={t("home.prices.title")}
            text={t("home.prices.text")}
            right={
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
                <span className="size-2 animate-pulse rounded-full bg-success" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {t("home.prices.stock")}
                </span>
              </div>
            }
          />
          <div className="grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-2">
            {POPULAR.map(({ device, fault }) => (
              <Link
                key={device.slug + fault.slug}
                to="/$locale/appareil/$slug"
                params={{ locale, slug: device.slug }}
                className="bg-card p-6 transition-colors hover:bg-surface"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-bold">
                    {device.name} — {t(fault.label)}
                  </span>
                  <span className="font-mono text-sm font-medium text-primary">
                    {formatFcfa(fault.price)}
                  </span>
                </div>
                <div className="mt-2 flex gap-4 font-mono text-[10px] uppercase text-muted-foreground">
                  <span>{t(fault.duration)}</span>
                  <span>{t("home.prices.warranty", [t(fault.warranty)])}</span>
                  <span>{t(fault.part)}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8">
            <Button asChild variant="technical">
              <Link to="/$locale/tarifs" params={{ locale }}>
                {t("home.prices.cta")}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Processus */}
      <section className="border-t border-border bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader eyebrow={t("home.process.eyebrow")} title={t("home.process.title")} />
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
            <h2 className="at-display mb-6 text-2xl">{t("home.suivi.title")}</h2>
            <p className="mb-6 text-sm text-background/70">{t("home.suivi.text")}</p>
            <Button asChild variant="primaryBlock" size="lg" className="w-full">
              <Link to="/$locale/suivi" params={{ locale }}>
                {t("home.suivi.cta")}
              </Link>
            </Button>
            <div className="mt-8 flex items-center justify-between border-t border-background/10 pt-8">
              <span className="font-mono text-[10px] font-bold uppercase text-background/50">
                {t("home.suivi.payments")}
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
              eyebrow={t("home.suivi.eyebrow")}
              title={t("home.suivi.workshop-title")}
              text={t("home.suivi.workshop-text")}
            />
            <MobileMoneyBar />
          </div>
        </div>
      </section>

      {/* Avis */}
      <section className="border-t border-border bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow={t("home.reviews.eyebrow")}
            title={t("home.reviews.title")}
            right={
              <Button asChild variant="technicalOutline">
                <Link to="/$locale/avis" params={{ locale }}>
                  {t("home.reviews.cta")}
                </Link>
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
