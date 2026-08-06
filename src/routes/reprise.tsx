import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CtaBand, MobileMoneyBar, SectionHeader } from "@/components/site/Blocks";
import { Button } from "@/components/ui/button";
import { BRANDS, DEVICES, devicesOfBrand, formatFcfa } from "@/data/catalog";

export const Route = createFileRoute("/reprise")({
  head: () => ({
    meta: [
      { title: "Reprise d'appareils — Allô Techno Abomey-Calavi" },
      {
        name: "description",
        content:
          "Revendez votre ancien smartphone, tablette ou ordinateur à Abomey-Calavi. Estimation immédiate et paiement Mobile Money le jour même.",
      },
      { property: "og:title", content: "Reprise d'appareils — Allô Techno" },
      {
        property: "og:description",
        content: "Estimez la valeur de reprise de votre appareil et repartez payé le jour même.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Reprise,
});

const CONDITIONS = [
  { key: "excellent", label: "Excellent — comme neuf", factor: 1 },
  { key: "bon", label: "Bon — micro-rayures", factor: 0.8 },
  { key: "usage", label: "Usagé — rayures visibles", factor: 0.6 },
  { key: "hs", label: "En panne — écran ou batterie HS", factor: 0.35 },
] as const;

function baseValue(year: number, faultsTotal: number) {
  const age = Math.max(0, 2026 - year);
  const depreciation = Math.max(0.15, 1 - age * 0.16);
  return Math.round((faultsTotal * 1.9 * depreciation) / 500) * 500;
}

function Reprise() {
  const [brand, setBrand] = useState("");
  const [deviceSlug, setDeviceSlug] = useState("");
  const [condition, setCondition] = useState<string>("bon");

  const devices = useMemo(() => (brand ? devicesOfBrand(brand) : []), [brand]);
  const device = DEVICES.find((d) => d.slug === deviceSlug);
  const factor = CONDITIONS.find((c) => c.key === condition)?.factor ?? 0.8;
  const estimate = device
    ? Math.round(
        (baseValue(
          device.year,
          device.faults.reduce((s, f) => s + f.price, 0),
        ) *
          factor) /
          500,
      ) * 500
    : 0;

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">Rachat & recyclage</span>
          <h1 className="at-display text-4xl md:text-6xl">Reprise d'appareils</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">
            Fonctionnel ou en panne, votre ancien appareil a de la valeur. Nous le reprenons, le
            reconditionnons en atelier et vous payons en Mobile Money le jour même.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid gap-px border border-border bg-border md:grid-cols-3">
            <div className="bg-card p-6">
              <label htmlFor="r-brand" className="at-eyebrow mb-3 block">
                Marque
              </label>
              <select
                id="r-brand"
                value={brand}
                onChange={(e) => {
                  setBrand(e.target.value);
                  setDeviceSlug("");
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
              <label htmlFor="r-device" className="at-eyebrow mb-3 block">
                Modèle
              </label>
              <select
                id="r-device"
                value={deviceSlug}
                disabled={!brand}
                onChange={(e) => setDeviceSlug(e.target.value)}
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
              <label htmlFor="r-cond" className="at-eyebrow mb-3 block">
                État
              </label>
              <select
                id="r-cond"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="h-11 w-full rounded-sm border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
              >
                {CONDITIONS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-8 border border-border bg-card p-8">
            <span className="at-eyebrow">Offre de reprise estimée</span>
            <div className="mt-3 font-mono text-4xl font-medium text-primary">
              {device ? formatFcfa(estimate) : "—"}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Estimation indicative. Le montant définitif est confirmé après contrôle en atelier
              (état de la batterie, écran, connectique, verrouillage du compte).
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="technical">
                <Link to="/reservation">Déposer mon appareil</Link>
              </Button>
              <Button asChild variant="technicalOutline">
                <Link to="/contact">Poser une question</Link>
              </Button>
            </div>
          </div>

          <div className="mt-8">
            <MobileMoneyBar />
          </div>
        </div>
      </section>

      <section className="border-t border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader eyebrow="Comment ça marche" title="Trois étapes, paiement le jour même" />
          <div className="grid gap-px border border-border bg-border md:grid-cols-3">
            {[
              {
                t: "Estimation en ligne",
                x: "Sélectionnez modèle et état pour obtenir une fourchette immédiate.",
              },
              {
                t: "Contrôle atelier",
                x: "Test complet en 20 minutes : batterie, écran, ports, déverrouillage.",
              },
              {
                t: "Paiement immédiat",
                x: "MTN MoMo, Moov Money, Celtiis ou espèces, ou déduction sur une réparation.",
              },
            ].map((s, i) => (
              <div key={s.t} className="bg-card p-8">
                <span className="font-mono text-4xl font-medium text-primary">{i + 1}</span>
                <h3 className="mt-6 text-lg font-bold tracking-tight">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.x}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
