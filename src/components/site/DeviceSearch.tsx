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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { useSlotAvailability } from "@/hooks/useSlotAvailability";
import {
  BRANDS,
  DEVICES,
  brandName,
  deviceBySlug,
  familyOf,
  formatFcfa,
  type Device,
} from "@/data/catalog";
import { fullTextSearch, type SearchResult } from "@/lib/search-fulltext";
import { categoryMedia } from "@/data/device-media";
import { EstimateBreakdown } from "@/components/site/EstimateBreakdown";
import { ContactForm } from "@/components/site/ContactForm";
import { ProcessSteps, SectionHeader } from "@/components/site/Blocks";
import { QrCode } from "@/components/site/QrCode";
import { ReservationSummary } from "@/components/site/ReservationSummary";
import { Button } from "@/components/ui/button";
import { computeEstimate } from "@/lib/estimate";
import { useI18n } from "@/lib/i18n/context";
import { createReservation } from "@/lib/reservations.functions";
import { getDevicePhotoUpload, registerDeviceAttachment } from "@/lib/photos.functions";
import { trackWizardEvent } from "@/lib/analytics";
import {
  HOURS_BY_PERIOD,
  isOpenNow,
  isPastSlot,
  periodOfHour,
  slotHoursFor,
  toIsoDate,
  type ContactInput,
  type DepositMode,
  type ReservationInput,
} from "@/lib/reservation-schema";

const STEPS = [
  "wizard.step.type",
  "wizard.step.marque",
  "wizard.step.serie",
  "wizard.step.famille",
  "wizard.step.modele",
  "wizard.step.panne",
  "wizard.step.creneau",
  "wizard.step.photos",
  "wizard.step.coordonnees",
  "wizard.step.recapitulatif",
] as const;
const DAYS_AHEAD = 10;

/** Taille maximale d'une photo sélectionnée dans l'assistant (côté client). */
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const DEPOSIT_OPTIONS: { value: DepositMode; label: string; hint: string }[] = [
  {
    value: "boutique",
    label: "wizard.mode.boutique",
    hint: "Zogbadjè, Abomey-Calavi",
  },
  {
    value: "domicile",
    label: "wizard.mode.domicile",
    hint: "Cotonou & Abomey-Calavi",
  },
];

/**
 * Navigation clavier « radiogroup » (roving tabindex, motif WAI-ARIA) : les
 * flèches déplacent le focus et sélectionnent l'option cible. tabIndex est
 * porté par l'option sélectionnée (ou la première active du groupe).
 */
function rovingRadio({
  count,
  selectedIndex,
  onSelect,
  isDisabled = () => false,
}: {
  count: number;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  isDisabled?: (index: number) => boolean;
}) {
  const focusIndex = (() => {
    if (selectedIndex !== null && selectedIndex >= 0) return selectedIndex;
    for (let i = 0; i < count; i++) {
      if (!isDisabled(i)) return i;
    }
    return -1;
  })();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
    e.preventDefault();
    if (count === 0) return;
    const from = focusIndex >= 0 ? focusIndex : 0;
    const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1;
    for (let i = 1; i <= count; i++) {
      const next = (from + i * step + count) % count;
      if (!isDisabled(next)) {
        onSelect(next);
        e.currentTarget.parentElement
          ?.querySelector<HTMLElement>(`[data-radio-index="${next}"]`)
          ?.focus();
        return;
      }
    }
  };

  const tabIndexFor = (i: number) => (i === focusIndex ? 0 : -1);

  return { handleKeyDown, tabIndexFor };
}

/**
 * Sélecteur de catégorie d'appareil (grille d'icônes). Réutilisé sur la page
 * d'accueil (redirige vers /reparations) et à l'étape 1 de l'assistant.
 */
// La grille de catégories vit dans un fichier autonome pour ne pas tirer le
// catalogue complet quand la page d'accueil l'importe.
import { CategoryPicker } from "./CategoryPicker";
export { CategoryPicker };

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
  const { t } = useI18n();
  const line = device
    ? device.name
    : crumbs.length > 0
      ? crumbs.join(" · ")
      : t("wizard.select.device");

  return (
    <div className="border border-border bg-surface px-5 py-4">
      <span className="at-eyebrow block">{t("wizard.selection")}</span>
      <p aria-live="polite" className="mt-2 truncate text-sm font-bold tracking-tight">
        {line}
      </p>
    </div>
  );
}

