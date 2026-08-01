import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { BRANDS, DEVICES, brandName, devicesOfBrand, formatFcfa } from "@/data/catalog";
import { Button } from "@/components/ui/button";

/**
 * Recherche intelligente en 3 étapes : marque → modèle → panne.
 * Surface centrale de la page d'accueil.
 */
export function DeviceSearch() {
  const navigate = useNavigate();
  const [brand, setBrand] = useState<string | null>(null);
  const [device, setDevice] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const devices = useMemo(() => (brand ? devicesOfBrand(brand) : []), [brand]);
  const selected = useMemo(() => DEVICES.find((d) => d.slug === device), [device]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return DEVICES.filter(
      (d) => d.name.toLowerCase().includes(q) || brandName(d.brand).toLowerCase().includes(q),
    ).slice(0, 5);
  }, [query]);

  return (
    <div className="at-in [animation-delay:150ms]">
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
        <label htmlFor="at-search" className="sr-only">
          Rechercher un appareil
        </label>
        <input
          id="at-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un appareil (ex : iPhone 13 Pro, Camon 20, PS5)"
          className="h-14 w-full rounded-sm border border-border bg-card pr-4 pl-12 font-mono text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full border border-border bg-card shadow-xl">
            {suggestions.map((s) => (
              <li key={s.slug}>
                <Link
                  to="/appareil/$slug"
                  params={{ slug: s.slug }}
                  className="flex items-center justify-between px-4 py-3 text-sm hover:bg-secondary"
                >
                  <span className="font-bold">{s.name}</span>
                  <span className="font-mono text-[10px] uppercase text-muted-foreground">
                    {brandName(s.brand)} · {s.category}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 gap-1 rounded-sm bg-foreground p-1 md:grid-cols-3">
        {/* 01 — Marque */}
        <div className="rounded-sm bg-background p-6">
          <span className="at-eyebrow mb-3 block">01. Marque</span>
          <h3 className="text-2xl font-bold tracking-tight">{brand ? brandName(brand) : "Sélectionner"}</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {BRANDS.slice(0, 8).map((b) => (
              <button
                key={b.slug}
                onClick={() => {
                  setBrand(b.slug);
                  setDevice(null);
                }}
                className={`border px-2 py-1 text-[10px] font-bold uppercase transition-colors ${
                  brand === b.slug
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-foreground"
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>

        {/* 02 — Modèle */}
        <div className={`rounded-sm p-6 ${brand ? "bg-background" : "bg-background/50"}`}>
          <span className="at-eyebrow mb-3 block">02. Modèle</span>
          {!brand ? (
            <h3 className="text-2xl font-bold tracking-tight text-muted-foreground/60">Attente marque…</h3>
          ) : (
            <>
              <h3 className="text-2xl font-bold tracking-tight">{selected?.name ?? "Sélectionner"}</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {devices.map((d) => (
                  <button
                    key={d.slug}
                    onClick={() => setDevice(d.slug)}
                    className={`border px-2 py-1 text-[10px] font-bold uppercase transition-colors ${
                      device === d.slug
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-foreground"
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
                {devices.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Modèles sur demande — <Link to="/devis" className="text-primary underline">demander un devis</Link>
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* 03 — Panne */}
        <div className={`rounded-sm p-6 ${selected ? "bg-background" : "bg-background/50"}`}>
          <span className="at-eyebrow mb-3 block">03. Panne</span>
          {!selected ? (
            <h3 className="text-2xl font-bold tracking-tight text-muted-foreground/60">Diagnostic…</h3>
          ) : (
            <ul className="space-y-2">
              {selected.faults.slice(0, 3).map((flt) => (
                <li key={flt.slug} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-semibold">{flt.label}</span>
                  <span className="font-mono text-xs text-primary">{formatFcfa(flt.price)}</span>
                </li>
              ))}
              <li>
                <Button
                  variant="primaryBlock"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => navigate({ to: "/appareil/$slug", params: { slug: selected.slug } })}
                >
                  Voir la fiche <ArrowRight className="size-3.5" />
                </Button>
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
