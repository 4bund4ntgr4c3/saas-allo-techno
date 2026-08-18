import * as React from "react";
import { Zap, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";
import {
  getHardwareUpgradePlanFn,
  type HardwareUpgradeRecommendation,
} from "@/lib/hardware-upgrade-copilot.functions";

export function HardwareUpgradeCopilotModal() {
  const formTopRef = React.useRef<HTMLDivElement>(null);
  const [deviceType, setDeviceType] = React.useState<"pc_portable" | "macbook" | "pc_bureau_tour">(
    "pc_portable",
  );
  const [currentRamGb, setCurrentRamGb] = React.useState<number>(8);
  const [currentStorageType, setCurrentStorageType] = React.useState<
    "hdd_mecanique" | "ssd_sata" | "ssd_nvme"
  >("hdd_mecanique");
  const primaryUsage = "bureautique";

  const [loading, setLoading] = React.useState(false);
  const [plan, setPlan] = React.useState<HardwareUpgradeRecommendation | null>(null);

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await getHardwareUpgradePlanFn({
        data: {
          deviceType,
          currentRamGb,
          currentStorageType,
          primaryUsage,
        },
      });
      setPlan(res);
      if (formTopRef.current) {
        formTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={formTopRef}
      className="border border-border bg-card p-5 sm:p-7 rounded-2xl max-w-2xl mx-auto space-y-6 shadow-xl animate-in fade-in duration-200"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Zap className="size-5 text-amber-500 shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Copilote IA d'Upgrade &amp; Boost Matériel
            </h3>
            <p className="text-xs text-muted-foreground">
              Diagnostic des lenteurs et plan d'optimisation sur mesure pour tripler la vitesse de
              votre PC
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-xs text-emerald-600 border-emerald-600/40 bg-emerald-600/10 font-bold"
        >
          Jusqu'à +350% Vitesse
        </Badge>
      </div>

      <form onSubmit={handleGeneratePlan} className="space-y-4 text-xs">
        <div>
          <label className="text-muted-foreground block mb-1">Type d'Ordinateur :</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "pc_portable", label: "PC Portable" },
              { id: "macbook", label: "Apple MacBook" },
              { id: "pc_bureau_tour", label: "PC Bureau Tour" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setDeviceType(t.id as "pc_portable" | "macbook" | "pc_bureau_tour")}
                className={`p-2 rounded-lg border text-center font-semibold transition-all ${
                  deviceType === t.id
                    ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-muted-foreground block mb-1">Mémoire RAM actuelle :</label>
            <div className="grid grid-cols-3 gap-2">
              {[4, 8, 16].map((ram) => (
                <button
                  key={ram}
                  type="button"
                  onClick={() => setCurrentRamGb(ram)}
                  className={`p-2 rounded-lg border text-center font-mono font-bold transition-all ${
                    currentRamGb === ram
                      ? "border-primary bg-primary text-primary-foreground shadow-xs"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {ram} Go
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-muted-foreground block mb-1">Type de stockage actuel :</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "hdd_mecanique", label: "Disque HDD" },
                { id: "ssd_sata", label: "SSD SATA" },
                { id: "ssd_nvme", label: "SSD NVMe" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() =>
                    setCurrentStorageType(s.id as "hdd_mecanique" | "ssd_sata" | "ssd_nvme")
                  }
                  className={`p-2 rounded-lg border text-center text-[10px] font-semibold transition-all ${
                    currentStorageType === s.id
                      ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          variant="technical"
          className="w-full font-bold uppercase tracking-wider text-xs h-9 mt-2"
        >
          {loading ? (
            <Loader2 className="size-4 mr-1.5 animate-spin" />
          ) : (
            <Sparkles className="size-4 mr-1.5" />
          )}
          {loading ? "Calcul de l'optimisation..." : "Générer mon Plan d'Upgrade IA"}
        </Button>
      </form>

      {plan && (
        <div className="space-y-4 pt-2 border-t border-border animate-in fade-in duration-200 text-xs">
          <div className="p-4 rounded-xl bg-surface/70 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-muted-foreground block">Diagnostic IA :</span>
              <strong className="text-foreground text-xs leading-snug">
                {plan.currentBottleneckSummary}
              </strong>
            </div>
            <Badge
              variant="outline"
              className="font-mono text-xs font-bold text-emerald-600 border-emerald-600/40 bg-emerald-600/10 shrink-0"
            >
              +{plan.speedGainPercent}% de Vitesse
            </Badge>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-foreground uppercase tracking-wide block text-xs">
              Packs d'Upgrade Recommandés :
            </span>

            {plan.recommendedUpgrades.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs"
              >
                <div className="space-y-0.5">
                  <strong className="text-foreground text-xs block">{item.component}</strong>
                  <p className="text-[11px] text-muted-foreground">{item.description}</p>
                  <span className="text-[10px] text-emerald-600 font-semibold block">
                    {item.benefit}
                  </span>
                </div>
                <strong className="font-mono text-sm font-extrabold text-primary shrink-0">
                  {formatFcfa(item.priceFcfa)}
                </strong>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-surface/80 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-muted-foreground block text-[11px]">
                Budget Total Pièces &amp; Pose Comprise :
              </span>
              <strong className="text-lg font-mono font-black text-primary">
                {formatFcfa(plan.totalBudgetFcfa)}
              </strong>
            </div>

            <Button asChild variant="technical" className="text-xs font-bold uppercase">
              <a
                href={`https://wa.me/22960000000?text=${encodeURIComponent(
                  `Bonjour Allô Techno, je souhaite réserver le pack d'upgrade complet pour mon PC (${formatFcfa(
                    plan.totalBudgetFcfa,
                  )}) afin de booster sa vitesse de +${plan.speedGainPercent}%.`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Réserver mon Upgrade en Atelier &rarr;
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
