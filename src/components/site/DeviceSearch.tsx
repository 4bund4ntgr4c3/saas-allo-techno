import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, ChevronLeft, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  BRANDS,
  CATEGORIES,
  DEVICES,
  brandName,
  formatFcfa,
  type Device,
} from "@/data/catalog";
import { categoryMedia } from "@/data/device-media";
import { Button } from "@/components/ui/button";

const STEPS = ["Type", "Marque", "Modèle", "Panne"] as const;

/**
 * Assistant de diagnostic en 4 étapes :
 * type d'appareil (icône) → marque → modèle → pannes (multi-sélection) + description.
 */
export function DeviceSearch() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<string | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [faults, setFaults] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [query, setQuery] = useState("");

  const brandsOfCategory = useMemo(() => {
    if (!category) return [];
    const slugs = new Set(DEVICES.filter((d) => d.category === category).map((d) => d.brand));
    return BRANDS.filter((b) => slugs.has(b.slug));
  }, [category]);

  const models = useMemo(
    () => DEVICES.filter((d) => d.category === category && d.brand === brand),
    [category, brand],
  );

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return DEVICES.filter(
      (d) => d.name.toLowerCase().includes(q) || brandName(d.brand).toLowerCase().includes(q),
    ).slice(0, 5);
  }, [query]);

  const total = useMemo(
    () =>
      (device?.faults ?? [])
        .filter((f) => faults.includes(f.slug))
        .reduce((sum, f) => sum + f.price, 0),
    [device, faults],
  );

  const toggleFault = (slug: string) =>
    setFaults((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));

  const reserve = () => {
    if (!device) return;
    const labels = device.faults.filter((f) => faults.includes(f.slug)).map((f) => f.label);
    const panne = [labels.join(", "), description.trim()].filter(Boolean).join(" — ");
    navigate({ to: "/reservation", search: { device: device.slug, panne: panne || undefined } });
  };

  return (
    <div className="at-in [animation-delay:150ms]">
      {/* Recherche directe */}
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
        <label htmlFor="at-search" className="sr-only">
          Rechercher un appareil
        </label>
        <input
          id="at-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un appareil (ex : iPhone 17 Pro, Camon 40, Switch 2)"
          className="h-14 w-full rounded-sm border border-border bg-card pr-4 pl-12 font-mono text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full border border-border bg-card shadow-xl">
            {suggestions.map((s) => (
              <li key={s.slug}>
                <button
                  type="button"
                  onClick={() => {
                    setCategory(s.category);
                    setBrand(s.brand);
                    setDevice(s);
                    setFaults([]);
                    setStep(3);
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-secondary"
                >
                  <span className="font-bold">{s.name}</span>
                  <span className="font-mono text-[10px] uppercase text-muted-foreground">
                    {brandName(s.brand)} · {s.category}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Fil d'étapes */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <button
              key={label}
              type="button"
              disabled={i > step}
              onClick={() => setStep(i)}
              className={`flex items-center gap-2 border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-40 ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : done
                    ? "border-foreground text-foreground"
                    : "border-border text-muted-foreground"
              }`}
            >
              <span>0{i + 1}</span>
              {label}
              {done && <Check className="size-3" />}
            </button>
          );
        })}
      </div>

      <div className="rounded-sm border border-border bg-card p-6 md:p-8">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="mb-6 flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary"
          >
            <ChevronLeft className="size-3" /> Retour
          </button>
        )}

        {/* 01 — Type d'appareil */}
        {step === 0 && (
          <>
            <span className="at-eyebrow mb-3 block">01. Quel type d'appareil ?</span>
            <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-3">
              {CATEGORIES.map((c) => {
                const media = categoryMedia(c);
                const Icon = media?.icon;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCategory(c);
                      setBrand(null);
                      setDevice(null);
                      setFaults([]);
                      setStep(1);
                    }}
                    className="group flex flex-col items-start gap-3 bg-card p-5 text-left transition-colors hover:bg-surface"
                  >
                    <span className="flex size-14 items-center justify-center rounded-sm border border-border text-primary transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                      {Icon && <Icon className="size-7" strokeWidth={1.5} />}
                    </span>
                    <span className="text-sm font-bold tracking-tight">{c}</span>
                    <span className="font-mono text-[10px] uppercase text-muted-foreground">
                      {media?.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* 02 — Marque */}
        {step === 1 && (
          <>
            <span className="at-eyebrow mb-3 block">02. Marque · {category}</span>
            <div className="flex flex-wrap gap-2">
              {brandsOfCategory.map((b) => (
                <button
                  key={b.slug}
                  type="button"
                  onClick={() => {
                    setBrand(b.slug);
                    setDevice(null);
                    setFaults([]);
                    setStep(2);
                  }}
                  className="border border-border px-3 py-2 text-xs font-bold uppercase transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
                >
                  {b.name}
                </button>
              ))}
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Marque absente ?{" "}
              <Link to="/devis" className="text-primary underline">
                Demander un devis
              </Link>
            </p>
          </>
        )}

        {/* 03 — Modèle */}
        {step === 2 && (
          <>
            <span className="at-eyebrow mb-3 block">
              03. Modèle · {brand ? brandName(brand) : ""}
            </span>
            <div className="grid gap-2 sm:grid-cols-2">
              {models.map((d) => (
                <button
                  key={d.slug}
                  type="button"
                  onClick={() => {
                    setDevice(d);
                    setFaults([]);
                    setStep(3);
                  }}
                  className="flex items-center gap-3 border border-border p-3 text-left transition-colors hover:border-foreground hover:bg-surface"
                >
                  <img
                    src={categoryMedia(d.category)?.image}
                    alt={d.name}
                    loading="lazy"
                    width={768}
                    height={768}
                    className="size-12 rounded-sm object-cover"
                  />
                  <span>
                    <span className="block text-sm font-bold tracking-tight">{d.name}</span>
                    <span className="font-mono text-[10px] uppercase text-muted-foreground">
                      {d.year} · {d.faults.length} pannes
                    </span>
                  </span>
                </button>
              ))}
              {models.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Modèles sur demande —{" "}
                  <Link to="/devis" className="text-primary underline">
                    demander un devis
                  </Link>
                </p>
              )}
            </div>
          </>
        )}

        {/* 04 — Pannes multi-sélection + description */}
        {step === 3 && device && (
          <>
            <span className="at-eyebrow mb-3 block">04. Pannes constatées · {device.name}</span>
            <p className="mb-4 text-xs text-muted-foreground">
              Sélectionnez une ou plusieurs pannes, puis décrivez le problème.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {device.faults.map((flt) => {
                const on = faults.includes(flt.slug);
                return (
                  <button
                    key={flt.slug}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleFault(flt.slug)}
                    className={`flex items-center justify-between gap-3 border p-3 text-left transition-colors ${
                      on ? "border-primary bg-primary/10" : "border-border hover:border-foreground"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <span
                        className={`flex size-4 shrink-0 items-center justify-center border ${
                          on ? "border-primary bg-primary text-primary-foreground" : "border-border"
                        }`}
                      >
                        {on && <Check className="size-3" />}
                      </span>
                      {flt.label}
                    </span>
                    <span className="font-mono text-xs text-primary">{formatFcfa(flt.price)}</span>
                  </button>
                );
              })}
            </div>

            <label htmlFor="at-desc" className="at-eyebrow mt-6 mb-2 block">
              Description de la panne
            </label>
            <textarea
              id="at-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex : l'écran s'allume mais le tactile ne répond plus depuis une chute."
              className="w-full rounded-sm border border-border bg-background p-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
              <p className="font-mono text-xs uppercase text-muted-foreground">
                {faults.length} panne(s) ·{" "}
                <span className="text-primary">
                  {total > 0 ? `Estimation ${formatFcfa(total)}` : "Diagnostic gratuit"}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="technical" size="sm">
                  <Link to="/appareil/$slug" params={{ slug: device.slug }}>
                    Voir la fiche
                  </Link>
                </Button>
                <Button
                  variant="primaryBlock"
                  size="sm"
                  disabled={faults.length === 0 && description.trim().length === 0}
                  onClick={reserve}
                >
                  Réserver <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
