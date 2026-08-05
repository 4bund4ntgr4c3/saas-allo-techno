import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ArrowRight,
  CalendarClock,
  Check,
  ChevronLeft,
  Clock,
  ImagePlus,
  Loader2,
  Search,
  Truck,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSlotAvailability } from "@/hooks/useSlotAvailability";
import {
  BRANDS,
  CATEGORIES,
  DEVICES,
  brandName,
  deviceBySlug,
  familyOf,
  formatFcfa,
  type Device,
} from "@/data/catalog";
import { categoryMedia } from "@/data/device-media";
import { EstimateBreakdown } from "@/components/site/EstimateBreakdown";
import { ContactForm } from "@/components/site/ContactForm";
import { ProcessSteps, SectionHeader } from "@/components/site/Blocks";
import { QrCode } from "@/components/site/QrCode";
import { ReservationSummary } from "@/components/site/ReservationSummary";
import { Button } from "@/components/ui/button";
import { computeEstimate } from "@/lib/estimate";
import { createReservation } from "@/lib/reservations.functions";
import { trackWizardEvent } from "@/lib/analytics";
import {
  DOMICILE_HOURS_LABEL,
  HOURS_BY_PERIOD,
  isOpenNow,
  isPastSlot,
  OPEN_NOW_LABEL,
  periodOfHour,
  slotHoursFor,
  toIsoDate,
  type ContactInput,
  type DepositMode,
  type ReservationInput,
} from "@/lib/reservation-schema";

const STEPS = [
  "Type",
  "Marque",
  "Série",
  "Famille",
  "Modèle",
  "Panne",
  "Créneau",
  "Coordonnées",
  "Récapitulatif",
] as const;
const DAYS_AHEAD = 10;

const DEPOSIT_OPTIONS: { value: DepositMode; label: string; hint: string }[] = [
  {
    value: "boutique",
    label: "Dépôt en boutique",
    hint: "Zogbadjè, Abomey-Calavi",
  },
  {
    value: "domicile",
    label: "Enlèvement à domicile",
    hint: "Cotonou & Abomey-Calavi",
  },
];

/**
 * Sélecteur de catégorie d'appareil (grille d'icônes). Réutilisé sur la page
 * d'accueil (redirige vers /reparations) et à l'étape 1 de l'assistant.
 */
