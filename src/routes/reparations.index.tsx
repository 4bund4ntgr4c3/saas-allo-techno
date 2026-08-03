import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Clock, Home, ShieldCheck, Store, Wallet } from "lucide-react";
import { SectionHeader, CtaBand } from "@/components/site/Blocks";
import { DeviceSearch } from "@/components/site/DeviceSearch";
import { BRANDS, CATEGORIES, DEVICES, devicesOfBrand } from "@/data/catalog";
import { categoryMedia } from "@/data/device-media";

export const Route = createFileRoute("/reparations/")({
  validateSearch: (
    s: Record<string, unknown>,
  ): {
    categorie?: string;
    device?: string;
    panne?: string;
    date?: string;
    creneau?: string;
    heure?: string;
  } => {
    const result: {
      categorie?: string;
      device?: string;
      panne?: string;
      date?: string;
      creneau?: string;
      heure?: string;
    } = {};
    const c = s["categorie"];
    if (typeof c === "string") result.categorie = c;
    const device = s["device"];
    if (typeof device === "string") result.device = device;
    const panne = s["panne"];
    if (typeof panne === "string") result.panne = panne;
    const date = s["date"];
    if (typeof date === "string") result.date = date;
    const creneau = s["creneau"];
    if (typeof creneau === "string") result.creneau = creneau;
    const heure = s["heure"];
    if (typeof heure === "string") result.heure = heure;
    return result;
  },
  head: () => ({
    meta: [
      { title: "Réparations par marque & appareil — Allô Techno" },
      {
        name: "description",
        content:
          "Apple, Samsung, Xiaomi, Tecno, Infinix, Huawei, Pixel, Sony… Choisissez votre marque et découvrez les pannes prises en charge, tarifs et délais.",
      },
      { property: "og:title", content: "Réparations par marque — Allô Techno" },
      {
        property: "og:description",
        content: "Toutes les marques et tous les types d'appareils réparés à Abomey-Calavi.",
      },
      { property: "og:url", content: "/reparations" },
    ],
    links: [{ rel: "canonical", href: "/reparations" }],
  }),
  component: Reparations,
});

function Reparations() {
  const { categorie, device, panne, date, creneau, heure } = Route.useSearch();
  return (
    <>
      <section className="border-b border-border py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <span className="at-eyebrow mb-4 block">Prendre rendez-vous</span>
            <h1 className="at-display text-4xl md:text-5xl">
              Réparation en 5 étapes. Créneau et devis avant intervention.
            </h1>
            <p className="mt-6 max-w-xl text-muted-foreground">
              Dites-nous quel appareil est en panne : nous affichons immédiatement les tarifs, le
              délai et les créneaux disponibles à Abomey-Calavi. {DEVICES.length} modèles
              référencés, {BRANDS.length} marques prises en charge.
            </p>
          </div>
          <div className="mt-10">
            <DeviceSearch
              initialCategory={categorie ?? null}
              initialDevice={device ?? null}
              initialPanne={panne ?? null}
              initialDate={date ?? null}
              initialHeure={heure ?? null}
            />
          </div>
          <ul className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Clock, t: "Réparation express", d: "La plupart des pannes en moins de 2 h" },
              { icon: ShieldCheck, t: "Garantie 6 mois", d: "Pièces et main-d'œuvre incluses" },
              { icon: Wallet, t: "Prix affiché", d: "Aucun frais surprise, diagnostic gratuit" },
              { icon: BadgeCheck, t: "Techniciens certifiés", d: "Pièces d'origine ou premium" },
            ].map((f) => (
              <li key={f.t} className="flex gap-3 bg-card p-4">
                <f.icon className="mt-0.5 size-5 shrink-0 text-primary" strokeWidth={1.5} />
                <span>
                  <span className="block text-sm font-bold tracking-tight">{f.t}</span>
                  <span className="text-xs text-muted-foreground">{f.d}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-2">
            {[
              {
                icon: Store,
                t: "En boutique",
                d: "Zogbadjè, Abomey-Calavi — sans rendez-vous possible",
              },
              { icon: Home, t: "À domicile", d: "Un technicien se déplace sur Cotonou & Calavi" },
            ].map((m) => (
              <div key={m.t} className="bg-card p-5">
                <m.icon className="size-6 text-primary" strokeWidth={1.5} />
                <p className="mt-3 text-sm font-bold uppercase tracking-tight">{m.t}</p>
                <p className="mt-1 text-xs text-muted-foreground">{m.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow="Marques"
            title="Toutes les marques"
            right={
              <Link
                to="/catalogue"
                className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/80"
              >
                Voir tout le catalogue →
              </Link>
            }
          />
          <div className="grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
            {BRANDS.map((b) => (
              <Link
                key={b.slug}
                to="/reparations/$brand"
                params={{ brand: b.slug }}
                className="group bg-card p-8 transition-colors hover:bg-surface"
              >
                <h2 className="text-xl font-extrabold uppercase tracking-tight">{b.name}</h2>
                <p className="mt-2 font-mono text-[10px] uppercase text-muted-foreground">
                  {b.tag}
                </p>
                <p className="mt-6 font-mono text-xs text-primary">
                  {devicesOfBrand(b.slug).length} modèle(s) référencé(s) →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow="Familles d'appareils"
            title="Par type d'appareil"
            text="Du smartphone d'entrée de gamme à l'iMac, en passant par les consoles et les montres connectées."
          />
          <div className="grid gap-px border border-border bg-border md:grid-cols-3">
            {CATEGORIES.map((c) => {
              const list = DEVICES.filter((d) => d.category === c);
              const Icon = categoryMedia(c)?.icon;
              return (
                <div key={c} className="bg-card p-8">
                  <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide">
                    {Icon && <Icon className="size-5 text-primary" strokeWidth={1.5} />}
                    {c}
                  </h3>
                  <ul className="mt-4 space-y-2">
                    {list.map((d) => (
                      <li key={d.slug}>
                        <Link
                          to="/appareil/$slug"
                          params={{ slug: d.slug }}
                          className="text-sm text-muted-foreground hover:text-primary"
                        >
                          {d.name}
                        </Link>
                      </li>
                    ))}
                    {list.length === 0 && (
                      <li className="text-sm text-muted-foreground">Sur devis</li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
