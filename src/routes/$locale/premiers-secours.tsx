import { createFileRoute } from "@tanstack/react-router";
import { Droplets, Zap, Flame, CheckCircle2, XCircle, PhoneCall, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageBreadcrumb } from "@/components/site/PageBreadcrumb";
import { COMPANY } from "@/data/catalog/company";
import { normalizeLocale, type Locale } from "@/lib/i18n/locales";
import { localeSeo } from "@/lib/seo";

export const Route = createFileRoute("/$locale/premiers-secours")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const seo = localeSeo(locale, "/services");
    return {
      meta: [
        { title: "Guide de Premiers Secours Informatiques — Allô Techno" },
        {
          name: "description",
          content:
            "Gestes d'urgence pas-à-pas en cas de liquide renversé, surtension orage ou surchauffe pour sauver votre PC ou Mac.",
        },
        ...seo.meta,
      ],
      links: [...seo.links],
    };
  },
  component: EmergencyGuidePage,
});

function EmergencyGuidePage() {
  const emergencyScenarios = [
    {
      id: "liquid",
      icon: Droplets,
      title: "1. Liquide Renversé (Eau, Café, Thé, Jus)",
      urgency: "CRITIQUE (Action immédiate < 5 min)",
      color: "border-blue-500/40 bg-blue-500/5",
      doList: [
        "Éteignez de force l'ordinateur en maintenant le bouton d'alimentation 10 secondes.",
        "Débranchez immédiatement le chargeur secteur et tous les périphériques USB.",
        "Placez le PC/Mac ouvert en forme de « V » inversé sur une serviette absorbante.",
        "Apportez-le en atelier sous 2h à 6h pour bain de désoxydation aux ultrasons.",
      ],
      dontList: [
        "NE LE RALLUMEZ SURTOUT PAS pour « vérifier s'il marche encore » (court-circuit garanti).",
        "N'utilisez PAS de sèche-cheveux chaud (cela fait fondre les touches et pousse le liquide).",
        "Ne mettez PAS votre ordinateur dans du riz (la poussière de riz colle et corrode les composants).",
      ],
    },
    {
      id: "thunder",
      icon: Zap,
      title: "2. Surtension Électrique & Foudre après Orage",
      urgency: "ÉLEVÉ (Risque incendie & alimentation)",
      color: "border-amber-500/40 bg-amber-500/5",
      doList: [
        "Débranchez immédiatement l'onduleur ou le chargeur de la prise murale.",
        "Vérifiez si une odeur de brûlé ou de composant plastique est perceptible.",
        "Testez le fusible du câble ou faites inspecter le connecteur de charge par notre équipe.",
      ],
      dontList: [
        "Ne rebranchez pas l'ordinateur sur la même multiprise sans diagnostic préalable.",
        "Ne tentez pas d'ouvrir le bloc d'alimentation (haute tension résiduelle dangereuse).",
      ],
    },
    {
      id: "heat",
      icon: Flame,
      title: "3. Surchauffe Brutale & Ventilateur Bruyant",
      urgency: "MOYEN (Usure prématurée processeur)",
      color: "border-orange-500/40 bg-orange-500/5",
      doList: [
        "Sauvegardez vos fichiers en cours et fermez les applications lourdes.",
        "Surélevez l'arrière de l'ordinateur portable pour libérer les grilles d'aération.",
        "Planifiez un dépoussiérage et un remplacement de pâte thermique en atelier.",
      ],
      dontList: [
        "N'utilisez pas l'ordinateur portable posé sur un lit, canapé ou coussin textile.",
        "Ne soufflez pas d'air avec la bouche dans les grilles (projection d'humidité).",
      ],
    },
  ];

  return (
    <div className="min-h-screen pb-16">
      {/* ─── Hero Header ─── */}
      <section className="border-b border-border py-12 bg-surface/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="at-eyebrow text-destructive font-bold flex items-center gap-1.5">
              <ShieldAlert className="size-4" /> Gestes d'Urgence SAV
            </span>
            <PageBreadcrumb items={[{ label: "Premiers Secours" }]} />
          </div>
          <h1 className="at-display text-3xl sm:text-5xl font-extrabold text-foreground">
            Premiers Secours &amp; Urgences Informatiques
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl">
            Un accident vient d'arriver à votre ordinateur ? Adoptez les bons réflexes pour éviter
            d'endommager irréversiblement votre carte mère et vos données personnelles.
          </p>
        </div>
      </section>

      {/* ─── Emergency Call Banner ─── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 mt-6">
        <div className="border border-destructive/40 bg-destructive/10 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <PhoneCall className="size-6 text-destructive shrink-0" />
            <div>
              <strong className="text-sm font-bold text-foreground">
                Urgence Désoxydation &amp; Dépannage Immédiat ?
              </strong>
              <p className="text-xs text-muted-foreground">
                Notre équipe d'astreinte technique vous répond directement au {COMPANY.phone}.
              </p>
            </div>
          </div>
          <Button asChild variant="destructive" size="sm" className="font-bold shrink-0">
            <a href={`tel:${COMPANY.phone.replace(/\s+/g, "")}`}>
              Appeler l'Atelier d'Urgence &rarr;
            </a>
          </Button>
        </div>
      </div>

      {/* ─── Scenarios Cards ─── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 mt-8 space-y-6">
        {emergencyScenarios.map((scenario) => {
          const Icon = scenario.icon;
          return (
            <div
              key={scenario.id}
              className={`border p-6 rounded-2xl space-y-5 shadow-xs ${scenario.color}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
                <div className="flex items-center gap-2.5">
                  <Icon className="size-5 text-primary shrink-0" />
                  <h2 className="text-base font-bold text-foreground">{scenario.title}</h2>
                </div>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] uppercase font-bold text-destructive border-destructive/30"
                >
                  {scenario.urgency}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* À FAIRE */}
                <div className="space-y-2.5 bg-background p-4 rounded-xl border border-emerald-600/30">
                  <span className="font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                    <CheckCircle2 className="size-4" /> Les Gestes Qui Sauvent :
                  </span>
                  <ul className="space-y-2 text-foreground">
                    {scenario.doList.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="font-bold text-emerald-600 font-mono">0{i + 1}.</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* À NE PAS FAIRE */}
                <div className="space-y-2.5 bg-background p-4 rounded-xl border border-destructive/30">
                  <span className="font-bold text-destructive uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                    <XCircle className="size-4" /> Erreurs Fatales à Éviter :
                  </span>
                  <ul className="space-y-2 text-foreground">
                    {scenario.dontList.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="font-bold text-destructive font-mono">✕</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
