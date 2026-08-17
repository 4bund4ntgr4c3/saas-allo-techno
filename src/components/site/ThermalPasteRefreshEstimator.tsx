import * as React from "react";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";

export function ThermalPasteRefreshEstimator() {
  const [deviceAgeMonths, setDeviceAgeMonths] = React.useState<number>(18);
  const [environment, setEnvironment] = React.useState<"climatise" | "ventile" | "poussiereux">(
    "ventile",
  );

  const thermalStatus = React.useMemo(() => {
    let tempRise = 10;
    let throttleLoss = 10;

    if (deviceAgeMonths >= 24) {
      tempRise += 15;
      throttleLoss += 20;
    } else if (deviceAgeMonths >= 12) {
      tempRise += 8;
      throttleLoss += 10;
    }

    if (environment === "poussiereux") {
      tempRise += 12;
      throttleLoss += 15;
    } else if (environment === "ventile") {
      tempRise += 6;
      throttleLoss += 8;
    }

    const estimatedTemp = Math.min(98, 55 + tempRise);
    const performanceLoss = Math.min(50, throttleLoss);

    return {
      tempRise,
      estimatedTemp,
      performanceLoss,
      pasteDried: deviceAgeMonths >= 18,
      recommendedPaste:
        "Pâte Haute Conductivité Arctic MX-4 (8.5 W/mK) + Nettoyage Ultrasons Ventilateur",
      priceFcfa: 15000,
    };
  }, [deviceAgeMonths, environment]);

  return (
    <div className="border border-border bg-card p-5 sm:p-7 rounded-2xl space-y-6 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Flame className="size-5 text-amber-500 shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Simulateur d'Usure Thermique &amp; Pâte Conductrice
            </h3>
            <p className="text-xs text-muted-foreground">
              Évaluez la surchauffe causée par l'Harmattan et le dessèchement thermique de votre
              PC/Mac
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-[10px] text-amber-600 border-amber-600/40 bg-amber-600/10"
        >
          Arctic MX-4 &amp; Grizzly
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-6 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">
              Dernier dépoussiérage / Remplacement pâte thermique :
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { months: 6, label: "Moins de 6 mois" },
                { months: 12, label: "Il y a 1 an (~12 mois)" },
                { months: 18, label: "Il y a 18 mois" },
                { months: 30, label: "+ de 2 ans / Jamais" },
              ].map((item) => (
                <button
                  key={item.months}
                  type="button"
                  onClick={() => setDeviceAgeMonths(item.months)}
                  className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all ${
                    deviceAgeMonths === item.months
                      ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">
              Environnement d'utilisation prédominant :
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "climatise", label: "Bureau Climatisé" },
                { id: "ventile", label: "Ventilateur / Salin" },
                { id: "poussiereux", label: "Zone Poussiéreuse" },
              ].map((env) => (
                <button
                  key={env.id}
                  type="button"
                  onClick={() => setEnvironment(env.id as "climatise" | "ventile" | "poussiereux")}
                  className={`p-2 rounded-lg border text-center text-xs font-semibold transition-all ${
                    environment === env.id
                      ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {env.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Box */}
        <div className="lg:col-span-6 border border-border bg-surface/50 p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <span className="at-eyebrow text-muted-foreground text-[10px] block">
              État Thermique &amp; Bridage Processeur (Throttling)
            </span>
            <div className="flex items-center gap-3 mt-1">
              <strong className="text-3xl font-mono font-extrabold text-destructive">
                {thermalStatus.estimatedTemp}°C
              </strong>
              <Badge
                variant="outline"
                className="font-mono text-xs text-destructive border-destructive/30 bg-destructive/10"
              >
                Perte de Vitesse : -{thermalStatus.performanceLoss}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              {thermalStatus.pasteDried
                ? "La pâte thermique d'usine s'est transformée en poudre sèche. Le ventilateur tourne à 100% et le processeur baisse sa fréquence pour ne pas griller."
                : "La pâte thermique est encore opérationnelle mais le radiateur accumule de la poussière."}
            </p>

            <div className="mt-4 space-y-2 border-t border-border pt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Forfait repâtage complet :</span>
                <strong className="font-mono text-primary font-bold">
                  {formatFcfa(thermalStatus.priceFcfa)}
                </strong>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Inclus : Démontage soigné, nettoyage solvant Isopropanol 99%, application Arctic
                MX-4 et test OCCT.
              </div>
            </div>
          </div>

          <Button
            asChild
            variant="technical"
            className="w-full font-bold uppercase tracking-wider text-xs"
          >
            <a
              href={`https://wa.me/22960000000?text=${encodeURIComponent(
                `Bonjour Allô Techno, je souhaite planifier un entretien thermique (dépoussiérage + repâtage Arctic MX-4 à ${formatFcfa(
                  thermalStatus.priceFcfa,
                )}) pour mon PC/Mac.`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Réserver mon Forfait Rafraîchissement Thermique &rarr;
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
