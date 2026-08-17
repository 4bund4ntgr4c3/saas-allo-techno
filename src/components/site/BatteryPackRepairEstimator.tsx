import * as React from "react";
import { BatteryCharging, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";
import {
  estimateBatteryRepair,
  type BatteryPackType,
  type BatteryServiceType,
} from "@/lib/battery-pack-repair";

export function BatteryPackRepairEstimator() {
  const [pack, setPack] = React.useState<BatteryPackType>("trottinette_36v");
  const [service, setService] = React.useState<BatteryServiceType>("recellage_integral");

  const estimate = React.useMemo(() => {
    return estimateBatteryRepair(pack, service);
  }, [pack, service]);

  return (
    <div className="border border-border bg-card p-5 sm:p-7 rounded-2xl space-y-6 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <BatteryCharging className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Laboratoire Batteries Lithium &amp; Recellage
            </h3>
            <p className="text-xs text-muted-foreground">
              Reconditionnement de packs de batteries pour trottinettes, VAE, drones et stations solaires
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] text-emerald-600 border-emerald-600/40 bg-emerald-600/10">
          Garantie Jusqu'à 12 Mois
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-6 space-y-4">
          <div>
            <span className="at-eyebrow text-[10px] text-muted-foreground block mb-2">1. Type d'Équipement Lithium</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "trottinette_36v", label: "Trottinette Électrique (36V/48V)" },
                { id: "velo_vae_48v", label: "Vélo Électrique VAE (48V)" },
                { id: "drone_lipo_6s", label: "Drone Agricole / Vidéo (LiPo 6S)" },
                { id: "station_solaire_lifepo4", label: "Station Solaire (LiFePO4)" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPack(p.id as BatteryPackType)}
                  className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all ${
                    pack === p.id
                      ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="at-eyebrow text-[10px] text-muted-foreground block mb-2">2. Prestation Technique Requise</span>
            <div className="space-y-2">
              {[
                {
                  id: "diagnostic_capacite",
                  title: "Test de Capacité & Résistance Interne",
                  desc: "Mesure précise de la dégradation chimique en Wh.",
                },
                {
                  id: "equilibrage_cellules",
                  title: "Équilibrage Actif des Tensions",
                  desc: "Harmonisation des cellules décalées pour retrouver l'autonomie d'origine.",
                },
                {
                  id: "remplacement_bms",
                  title: "Remplacement Carte BMS de Protection",
                  desc: "Installation d'un contrôleur BMS neuf avec sonde thermique.",
                },
                {
                  id: "recellage_integral",
                  title: "Recellage Complet avec Cellules Neuves Samsung/LG",
                  desc: "Remplacement à 100% de toutes les cellules lithium par des éléments Grade A.",
                },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setService(s.id as BatteryServiceType)}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${
                    service === s.id
                      ? "border-primary bg-primary/10 shadow-xs"
                      : "border-border bg-surface hover:border-border/80"
                  }`}
                >
                  <h4 className="text-xs font-bold text-foreground">{s.title}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Estimation Box */}
        <div className="lg:col-span-6 border border-border bg-surface/50 p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <span className="at-eyebrow text-muted-foreground text-[10px] block">
              Estimation Forfaitaire de Réparation
            </span>
            <strong className="text-2xl sm:text-3xl font-mono font-extrabold text-primary block mt-1">
              {formatFcfa(estimate.estimatedPriceFcfa.min)} — {formatFcfa(estimate.estimatedPriceFcfa.max)}
            </strong>
            <p className="text-xs text-muted-foreground mt-1">
              Soudure par points professionnelle sous bande nickel pure (pas d'échauffement thermique).
            </p>

            <div className="mt-4 space-y-2.5 border-t border-border pt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Technologie employée :</span>
                <span className="font-semibold text-foreground text-right max-w-[200px]">{estimate.cellTechnology}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Délai d'intervention :</span>
                <span className="font-mono font-bold text-foreground">{estimate.turnaroundDays}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-bold">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="size-3.5" /> Garantie Atelier :
                </span>
                <span>{estimate.warrantyMonths} Mois Pièces &amp; Main d'Œuvre</span>
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
                `Bonjour Allô Techno Laboratoire Énergie, je souhaite faire réviser un pack batterie lithium : "${pack}" avec prestation "${service}".`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Déposer mon Pack Batterie au Laboratoire &rarr;
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
