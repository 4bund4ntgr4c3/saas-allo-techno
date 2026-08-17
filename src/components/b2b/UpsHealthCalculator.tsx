import * as React from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function UpsHealthCalculator() {
  const [loadWatts, setLoadWatts] = React.useState(350); // ex: 2 PC + 1 écran + Box
  const [upsVa, setUpsVa] = React.useState<number>(1000); // 1000 VA = ~600W

  const runtimeMinutes = React.useMemo(() => {
    // Formule empirique UPS : runtime = (Capacité batterie Wh * Rendement 0.8) / Charge Watts * 60
    // 650VA =~ 84Wh, 1000VA =~ 144Wh, 2000VA =~ 288Wh, 3000VA =~ 432Wh
    let batteryWh = 144;
    if (upsVa === 650) batteryWh = 84;
    else if (upsVa === 1000) batteryWh = 144;
    else if (upsVa === 2000) batteryWh = 288;
    else if (upsVa === 3000) batteryWh = 432;

    const usefulWh = batteryWh * 0.8;
    const minutes = (usefulWh / Math.max(50, loadWatts)) * 60;
    return Math.max(2, Math.round(minutes));
  }, [loadWatts, upsVa]);

  const maxPowerWatts = Math.round(upsVa * 0.6);
  const isOverloaded = loadWatts > maxPowerWatts;

  return (
    <div className="border border-border bg-card p-5 sm:p-7 rounded-2xl space-y-6 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Zap className="size-5 text-amber-500 shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Simulateur d'Autonomie Onduleur (UPS) &amp; Relais SBEE
            </h3>
            <p className="text-xs text-muted-foreground">
              Calculez le temps de sauvegarde de vos ordinateurs et serveurs en cas de coupure de courant
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] text-amber-600 border-amber-600/40 bg-amber-600/10 font-bold">
          Protection Surtensions
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Controls */}
        <div className="lg:col-span-6 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Consommation totale des appareils branchés (Watts) :
            </label>
            <Input
              type="number"
              min={50}
              max={3000}
              step={25}
              value={loadWatts}
              onChange={(e) => setLoadWatts(Number(e.target.value))}
              className="font-mono font-bold text-sm"
            />
            <span className="text-[10px] text-muted-foreground mt-1 block">
              Repères : 1 PC Portable (45W) · 1 Tour Bureau (200W) · 1 Écran (35W) · 1 Serveur (300W)
            </span>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">
              Modèle d'onduleur envisagé :
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { va: 650, label: "650 VA (390W Max)" },
                { va: 1000, label: "1 000 VA (600W Max)" },
                { va: 2000, label: "2 000 VA (1 200W Max)" },
                { va: 3000, label: "3 000 VA (1 800W Max)" },
              ].map((item) => (
                <button
                  key={item.va}
                  type="button"
                  onClick={() => setUpsVa(item.va)}
                  className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all ${
                    upsVa === item.va
                      ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Box */}
        <div className="lg:col-span-6 border border-border bg-surface/50 p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <span className="at-eyebrow text-muted-foreground text-[10px] block">
              Autonomie Estimée en Cas de Coupure Totale
            </span>
            <strong className={`text-3xl font-mono font-extrabold block mt-1 ${
              isOverloaded ? "text-destructive" : "text-emerald-600"
            }`}>
              {isOverloaded ? "SURCHARGE DÉTECTÉE" : `~${runtimeMinutes} Minutes`}
            </strong>
            <p className="text-xs text-muted-foreground mt-1">
              {isOverloaded
                ? `La charge (${loadWatts}W) dépasse la capacité maximale de l'onduleur (${maxPowerWatts}W). Choisissez un modèle supérieur.`
                : "Temps largement suffisant pour sauvegarder vos documents et basculer sur groupe électrogène."}
            </p>

            <div className="mt-4 space-y-2 border-t border-border pt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Charge de l'onduleur :</span>
                <span className="font-mono font-bold text-foreground">{Math.round((loadWatts / maxPowerWatts) * 100)}% de capacité</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Remplacement des batteries internes :</span>
                <span className="font-semibold text-foreground">Tous les 24 à 36 mois</span>
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
                `Bonjour Allô Techno, nous souhaitons commander un onduleur ${upsVa} VA pour protéger nos équipements (${loadWatts} Watts).`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Commander un Onduleur Certifié &rarr;
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
