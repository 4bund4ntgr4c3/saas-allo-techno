import * as React from "react";
import { Zap, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";

export function EnergyAuditCalculator() {
  const [desktopCount, setDesktopCount] = React.useState(15);
  const [laptopCount, setLaptopCount] = React.useState(25);
  const [hoursPerDay, setHoursPerDay] = React.useState(9);
  const sbeeKwhRateFcfa = 125; // Tarif moyen SBEE Moyenne Tension Professionnel au Bénin

  // Consommation estimée : Desktop moyen = 220W, Laptop moyen = 45W
  const annualKwhCurrent = React.useMemo(() => {
    const dailyWatts = (desktopCount * 220 + laptopCount * 45) * hoursPerDay;
    const workingDaysYear = 260;
    return Math.round((dailyWatts * workingDaysYear) / 1000);
  }, [desktopCount, laptopCount, hoursPerDay]);

  const annualBillCurrentFcfa = React.useMemo(() => {
    return annualKwhCurrent * sbeeKwhRateFcfa;
  }, [annualKwhCurrent, sbeeKwhRateFcfa]);

  // Économies avec révision thermique Allô Techno & migration progressive laptops : ~35% de réduction
  const annualSavingsFcfa = React.useMemo(() => {
    return Math.round(annualBillCurrentFcfa * 0.35);
  }, [annualBillCurrentFcfa]);

  const co2SavedKg = React.useMemo(() => {
    // Facteur d'émission moyen réseau électrique Bénin/CEDEAO : ~0.55 kg CO2 / kWh
    return Math.round(annualKwhCurrent * 0.35 * 0.55);
  }, [annualKwhCurrent]);

  return (
    <div className="border border-border bg-card p-5 sm:p-7 rounded-xl space-y-6 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Zap className="size-5 text-amber-500 shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Audit Énergétique Flotte &amp; Facture SBEE
            </h3>
            <p className="text-xs text-muted-foreground">
              Estimez les dépenses électriques de vos ordinateurs et les gains de sobriété
              énergétique
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-xs border-amber-500/40 text-amber-600 bg-amber-500/10"
        >
          Tarif SBEE Pro : {sbeeKwhRateFcfa} FCFA / kWh
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Controls */}
        <div className="lg:col-span-6 space-y-4">
          <div>
            <Label className="text-xs">Nombre d'ordinateurs fixes (Tours / Desktops 220W) :</Label>
            <Input
              type="number"
              min={0}
              max={500}
              className="mt-1.5 font-mono font-bold text-sm"
              value={desktopCount}
              onChange={(e) => setDesktopCount(Number(e.target.value))}
            />
          </div>

          <div>
            <Label className="text-xs">Nombre d'ordinateurs portables (Laptops 45W) :</Label>
            <Input
              type="number"
              min={0}
              max={500}
              className="mt-1.5 font-mono font-bold text-sm"
              value={laptopCount}
              onChange={(e) => setLaptopCount(Number(e.target.value))}
            />
          </div>

          <div>
            <Label className="text-xs">Heures d'utilisation moyenne par jour de bureau :</Label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {[8, 9, 11].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHoursPerDay(h)}
                  className={`p-2 rounded-lg border text-xs font-semibold ${
                    hoursPerDay === h
                      ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                      : "border-border bg-surface text-muted-foreground"
                  }`}
                >
                  {h} heures / jour
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Box */}
        <div className="lg:col-span-6 border border-emerald-600/30 bg-emerald-600/5 p-5 rounded-xl flex flex-col justify-between space-y-4">
          <div>
            <span className="at-eyebrow text-muted-foreground text-[10px] block">
              Économies d'Énergie Annuelles Estimées
            </span>
            <strong className="text-2xl sm:text-3xl font-mono font-extrabold text-foreground block mt-1">
              {formatFcfa(annualSavingsFcfa)} / an
            </strong>
            <p className="text-xs text-muted-foreground mt-1">
              Grâce à l'optimisation thermique, au dépoussiérage et aux réglages de gestion
              d'alimentation.
            </p>

            <div className="mt-4 space-y-2 border-t border-border/60 pt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Consommation annuelle globale :</span>
                <span className="font-mono font-bold text-foreground">
                  {annualKwhCurrent.toLocaleString()} kWh
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Facture brute annuelle SBEE :</span>
                <span className="font-mono text-destructive font-bold">
                  {formatFcfa(annualBillCurrentFcfa)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-emerald-600 pt-1 border-t border-border/40">
                <span className="flex items-center gap-1">
                  <Leaf className="size-3.5" /> Émissions de CO2 Évitées :
                </span>
                <span className="font-mono">~{co2SavedKg} kg CO2 eq</span>
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
                `Bonjour Allô Techno, nous souhaitons planifier un audit énergétique et thermique pour notre parc de ${desktopCount + laptopCount} ordinateurs.`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Réduire la Facture Électrique de notre Flotte &rarr;
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
