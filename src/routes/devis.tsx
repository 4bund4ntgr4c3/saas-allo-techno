import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Clock, ShieldCheck } from "lucide-react";
import { CtaBand, MobileMoneyBar, SectionHeader } from "@/components/site/Blocks";
import { LeadForm } from "@/components/site/LeadForm";
import { Button } from "@/components/ui/button";
import { BRANDS, DEVICES, devicesOfBrand, formatFcfa } from "@/data/catalog";

export const Route = createFileRoute("/devis")({
  head: () => ({
    meta: [
      { title: "Devis instantané réparation — Allô Techno Abomey-Calavi" },
      {
        name: "description",
        content:
          "Estimez en 30 secondes le prix et le délai de réparation de votre smartphone, tablette, ordinateur ou console à Abomey-Calavi.",
      },
      { property: "og:title", content: "Devis instantané — Allô Techno" },
      {
        property: "og:description",
        content: "Choisissez votre appareil et votre panne : prix, délai et garantie affichés immédiatement.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Devis,
});

function Devis() {
  const [brand, setBrand] = useState<string>("");
  const [deviceSlug, setDeviceSlug] = useState<string>("");
  const [faultSlug, setFaultSlug] = useState<string>("");

  const devices = useMemo(() => (brand ? devicesOfBrand(brand) : []), [brand]);
  const device = useMemo(() => DEVICES.find((d) => d.slug === deviceSlug), [deviceSlug]);
  const fault = device?.faults.find((f) => f.slug === faultSlug);

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">Estimation gratuite</span>
          <h1 className="at-display text-4xl md:text-6xl">Devis instantané</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">
            Trois clics suffisent : marque, appareil, panne. Vous obtenez immédiatement le prix, le
            délai et la garantie appliquée en atelier.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid gap-px border border-border bg-border md:grid-cols-3">
            <div className="bg-card p-6">
              <label htmlFor="brand" className="at-eyebrow mb-3 block">
                1 · Marque
              </label>
              <select
                id="brand"
                value={brand}
                onChange={(e) => {
                  setBrand(e.target.value);
                  setDeviceSlug("");
                  setFaultSlug("");
                }}
                className="h-11 w-full rounded-sm border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">Sélectionner…</option>
                {BRANDS.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-card p-6">
              <label htmlFor="device" className="at-eyebrow mb-3 block">
                2 · Appareil
              </label>
              <select
                id="device"
                value={deviceSlug}
                disabled={!brand}
                onChange={(e) => {
                  setDeviceSlug(e.target.value);
                  setFaultSlug("");
                }}
                className="h-11 w-full rounded-sm border border-border bg-background px-3 text-sm disabled:opacity-50 focus:border-primary focus:outline-none"
              >
                <option value="">Sélectionner…</option>
                {devices.map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-card p-6">
              <label htmlFor="fault" className="at-eyebrow mb-3 block">
                3 · Panne
              </label>
              <select
                id="fault"
                value={faultSlug}
                disabled={!device}
                onChange={(e) => setFaultSlug(e.target.value)}
                className="h-11 w-full rounded-sm border border-border bg-background px-3 text-sm disabled:opacity-50 focus:border-primary focus:outline-none"
              >
                <option value="">Sélectionner…</option>
                {device?.faults.map((f) => (
                  <option key={f.slug} value={f.slug}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {fault && device ? (
            <div className="mt-8 border border-border bg-card p-8">
              <span className="at-eyebrow">Estimation</span>
              <h2 className="at-display mt-2 text-3xl">
                {device.name} — {fault.label}
              </h2>
              <div className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-3">
                <div className="bg-card p-6">
                  <div className="font-mono text-3xl font-medium text-primary">
                    {formatFcfa(fault.price)}
                  </div>
                  <div className="at-eyebrow mt-2">Prix tout compris</div>
                </div>
                <div className="bg-card p-6">
                  <div className="flex items-center gap-2 font-mono text-2xl font-medium">
                    <Clock className="size-5 text-muted-foreground" />
                    {fault.duration}
                  </div>
                  <div className="at-eyebrow mt-2">Délai atelier</div>
                </div>
                <div className="bg-card p-6">
                  <div className="flex items-center gap-2 font-mono text-2xl font-medium">
                    <ShieldCheck className="size-5 text-muted-foreground" />
                    {fault.warranty}
                  </div>
                  <div className="at-eyebrow mt-2">Garantie</div>
                </div>
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                Pièce utilisée : {fault.part}. Le diagnostic reste gratuit et le prix est confirmé
                avant toute intervention.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild variant="technical" size="lg">
                  <Link to="/reservation">
                    Réserver cette réparation <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button asChild variant="technicalOutline" size="lg">
                  <Link to="/appareil/$slug" params={{ slug: device.slug }}>
                    Voir toutes les pannes
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-8 border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Complétez les trois champs pour afficher votre estimation.
            </p>
          )}

          <div className="mt-8">
            <MobileMoneyBar />
          </div>
        </div>
      </section>

      <section className="border-t border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow="Pas votre modèle ?"
            title="Nous réparons aussi les appareils hors catalogue"
            text="Décrivez votre panne lors de la réservation : nous vous rappelons avec un devis personnalisé sous 15 minutes ouvrées."
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Button asChild variant="technical" className="self-start">
              <Link to="/reservation">Demander un devis personnalisé</Link>
            </Button>
            <LeadForm
              source="devis"
              title="Demande de devis personnalisé"
              messageLabel="Appareil et panne"
              messagePlaceholder="Ex. : iPhone 12 — l'écran ne répond plus après une chute…"
              showReference={false}
              successText="Votre demande est enregistrée. Nous vous rappelons sous 15 minutes ouvrées."
            />
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