export function CategoryPicker({ onSelect }: { onSelect: (category: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-3">
      {CATEGORIES.map((c) => {
        const media = categoryMedia(c);
        const Icon = media?.icon;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onSelect(c)}
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
  );
}

/**
 * Carte flottante de suivi : une seule ligne qui se met à jour au fil des
 * étapes — chemin de sélection (type · marque · série · famille) puis nom
 * complet de l'appareil une fois le modèle choisi.
 */
function SelectionSummary({
  category,
  brand,
  series,
  family,
  device,
}: {
  category: string | null;
  brand: string | null;
  series: string | null;
  family: string | null;
  device: Device | null;
}) {
  const crumbs = [category, brand ? brandName(brand) : null, series, family].filter(
    Boolean,
  ) as string[];
  const line = device
    ? device.name
    : crumbs.length > 0
      ? crumbs.join(" · ")
      : "Choisissez un appareil";

  return (
    <div className="border border-border bg-surface px-5 py-4">
      <span className="at-eyebrow block">Votre sélection</span>
      <p aria-live="polite" className="mt-2 truncate text-sm font-bold tracking-tight">
        {line}
      </p>
    </div>
  );
}

/**
 * Assistant de diagnostic et de réservation en 9 étapes :
 * type d'appareil (icône) → marque → série (ex : Galaxy A) → famille de modèles
 * (ex : A5x, affichée seulement quand elle regroupe plusieurs modèles) → modèle →
 * pannes (multi-sélection) → date & heure → coordonnées → récapitulatif.
 * Reprend l'ancienne page /reservation (qui redirige ici).
 */
export function DeviceSearch({
  initialCategory,
  initialDevice,
  initialPanne,
  initialDate,
  initialHeure,
}: {
  initialCategory?: string | null;
  initialDevice?: string | null;
  initialPanne?: string | null;
  initialDate?: string | null;
  initialHeure?: string | null;
}) {
  const submit = useServerFn(createReservation);
  const [step, setStep] = useState(initialCategory ? 1 : 0);
  const [category, setCategory] = useState<string | null>(initialCategory ?? null);
  const [brand, setBrand] = useState<string | null>(null);
  const [series, setSeries] = useState<string | null>(null);
  const [family, setFamily] = useState<string | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [faults, setFaults] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [query, setQuery] = useState("");
  const [date, setDate] = useState<string | null>(null);
  const [hour, setHour] = useState<string | null>(null);
  const [comeNow, setComeNow] = useState(false);
  const [mode, setMode] = useState<DepositMode>("boutique");
  const [contact, setContact] = useState<Partial<ContactInput>>({
    paiement: "mtn",
  });
  const [ref, setRef] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  // URLs de prévisualisation des photos (évite les fuites mémoire)
  const previewUrls = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);
  useEffect(() => {
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [previewUrls]);

  const DRAFT_KEY = "at-wizard-draft";

  const [showDraftPrompt, setShowDraftPrompt] = useState(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return false;
      const draft = JSON.parse(raw);
      return Date.now() - draft.timestamp < 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  });

  const saveDraft = () => {
    const draft = {
      step,
      category,
      brand,
      series,
      family,
      deviceSlug: device?.slug ?? null,
      faults,
      description,
      mode,
      date,
      hour,
      comeNow,
      contact,
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {}
  };

  const restoreDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return false;
      const draft = JSON.parse(raw);
      if (Date.now() - draft.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(DRAFT_KEY);
        return false;
      }
      setStep(draft.step);
      setCategory(draft.category);
      setBrand(draft.brand);
      setSeries(draft.series);
      setFamily(draft.family);
      if (draft.deviceSlug) {
        const d = deviceBySlug(draft.deviceSlug);
        if (d) setDevice(d);
      }
      setFaults(draft.faults);
      setDescription(draft.description);
      setMode(draft.mode);
      setDate(draft.date);
      setHour(draft.hour);
      setComeNow(draft.comeNow);
      setContact(draft.contact);
      localStorage.removeItem(DRAFT_KEY);
      return true;
    } catch {
      return false;
    }
  };

  const clearDraft = () => localStorage.removeItem(DRAFT_KEY);

  // Pré-remplissage depuis les paramètres d'URL (liens « Réserver » → /reservation
  // → redirection ici) : appareil, panne, date et heure déjà connus.
  useEffect(() => {
    if (initialDevice) {
      const d = deviceBySlug(initialDevice);
      if (d) {
        setCategory(d.category);
        setBrand(d.brand);
        setSeries(d.series);
        setFamily(familyOf(d.name));
        setDevice(d);
        setFaults([]);
        if (initialPanne) setDescription(initialPanne);
        if (initialDate) setDate(initialDate);
        if (initialHeure && (!initialDate || !isPastSlot(initialDate, initialHeure)))
          setHour(initialHeure);
        setStep(initialDate || initialHeure ? 6 : 5);
        return;
      }
    }
    if (initialCategory && !category) setStep(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDevice, initialPanne, initialDate, initialHeure]);

  // Gestion du focus : à chaque changement d'étape, le focus est déplacé sur
  // le contenu de l'étape courante (l'étape précédente disparaît du DOM).
  const stepContentRef = useRef<HTMLDivElement | null>(null);
  const prevStepRef = useRef(step);

  useEffect(() => {
    if (prevStepRef.current === step) return;
    prevStepRef.current = step;
    stepContentRef.current?.focus({ preventScroll: true });
    trackWizardEvent({
      event: "step_viewed",
      step,
      ...(category ? { category } : {}),
      ...(brand ? { brand } : {}),
      ...(device?.name ? { device: device.name } : {}),
    });
    if (step === 8) {
      trackWizardEvent({
        event: "estimation_shown",
        step: 8,
        ...(category ? { category } : {}),
        ...(brand ? { brand } : {}),
        ...(device?.name ? { device: device.name } : {}),
      });
    }
  }, [step]);

  const availability = useSlotAvailability(mode, DAYS_AHEAD);
  const { openDates } = availability;

  const dateKeys = useMemo(
    () => [...openDates.keys()].filter((k) => k >= toIsoDate(new Date())).sort(),
    [openDates],
  );
  const availableHours = useMemo(() => {
    if (!date) return [];
    const weekday = new Date(`${date}T12:00:00`).getDay();
    const allowed = new Set(slotHoursFor(mode, weekday));
    return (openDates.get(date) ?? [])
      .flatMap((s) => HOURS_BY_PERIOD[s.period])
      .filter((h) => allowed.has(h) && !isPastSlot(date, h));
  }, [openDates, date, mode]);

  // Auto-save draft on every change
  useEffect(() => {
    if (step > 0) saveDraft();
  }, [step, category, brand, series, family, device, faults, description, mode, date, hour, comeNow, contact]);

  // Temps réel : libère l'heure sélectionnée si elle est prise entre-temps.
  useEffect(() => {
    if (date && hour && availability.isHourTaken(date, hour)) setHour(null);
  }, [date, hour, availability]);

  const brandsOfCategory = useMemo(() => {
    if (!category) return [];
    const slugs = new Set(DEVICES.filter((d) => d.category === category).map((d) => d.brand));
    return BRANDS.filter((b) => slugs.has(b.slug));
  }, [category]);

  const seriesOfBrand = useMemo(() => {
    const list = DEVICES.filter((d) => d.category === category && d.brand === brand);
    const bySeries = new Map<string, { years: number[]; count: number }>();
    for (const d of list) {
      const s = d.series || "Autres";
      const cur = bySeries.get(s) ?? { years: [], count: 0 };
      cur.years.push(d.year);
      cur.count++;
      bySeries.set(s, cur);
    }
    return [...bySeries.entries()].map(([name, { years, count }]) => ({
      name,
      count,
      from: Math.min(...years),
      to: Math.max(...years),
    }));
  }, [category, brand]);

  const familiesOf = (seriesName: string) => {
    const list = DEVICES.filter(
      (d) => d.category === category && d.brand === brand && (d.series || "Autres") === seriesName,
    );
    const byFamily = new Map<string, { years: number[]; count: number }>();
    for (const d of list) {
      const f = familyOf(d.name);
      const cur = byFamily.get(f) ?? { years: [], count: 0 };
      cur.years.push(d.year);
      cur.count++;
      byFamily.set(f, cur);
    }
    return [...byFamily.entries()].map(([name, { years, count }]) => ({
      name,
      count,
      from: Math.min(...years),
      to: Math.max(...years),
    }));
  };

  const families = useMemo(() => familiesOf(series ?? ""), [familiesOf, series]);

  const familiesUseful = families.length > 1;

  const models = useMemo(
    () =>
      DEVICES.filter(
        (d) =>
          d.category === category &&
          d.brand === brand &&
          (d.series || "Autres") === series &&
          (family ? familyOf(d.name) === family : true),
      ),
    [category, brand, series, family],
  );

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return DEVICES.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.series.toLowerCase().includes(q) ||
        brandName(d.brand).toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q),
    );
  }, [query]);

  const selectedFaults = useMemo(
    () => (device?.faults ?? []).filter((f) => faults.includes(f.slug)),
    [device, faults],
  );

  const estimate = useMemo(() => computeEstimate(selectedFaults), [selectedFaults]);
  const total = estimate.total;

  const toggleFault = (slug: string) =>
    setFaults((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));

  const panneLabel = useMemo(() => {
    if (!device) return "";
    const labels = device.faults.filter((f) => faults.includes(f.slug)).map((f) => f.label);
    return [labels.join(", "), description.trim()].filter(Boolean).join(" — ");
  }, [device, faults, description]);

  const values = useMemo((): ReservationInput => {
    const now = new Date();
    return {
      nom: contact.nom ?? "",
      telephone: contact.telephone ?? "",
      email: contact.email ?? "",
      appareil: device?.slug ?? "",
      panne: panneLabel,
      mode,
      paiement: contact.paiement ?? "mtn",
      date: date ?? toIsoDate(now),
      creneau: hour
        ? periodOfHour(hour)
        : periodOfHour(`${String(now.getHours()).padStart(2, "0")}:00`),
      heure: hour ?? "",
      message: contact.message ?? "",
    };
  }, [contact, device, panneLabel, date, hour, mode]);

  const confirmReservation = async () => {
    if (!device) return;
    if (!comeNow) {
      if (!date || !hour) {
        toast.error("Choisissez une date et une heure pour votre rendez-vous.");
        setStep(6);
        return;
      }
      if (availability.isHourTaken(date, hour)) {
        toast.error("Ce créneau vient d'être réservé. Choisissez une autre heure.");
        setHour(null);
        setStep(6);
        return;
      }
    } else if (!isOpenNow()) {
      toast.error("La boutique est fermée maintenant — choisissez un créneau.");
      setComeNow(false);
      return;
    }
    setSubmitting(true);
    try {
      const row = await submit({ data: values });
      setRef(row.reference);
      clearDraft();
      trackWizardEvent({
        event: "reservation_created",
        step: 8,
        ...(category ? { category } : {}),
        ...(brand ? { brand } : {}),
        ...(device?.name ? { device: device.name } : {}),
      });
      toast.success(`Réservation enregistrée — dossier ${row.reference}`, {
        description: `Confirmation envoyée${values.email ? ` à ${values.email} et` : ""} par WhatsApp au ${values.telephone}.`,
      });
      setDevice(null);
      setFaults([]);
      setDescription("");
      setDate(null);
      setHour(null);
      setComeNow(false);
      setStep(0);
      availability.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Réservation impossible");
      availability.refresh();
    } finally {
      setSubmitting(false);
    }
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
          <ul className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto border border-border bg-card shadow-xl">
            {suggestions.map((s) => (
              <li key={s.slug}>
                <button
                  type="button"
                  onClick={() => {
                    setCategory(s.category);
                    setBrand(s.brand);
                    setSeries(s.series);
                    setFamily(null);
                    setDevice(s);
                    setFaults([]);
                    setStep(5);
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
            <li className="border-t border-border px-4 py-2 font-mono text-[10px] uppercase text-muted-foreground">
              {suggestions.length} appareil{suggestions.length > 1 ? "s" : ""} trouvé
              {suggestions.length > 1 ? "s" : ""}
            </li>
          </ul>
        )}
      </div>

      {/* Fil d'étapes */}
      <nav aria-label="Étapes de l'assistant de diagnostic" className="mb-4">
        <ol className="flex flex-wrap items-center gap-2">
          {STEPS.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={label}>
                <button
                  type="button"
                  disabled={i > step || (i === 3 && !familiesUseful)}
                  aria-current={active ? "step" : undefined}
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
              </li>
            );
          })}
        </ol>
      </nav>

      {showDraftPrompt && step === 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm">
            <strong>Reprendre votre dossier ?</strong> Votre progression a été sauvegardée.
          </p>
          <div className="flex gap-3">
            <Button
              size="sm"
              onClick={() => {
                restoreDraft();
                setShowDraftPrompt(false);
              }}
            >
              Reprendre
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                clearDraft();
                setShowDraftPrompt(false);
              }}
            >
              Recommencer
            </Button>
          </div>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-8">
        <div className="rounded-sm border border-border bg-card p-6 md:p-8">
          <div
            ref={stepContentRef}
            tabIndex={-1}
            role="region"
            aria-label={STEPS[step]}
            className="focus:outline-none"
          >
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
                <CategoryPicker
                  onSelect={(c) => {
                    setCategory(c);
                    setBrand(null);
                    setSeries(null);
                    setFamily(null);
                    setDevice(null);
                    setFaults([]);
                    setStep(1);
                  }}
                />
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
                        setSeries(null);
                        setFamily(null);
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

            {/* 03 — Série / génération */}
            {step === 2 && (
              <>
                <span className="at-eyebrow mb-3 block">
                  03. Série · {brand ? brandName(brand) : ""}
                </span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {seriesOfBrand.map((s) => (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => {
                        setSeries(s.name);
                        setFamily(null);
                        setDevice(null);
                        setFaults([]);
                        setStep(familiesOf(s.name).length > 1 ? 3 : 4);
                      }}
                      className="flex items-center justify-between gap-3 border border-border p-3 text-left transition-colors hover:border-foreground hover:bg-surface"
                    >
                      <span>
                        <span className="block text-sm font-bold tracking-tight">{s.name}</span>
                        <span className="font-mono text-[10px] uppercase text-muted-foreground">
                          {s.from} – {s.to} · {s.count} modèle{s.count > 1 ? "s" : ""}
                        </span>
                      </span>
                      <ChevronLeft className="size-3 rotate-180 text-primary" />
                    </button>
                  ))}
                  {seriesOfBrand.length === 0 && (
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

            {/* 04 — Famille de modèles */}
            {step === 3 && (
              <>
                <span className="at-eyebrow mb-3 block">
                  04. Famille de modèles · {brand ? brandName(brand) : ""}{" "}
                  {series ? `· ${series}` : ""}
                </span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {families.map((f) => (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => {
                        setFamily(f.name);
                        setDevice(null);
                        setFaults([]);
                        setStep(4);
                      }}
                      className="flex items-center justify-between gap-3 border border-border p-3 text-left transition-colors hover:border-foreground hover:bg-surface"
                    >
                      <span>
                        <span className="block text-sm font-bold tracking-tight">{f.name}</span>
                        <span className="font-mono text-[10px] uppercase text-muted-foreground">
                          {f.from} – {f.to} · {f.count} modèle{f.count > 1 ? "s" : ""}
                        </span>
                      </span>
                      <ChevronLeft className="size-3 rotate-180 text-primary" />
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* 05 — Modèle */}
            {step === 4 && (
              <>
                <span className="at-eyebrow mb-3 block">
                  05. Modèle · {brand ? brandName(brand) : ""} {series ? `· ${series}` : ""}{" "}
                  {family ? `· ${family}` : ""}
                </span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {models.map((d) => {
                    const ModelIcon = categoryMedia(d.category)?.icon;
                    return (
                      <button
                        key={d.slug}
                        type="button"
                        onClick={() => {
                          setDevice(d);
                          setFaults([]);
                          setStep(5);
                        }}
                        className="flex items-center gap-3 border border-border p-3 text-left transition-colors hover:border-foreground hover:bg-surface"
                      >
                        <span className="flex size-12 shrink-0 items-center justify-center border border-border text-primary">
                          {ModelIcon && <ModelIcon className="size-6" strokeWidth={1.5} />}
                        </span>
                        <span>
                          <span className="block text-sm font-bold tracking-tight">{d.name}</span>
                          <span className="font-mono text-[10px] uppercase text-muted-foreground">
                            {d.year} · {d.faults.length} pannes
                          </span>
                        </span>
                      </button>
                    );
                  })}
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

            {/* 06 — Pannes multi-sélection + description */}
            {step === 5 && device && (
              <>
                <span className="at-eyebrow mb-3 block">06. Pannes constatées · {device.name}</span>
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
                          on
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-foreground"
                        }`}
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold">
                          <span
                            className={`flex size-4 shrink-0 items-center justify-center border ${
                              on
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border"
                            }`}
                          >
                            {on && <Check className="size-3" />}
                          </span>
                          {flt.label}
                        </span>
                        <span className="font-mono text-xs text-primary">
                          {formatFcfa(flt.price)}
                        </span>
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
                      onClick={() => setStep(6)}
                    >
                      Choisir un créneau <ArrowRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* 07 — Date & heure du rendez-vous */}
            {step === 6 && device && (
              <>
                <span className="at-eyebrow mb-3 block">07. Date & heure du rendez-vous</span>
                <p className="mb-4 text-xs text-muted-foreground">
                  Choisissez un mode de dépôt, un jour puis une heure. Seuls les créneaux à venir,
                  réellement disponibles pour ce mode, sont affichés.
                </p>

                <div className="mb-2 flex items-center gap-2">
                  <Truck className="size-4 text-primary" strokeWidth={1.5} />
                  <span className="font-mono text-[10px] uppercase tracking-wider">
                    Mode de dépôt
                  </span>
                </div>
                <div
                  role="radiogroup"
                  aria-label="Mode de dépôt"
                  className="mb-6 grid gap-2 sm:grid-cols-2"
                >
                  {DEPOSIT_OPTIONS.map((o) => {
                    const on = mode === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => {
                          setMode(o.value);
                          setDate(null);
                          setHour(null);
                          setComeNow(false);
                        }}
                        className={`flex items-center gap-3 border p-3 text-left transition-colors ${
                          on
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-foreground"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
                            on ? "border-primary" : "border-border"
                          }`}
                        >
                          {on && <span className="size-2 rounded-full bg-primary" />}
                        </span>
                        <span>
                          <span className="block text-sm font-bold tracking-tight">{o.label}</span>
                          <span className="text-xs text-muted-foreground">{o.hint}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                {mode === "domicile" && (
                  <p className="-mt-4 mb-6 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {DOMICILE_HOURS_LABEL}
                  </p>
                )}

                <div className="mb-2 flex items-center gap-2">
                  <CalendarClock className="size-4 text-primary" strokeWidth={1.5} />
                  <span
                    id="ds-day-label"
                    className="font-mono text-[10px] uppercase tracking-wider"
                  >
                    Jour
                  </span>
                </div>
                {availability.isLoading ? (
                  <p role="status" className="text-xs text-muted-foreground">
                    Chargement des disponibilités…
                  </p>
                ) : dateKeys.length === 0 ? (
                  <p role="status" className="text-xs text-muted-foreground">
                    Aucun créneau libre sur les 10 prochains jours — appelez-nous directement.
                  </p>
                ) : (
                  <div
                    role="radiogroup"
                    aria-labelledby="ds-day-label"
                    className="flex flex-nowrap gap-2 overflow-x-auto pb-1"
                  >
                    {dateKeys.map((d) => {
                      const on = date === d;
                      const dt = new Date(`${d}T12:00:00`);
                      return (
                        <button
                          key={d}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => {
                            setDate(d);
                            setHour(null);
                            setComeNow(false);
                          }}
                          className={`w-[76px] shrink-0 border p-3 text-center transition-colors ${
                            on
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:border-foreground"
                          }`}
                        >
                          <span className="block font-mono text-[10px] uppercase">
                            {dt.toLocaleDateString("fr-FR", { weekday: "short" })}
                          </span>
                          <span className="block text-lg font-bold leading-tight">
                            {dt.getDate()}
                          </span>
                          <span className="block font-mono text-[10px] uppercase">
                            {dt.toLocaleDateString("fr-FR", { month: "short" })}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {date === toIsoDate(new Date()) &&
                  mode === "boutique" &&
                  isOpenNow() &&
                  !comeNow && (
                    <button
                      type="button"
                      onClick={() => {
                        setComeNow(true);
                        setHour(null);
                      }}
                      className="mt-3 flex w-full items-center justify-between gap-3 border border-dashed border-primary/60 bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10"
                    >
                      <span>
                        <span className="block text-sm font-bold tracking-tight">
                          Venez maintenant
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Déposez l'appareil aujourd'hui sans créneau horaire — priorité boutique.
                        </span>
                      </span>
                      <Zap className="size-5 shrink-0 text-primary" strokeWidth={1.5} />
                    </button>
                  )}
                {comeNow && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border border-primary bg-primary/10 p-4">
                    <p className="text-sm font-bold">
                      Venir maintenant — dépôt immédiat aujourd'hui
                    </p>
                    <button
                      type="button"
                      onClick={() => setComeNow(false)}
                      className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground underline hover:text-primary"
                    >
                      Annuler
                    </button>
                  </div>
                )}

                <div className="mt-6 mb-2 flex items-center gap-2">
                  <Clock className="size-4 text-primary" strokeWidth={1.5} />
                  <span className="font-mono text-[10px] uppercase tracking-wider">Heure</span>
                </div>
                {!date ? (
                  <p className="text-xs text-muted-foreground">Sélectionnez d'abord un jour.</p>
                ) : comeNow ? (
                  <p className="text-xs text-muted-foreground">
                    Vous passez directement en boutique aujourd'hui ({OPEN_NOW_LABEL}). Votre
                    dossier sera préparé à l'avance.
                  </p>
                ) : availableHours.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Plus aucune heure libre ce jour-là — choisissez un autre jour
                    {mode === "boutique" && isOpenNow() && date === toIsoDate(new Date())
                      ? " ou venez maintenant"
                      : ""}
                    .
                  </p>
                ) : (
                  <div
                    role="radiogroup"
                    aria-label="Heure du rendez-vous"
                    className="grid grid-cols-3 gap-2 sm:grid-cols-4"
                  >
                    {availableHours.map((h) => {
                      const on = hour === h;
                      const taken = availability.isHourTaken(date, h);
                      return (
                        <button
                          key={h}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          disabled={taken}
                          title={taken ? "Déjà réservé" : undefined}
                          onClick={() => {
                            setHour(h);
                            setComeNow(false);
                          }}
                          className={`border px-3 py-2 font-mono text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                            taken
                              ? "border-border/50 line-through"
                              : on
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border hover:border-foreground"
                          }`}
                        >
                          {h}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
                  <p className="font-mono text-xs uppercase text-muted-foreground">
                    {comeNow
                      ? "Aujourd'hui · Venir maintenant"
                      : date && hour
                        ? `${new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            day: "2-digit",
                            month: "long",
                          })} · ${hour}`
                        : "Aucun créneau sélectionné"}{" "}
                    ·{" "}
                    <span className="text-primary">
                      {total > 0 ? `Estimation ${formatFcfa(total)}` : "Diagnostic gratuit"}
                    </span>
                  </p>
                  <Button
                    variant="primaryBlock"
                    size="sm"
                    disabled={!date || (!hour && !comeNow)}
                    onClick={() => setStep(7)}
                  >
                    {comeNow ? "Venir maintenant" : "Réserver ce créneau"}{" "}
                    <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              </>
            )}

            {/* 08 — Coordonnées */}
            {step === 7 && device && (
              <>
                <button
                  type="button"
                  onClick={() => setStep(6)}
                  className="mb-4 flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary"
                >
                  <ChevronLeft className="size-3" /> Créneau
                </button>
                <ContactForm
                  defaultValues={contact}
                  submitLabel="Voir le récapitulatif"
                  onValid={(c) => {
                    setContact(c);
                    setStep(8);
                  }}
                />
              </>
            )}

            {/* 09 — Récapitulatif */}
            {step === 8 && device && (
              <>
                <ReservationSummary
                  values={values}
                  immediate={comeNow}
                  submitting={submitting}
                  onEdit={() => setStep(7)}
                  onConfirm={() => void confirmReservation()}
                />
                <div className="mt-14">
                  <SectionHeader eyebrow="Après la réservation" title="Ce qui se passe ensuite" />
                  <ProcessSteps />
                </div>
              </>
            )}

            {ref && (
              <div
                role="status"
                tabIndex={-1}
                className="mt-6 border border-success/40 bg-success/10 p-4"
              >
                <div className="flex flex-wrap items-start gap-6">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">Dossier {ref} créé.</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Conservez ce numéro. Suivez l'avancement dans votre{" "}
                      <Link to="/mon-compte" className="text-primary underline">
                        espace client
                      </Link>{" "}
                      ou sur la page{" "}
                      <Link to="/suivi" className="text-primary underline">
                        Suivi
                      </Link>
                      . Pour un nouveau dossier, reprenez l'assistant ci-dessus.
                    </p>
                  </div>
                  <QrCode
                    value={`https://allotechno.bj/suivi?ref=${ref}`}
                    label={`Suivi du dossier ${ref}`}
                    caption="QR code de suivi du dossier"
                  />
                </div>
                <div className="mt-6 border-t border-success/30 pt-4">
                  <p className="mb-3 text-sm font-semibold">Photos de l'appareil (facultatif)</p>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Envoyez une ou plusieurs photos pour accélérer le diagnostic.
                  </p>
                  <label
                    htmlFor="photo-upload"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-dashed border-border px-4 py-3 text-sm hover:bg-surface"
                  >
                    <ImagePlus className="size-4" />
                    Ajouter des photos
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      if (files.length > 0) setPhotos((prev) => [...prev, ...files].slice(0, 5));
                    }}
                  />
                  {photos.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {photos.map((_f, i) => (
                        <div key={i} className="relative size-16 rounded-sm border border-border bg-surface">
                          <img
                            src={previewUrls[i]}
                            alt={`Photo ${i + 1}`}
                            className="size-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                            className="absolute -right-2 -top-2 size-5 rounded-full bg-destructive text-xs text-white"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {photos.length > 0 && (
                    <Button
                      size="sm"
                      className="mt-3"
                      disabled={uploading}
                      onClick={async () => {
                        setUploading(true);
                        try {
                          const urls: string[] = [];
                          for (const file of photos) {
                            const ext = file.name.split(".").pop() ?? "jpg";
                            const path = `uploads/${ref}/${crypto.randomUUID()}.${ext}`;
                            const { error } = await supabase.storage
                              .from("device-photos")
                              .upload(path, file, { upsert: false });
                            if (!error) {
                              const { data } = supabase.storage
                                .from("device-photos")
                                .getPublicUrl(path);
                              urls.push(data.publicUrl);
                            }
                          }
                          setPhotoUrls(urls);
                          setPhotos([]);
                          toast.success(`${urls.length} photo(s) envoyée(s)`);
                        } catch {
                          toast.error("Erreur lors de l'envoi des photos");
                        } finally {
                          setUploading(false);
                        }
                      }}
                    >
                      {uploading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ImagePlus className="mr-2 size-4" />}
                      {uploading ? "Envoi…" : `Envoyer ${photos.length} photo(s)`}
                    </Button>
                  )}
                  {photoUrls.length > 0 && (
                    <p className="mt-2 text-xs text-success">
                      ✓ {photoUrls.length} photo(s) envoyée(s) avec succès.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="mt-6 lg:sticky lg:top-24 lg:mt-0">
          <SelectionSummary
            category={category}
            brand={brand}
            series={series}
            family={family}
            device={device}
          />
          {device && (
            <div className="mt-4">
              <EstimateBreakdown estimate={estimate} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
