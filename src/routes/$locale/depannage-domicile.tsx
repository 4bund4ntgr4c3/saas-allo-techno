import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Sparkles,
  Laptop,
  Wifi,
  Wrench,
  Zap,
  MapPin,
  Calendar,
  Clock,
  Phone,
  ArrowLeft,
  Check,
  Pencil,
  HardDrive,
  Cpu,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PageBreadcrumb } from "@/components/site/PageBreadcrumb";
import { bookHomeRepairFn } from "@/lib/home-repair-booking.functions";
import { normalizeLocale, type Locale } from "@/lib/i18n/locales";
import { localeSeo } from "@/lib/seo";
import { formatFcfa, COMPANY } from "@/data/catalog/company";

export const Route = createFileRoute("/$locale/depannage-domicile")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const seo = localeSeo(locale, "/services");
    return {
      meta: [
        { title: "Dépannage Informatique VIP à Domicile & sur Site — Allô Techno" },
        {
          name: "description",
          content:
            "Un technicien informatique qualifié chez vous en 1h avec sa mallette d'intervention à Cotonou, Haie Vive et Calavi.",
        },
        ...seo.meta,
      ],
      links: [...seo.links],
    };
  },
  component: HomeRepairBookingPage,
});

// Zones d'intervention et frais de déplacement
const INTERVENTION_ZONES = [
  {
    id: "Cotonou Centre",
    label: "Cotonou Centre",
    description: "Ganhi, St Michel, Gbégamey, Cadjèhoun",
    fee: 5000,
    eta: "30 - 45 min",
  },
  {
    id: "Haie Vive / Les Cocotiers",
    label: "Haie Vive / Cocotiers",
    description: "Aéroport, Zone Résidentielle, Patte d'Oie",
    fee: 5000,
    eta: "30 - 45 min",
  },
  {
    id: "Akpakpa / PK10",
    label: "Akpakpa / PK10",
    description: "Sènadé, Avotrou, PK10, Sèmè-Kpodji",
    fee: 6000,
    eta: "45 - 60 min",
  },
  {
    id: "Abomey-Calavi",
    label: "Abomey-Calavi",
    description: "Godomey, Arconville, Zogbadjè, IITA",
    fee: 7000,
    eta: "45 - 60 min",
  },
  {
    id: "Porto-Novo",
    label: "Porto-Novo & Environs",
    description: "Capitale & zones périphériques",
    fee: 10000,
    eta: "60 - 90 min",
  },
];

// Types d'équipements & prestations
const SERVICE_PRESETS = [
  {
    id: "ecran_ssd",
    title: "Écran cassé / Upgrade SSD",
    subtitle: "Remplacement dalle, booster la vitesse avec SSD",
    icon: Laptop,
    estimatedBase: 25000,
    category: "Matériel",
  },
  {
    id: "panne_logicielle",
    title: "PC Bloqué / Virus / Windows",
    subtitle: "Écran bleu, lenteur extrême, réinstallation propre",
    icon: Cpu,
    estimatedBase: 15000,
    category: "Système",
  },
  {
    id: "reseau_wifi",
    title: "Wi-Fi, Box Fibre & Imprimante",
    subtitle: "Connexion instable, imprimante réseau, partage",
    icon: Wifi,
    estimatedBase: 18000,
    category: "Réseau",
  },
  {
    id: "maintenance_complete",
    title: "Entretien VIP & Dépoussiérage",
    subtitle: "Changement pâte thermique, nettoyage circuits",
    icon: Sparkles,
    estimatedBase: 12000,
    category: "Maintenance",
  },
  {
    id: "batterie_charge",
    title: "Batterie & Alimentation",
    subtitle: "Ne charge plus, connecteur dessoudé, surchauffe",
    icon: Zap,
    estimatedBase: 20000,
    category: "Alimentation",
  },
  {
    id: "recuperation_donnees",
    title: "Récupération Données Urgence",
    subtitle: "Disque non reconnu, fichiers supprimés, clé USB",
    icon: HardDrive,
    estimatedBase: 25000,
    category: "Données",
  },
];

