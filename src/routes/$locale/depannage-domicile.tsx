import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageBreadcrumb } from "@/components/site/PageBreadcrumb";
import { bookHomeRepairFn } from "@/lib/home-repair-booking.functions";
import { normalizeLocale, type Locale } from "@/lib/i18n/locales";
import { localeSeo } from "@/lib/seo";

export const Route = createFileRoute("/$locale/depannage-domicile")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const seo = localeSeo(locale, "/services");
    return {
      meta: [
        { title: "Dépannage Informatique VIP à Domicile & sur Site — Allô Techno" },
        {
          name: "description",
          content: "Un technicien informatique qualifié chez vous en 1h avec sa mallette d'intervention à Cotonou, Haie Vive et Calavi.",
        },
        ...seo.meta,
      ],
      links: [...seo.links],
    };
  },
  component: HomeRepairBookingPage,
});

function HomeRepairBookingPage() {
  const formTopRef = React.useRef<HTMLDivElement>(null);
  const [step, setStep] = React.useState<1 | 2>(1);

  // Form states with default first option selected
  const [customerName, setCustomerName] = React.useState("Directeur Général");
  const [phone, setPhone] = React.useState("97000000");
  const [zone, setZone] = React.useState("Cotonou Centre");
  const [addressDetails, setAddressDetails] = React.useState("Quartier Haie Vive, Rue 124");
  const [issueType, setIssueType] = React.useState("ecran_ssd");
  const [preferredTimeSlot, setPreferredTimeSlot] = React.useState("Matin (08h - 12h)");
  const [preferredDate, setPreferredDate] = React.useState(new Date().toISOString().slice(0, 10));

  const [loading, setLoading] = React.useState(false);
  const [bookingResult, setBookingResult] = React.useState<{ bookingId: string; message: string } | null>(null);

  // Auto-scroll when step changes
  React.useEffect(() => {
    if (formTopRef.current) {
      formTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [step]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await bookHomeRepairFn({
        data: {
          customerName,
          phone,
          zone,
          addressDetails,
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

  return (
    <div className="min-h-screen pb-16">
      {/* ─── Hero Header ─── */}
      <section className="border-b border-border py-12 bg-surface/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="at-eyebrow text-primary font-bold">Service Mobile VIP</span>
            <PageBreadcrumb items={[{ label: "Dépannage à Domicile" }]} />
          </div>
          <h1 className="at-display text-3xl sm:text-5xl font-extrabold text-foreground">
            Dépannage VIP sur Site &amp; à Domicile
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl">
            Pas le temps de vous déplacer en atelier ? Notre technicien mobile intervient directement à votre domicile ou à vos bureaux avec tout le matériel de précision.
          </p>
        </div>
      </section>

      {/* ─── Main Content Form ─── */}
      <div ref={formTopRef} className="mx-auto max-w-2xl px-4 sm:px-6 mt-8">
        {bookingResult ? (
          <div className="border border-emerald-600/30 bg-card p-6 sm:p-8 rounded-2xl text-center space-y-4 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="size-12 rounded-full bg-emerald-600/10 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-7" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Intervention Mobile Confirmée !</h2>
            <Badge variant="outline" className="font-mono text-sm text-primary font-bold">
              Réf : {bookingResult.bookingId}
            </Badge>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              {bookingResult.message}
            </p>
            <div className="pt-2">
              <Button asChild variant="technical" className="text-xs font-bold uppercase">
                <a
                  href={`https://wa.me/22960000000?text=${encodeURIComponent(
                    `Bonjour Allô Techno, je confirme ma réservation d'intervention à domicile N° ${bookingResult.bookingId} pour le ${preferredDate}.`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Contacter le Technicien sur WhatsApp &rarr;
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="border border-border bg-card p-6 sm:p-8 rounded-2xl space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">
                  {step === 1 ? "Étape 1/2 : Votre Localisation & Panne" : "Étape 2/2 : Créneau d'Intervention"}
                </h3>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono text-emerald-600 border-emerald-600/30">
                Déplacement : 5 000 FCFA
              </Badge>
            </div>

            {step === 1 ? (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-muted-foreground block mb-1">Votre Nom / Entreprise :</label>
                  <Input
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="ex: Cabinet Me Koffi"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">Téléphone de contact (WhatsApp) :</label>
                  <Input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="ex: 97 00 00 00"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">Zone Géographique d'Intervention :</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Cotonou Centre",
                      "Haie Vive / Les Cocotiers",
                      "Akpakpa / PK10",
                      "Abomey-Calavi",
                    ].map((z) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => setZone(z)}
                        className={`p-2 rounded-lg border text-left font-semibold transition-all ${
                          zone === z
                            ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                            : "border-border bg-surface text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {z}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">Adresse précise / Repères :</label>
                  <Input
                    required
                    value={addressDetails}
                    onChange={(e) => setAddressDetails(e.target.value)}
                    placeholder="ex: Derrière la pharmacie du Camp Guézo, Immeuble bleu 2e étage"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">Nature de la Prestation souhaitée :</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "ecran_ssd", label: "Écran cassé / Upgrade SSD" },
                      { id: "panne_logicielle", label: "PC bloqué / Windows infecté" },
                      { id: "reseau_wifi", label: "Box Wi-Fi / Imprimante réseau" },
                      { id: "maintenance_complete", label: "Entretien complet & Dépoussiérage" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setIssueType(item.id)}
                        className={`p-2.5 rounded-lg border text-left font-semibold transition-all ${
                          issueType === item.id
                            ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                            : "border-border bg-surface text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  variant="technical"
                  className="w-full font-bold uppercase tracking-wider text-xs h-9 mt-2"
                >
                  Continuer vers le Choix de la Date &rarr;
                </Button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-muted-foreground block mb-1">Date souhaitée :</label>
                  <Input
                    type="date"
                    required
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">Créneau horaire d'intervention :</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      "Matin (08h - 12h)",
                      "Après-midi (14h - 18h)",
                      "Urgence Express (1h)",
                    ].map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setPreferredTimeSlot(slot)}
                        className={`p-2.5 rounded-lg border text-center font-semibold transition-all ${
                          preferredTimeSlot === slot
                            ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                            : "border-border bg-surface text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-surface rounded-xl border border-border text-[11px] text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                  <span>Le technicien arrive avec ses pièces d'origine certifiées et son terminal de paiement MoMo.</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="w-1/3 text-xs"
                  >
                    &larr; Retour
                  </Button>
                  <Button
                    type="submit"
                    variant="technical"
                    disabled={loading}
                    className="w-2/3 font-bold uppercase tracking-wider text-xs h-9"
                  >
                    {loading ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : null}
                    {loading ? "Confirmation..." : "Valider ma Réservation VIP"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
