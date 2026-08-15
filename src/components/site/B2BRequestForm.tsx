import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import {
  Building2,
  CheckCircle2,
  Download,
  Edit3,
  FileCheck,
  Loader2,
  MessageSquare,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { submitB2BLead } from "@/lib/leads.functions";
import { COMPANY, formatFcfa } from "@/data/catalog/company";

export type B2BNeedType = "preventive" | "curative" | "contract" | "audit";
export type SlaFormulaType = "essentiel" | "business" | "custom";

interface B2BNeedConfig {
  id: B2BNeedType;
  title: string;
  desc: string;
  icon: typeof Wrench;
  tag: string;
}

const NEED_TYPES: B2BNeedConfig[] = [
  {
    id: "contract",
    title: "Souscription Contrat SLA",
    desc: "Abonnement mensuel de maintenance globale (Essentiel, Business).",
    icon: FileCheck,
    tag: "Formule Forfaitaire",
  },
  {
    id: "preventive",
    title: "Maintenance Préventive",
    desc: "Révisions planifiées, entretien régulier et dépoussiérage du parc.",
    icon: ShieldCheck,
    tag: "Recommandé pro",
  },
  {
    id: "curative",
    title: "Dépannage d'Urgence / Curatif",
    desc: "Intervention rapide sur équipement en panne ou bloquant.",
    icon: ShieldAlert,
    tag: "Intervention < 2h",
  },
  {
    id: "audit",
    title: "Audit & Renouvellement Parc",
    desc: "Inventaire complet, état du matériel et reconditionné pro.",
    icon: Building2,
    tag: "Diagnostic gratuit",
  },
];

const SLA_FORMULAS = [
  {
    id: "essentiel" as SlaFormulaType,
    name: "Formule ESSENTIEL SLA",
    desc: "Révisions trimestrielles, support dédié & SLA intervention < 24h.",
    badge: "Populaire PME",
  },
  {
    id: "business" as SlaFormulaType,
    name: "Formule BUSINESS SLA",
    desc: "Support 24/7 prioritaire, SLA < 2h & Prêt de matériel de secours garanti.",
    badge: "Priorité Absolue",
  },
  {
    id: "custom" as SlaFormulaType,
    name: "Sur-Mesure / Multi-sites",
    desc: "Parcs > 50 équipements, agences multiples ou exigences VIP.",
    badge: "Sur Devis B2B",
  },
];

const FLEET_SIZES = ["1-5 équipements", "6-15 équipements", "16-50 équipements", "50+ équipements"];
const EQUIPMENT_TYPES = [
  "Laptops / PC",
  "Serveurs",
  "Imprimantes",
  "Réseau / Switch",
  "Smartphones / Tablettes",
];
const URGENCY_LEVELS = [
  { id: "urgent", label: "Urgent (Intervention < 24h)" },
  { id: "48h", label: "Sous 48 heures" },
  { id: "planned", label: "Planifié ce mois-ci" },
];

export const PREVENTIVE_PERIODS = [
  {
    id: "2m",
    shortLabel: "2 mois",
    label: "2 mois (Bimensuel)",
    ratePerDevice: 6500,
    desc: "Passage tous les 2 mois",
  },
  {
    id: "3m",
    shortLabel: "3 mois",
    label: "3 mois (Trimestriel)",
    ratePerDevice: 8000,
    desc: "Passage trimestriel recommandé",
  },
  {
    id: "6m",
    shortLabel: "6 mois",
    label: "6 mois (Semestriel)",
    ratePerDevice: 10000,
    desc: "Passage tous les 6 mois",
  },
  {
    id: "12m",
    shortLabel: "12 mois",
    label: "12 mois (Annuel)",
    ratePerDevice: 15000,
    desc: "Révision annuelle complète",
  },
];

export function calculateEstimate(
  needType: B2BNeedType | null,
  slaFormula: SlaFormulaType | null,
  fleetSize: string | null,
  preventivePeriodId: string | null,
): string {
  if (!needType) return "Sélectionnez votre prestation";
  if (!fleetSize) return "Sélectionnez la taille du parc";

  if (fleetSize === "50+ équipements") {
    return "Sur Devis Personnalisé";
  }

  let count = 5;
  let discount = 0;

  if (fleetSize === "6-15 équipements") {
    count = 10;
    discount = 0.1; // -10% remise dégressive
  } else if (fleetSize === "16-50 équipements") {
    count = 25;
    discount = 0.1; // -10% remise dégressive (4500 FCFA/app sur Essentiel)
  }

  if (needType === "contract") {
    if (!slaFormula) return "Sélectionnez une formule SLA";
    if (slaFormula === "custom") return "Sur Devis Personnalisé";
    if (slaFormula === "essentiel") {
      const baseRate = 5000;
      const rate = count > 15 ? 4500 : Math.round(baseRate * (1 - discount));
      return `${formatFcfa(count * rate)} / mois (${formatFcfa(rate)} / app${rate < baseRate ? ` • -10%` : ""})`;
    }
    if (slaFormula === "business") {
      const baseRate = 8000;
      const rate = count > 15 ? 7000 : Math.round(baseRate * (1 - discount));
      return `${formatFcfa(count * rate)} / mois (${formatFcfa(rate)} / app${rate < baseRate ? ` • -10%` : ""})`;
    }
  }

  if (needType === "preventive") {
    if (!preventivePeriodId) return "Sélectionnez une périodicité";
    const pObj = PREVENTIVE_PERIODS.find((p) => p.id === preventivePeriodId);
    if (!pObj) return "Sélectionnez une périodicité";
    const rate = Math.round(pObj.ratePerDevice * (1 - discount));
    const total = count * rate;
    return `${formatFcfa(total)} / passe (${formatFcfa(rate)} / app${discount > 0 ? ` • -10%` : ""})`;
  }

  if (needType === "curative") {
    return "Diagnostic gratuit + Forfait dépannage";
  }

  if (needType === "audit") {
    return "Diagnostic & Audit Offerts";
  }

  return "Sur Devis B2B";
}

export function calculateSlaEstimate(formula: SlaFormulaType, fleetSize: string): string {
  return calculateEstimate("contract", formula, fleetSize, "3m");
}

export interface B2BRequestFormProps {
  initialFormula?: SlaFormulaType | undefined;
  initialNeedType?: B2BNeedType | undefined;
}

export function B2BRequestForm({ initialFormula, initialNeedType }: B2BRequestFormProps) {
  const submitB2BFn = useServerFn(submitB2BLead);

  const defaultNeedType: B2BNeedType =
    (initialFormula ? "contract" : initialNeedType) || NEED_TYPES[0]!.id;

  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialFormula ? 2 : 1);
  const [needType, setNeedType] = useState<B2BNeedType>(defaultNeedType);
  const [slaFormula, setSlaFormula] = useState<SlaFormulaType>(
    initialFormula || SLA_FORMULAS[0]!.id,
  );
  const [preventivePeriod, setPreventivePeriod] = useState<string>(PREVENTIVE_PERIODS[0]!.id);
  const [fleetSize, setFleetSize] = useState<string>(FLEET_SIZES[0]!);
  const [selectedEqTypes, setSelectedEqTypes] = useState<string[]>([EQUIPMENT_TYPES[0]!]);
  const [urgency, setUrgency] = useState<string>(
    initialFormula === "essentiel"
      ? "48h"
      : initialFormula === "business"
        ? "urgent"
        : URGENCY_LEVELS[0]!.id,
  );

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Cotonou / Abomey-Calavi");
  const [notes, setNotes] = useState("");

  const [busy, setBusy] = useState(false);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [accountDetails, setAccountDetails] = useState<{
    accountCreated: boolean;
    email: string;
    existingAccount: boolean;
  } | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  const slaEstimate = calculateEstimate(needType, slaFormula, fleetSize, preventivePeriod);

  const toggleEqType = (type: string) => {
    setSelectedEqTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  useEffect(() => {
    if (successCode) {
      const qrData = `https://allotechno.africa/devis?ref=${successCode}`;
      QRCode.toDataURL(qrData, { width: 160, margin: 1 })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error("Erreur génération QR Code:", err));
    }
  }, [successCode]);

  // Défilement automatique fluide vers le début du formulaire à chaque changement d'étape
  useEffect(() => {
    const el = document.getElementById("b2b-form");
    if (el) {
      const yOffset = -20;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, [step]);

  const onSubmitFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !contactName.trim() || !phone.trim()) {
      toast.error("Veuillez renseigner le nom de l'entreprise, du contact et le téléphone.");
      setStep(3);
      return;
    }

    setBusy(true);
    const code = `B2B-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const res = await submitB2BFn({
        data: {
          companyName: companyName.trim(),
          contactName: contactName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          city: city.trim() || undefined,
          needType: needType || "contract",
          slaFormula:
            needType === "preventive"
              ? preventivePeriod
                ? `preventive_${preventivePeriod}`
                : undefined
              : slaFormula || undefined,
          fleetSize: fleetSize || "1-5 équipements",
          equipmentTypes: selectedEqTypes,
          urgency: urgency || "48h",
          notes: notes.trim() || undefined,
          reference: code,
        },
      });

      setSuccessCode(res.leadRef || code);
      setAccountDetails({
        accountCreated: res.accountCreated,
        email: res.email,
        existingAccount: res.existingAccount,
      });
      toast.success("Demande B2B enregistrée — un e-mail de confirmation a été envoyé.");
    } catch {
      setSuccessCode(code);
      toast.success("Proposition B2B générée !");
    } finally {
      setBusy(false);
    }
  };

  const generatePDF = async () => {
    if (!successCode) return;
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const doc = new jsPDF();

    // Top Header Banner
    doc.setFillColor(20, 20, 20);
    doc.rect(0, 0, 210, 32, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("ALLÔ TECHNO AFRICA", 14, 18);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Services Informatiques B2B & Maintenance Spécialisée", 14, 25);

    // Ref Badge
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`REF: ${successCode}`, 145, 18);

    // Document Title
    doc.setTextColor(220, 38, 38);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PROPOSITION & FICHE TECHNIQUE B2B", 14, 44);

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Date de génération : ${new Date().toLocaleDateString("fr-FR")} - Statut : Demande Validée & Compte Client Activé`,
      14,
      50,
    );

    const bodyRows = [
      ["Référence Dossier B2B", successCode],
      [
        "Type d'Intervention / Service",
        NEED_TYPES.find((n) => n.id === needType)?.title || needType,
      ],
      [
        "Formule Contrat SLA",
        slaFormula === "essentiel"
          ? "Formule ESSENTIEL SLA"
          : slaFormula === "business"
            ? "Formule BUSINESS SLA"
            : "Sur-Mesure / Multi-sites",
      ],
      ["Estimation Tarifaire Mensuelle", slaEstimate],
      ["Taille Estimée du Parc", fleetSize],
      ["Types d'Équipements Concernés", selectedEqTypes.join(", ") || "Non spécifié"],
      ["Niveau d'Urgence & Délai", URGENCY_LEVELS.find((u) => u.id === urgency)?.label || urgency],
      ["Nom de l'Entreprise / Institution", companyName],
      ["Responsable / Contact IT", contactName],
      ["Téléphone / WhatsApp Direct", phone],
      ["E-mail Professionnel", accountDetails?.email || email || "Non spécifié"],
      ["Ville & Agence Principale", city],
      ["Précisions & Notes Spécifiques", notes || "Aucune précision complémentaire"],
    ];

    if (accountDetails?.accountCreated) {
      bodyRows.push([
        "Compte Client B2B",
        `E-mail: ${accountDetails.email} — confirmez-le pour activer l'accès au portail.`,
      ]);
    }

    // Breakdown Table using autoTable
    autoTable(doc, {
      startY: 55,
      head: [["Caractéristique / Élément", "Spécification retenue"]],
      body: bodyRows,
      headStyles: {
        fillColor: [20, 20, 20],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
      },
      styles: { fontSize: 9, cellPadding: 3.5 },
      theme: "grid",
    });

    const finalY =
      (doc as unknown as { lastAutoTable?: { previous?: { finalY?: number } } }).lastAutoTable
        ?.previous?.finalY || 180;

    // Guarantees Section
    doc.setFillColor(245, 245, 245);
    doc.rect(14, finalY + 8, 125, 38, "F");
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Engagements & Inclusions Allô Techno B2B :", 18, finalY + 16);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text("• Diagnostic gratuit & Prise en charge urgente sur site (< 2h).", 18, finalY + 23);
    doc.text("• Matériel de prêt de secours garanti durant les opérations.", 18, finalY + 29);
    doc.text("• Facturation certifiée conformité B2B & Paiement sur facture.", 18, finalY + 35);

    // Embed QR Code Image
    if (qrCodeUrl) {
      doc.addImage(qrCodeUrl, "PNG", 148, finalY + 8, 38, 38);
      doc.setFontSize(7.5);
      doc.setTextColor(100, 100, 100);
      doc.text("Scannez pour vérifier", 151, finalY + 49);
    }

    doc.save(`Fiche-B2B-${successCode}-${companyName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
  };

  // Ultra-Complete Success State
  if (successCode) {
    const waDigits = COMPANY.whatsapp.replace(/\D/g, "");
    const phoneDigits = COMPANY.phone.replace(/\D/g, "");
    const waText = encodeURIComponent(
      `Bonjour Allô Techno, je viens de soumettre la demande B2B (Réf: ${successCode}) pour l'entreprise ${companyName}. Formule: ${slaFormula}. Identifiant: ${accountDetails?.email || email}. Pouvons-nous échanger ?`,
    );
    const waUrl = `https://wa.me/${waDigits}?text=${waText}`;

    return (
      <div id="b2b-form" className="at-in border border-foreground bg-card p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-border pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center border border-success bg-success/10 text-success font-bold">
              <CheckCircle2 className="size-7" />
            </div>
            <div>
              <span className="at-eyebrow text-success">
                Demande B2B &amp; Compte Client Activés
              </span>
              <h3 className="at-display text-2xl font-bold">
                Récapitulatif Complet &amp; Accès Espace Client
              </h3>
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono text-xs text-muted-foreground block">
              Code Référence B2B :
            </span>
            <span className="font-mono text-lg font-extrabold text-primary border border-primary/30 bg-primary/10 px-3 py-1 inline-block">
              {successCode}
            </span>
          </div>
        </div>

        {/* Automatic B2B Client Account Access Box */}
        <div className="border border-border bg-surface p-5 space-y-3">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm border-b border-border pb-2">
            <UserCheck className="size-5 text-primary" />
            {accountDetails?.accountCreated
              ? "Compte Client B2B Créé — Confirmez votre e-mail"
              : accountDetails?.existingAccount
                ? "Compte Client B2B Reconnu & Rattaché"
                : "Compte Client B2B Activé"}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 text-xs">
            <div className="p-3 border border-border bg-card">
              <span className="text-muted-foreground block text-[10px] uppercase font-mono mb-1">
                Identifiant / E-mail de connexion :
              </span>
              <span className="font-mono font-bold text-foreground truncate block">
                {accountDetails?.email || email}
              </span>
            </div>

            <div className="p-3 border border-border bg-card">
              <span className="text-muted-foreground block text-[10px] uppercase font-mono mb-1">
                Accès Espace Client :
              </span>
              <span className="font-medium text-foreground">
                {accountDetails?.accountCreated
                  ? "Un e-mail de confirmation a été envoyé. Confirmez-le, puis choisissez votre mot de passe via « Mot de passe oublié »."
                  : "Connectez-vous avec vos identifiants habituels"}
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-xs font-bold uppercase tracking-wider"
            >
              <Link to="/mon-compte">Accéder à mon Espace Client B2B &rarr;</Link>
            </Button>
          </div>
        </div>

        {/* Breakdown Table & QR Code Grid */}
        <div className="grid gap-6 md:grid-cols-12 items-start">
          {/* Main Specs Table */}
          <div className="md:col-span-8 border border-border bg-surface p-4 space-y-3">
            <h4 className="at-eyebrow text-foreground border-b border-border pb-2">
              Spécifications de la Demande B2B
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs border-b border-border pb-2">
              <span className="text-muted-foreground">Prestation retenue :</span>
              <span className="font-bold text-foreground text-right">
                {NEED_TYPES.find((n) => n.id === needType)?.title}
              </span>
            </div>
            {needType === "contract" && (
              <div className="grid grid-cols-2 gap-2 text-xs border-b border-border pb-2">
                <span className="text-muted-foreground">Formule SLA :</span>
                <span className="font-mono font-extrabold text-primary text-right uppercase">
                  {SLA_FORMULAS.find((f) => f.id === slaFormula)?.name}
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 text-xs border-b border-border pb-2">
              <span className="text-muted-foreground">Estimation Tarifaire :</span>
              <span className="font-mono font-extrabold text-foreground text-right text-sm">
                {slaEstimate}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs border-b border-border pb-2">
              <span className="text-muted-foreground">Taille du parc :</span>
              <span className="font-mono font-bold text-right">{fleetSize}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs border-b border-border pb-2">
              <span className="text-muted-foreground">Équipements :</span>
              <span className="font-medium text-right truncate">{selectedEqTypes.join(", ")}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs border-b border-border pb-2">
              <span className="text-muted-foreground">Délai d'intervention :</span>
              <span className="font-mono text-primary font-bold text-right">
                {URGENCY_LEVELS.find((u) => u.id === urgency)?.label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs border-b border-border pb-2">
              <span className="text-muted-foreground">Entreprise &amp; Contact :</span>
              <span className="font-bold text-right">
                {companyName} ({contactName})
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="text-muted-foreground">Téléphone &amp; Localisation :</span>
              <span className="font-mono text-right">
                {phone} — {city}
              </span>
            </div>
          </div>

          {/* QR Code & PDF Export Column */}
          <div className="md:col-span-4 border border-border bg-card p-4 space-y-4 text-center">
            <span className="at-eyebrow block">QR Code d'Authentification</span>
            {qrCodeUrl ? (
              <div className="flex justify-center p-2 bg-white border border-border inline-block mx-auto">
                <img src={qrCodeUrl} alt={`QR Code ${successCode}`} className="size-36" />
              </div>
            ) : (
              <div className="flex size-36 items-center justify-center border border-border bg-surface mx-auto">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              Conservez ce QR code pour le suivi en direct de votre proposition B2B.
            </p>
            <Button
              type="button"
              variant="technical"
              className="w-full text-xs font-bold uppercase tracking-wider"
              onClick={generatePDF}
            >
              <Download className="mr-2 size-4" />
              Télécharger la Fiche PDF
            </Button>
          </div>
        </div>

        {/* Direct Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground max-w-md">
            Un technicien B2B dédié valide votre étude sous 2 heures. Vous pouvez également nous
            contacter directement via WhatsApp avec la référence{" "}
            <strong className="text-foreground">{successCode}</strong>.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="technical" size="lg">
              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                <MessageSquare className="mr-2 size-4" />
                Échanger sur WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={`tel:+${phoneDigits}`}>
                <PhoneCall className="mr-2 size-4" />
                Appeler le {COMPANY.phone}
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="b2b-form" className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Top Header Banner */}
      <div className="border border-border bg-card p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="at-eyebrow mb-1 block">Sans création de compte préalable</span>
          <h2 className="at-display text-xl sm:text-2xl md:text-3xl font-bold break-words">
            Demande de Service &amp; Maintenance B2B
          </h2>
        </div>
      </div>

      {/* 2-Column Grid: Form Steps Space (Left) + Live Recap Card (Right) */}
      <div className="grid gap-6 lg:grid-cols-12 items-start w-full max-w-full">
        {/* Left Column: B2B Form Space (7 cols) */}
        <div className="lg:col-span-7 border border-border bg-card p-3 sm:p-6 md:p-8 space-y-6 min-w-0 max-w-full overflow-hidden">
          {/* Segmented 4-Step Navigation Bar Inside Form Space */}
          <div className="border border-border bg-surface p-1 grid grid-cols-2 sm:grid-cols-4 w-full gap-1 text-center font-mono text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`h-10 sm:h-12 flex items-center justify-center px-1 border transition-all truncate min-w-0 ${
                step === 1
                  ? "bg-foreground text-background border-foreground"
                  : "border-transparent bg-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              1. SERVICE
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              className={`h-10 sm:h-12 flex items-center justify-center px-1 border transition-all truncate min-w-0 ${
                step === 2
                  ? "bg-foreground text-background border-foreground"
                  : "border-transparent bg-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              2. PARC
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className={`h-10 sm:h-12 flex items-center justify-center px-1 border transition-all truncate min-w-0 ${
                step === 3
                  ? "bg-foreground text-background border-foreground"
                  : "border-transparent bg-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              3. CONTACT
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className={`h-10 sm:h-12 flex items-center justify-center px-1 border transition-all truncate min-w-0 ${
                step === 4
                  ? "bg-foreground text-background border-foreground"
                  : "border-transparent bg-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              4. REVUE
            </button>
          </div>

          {/* Step 1: Need Selection ONLY */}
          {step === 1 && (
            <div className="space-y-6 at-in">
              <div>
                <h3 className="text-base font-bold uppercase tracking-wider mb-1">
                  Étape 1 : Choisissez votre type d'intervention B2B
                </h3>
                <p className="text-sm text-muted-foreground">
                  Sélectionnez la prestation principale recherchée pour votre entreprise.
                </p>
              </div>

              {/* Need Type Selection */}
              <div className="grid gap-3 sm:grid-cols-2">
                {NEED_TYPES.map((item) => {
                  const Icon = item.icon;
                  const isSelected = needType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setNeedType(item.id)}
                      className={`flex flex-col justify-between p-4 text-left border transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 text-foreground font-semibold"
                          : "border-border bg-surface text-muted-foreground hover:border-border hover:bg-card hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-3">
                        <div
                          className={`flex size-10 items-center justify-center border ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"}`}
                        >
                          <Icon className="size-5" />
                        </div>
                        <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 border border-border bg-card text-foreground">
                          {item.tag}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-sm mb-1">{item.title}</h4>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end pt-4 border-t border-border w-full">
                <Button
                  variant="technical"
                  size="lg"
                  className="w-full sm:w-auto text-center whitespace-normal h-auto min-h-12 py-3 px-4 sm:px-8 text-xs sm:text-sm font-bold uppercase tracking-wider max-w-full"
                  onClick={() => {
                    if (!needType) {
                      toast.error("Veuillez sélectionner un type d'intervention.");
                      return;
                    }
                    setStep(2);
                  }}
                >
                  <span className="hidden sm:inline">
                    Continuer vers les détails du parc &rarr;
                  </span>
                  <span className="sm:hidden">Détails du parc &rarr;</span>
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Fleet & Formulas & Periodicity & Urgency */}
          {step === 2 && (
            <div className="space-y-6 at-in">
              <div>
                <h3 className="text-base font-bold uppercase tracking-wider mb-1">
                  Étape 2 : Détails du parc, Offres &amp; Niveau d'urgence
                </h3>
                <p className="text-sm text-muted-foreground">
                  Aidez-nous à calibrer les tarifs et techniciens nécessaires.
                </p>
              </div>

              {/* Fleet Size */}
              <div>
                <label className="at-eyebrow mb-2 block">
                  1. Taille estimée du parc matériel :
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {FLEET_SIZES.map((size) => {
                    const hasDiscount = size === "6-15 équipements" || size === "16-50 équipements";
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setFleetSize(size)}
                        className={`h-12 flex flex-col items-center justify-center font-mono text-[11px] uppercase border text-center transition-all ${
                          fleetSize === size
                            ? "border-primary bg-primary text-primary-foreground font-bold"
                            : "border-border bg-surface text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span>{size}</span>
                        {hasDiscount && (
                          <span
                            className={`text-[8px] font-bold uppercase ${fleetSize === size ? "text-primary-foreground opacity-90" : "text-success"}`}
                          >
                            -10% Dégressif
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SLA Formulas Selection - ONLY for SLA contract in Step 2 */}
              {needType === "contract" && (
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center">
                    <label className="at-eyebrow text-primary block">
                      2. Choisissez votre Formule Contrat SLA :
                    </label>
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">
                      1-15 app: 5 000 F/app | &gt;15 app: 4 500 F/app
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {SLA_FORMULAS.map((formula) => (
                      <button
                        key={formula.id}
                        type="button"
                        onClick={() => {
                          setSlaFormula(formula.id);
                          if (formula.id === "essentiel") setUrgency("48h");
                          if (formula.id === "business") setUrgency("urgent");
                        }}
                        className={`p-3 text-left border transition-all ${
                          slaFormula === formula.id
                            ? "border-primary bg-primary text-primary-foreground font-bold"
                            : "border-border bg-surface text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-mono text-xs uppercase font-extrabold">
                            {formula.name}
                          </span>
                        </div>
                        <p className="text-[11px] opacity-80">{formula.desc}</p>
                        <div className="mt-2 font-mono text-[10px] font-bold uppercase underline">
                          {calculateEstimate("contract", formula.id, fleetSize, preventivePeriod)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Maintenance Préventive Periodicity Selector - ONLY for Maintenance Préventive in Step 2 */}
              {needType === "preventive" && (
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center">
                    <label className="at-eyebrow text-primary block">
                      2. Choisissez la Périodicité d'Entretien :
                    </label>
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">
                      Tarification par équipement / passe
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {PREVENTIVE_PERIODS.map((period) => {
                      let count = 5;
                      let discount = 0;
                      if (fleetSize === "6-15 équipements") {
                        count = 10;
                        discount = 0.1;
                      } else if (fleetSize === "16-50 équipements") {
                        count = 25;
                        discount = 0.1;
                      }

                      const unitRate = Math.round(period.ratePerDevice * (1 - discount));
                      const totalPrice =
                        fleetSize && fleetSize !== "50+ équipements" ? count * unitRate : null;

                      return (
                        <button
                          key={period.id}
                          type="button"
                          onClick={() => setPreventivePeriod(period.id)}
                          className={`p-2.5 text-center border transition-all ${
                            preventivePeriod === period.id
                              ? "border-primary bg-primary text-primary-foreground font-bold"
                              : "border-border bg-surface text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <span className="font-mono text-xs font-extrabold uppercase block">
                            {period.shortLabel}
                          </span>
                          <span className="text-[11px] font-bold font-mono block opacity-95 mt-0.5">
                            {totalPrice
                              ? formatFcfa(totalPrice)
                              : `${formatFcfa(period.ratePerDevice)}/app`}
                          </span>
                          {totalPrice && (
                            <span
                              className={`text-[9px] block font-mono ${preventivePeriod === period.id ? "opacity-85 text-primary-foreground" : "text-muted-foreground"}`}
                            >
                              ({formatFcfa(unitRate)}/app)
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Equipment types */}
              <div className="border-t border-border pt-4">
                <label className="at-eyebrow mb-2 block">
                  3. Matériels concernés (choix multiples) :
                </label>
                <div className="flex flex-wrap gap-2">
                  {EQUIPMENT_TYPES.map((type) => {
                    const active = selectedEqTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleEqType(type)}
                        className={`h-10 inline-flex items-center justify-center px-3.5 text-xs font-semibold uppercase border transition-all ${
                          active
                            ? "border-primary bg-primary/10 text-primary font-bold"
                            : "border-border bg-surface text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {active ? "✓ " : "+ "}
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Urgency */}
              <div className="border-t border-border pt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="at-eyebrow block">4. Délai d'intervention souhaité :</label>
                  {needType === "contract" && slaFormula !== "custom" && (
                    <span className="font-mono text-[10px] text-primary uppercase font-bold">
                      ✓ Délai SLA inclus dans cette formule
                    </span>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {URGENCY_LEVELS.map((u) => {
                    const isLocked = needType === "contract" && slaFormula !== "custom";
                    const isSelected = urgency === u.id;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        disabled={isLocked}
                        onClick={() => setUrgency(u.id)}
                        className={`h-12 flex items-center justify-center px-3 text-xs font-medium border text-center transition-all ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground font-bold"
                            : isLocked
                              ? "border-border bg-surface/50 text-muted-foreground opacity-50 cursor-not-allowed"
                              : "border-border bg-surface text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {u.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-between pt-4 border-t border-border w-full">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-center h-auto min-h-12 py-3 px-4 sm:px-6 text-xs sm:text-sm font-bold uppercase tracking-wider"
                  onClick={() => setStep(1)}
                >
                  &larr; Retour
                </Button>
                <Button
                  variant="technical"
                  size="lg"
                  className="w-full sm:w-auto text-center whitespace-normal h-auto min-h-12 py-3 px-4 sm:px-8 text-xs sm:text-sm font-bold uppercase tracking-wider max-w-full"
                  onClick={() => {
                    if (!fleetSize) {
                      toast.error("Veuillez sélectionner la taille de votre parc.");
                      return;
                    }
                    if (needType === "contract" && !slaFormula) {
                      toast.error("Veuillez choisir une formule SLA.");
                      return;
                    }
                    if (needType === "preventive" && !preventivePeriod) {
                      toast.error("Veuillez choisir la périodicité d'entretien.");
                      return;
                    }
                    if (selectedEqTypes.length === 0) {
                      toast.error("Veuillez choisir au moins un type d'équipement.");
                      return;
                    }
                    if (!urgency) {
                      toast.error("Veuillez choisir un délai d'intervention.");
                      return;
                    }
                    setStep(3);
                  }}
                >
                  <span className="hidden sm:inline">Continuer vers le contact &rarr;</span>
                  <span className="sm:hidden">Coordonnées contact &rarr;</span>
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Contact Details */}
          {step === 3 && (
            <div className="space-y-6 at-in">
              <div>
                <h3 className="text-base font-bold uppercase tracking-wider mb-1">
                  Étape 3 : Coordonnées de l'Entreprise
                </h3>
                <p className="text-sm text-muted-foreground">
                  Renseignez vos coordonnées pour la génération de la proposition officielle.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="at-eyebrow mb-1 block">
                    Nom de l'Entreprise / Institution *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="ex: TechnoHub Africa S.A."
                    className="h-11 w-full border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="at-eyebrow mb-1 block">Nom du Responsable / Contact *</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="ex: M. Sylvain KPOHOU"
                    className="h-11 w-full border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="at-eyebrow mb-1 block">Téléphone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="ex: +229 01 97 00 00 00"
                    className="h-11 w-full border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="at-eyebrow mb-1 block">E-mail professionnel</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@entreprise.bj"
                    className="h-11 w-full border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="at-eyebrow mb-1 block">Localisation / Agence principale</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="ex: Cotonou, Haie Vive / Parakou"
                    className="h-11 w-full border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="at-eyebrow mb-1 block">Notes / Précisions sur le besoin</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="ex: 5 laptops HP avec soucis d'écran et surchauffe"
                    className="h-11 w-full border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-between pt-4 border-t border-border w-full">
                <Button
                  variant="outline"
                  size="lg"
                  type="button"
                  className="w-full sm:w-auto text-center h-auto min-h-12 py-3 px-4 sm:px-6 text-xs sm:text-sm font-bold uppercase tracking-wider"
                  onClick={() => setStep(2)}
                >
                  &larr; Retour
                </Button>
                <Button
                  variant="technical"
                  size="lg"
                  type="button"
                  className="w-full sm:w-auto text-center whitespace-normal h-auto min-h-12 py-3 px-4 sm:px-8 text-xs sm:text-sm font-bold uppercase tracking-wider max-w-full"
                  onClick={() => {
                    if (!companyName.trim() || !contactName.trim() || !phone.trim()) {
                      toast.error(
                        "Veuillez renseigner le nom de l'entreprise, du contact et le téléphone.",
                      );
                      return;
                    }
                    setStep(4);
                  }}
                >
                  Passer à la revue &rarr;
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Pre-Validation Review & Confirmation */}
          {step === 4 && (
            <div className="space-y-6 at-in">
              <div>
                <h3 className="text-base font-bold uppercase tracking-wider mb-1">
                  Étape 4 : Revue &amp; Validation de la demande B2B
                </h3>
                <p className="text-sm text-muted-foreground">
                  Vérifiez vos choix avant d'envoyer la demande et générer votre fiche B2B.
                </p>
              </div>

              {/* Section 1: Service */}
              <div className="border border-border bg-surface p-4 space-y-2">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <span className="at-eyebrow text-foreground">1. Prestation &amp; Offre</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep(1)}
                    className="h-7 text-xs font-mono"
                  >
                    <Edit3 className="mr-1 size-3" /> Modifier
                  </Button>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Besoin principal :</span>
                    <span className="font-bold">
                      {NEED_TYPES.find((n) => n.id === needType)?.title}
                    </span>
                  </div>
                  {needType === "contract" && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Formule SLA :</span>
                      <span className="font-mono font-bold text-primary">
                        {SLA_FORMULAS.find((f) => f.id === slaFormula)?.name}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimation Tarifaire :</span>
                    <span className="font-mono font-bold text-foreground">{slaEstimate}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Parc */}
              <div className="border border-border bg-surface p-4 space-y-2">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <span className="at-eyebrow text-foreground">2. Parc &amp; Urgence</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep(2)}
                    className="h-7 text-xs font-mono"
                  >
                    <Edit3 className="mr-1 size-3" /> Modifier
                  </Button>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taille du parc :</span>
                    <span className="font-mono font-bold">{fleetSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Matériels :</span>
                    <span className="font-medium">{selectedEqTypes.join(", ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Niveau d'urgence :</span>
                    <span className="font-mono font-bold text-primary">
                      {URGENCY_LEVELS.find((u) => u.id === urgency)?.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Contact */}
              <div className="border border-border bg-surface p-4 space-y-2">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <span className="at-eyebrow text-foreground">3. Coordonnées Entreprise</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep(3)}
                    className="h-7 text-xs font-mono"
                  >
                    <Edit3 className="mr-1 size-3" /> Modifier
                  </Button>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entreprise :</span>
                    <span className="font-bold">{companyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contact IT :</span>
                    <span className="font-medium">{contactName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Téléphone :</span>
                    <span className="font-mono">{phone}</span>
                  </div>
                  {email && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">E-mail :</span>
                      <span className="font-mono">{email}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Localisation :</span>
                    <span className="font-medium">{city}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-between pt-4 border-t border-border w-full">
                <Button
                  variant="outline"
                  size="lg"
                  type="button"
                  className="w-full sm:w-auto text-center h-auto min-h-12 py-3 px-4 sm:px-6 text-xs sm:text-sm font-bold uppercase tracking-wider"
                  onClick={() => setStep(3)}
                >
                  &larr; Retour aux coordonnées
                </Button>
                <Button
                  variant="technical"
                  size="lg"
                  type="button"
                  className="w-full sm:w-auto text-center whitespace-normal h-auto min-h-12 py-3 px-4 sm:px-8 text-xs sm:text-sm font-bold uppercase tracking-wider max-w-full"
                  onClick={onSubmitFinal}
                  disabled={busy}
                >
                  {busy ? (
                    <Loader2 className="mr-2 size-4 animate-spin shrink-0" />
                  ) : (
                    <Sparkles className="mr-2 size-4 shrink-0" />
                  )}
                  <span>{busy ? "Traitement..." : "Valider & Générer la Proposition B2B"}</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Pure Live Summary Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
          <div className="border border-border bg-card p-4 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="size-2 bg-primary animate-pulse inline-block" />
                <h3 className="at-eyebrow text-primary">Récapitulatif en temps réel</h3>
              </div>
              <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 border border-border bg-surface">
                Étape {step}/4
              </span>
            </div>

            {/* Selected Prestation */}
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase font-mono">
                Prestation :
              </span>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-sm text-foreground">
                  {NEED_TYPES.find((n) => n.id === needType)?.title}
                </span>
                <span className="text-[11px] font-mono font-bold text-primary px-2 py-0.5 border border-primary/30 bg-primary/10">
                  {NEED_TYPES.find((n) => n.id === needType)?.tag}
                </span>
              </div>
              {needType === "contract" && (
                <div className="mt-1 pt-1 border-t border-border flex flex-wrap justify-between items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono">Formule SLA :</span>
                  <span className="text-xs font-mono font-extrabold text-primary uppercase">
                    {SLA_FORMULAS.find((f) => f.id === slaFormula)?.name}
                  </span>
                </div>
              )}
            </div>

            {/* Dynamic SLA Price Estimation */}
            <div className="border-t border-border pt-3 space-y-1">
              <span className="text-xs text-muted-foreground uppercase font-mono">
                Estimation Tarifaire :
              </span>
              <div className="font-mono text-base font-extrabold text-foreground">
                {slaEstimate}
              </div>
            </div>

            {/* Fleet & Equipment */}
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex justify-between text-xs gap-2">
                <span className="text-muted-foreground">Taille du parc :</span>
                <span className="font-mono font-bold">{fleetSize}</span>
              </div>
              <div className="flex justify-between text-xs gap-2">
                <span className="text-muted-foreground shrink-0">Équipements :</span>
                <span className="font-medium text-right break-words text-foreground font-semibold">
                  {selectedEqTypes.length > 0 ? selectedEqTypes.join(", ") : "Aucun sélectionné"}
                </span>
              </div>
              <div className="flex justify-between text-xs gap-2">
                <span className="text-muted-foreground">Délai souhaité :</span>
                <span className="font-mono text-primary font-bold">
                  {URGENCY_LEVELS.find((u) => u.id === urgency)?.label}
                </span>
              </div>
            </div>

            {/* Company & Contact (Live as typed) */}
            <div className="border-t border-border pt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entreprise :</span>
                <span className="font-bold">{companyName || "Non spécifiée"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contact IT :</span>
                <span className="font-medium">{contactName || "Non spécifié"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Téléphone :</span>
                <span className="font-mono">{phone || "Non spécifié"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ville / Agence :</span>
                <span className="font-medium">{city}</span>
              </div>
            </div>

            {/* Guarantees & Inclusions */}
            <div className="border-t border-border pt-4 bg-surface p-3 space-y-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <CheckCircle2 className="size-3.5 text-primary" />
                Devis B2B 100% Gratuit &amp; Sans Engagement
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-success" />
                Intervention &amp; Enlèvement sur site à Cotonou / Calavi
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-success" />
                Facturation certifiée B2B &amp; Paiement sur facture
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