/**
 * Assistant de diagnostic et de réservation en 10 étapes :
 * type d'appareil (icône) → marque → série (ex : Galaxy A) → famille de modèles
 * (ex : A5x, affichée seulement quand elle regroupe plusieurs modèles) → modèle →
 * pannes (multi-sélection) → date & heure → photos (optionnel) → coordonnées →
 * récapitulatif. Reprend l'ancienne page /reservation (qui redirige ici).
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
  const { locale, t } = useI18n();
  const submit = useServerFn(createReservation);
  const getPhotoUpload = useServerFn(getDevicePhotoUpload);
  const registerAttachment = useServerFn(registerDeviceAttachment);
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
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [srcParam, setSrcParam] = useState<string | null>(null);
  const [restoredPhotoCount, setRestoredPhotoCount] = useState(0);
  const [autoUploadStatus, setAutoUploadStatus] = useState<
    "uploading" | "done" | "partial" | "failed" | null
  >(null);
  const [autoUploadCounts, setAutoUploadCounts] = useState<{ ok: number; failed: number }>({
    ok: 0,
    failed: 0,
  });

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

  const saveDraft = useCallback(() => {
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
      // Les fichiers ne sont jamais sérialisés : seul le compte est conservé.
      photoCount: photos.length,
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Quota localStorage atteint (navigation privée, mode avion) : on ignore, le brouillon sera perdu.
    }
  }, [
    step,
    category,
    brand,
    series,
    family,
    device,
    faults,
    description,
    mode,
    date,
    hour,
    comeNow,
    contact,
    photos.length,
  ]);

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
      // Les fichiers blobs ne sont pas persistables : on restaure seulement le compte.
      setPhotos([]);
      setRestoredPhotoCount(draft.photoCount ?? 0);
      localStorage.removeItem(DRAFT_KEY);
      return true;
    } catch {
      return false;
    }
  };

  const clearDraft = () => localStorage.removeItem(DRAFT_KEY);

  // Attribution : paramètre d'URL `src` (ex : ?src=quartier-zogbadje), lu au
  // montage côté client (la route /reparations ne transmet pas ce paramètre).
  useEffect(() => {
    try {
      const s = new URLSearchParams(window.location.search).get("src");
      if (s) setSrcParam(s.trim().slice(0, 80) || null);
    } catch {
      // Lecture du navigateur impossible : on ignore l'attribution.
    }
  }, []);

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
    if (step === 9) {
      trackWizardEvent({
        event: "estimation_shown",
        step: 9,
        ...(category ? { category } : {}),
        ...(brand ? { brand } : {}),
        ...(device?.name ? { device: device.name } : {}),
      });
    }
  }, [step, category, brand, device?.name]);

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
  }, [step, saveDraft]);

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

  const familiesOf = useCallback(
    (seriesName: string) => {
      const list = DEVICES.filter(
        (d) =>
          d.category === category && d.brand === brand && (d.series || "Autres") === seriesName,
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
    },
    [category, brand],
  );

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

  const fullTextResults = useMemo(() => {
    const q = query.trim();
    if (q.length < 2) return [];
    return fullTextSearch(q, locale);
  }, [query, locale]);

  const groupedResults = useMemo(() => {
    const groups: { type: SearchResult["type"]; label: string; items: SearchResult[] }[] = [];
    const deviceResults = fullTextResults.filter((r) => r.type === "device");
    const blogResults = fullTextResults.filter((r) => r.type === "blog");
    const pageResults = fullTextResults.filter((r) => r.type === "page");
    if (deviceResults.length > 0) groups.push({ type: "device", label: t("search.group.devices"), items: deviceResults });
    if (blogResults.length > 0) groups.push({ type: "blog", label: t("search.group.blog"), items: blogResults });
    if (pageResults.length > 0) groups.push({ type: "page", label: t("search.group.pages"), items: pageResults });
    return groups;
  }, [fullTextResults, t]);

  const selectedFaults = useMemo(
    () => (device?.faults ?? []).filter((f) => faults.includes(f.slug)),
    [device, faults],
  );

  const estimate = useMemo(() => computeEstimate(selectedFaults), [selectedFaults]);
  const total = estimate.total;

  const depositRadio = rovingRadio({
    count: DEPOSIT_OPTIONS.length,
    selectedIndex: DEPOSIT_OPTIONS.findIndex((o) => o.value === mode),
    onSelect: (i) => {
      setMode(DEPOSIT_OPTIONS[i]!.value);
      setDate(null);
      setHour(null);
      setComeNow(false);
    },
  });

  const dayRadio = rovingRadio({
    count: dateKeys.length,
    selectedIndex: date === null ? null : dateKeys.indexOf(date),
    onSelect: (i) => {
      setDate(dateKeys[i]!);
      setHour(null);
      setComeNow(false);
    },
  });

  const hourRadio = rovingRadio({
    count: availableHours.length,
    selectedIndex: hour === null ? null : availableHours.indexOf(hour),
    onSelect: (i) => {
      setHour(availableHours[i]!);
      setComeNow(false);
    },
    isDisabled: (i) => availability.isHourTaken(date, availableHours[i]!),
  });

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

  /**
   * Upload des pièces jointes via l'URL signée (même mécanisme que le panneau
   * de confirmation) : préparation → PUT → rattachement au dossier. Non bloquant.
   */
  const uploadSelectedPhotos = async (files: File[], reference: string, code: string) => {
    let ok = 0;
    let failed = 0;
    for (const file of files) {
      try {
        const prepared = await getPhotoUpload({
          data: {
            reference,
            code,
            fileName: file.name,
            contentType: file.type,
            fileSize: file.size,
          },
        });
        const res = await fetch(prepared.signedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
            "x-upsert": "false",
          },
          body: file,
        });
        if (!res.ok) throw new Error(`Upload ${res.status}`);
        await registerAttachment({
          data: {
            reference,
            code,
            url: prepared.path,
            kind: file.type.startsWith("video/") ? "video" : "photo",
            stage: "appareil",
          },
        });
        ok++;
      } catch {
        failed++;
      }
    }
    // Seuls les fichiers réellement envoyés quittent la sélection (retry possible sinon).
    setPhotos((prev) => prev.filter((f) => !files.includes(f)));
    return { ok, failed };
  };

  const confirmReservation = async () => {
    if (!device) return;
    if (!comeNow) {
      if (!date || !hour) {
        toast.error(t("wizard.error.no.slot"));
        setStep(6);
        return;
      }
      if (availability.isHourTaken(date, hour)) {
        toast.error(t("wizard.error.taken"));
        setHour(null);
        setStep(6);
        return;
      }
    } else if (!isOpenNow()) {
      toast.error(t("wizard.error.closed"));
      setComeNow(false);
      return;
    }
    setSubmitting(true);
    try {
      const row = await submit({
        data: { ...values, ...(srcParam ? { source: srcParam } : {}) },
      });
      setRef(row.reference);
      setTrackingCode(row.tracking_code ?? null);
      clearDraft();
      setRestoredPhotoCount(0);
      trackWizardEvent({
        event: "reservation_created",
        step: 9,
        ...(category ? { category } : {}),
        ...(brand ? { brand } : {}),
        ...(device?.name ? { device: device.name } : {}),
        ...(srcParam ? { source: srcParam } : {}),
      });
      toast.success(t("wizard.success.toast", [row.reference]), {
        description: values.email
          ? t("wizard.success.toast.email", [values.email, values.telephone])
          : t("wizard.success.toast.phone", [values.telephone]),
      });
      // Envoi automatique (non bloquant) des photos sélectionnées à l'étape 8.
      if (photos.length > 0) {
        setAutoUploadStatus("uploading");
        setAutoUploadCounts({ ok: 0, failed: 0 });
        void uploadSelectedPhotos(photos, row.reference, row.tracking_code ?? "").then(
          ({ ok, failed }) => {
            setAutoUploadCounts({ ok, failed });
            setAutoUploadStatus(failed === 0 ? "done" : ok > 0 ? "partial" : "failed");
          },
        );
      }
      setDevice(null);
      setFaults([]);
      setDescription("");
      setDate(null);
      setHour(null);
      setComeNow(false);
      setStep(0);
      availability.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("wizard.error.generic"));
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
          {t("wizard.search.aria")}
        </label>
        <input
          id="at-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("wizard.search.placeholder")}
          className="h-14 w-full border border-border bg-card pr-4 pl-12 font-mono text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        {query.trim().length >= 2 && (
          <p role="status" className="sr-only">
            {t(
              suggestions.length > 1
                ? "wizard.search.results.plural"
                : "wizard.search.results.single",
              [suggestions.length],
            )}
          </p>
        )}
        {fullTextResults.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto border border-border bg-card shadow-xl">
            {groupedResults.map((group) => (
              <li key={group.type}>
                <div className="border-t border-border bg-surface px-4 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </div>
                {group.items.map((item) => (
                  <li key={item.url}>
                    <button
                      type="button"
                      onClick={() => {
                        if (item.type === "device") {
                          const d = DEVICES.find((dev) => item.url.includes(dev.slug));
                          if (d) {
                            setCategory(d.category);
                            setBrand(d.brand);
                            setSeries(d.series);
                            setFamily(null);
                            setDevice(d);
                            setFaults([]);
                            setStep(5);
                          }
                        }
                        setQuery("");
                      }}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-secondary"
                    >
                      <span className="flex flex-col">
                        <span className="font-bold">{item.title}</span>
                        {item.description && (
                          <span className="text-xs text-muted-foreground">{item.description}</span>
                        )}
                      </span>
                      <span className="font-mono text-[10px] uppercase text-muted-foreground">
                        {item.type === "device" ? t("search.type.device") : item.type === "blog" ? t("search.type.blog") : t("search.type.page")}
                      </span>
                    </button>
                  </li>
                ))}
              </li>
            ))}
            <li className="border-t border-border px-4 py-2 font-mono text-[10px] uppercase text-muted-foreground">
              {fullTextResults.length} {fullTextResults.length > 1 ? t("wizard.search.results.plural") : t("wizard.search.results.single")}
            </li>
          </ul>
        )}
      </div>

      {/* Fil d'étapes */}
      <nav aria-label={t("wizard.nav.aria")} className="mb-4">
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
                  {t(label)}
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
            <strong>{t("wizard.draft.resume.title")}</strong> {t("wizard.draft.resume.text")}
          </p>
          <div className="flex gap-3">
            <Button
              size="sm"
              onClick={() => {
                restoreDraft();
                setShowDraftPrompt(false);
              }}
            >
              {t("wizard.draft.resume")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                clearDraft();
                setShowDraftPrompt(false);
              }}
            >
              {t("wizard.draft.restart")}
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
            aria-label={t(STEPS[step] ?? "")}
            className="focus:outline-none"
          >
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="mb-6 flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary"
              >
                <ChevronLeft className="size-3" /> {t("wizard.back")}
              </button>
            )}

            {/* 01 — Type d'appareil */}
            {step === 0 && (
              <>
                <span className="at-eyebrow mb-3 block">{t("wizard.step0.title")}</span>
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
                <span className="at-eyebrow mb-3 block">
                  {t("wizard.step1.title")} · {t(category ?? "")}
                </span>
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
                  {t("wizard.brand.missing")}{" "}
                  <Link to="/$locale/devis" params={{ locale }} className="text-primary underline">
                    {t("wizard.requestQuote")}
                  </Link>
                </p>
              </>
            )}

            {/* 03 — Série / génération */}
            {step === 2 && (
              <>
                <span className="at-eyebrow mb-3 block">
                  {t("wizard.step2.title")} · {brand ? brandName(brand) : ""}
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
                          {s.from} – {s.to} ·{" "}
                          {t(s.count > 1 ? "wizard.models.plural" : "wizard.models.single", [
                            s.count,
                          ])}
                        </span>
                      </span>
                      <ChevronLeft className="size-3 rotate-180 text-primary" />
                    </button>
                  ))}
                  {seriesOfBrand.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      {t("wizard.models.onrequest")}{" "}
                      <Link
                        to="/$locale/devis"
                        params={{ locale }}
                        className="text-primary underline"
                      >
                        {t("wizard.requestQuote")}
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
                  {t("wizard.step3.title")} · {brand ? brandName(brand) : ""}{" "}
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
                          {f.from} – {f.to} ·{" "}
                          {t(f.count > 1 ? "wizard.models.plural" : "wizard.models.single", [
                            f.count,
                          ])}
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
                  {t("wizard.step4.title")} · {brand ? brandName(brand) : ""}{" "}
                  {series ? `· ${series}` : ""} {family ? `· ${family}` : ""}
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
                            {d.year} · {d.faults.length} {t("pannes")}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                  {models.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      {t("wizard.models.onrequest")}{" "}
                      <Link
                        to="/$locale/devis"
                        params={{ locale }}
                        className="text-primary underline"
                      >
                        {t("wizard.requestQuote")}
                      </Link>
                    </p>
                  )}
                </div>
              </>
            )}

            {/* 06 — Pannes multi-sélection + description */}
            {step === 5 && device && (
              <>
                <span className="at-eyebrow mb-3 block">
                  {t("wizard.step5.title")} · {device.name}
                </span>
                <p className="mb-4 text-xs text-muted-foreground">{t("wizard.faults.hint")}</p>
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
                          {t(flt.label)}
                        </span>
                        <span className="font-mono text-xs text-primary">
                          {formatFcfa(flt.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <label htmlFor="at-desc" className="at-eyebrow mt-6 mb-2 block">
                  {t("wizard.description.label")}
                </label>
                <textarea
                  id="at-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("wizard.description.placeholder")}
                  className="w-full border border-border bg-background p-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
                  <p className="font-mono text-xs uppercase text-muted-foreground">
                    {t("wizard.fault.count", [faults.length])} ·{" "}
                    <span className="text-primary">
                      {total > 0
                        ? t("wizard.estimate", [formatFcfa(total)])
                        : t("wizard.free.diagnosis")}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="technical" size="sm">
                      <Link to="/$locale/appareil/$slug" params={{ locale, slug: device.slug }}>
                        {t("wizard.view.product")}
                      </Link>
                    </Button>
                    <Button
                      variant="primaryBlock"
                      size="sm"
                      disabled={faults.length === 0 && description.trim().length === 0}
                      onClick={() => setStep(6)}
                    >
                      {t("wizard.choose.slot")} <ArrowRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* 07 — Date & heure du rendez-vous */}
            {step === 6 && device && (
              <>
                <span className="at-eyebrow mb-3 block">{t("wizard.step6.title")}</span>
                <p className="mb-4 text-xs text-muted-foreground">{t("wizard.step6.hint")}</p>

                <div className="mb-2 flex items-center gap-2">
                  <Truck className="size-4 text-primary" strokeWidth={1.5} />
                  <span className="font-mono text-[10px] uppercase tracking-wider">
                    {t("wizard.deposit.mode")}
                  </span>
                </div>
                <div
                  role="radiogroup"
                  aria-label={t("wizard.deposit.mode")}
                  className="mb-6 grid gap-2 sm:grid-cols-2"
                >
                  {DEPOSIT_OPTIONS.map((o, i) => {
                    const on = mode === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        tabIndex={depositRadio.tabIndexFor(i)}
                        data-radio-index={i}
                        onKeyDown={depositRadio.handleKeyDown}
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
                          className={`flex size-4 shrink-0 items-center justify-center border ${
                            on ? "border-primary" : "border-border"
                          }`}
                        >
                          {on && <span className="size-2 bg-primary" />}
                        </span>
                        <span>
                          <span className="block text-sm font-bold tracking-tight">
                            {t(o.label)}
                          </span>
                          <span className="text-xs text-muted-foreground">{o.hint}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                {mode === "domicile" && (
                  <p className="-mt-4 mb-6 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t("wizard.domicile.hours")}
                  </p>
                )}

                <div className="mb-2 flex items-center gap-2">
                  <CalendarClock className="size-4 text-primary" strokeWidth={1.5} />
                  <span
                    id="ds-day-label"
                    className="font-mono text-[10px] uppercase tracking-wider"
                  >
                    {t("wizard.day")}
                  </span>
                </div>
                {availability.isLoading ? (
                  <p role="status" className="text-xs text-muted-foreground">
                    {t("wizard.availability.loading")}
                  </p>
                ) : dateKeys.length === 0 ? (
                  <p role="status" className="text-xs text-muted-foreground">
                    {t("wizard.availability.empty")}
                  </p>
                ) : (
                  <div
                    role="radiogroup"
                    aria-labelledby="ds-day-label"
                    className="flex flex-nowrap gap-2 overflow-x-auto pb-1"
                  >
                    {dateKeys.map((d, i) => {
                      const on = date === d;
                      const dt = new Date(`${d}T12:00:00`);
                      return (
                        <button
                          key={d}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          tabIndex={dayRadio.tabIndexFor(i)}
                          data-radio-index={i}
                          onKeyDown={dayRadio.handleKeyDown}
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
                            {dt.toLocaleDateString(locale, { weekday: "short" })}
                          </span>
                          <span className="block text-lg font-bold leading-tight">
                            {dt.getDate()}
                          </span>
                          <span className="block font-mono text-[10px] uppercase">
                            {dt.toLocaleDateString(locale, { month: "short" })}
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
                          {t("wizard.come.now")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t("wizard.come.now.hint")}
                        </span>
                      </span>
                      <Zap className="size-5 shrink-0 text-primary" strokeWidth={1.5} />
                    </button>
                  )}
                {comeNow && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border border-primary bg-primary/10 p-4">
                    <p className="text-sm font-bold">{t("wizard.come.now.immediate")}</p>
                    <button
                      type="button"
                      onClick={() => setComeNow(false)}
                      className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground underline hover:text-primary"
                    >
                      {t("wizard.cancel")}
                    </button>
                  </div>
                )}

                <div className="mt-6 mb-2 flex items-center gap-2">
                  <Clock className="size-4 text-primary" strokeWidth={1.5} />
                  <span className="font-mono text-[10px] uppercase tracking-wider">
                    {t("wizard.hour")}
                  </span>
                </div>
                {!date ? (
                  <p className="text-xs text-muted-foreground">
                    {t("wizard.hour.select.day.first")}
                  </p>
                ) : comeNow ? (
                  <p className="text-xs text-muted-foreground">
                    {t("wizard.come.now.opennow", [t("wizard.opennow.label")])}
                  </p>
                ) : availableHours.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {t("wizard.hour.none.left")}
                    {mode === "boutique" && isOpenNow() && date === toIsoDate(new Date())
                      ? t("wizard.hour.none.comeNow")
                      : ""}
                    .
                  </p>
                ) : (
                  <div
                    role="radiogroup"
                    aria-label={t("wizard.hour.aria")}
                    className="grid grid-cols-3 gap-2 sm:grid-cols-4"
                  >
                    {availableHours.map((h, i) => {
                      const on = hour === h;
                      const taken = availability.isHourTaken(date, h);
                      return (
                        <button
                          key={h}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          tabIndex={hourRadio.tabIndexFor(i)}
                          data-radio-index={i}
                          onKeyDown={hourRadio.handleKeyDown}
                          disabled={taken}
                          title={taken ? t("wizard.hour.taken") : undefined}
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
                      ? t("wizard.slot.today")
                      : date && hour
                        ? `${new Date(`${date}T12:00:00`).toLocaleDateString(locale, {
                            weekday: "long",
                            day: "2-digit",
                            month: "long",
                          })} · ${hour}`
                        : t("wizard.slot.none")}{" "}
                    ·{" "}
                    <span className="text-primary">
                      {total > 0
                        ? t("wizard.estimate", [formatFcfa(total)])
                        : t("wizard.free.diagnosis")}
                    </span>
                  </p>
                  <Button
                    variant="primaryBlock"
                    size="sm"
                    disabled={!date || (!hour && !comeNow)}
                    onClick={() => setStep(7)}
                  >
                    {comeNow ? t("wizard.come.now") : t("wizard.slot.book")}{" "}
                    <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              </>
            )}

            {/* 08 — Photos (optionnel) */}
            {step === 7 && device && (
              <>
                <span className="at-eyebrow mb-3 block">{t("wizard.step7.title")}</span>
                <p className="mb-4 text-xs text-muted-foreground">{t("wizard.photos.optional")}</p>

                <label
                  htmlFor="wizard-photos"
                  className="inline-flex cursor-pointer items-center gap-2 border border-dashed border-border px-4 py-3 text-sm hover:bg-surface"
                >
                  <ImagePlus className="size-4" />
                  {t("wizard.photos.select")}
                </label>
                <input
                  id="wizard-photos"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    e.target.value = "";
                    if (files.some((f) => f.size > MAX_PHOTO_BYTES)) {
                      toast.error(t("wizard.photos.max"));
                      return;
                    }
                    setPhotos((prev) => [...prev, ...files].slice(0, 3));
                  }}
                />

                {restoredPhotoCount > 0 && photos.length === 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {t("wizard.photos.restored", [restoredPhotoCount])}
                  </p>
                )}

                {photos.length > 0 && (
                  <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {photos.map((f, i) => (
                      <li
                        key={`${f.name}-${i}`}
                        className="relative overflow-hidden border border-border bg-surface"
                      >
                        <OptimizedImage
                          src={previewUrls[i]}
                          alt={t("wizard.photos.alt", [i + 1])}
                          aspectRatio="1/1"
                          className="w-full"
                        />
                        <button
                          type="button"
                          aria-label={t("wizard.photos.remove", [i + 1])}
                          onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                          className="absolute -right-1 -top-1 grid size-5 place-items-center bg-destructive text-xs text-white"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {photos.length > 0 && (
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t("wizard.photos.count", [photos.length])}
                  </p>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
                  <p className="font-mono text-xs uppercase text-muted-foreground">
                    {t("wizard.photos.title")}
                  </p>
                  <Button variant="primaryBlock" size="sm" onClick={() => setStep(8)}>
                    {t("wizard.photos.continue")} <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              </>
            )}

            {/* 09 — Coordonnées */}
            {step === 8 && device && (
              <>
                <button
                  type="button"
                  onClick={() => setStep(7)}
                  className="mb-4 flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary"
                >
                  <ChevronLeft className="size-3" /> {t(STEPS[7] ?? "")}
                </button>
                <ContactForm
                  defaultValues={contact}
                  submitLabel={t("wizard.summary.see")}
                  onValid={(c) => {
                    setContact(c);
                    setStep(9);
                  }}
                />
              </>
            )}

            {/* 10 — Récapitulatif */}
            {step === 9 && device && (
              <>
                <ReservationSummary
                  values={values}
                  immediate={comeNow}
                  submitting={submitting}
                  onEdit={() => setStep(8)}
                  onConfirm={() => void confirmReservation()}
                />
                <div className="mt-14">
                  <SectionHeader
                    eyebrow={t("wizard.after.eyebrow")}
                    title={t("wizard.after.title")}
                  />
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
                    <p className="text-sm font-bold">
                      {t("wizard.success.created", [ref as string])}
                    </p>
                    {trackingCode && (
                      <p className="mt-2">
                        <span className="at-eyebrow mb-1 block">
                          {t("wizard.success.tracking.code")}
                        </span>
                        <span className="inline-block border border-primary/50 bg-primary/10 px-3 py-1 font-mono text-sm font-bold tracking-[0.2em] text-primary">
                          {trackingCode}
                        </span>
                      </p>
                    )}
                    <p className="mt-3 text-sm text-muted-foreground">
                      {t("wizard.success.hint")}{" "}
                      <Link to="/mon-compte" className="text-primary underline">
                        {t("wizard.success.account")}
                      </Link>
                      {t("wizard.success.or")}{" "}
                      <Link
                        to="/$locale/suivi"
                        params={{ locale }}
                        search={{
                          ...(ref ? { ref } : {}),
                          ...(trackingCode ? { code: trackingCode } : {}),
                        }}
                        className="text-primary underline"
                      >
                        {t("nav.suivi")}
                      </Link>
                      {t("wizard.success.restart")}
                    </p>
                  </div>
                  <QrCode
                    value={`${window.location.origin}/${locale}/suivi?ref=${ref}${trackingCode ? `&code=${trackingCode}` : ""}`}
                    label={t("wizard.success.qr.label", [ref as string])}
                    caption={t("wizard.success.qr.caption")}
                  />
                </div>
                <div className="mt-6 border-t border-success/30 pt-4">
                  <p className="mb-3 text-sm font-semibold">{t("wizard.photos.title")}</p>
                  <p className="mb-3 text-xs text-muted-foreground">{t("wizard.photos.hint")}</p>
                  <label
                    htmlFor="photo-upload"
                    className="inline-flex cursor-pointer items-center gap-2 border border-dashed border-border px-4 py-3 text-sm hover:bg-surface"
                  >
                    <ImagePlus className="size-4" />
                    {t("wizard.photos.add")}
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
                        <div
                          key={i}
                          className="relative size-16 border border-border bg-surface"
                        >
                          <OptimizedImage
                            src={previewUrls[i]}
                            alt={t("wizard.photos.alt", [i + 1])}
                            aspectRatio="1/1"
                          />
                          <button
                            type="button"
                            onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                            className="absolute -right-2 -top-2 size-5 bg-destructive text-xs text-white"
                            aria-label={t("wizard.photos.remove", [i + 1])}
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
                      disabled={uploading || autoUploadStatus === "uploading" || !trackingCode}
                      onClick={async () => {
                        setUploading(true);
                        try {
                          const ok: string[] = [];
                          for (const file of photos) {
                            try {
                              const prepared = await getPhotoUpload({
                                data: {
                                  reference: ref as string,
                                  code: trackingCode as string,
                                  fileName: file.name,
                                  contentType: file.type,
                                  fileSize: file.size,
                                },
                              });
                              const res = await fetch(prepared.signedUrl, {
                                method: "PUT",
                                headers: {
                                  "Content-Type": file.type,
                                  "x-upsert": "false",
                                },
                                body: file,
                              });
                              if (!res.ok) throw new Error(`Upload ${res.status}`);
                              ok.push(prepared.path);
                            } catch {
                              toast.error(t("wizard.photos.upload.error.file", [file.name]));
                            }
                          }
                          setPhotoUrls(ok);
                          setPhotos([]);
                          toast.success(t("wizard.photos.upload.success", [ok.length]));
                        } catch {
                          toast.error(t("wizard.photos.upload.error"));
                        } finally {
                          setUploading(false);
                        }
                      }}
                    >
                      {uploading ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <ImagePlus className="mr-2 size-4" />
                      )}
                      {uploading
                        ? t("wizard.photos.uploading")
                        : t("wizard.photos.send", [photos.length])}
                    </Button>
                  )}
                  {photoUrls.length > 0 && (
                    <p className="mt-2 text-xs text-success">
                      {t("wizard.photos.sent.success", [photoUrls.length])}
                    </p>
                  )}
                  {autoUploadStatus === "uploading" && (
                    <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="size-3 animate-spin" />
                      {t("wizard.photos.uploading")}
                    </p>
                  )}
                  {autoUploadStatus === "done" && (
                    <p className="mt-2 text-xs text-success">
                      {t("wizard.photos.uploaded", [autoUploadCounts.ok])}
                    </p>
                  )}
                  {(autoUploadStatus === "partial" || autoUploadStatus === "failed") && (
                    <p className="mt-2 text-xs text-destructive">{t("wizard.photos.failed")}</p>
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