// Créneaux horaires
const TIME_SLOTS = [
  {
    id: "Matin (08h - 12h)",
    label: "Matin",
    hours: "08h00 - 12h00",
    surcharge: 0,
    tag: "Standard",
  },
  {
    id: "Après-midi (14h - 18h)",
    label: "Après-midi",
    hours: "14h00 - 18h00",
    surcharge: 0,
    tag: "Recommandé",
  },
  {
    id: "Urgence Express (1h)",
    label: "Urgence Express (1h)",
    hours: "Arrivée < 60 min",
    surcharge: 3000,
    tag: "Astreinte VIP",
  },
];

type WizardStep = 1 | 2 | 3 | 4;

function HomeRepairBookingPage() {
  const formTopRef = React.useRef<HTMLDivElement>(null);
  const [step, setStep] = React.useState<WizardStep>(1);

  // Form states with realistic defaults
  const [customerName, setCustomerName] = React.useState("Directeur Général");
  const [phone, setPhone] = React.useState("97000000");
  const [zone, setZone] = React.useState("Cotonou Centre");
  const [addressDetails, setAddressDetails] = React.useState(
    "Quartier Haie Vive, Rue 124, 2e étage",
  );
  const [issueType, setIssueType] = React.useState("ecran_ssd");
  const [customNotes, setCustomNotes] = React.useState("");
  const [deviceModel, setDeviceModel] = React.useState("Ordinateur Portable");
  const [preferredTimeSlot, setPreferredTimeSlot] = React.useState("Matin (08h - 12h)");

  // Date helper (defaults to today)
  const todayStr = React.useMemo(() => new Date().toISOString().slice(0, 10), []);
  const tomorrowStr = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);
  const [preferredDate, setPreferredDate] = React.useState(todayStr);
  const [paymentMethod, setPaymentMethod] = React.useState<"momo" | "flooz" | "celtiis" | "cash">(
    "momo",
  );

  const [loading, setLoading] = React.useState(false);
  const [bookingResult, setBookingResult] = React.useState<{
    bookingId: string;
    message: string;
  } | null>(null);

  // Dynamic pricing calculations
  const selectedZoneObj = INTERVENTION_ZONES.find((z) => z.id === zone) || INTERVENTION_ZONES[0]!;
  const selectedServiceObj = SERVICE_PRESETS.find((s) => s.id === issueType) || SERVICE_PRESETS[0]!;
  const selectedSlotObj = TIME_SLOTS.find((s) => s.id === preferredTimeSlot) || TIME_SLOTS[0]!;

  const travelFee = selectedZoneObj.fee;
  const expressSurcharge = selectedSlotObj.surcharge;
  const estimatedServiceCost = selectedServiceObj.estimatedBase;
  const totalEstimatedCost = travelFee + expressSurcharge + estimatedServiceCost;

  // Auto-scroll to top of form when step changes
  const prevStepRef = React.useRef(step);
  React.useEffect(() => {
    if (prevStepRef.current !== step) {
      prevStepRef.current = step;
      if (formTopRef.current) {
        formTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [step]);

  const validateStep1 = () => {
    return Boolean(issueType);
  };

  const validateStep2 = () => {
    return (
      customerName.trim().length >= 2 &&
      phone.trim().length >= 8 &&
      addressDetails.trim().length >= 5
    );
  };

  const validateStep3 = () => {
    return Boolean(preferredDate) && Boolean(preferredTimeSlot);
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) setStep(4);
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as WizardStep);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await bookHomeRepairFn({
        data: {
          customerName,
          phone,
          zone,
          addressDetails: `${addressDetails}${customNotes ? ` (Détails: ${customNotes})` : ""}${deviceModel ? ` [Appareil: ${deviceModel}]` : ""}`,
          issueType,
          preferredDate,
          preferredTimeSlot,
        },
      });
      if (res.success) {
        setBookingResult({ bookingId: res.bookingId, message: res.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "—";
    if (dateStr === todayStr) return "Aujourd'hui";
    if (dateStr === tomorrowStr) return "Demain";
    try {
      const [y = 0, m = 1, d = 1] = dateStr.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* ─── Hero Header ─── */}
      <section className="border-b border-border py-10 bg-surface/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="at-eyebrow text-primary font-bold">
                Techniciens Mobiles en Astreinte
              </span>
            </div>
            <PageBreadcrumb items={[{ label: "Dépannage à Domicile" }]} />
          </div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="at-display text-3xl sm:text-5xl font-extrabold text-foreground">
                Dépannage VIP sur Site &amp; à Domicile
              </h1>
              <p className="mt-2.5 text-sm sm:text-base text-muted-foreground max-w-2xl">
                Un technicien certifié Allô Techno intervient directement chez vous ou dans vos
                bureaux avec sa mallette d'intervention complète en 1h.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-card border border-border px-4 py-2.5 shrink-0 self-start md:self-auto">
              <ShieldCheck className="size-5 text-emerald-600" />
              <div className="text-xs">
                <span className="font-bold block text-foreground">Garantie 90 Jours</span>
                <span className="text-muted-foreground text-[11px]">Pièces &amp; Main d'œuvre</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Main Content Container ─── */}
      <div ref={formTopRef} className="mx-auto max-w-6xl px-4 sm:px-6 mt-8 scroll-mt-24">
        {bookingResult ? (
          /* ─── Success Confirmation Screen ─── */
          <div className="max-w-2xl mx-auto border border-emerald-600/30 bg-card p-6 sm:p-10 text-center space-y-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="size-16 rounded-full bg-emerald-600/10 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-600/5">
              <CheckCircle2 className="size-9" />
            </div>
            <div className="space-y-2">
              <span className="at-eyebrow text-emerald-600 font-bold">Intervention Validée</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Demande VIP Enregistrée avec Succès !
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
                {bookingResult.message}
              </p>
            </div>

            {/* Ticket Card Details */}
            <div className="border border-border bg-surface p-5 text-left text-xs space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-muted-foreground uppercase">Référence Dossier</span>
                <span className="font-bold text-primary text-sm">{bookingResult.bookingId}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-muted-foreground block">Client / Société</span>
                  <span className="font-bold text-foreground">{customerName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Téléphone</span>
                  <span className="font-bold text-foreground">{phone}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Zone &amp; Adresse</span>
                  <span className="font-bold text-foreground">
                    {zone} — {addressDetails}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Date &amp; Heure</span>
                  <span className="font-bold text-foreground">
                    {formatDateDisplay(preferredDate)} ({preferredTimeSlot})
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Prestation</span>
                  <span className="font-bold text-foreground">{selectedServiceObj.title}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Total Estimé TTC</span>
                  <span className="font-bold text-primary">{formatFcfa(totalEstimatedCost)}</span>
                </div>
              </div>
            </div>

            {/* Protocol steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
              <div className="p-3 bg-surface border border-border text-xs">
                <div className="flex items-center gap-2 font-bold text-foreground mb-1">
                  <span className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">
                    1
                  </span>
                  Appel sous 15 min
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Le régulateur d'astreinte confirme les pièces à embarquer.
                </p>
              </div>
              <div className="p-3 bg-surface border border-border text-xs">
                <div className="flex items-center gap-2 font-bold text-foreground mb-1">
                  <span className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">
                    2
                  </span>
                  Arrivée sur Site
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Le technicien arrive avec sa mallette complète antistatique.
                </p>
              </div>
              <div className="p-3 bg-surface border border-border text-xs">
                <div className="flex items-center gap-2 font-bold text-foreground mb-1">
                  <span className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">
                    3
                  </span>
                  Test &amp; Paiement
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Règlement direct MoMo/Espèces après validation des tests.
                </p>
              </div>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="primaryBlock" className="text-xs font-bold uppercase">
                <a
                  href={`https://wa.me/2290143679767?text=${encodeURIComponent(
                    `Bonjour Allô Techno, je confirme ma réservation d'intervention VIP à domicile N° ${bookingResult.bookingId} pour ${customerName} à ${zone} (${addressDetails}) le ${preferredDate} (${preferredTimeSlot}). Prestation : ${selectedServiceObj.title}.`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Phone className="size-4 mr-2" />
                  Confirmer sur WhatsApp &rarr;
                </a>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setBookingResult(null);
                  setStep(1);
                }}
                className="text-xs"
              >
                Nouvelle Réservation
              </Button>
            </div>
          </div>
        ) : (
          /* ─── 2-Column Responsive Layout: Wizard (Left) + Live Summary Card (Right) ─── */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ─── Left Column: Wizard ─── */}
            <div className="lg:col-span-7 space-y-6">
              {/* Stepper Progress Bar */}
              <div className="border border-border bg-card p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="font-mono font-bold uppercase tracking-wider text-muted-foreground">
                    Étape {step} sur 4
                  </span>
                  <span className="font-mono text-primary font-bold text-[11px]">
                    {step === 1 && "1. Diagnostic & Panne"}
                    {step === 2 && "2. Localisation & Contact"}
                    {step === 3 && "3. Date & Créneau"}
                    {step === 4 && "4. Confirmation VIP"}
                  </span>
                </div>

                {/* Progress Indicators */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { s: 1, label: "Panne", icon: Wrench },
                    { s: 2, label: "Lieu", icon: MapPin },
                    { s: 3, label: "Créneau", icon: Calendar },
                    { s: 4, label: "Validation", icon: CheckCheck },
                  ].map((item) => {
                    const isCompleted = step > item.s;
                    const isCurrent = step === item.s;
                    return (
                      <button
                        key={item.s}
                        type="button"
                        onClick={() => {
                          if (item.s < step) setStep(item.s as WizardStep);
                        }}
                        disabled={item.s > step}
                        className={`flex items-center gap-2 p-2 text-left border transition-all ${
                          isCurrent
                            ? "border-primary bg-primary/10 text-primary font-bold"
                            : isCompleted
                              ? "border-emerald-600/40 bg-emerald-600/5 text-emerald-600 cursor-pointer hover:border-emerald-600"
                              : "border-border bg-surface text-muted-foreground/50 opacity-70 cursor-not-allowed"
                        }`}
                      >
                        <div
                          className={`size-6 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 ${
                            isCurrent
                              ? "bg-primary text-primary-foreground font-bold"
                              : isCompleted
                                ? "bg-emerald-600 text-white font-bold"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isCompleted ? <Check className="size-3.5" /> : item.s}
                        </div>
                        <span className="hidden sm:inline text-xs font-semibold truncate">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Wizard Form Container */}
              <form
                onSubmit={handleSubmit}
                className="border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6"
              >
                {/* ═══════════ STEP 1: PANNE & MATÉRIEL ═══════════ */}
                {step === 1 && (
                  <div className="space-y-6 animate-in fade-in-50 duration-300">
                    <div>
                      <span className="at-eyebrow text-primary mb-1 block">
                        Étape 1 · Diagnostic Initial
                      </span>
                      <h2 className="text-xl font-bold text-foreground">
                        Quel type de problème rencontrez-vous ?
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        Sélectionnez la prestation principale. Le technicien emportera les outils et
                        pièces adaptés.
                      </p>
                    </div>

                    {/* Service Preset Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {SERVICE_PRESETS.map((preset) => {
                        const Icon = preset.icon;
                        const isSelected = issueType === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setIssueType(preset.id)}
                            className={`p-3.5 border text-left flex items-start gap-3.5 transition-all duration-150 relative cursor-pointer ${
                              isSelected
                                ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary shadow-xs"
                                : "border-border bg-surface hover:border-foreground/30 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <div
                              className={`p-2 shrink-0 ${
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-card text-muted-foreground border border-border"
                              }`}
                            >
                              <Icon className="size-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-xs text-foreground block truncate">
                                  {preset.title}
                                </span>
                                {isSelected && (
                                  <span className="size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] shrink-0">
                                    ✓
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                                {preset.subtitle}
                              </p>
                              <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
                                <span className="text-muted-foreground">Est. dès</span>
                                <span className="text-primary font-bold">
                                  {formatFcfa(preset.estimatedBase)}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Modèle de l'appareil */}
                    <div className="pt-2 border-t border-border space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1.5">
                          Modèle ou marque de votre appareil (optionnel) :
                        </label>
                        <Input
                          value={deviceModel}
                          onChange={(e) => setDeviceModel(e.target.value)}
                          placeholder="ex: MacBook Pro M2, Dell XPS 15, HP EliteBook, PC Gamer Asus..."
                          className="text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1.5">
                          Précisez les symptômes ou messages d'erreur :
                        </label>
                        <Textarea
                          value={customNotes}
                          onChange={(e) => setCustomNotes(e.target.value)}
                          placeholder="ex: L'écran s'éteint après 5 minutes de chauffe, bruit anormal du ventilateur..."
                          className="text-xs resize-none"
                          rows={2}
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="button"
                        onClick={handleNext}
                        variant="technical"
                        className="w-full font-bold uppercase tracking-wider text-xs h-11"
                      >
                        Continuer vers la Localisation VIP &rarr;
                      </Button>
                    </div>
                  </div>
                )}

                {/* ═══════════ STEP 2: LOCALISATION & CONTACT ═══════════ */}
                {step === 2 && (
                  <div className="space-y-6 animate-in fade-in-50 duration-300">
                    <div>
                      <span className="at-eyebrow text-primary mb-1 block">
                        Étape 2 · Adresse &amp; Coordonnées
                      </span>
                      <h2 className="text-xl font-bold text-foreground">
                        Où devons-nous envoyer le technicien ?
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        Indiquez votre zone d'intervention pour calculer les frais de déplacement
                        transparents.
                      </p>
                    </div>

                    {/* Zone Selector */}
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-2">
                        Zone géographique d'intervention :
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {INTERVENTION_ZONES.map((z) => {
                          const isSelected = zone === z.id;
                          return (
                            <button
                              key={z.id}
                              type="button"
                              onClick={() => setZone(z.id)}
                              className={`p-3 border text-left flex flex-col justify-between transition-all cursor-pointer ${
                                isSelected
                                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                                  : "border-border bg-surface hover:border-foreground/30 text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-xs text-foreground">{z.label}</span>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] font-mono ${
                                    isSelected
                                      ? "border-primary text-primary font-bold"
                                      : "border-border text-muted-foreground"
                                  }`}
                                >
                                  {formatFcfa(z.fee)}
                                </Badge>
                              </div>
                              <span className="text-[11px] text-muted-foreground line-clamp-1">
                                {z.description}
                              </span>
                              <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-emerald-600">
                                <Clock className="size-3" />
                                <span>Arrivée est. : {z.eta}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1">
                          Nom complet / Nom de l'Entreprise :
                        </label>
                        <Input
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="ex: Dr. Dossou / Cabinet Juridique Alpha"
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1">
                          Numéro WhatsApp / Téléphone :
                        </label>
                        <Input
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="ex: 97 00 00 00"
                          className="text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">
                        Adresse précise, repères GPS &amp; étage :
                      </label>
                      <Input
                        required
                        value={addressDetails}
                        onChange={(e) => setAddressDetails(e.target.value)}
                        placeholder="ex: Rue 124 Haie Vive, Immeuble vitré bleu, 2e étage Porte A4"
                        className="text-xs"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePrev}
                        className="w-1/3 text-xs"
                      >
                        <ArrowLeft className="size-3.5 mr-1" /> Retour
                      </Button>
                      <Button
                        type="button"
                        onClick={handleNext}
                        disabled={!validateStep2()}
                        variant="technical"
                        className="w-2/3 font-bold uppercase tracking-wider text-xs h-11"
                      >
                        Continuer vers le Créneau &rarr;
                      </Button>
                    </div>
                  </div>
                )}

                {/* ═══════════ STEP 3: DATE & CRÉNEAU HORAIRE ═══════════ */}
                {step === 3 && (
                  <div className="space-y-6 animate-in fade-in-50 duration-300">
                    <div>
                      <span className="at-eyebrow text-primary mb-1 block">
                        Étape 3 · Planification
                      </span>
                      <h2 className="text-xl font-bold text-foreground">
                        Quand souhaitez-vous l'intervention ?
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        Choisissez la date et le créneau idéal pour recevoir notre technicien avec
                        sa mallette.
                      </p>
                    </div>

                    {/* Quick Date Pills */}
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-2">
                        Sélection rapide du jour :
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "Aujourd'hui", val: todayStr },
                          { label: "Demain", val: tomorrowStr },
                          { label: "Date libre", val: preferredDate },
                        ].map((d, i) => {
                          const isSelected =
                            i < 2
                              ? preferredDate === d.val
                              : preferredDate !== todayStr && preferredDate !== tomorrowStr;
                          return (
                            <button
                              key={d.label}
                              type="button"
                              onClick={() => {
                                if (d.val) setPreferredDate(d.val);
                              }}
                              className={`p-2.5 border text-center font-bold text-xs transition-all cursor-pointer ${
                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground shadow-xs"
                                  : "border-border bg-surface text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {d.label}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-3">
                        <label className="text-[11px] text-muted-foreground block mb-1 font-mono">
                          Ou choisir une date spécifique dans le calendrier :
                        </label>
                        <Input
                          type="date"
                          required
                          value={preferredDate}
                          min={todayStr}
                          onChange={(e) => setPreferredDate(e.target.value)}
                          className="text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    {/* Time Slot Selection */}
                    <div className="pt-2 border-t border-border">
                      <label className="text-xs font-semibold text-foreground block mb-2">
                        Créneau horaire d'intervention :
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {TIME_SLOTS.map((slot) => {
                          const isSelected = preferredTimeSlot === slot.id;
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => setPreferredTimeSlot(slot.id)}
                              className={`p-3.5 border text-left flex flex-col justify-between transition-all cursor-pointer ${
                                isSelected
                                  ? "border-primary bg-primary/5 ring-1 ring-primary text-foreground"
                                  : "border-border bg-surface hover:border-foreground/30 text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-xs">{slot.label}</span>
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] font-mono ${
                                    slot.surcharge > 0
                                      ? "border-amber-500 text-amber-600 bg-amber-500/10 font-bold"
                                      : "border-border text-muted-foreground"
                                  }`}
                                >
                                  {slot.tag}
                                </Badge>
                              </div>
                              <span className="font-mono text-[11px] text-muted-foreground">
                                {slot.hours}
                              </span>
                              <div className="mt-2 text-[10px] font-mono">
                                {slot.surcharge > 0 ? (
                                  <span className="text-amber-600 font-bold">
                                    +{formatFcfa(slot.surcharge)} (Urgence)
                                  </span>
                                ) : (
                                  <span className="text-emerald-600">Sans supplément</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Security & Tooling info */}
                    <div className="p-3 bg-surface border border-border text-[11px] text-muted-foreground flex items-center gap-2.5">
                      <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                      <span>
                        Le technicien mobile transporte : station de soudure portable, testeur
                        d'alimentation, SSD neufs certifiés et outillage iFixit.
                      </span>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePrev}
                        className="w-1/3 text-xs"
                      >
                        <ArrowLeft className="size-3.5 mr-1" /> Retour
                      </Button>
                      <Button
                        type="button"
                        onClick={handleNext}
                        disabled={!validateStep3()}
                        variant="technical"
                        className="w-2/3 font-bold uppercase tracking-wider text-xs h-11"
                      >
                        Vérifier &amp; Récapituler &rarr;
                      </Button>
                    </div>
                  </div>
                )}

                {/* ═══════════ STEP 4: RÉCAPITULATIF & VALIDATION ═══════════ */}
                {step === 4 && (
                  <div className="space-y-6 animate-in fade-in-50 duration-300">
                    <div>
                      <span className="at-eyebrow text-primary mb-1 block">
                        Étape 4 · Validation Finale
                      </span>
                      <h2 className="text-xl font-bold text-foreground">
                        Confirmez votre demande d'intervention VIP
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        Vérifiez les informations avant validation. Aucun paiement immédiat n'est
                        exigé en ligne.
                      </p>
                    </div>

                    {/* Summary Review Grid */}
                    <div className="border border-border bg-surface p-4 space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <div className="flex items-center gap-2">
                          <Wrench className="size-4 text-primary" />
                          <span className="font-bold text-foreground">Prestation demandée</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setStep(1)}
                          className="h-6 px-2 text-[10px] text-primary"
                        >
                          <Pencil className="size-3 mr-1" /> Modifier
                        </Button>
                      </div>
                      <div className="pl-6 space-y-1">
                        <p className="font-bold text-foreground">{selectedServiceObj.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {deviceModel} {customNotes ? `— ${customNotes}` : ""}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-b border-border pt-2 pb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="size-4 text-primary" />
                          <span className="font-bold text-foreground">Lieu d'intervention</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setStep(2)}
                          className="h-6 px-2 text-[10px] text-primary"
                        >
                          <Pencil className="size-3 mr-1" /> Modifier
                        </Button>
                      </div>
                      <div className="pl-6 space-y-1">
                        <p className="font-bold text-foreground">
                          {customerName} ({phone})
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {zone} — {addressDetails}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-b border-border pt-2 pb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="size-4 text-primary" />
                          <span className="font-bold text-foreground">Date &amp; Horaire</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setStep(3)}
                          className="h-6 px-2 text-[10px] text-primary"
                        >
                          <Pencil className="size-3 mr-1" /> Modifier
                        </Button>
                      </div>
                      <div className="pl-6 space-y-1">
                        <p className="font-bold text-foreground">
                          {formatDateDisplay(preferredDate)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{preferredTimeSlot}</p>
                      </div>
                    </div>

                    {/* Payment on-site choice */}
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-2">
                        Mode de règlement souhaité sur place (après test de conformité) :
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: "momo", label: "MTN MoMo" },
                          { id: "flooz", label: "Moov Flooz" },
                          { id: "celtiis", label: "Celtiis Cash" },
                          { id: "cash", label: "Espèces" },
                        ].map((pay) => (
                          <button
                            key={pay.id}
                            type="button"
                            onClick={() =>
                              setPaymentMethod(pay.id as "momo" | "flooz" | "celtiis" | "cash")
                            }
                            className={`p-2.5 border text-center font-bold text-xs transition-all cursor-pointer ${
                              paymentMethod === pay.id
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-surface text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {pay.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePrev}
                        className="w-1/3 text-xs"
                      >
                        <ArrowLeft className="size-3.5 mr-1" /> Retour
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        variant="primaryBlock"
                        className="w-2/3 font-extrabold uppercase tracking-wider text-xs h-11"
                      >
                        {loading ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                        {loading ? "Validation VIP en cours..." : "Confirmer mon Intervention VIP"}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* ─── Right Column: Dynamic Live Summary Card ─── */}
            <aside className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
              <div className="border border-border bg-card p-6 shadow-sm space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <span className="at-eyebrow text-primary block">Récapitulatif en Direct</span>
                    <h3 className="font-bold text-base text-foreground">Votre Ordre de Mission</h3>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono border-emerald-600/40 text-emerald-600 bg-emerald-600/5"
                  >
                    Service VIP
                  </Badge>
                </div>

                {/* Prestation Snapshot */}
                <div className="p-3 bg-surface border border-border space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-mono text-[10px] uppercase">
                      Service Sélectionné
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep(1)}
                      className="h-5 px-1 text-[10px] text-primary hover:bg-transparent"
                    >
                      <Pencil className="size-2.5 mr-1" /> Changer
                    </Button>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-primary/10 text-primary shrink-0">
                      {React.createElement(selectedServiceObj.icon, { className: "size-4" })}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-foreground block truncate">
                        {selectedServiceObj.title}
                      </span>
                      <span className="text-[11px] text-muted-foreground block truncate">
                        {deviceModel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Zone & Time Snapshot */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-surface border border-border space-y-1">
                    <span className="text-muted-foreground font-mono text-[10px] uppercase block">
                      Zone d'intervention
                    </span>
                    <span className="font-bold text-foreground block truncate">
                      {selectedZoneObj.label}
                    </span>
                    <span className="text-[10px] font-mono text-primary">
                      {formatFcfa(travelFee)}
                    </span>
                  </div>
                  <div className="p-3 bg-surface border border-border space-y-1">
                    <span className="text-muted-foreground font-mono text-[10px] uppercase block">
                      Créneau Souhaité
                    </span>
                    <span className="font-bold text-foreground block truncate">
                      {formatDateDisplay(preferredDate)}
                    </span>
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {preferredTimeSlot}
                    </span>
                  </div>
                </div>

                {/* Pricing Breakdown */}
                <div className="space-y-2 border-t border-border pt-4 text-xs font-mono">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Frais de déplacement ({selectedZoneObj.label})</span>
                    <span className="font-bold text-foreground">{formatFcfa(travelFee)}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Diagnostic &amp; Devis sur site</span>
                    <span className="text-emerald-600 font-bold">Inclus (0 FCFA)</span>
                  </div>
                  {expressSurcharge > 0 && (
                    <div className="flex items-center justify-between text-amber-600">
                      <span>Supplément Urgence Express (&lt; 1h)</span>
                      <span className="font-bold">+{formatFcfa(expressSurcharge)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Forfait intervention estimé</span>
                    <span>~{formatFcfa(estimatedServiceCost)}</span>
                  </div>

                  {/* Total Bar */}
                  <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                    <span className="font-bold text-foreground uppercase tracking-tight">
                      Total Estimé TTC
                    </span>
                    <span className="font-extrabold text-lg text-primary">
                      {formatFcfa(totalEstimatedCost)}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-sans leading-tight pt-1">
                    * Règlement direct au technicien après réparation et tests complets. Aucuns
                    frais cachés.
                  </p>
                </div>

                {/* Trust Guarantees */}
                <div className="space-y-2 border-t border-border pt-4 text-[11px]">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check className="size-3.5 text-emerald-600 shrink-0" />
                    <span>Mallette d'intervention complète &amp; pièces certifiées</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check className="size-3.5 text-emerald-600 shrink-0" />
                    <span>Garantie 90 jours pièces et main-d'œuvre</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check className="size-3.5 text-emerald-600 shrink-0" />
                    <span>Facture normalisée disponible avec NPI</span>
                  </div>
                </div>

                {/* Hotline assistance */}
                <div className="bg-surface p-3 border border-border flex items-center justify-between text-xs">
                  <div>
                    <span className="text-muted-foreground text-[10px] block">
                      Une question urgente ?
                    </span>
                    <span className="font-bold text-foreground">{COMPANY.phone}</span>
                  </div>
                  <Button asChild variant="outline" size="sm" className="text-[11px] h-7 px-2.5">
                    <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}>Appeler</a>
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
