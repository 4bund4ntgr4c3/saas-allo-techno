import { Leaf } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";

export interface EsgMetricsData {
  reportPeriod: string;
  co2EmissionsAvoidedKg: number;
  electronicWasteSavedKg: number;
  circularEconomyScorePercent: number;
  financialSavingsFcfa: number;
}

export interface EsgMetricsCardProps {
  metrics: EsgMetricsData;
}

export function EsgMetricsCard({ metrics }: EsgMetricsCardProps) {
  return (
    <div className="border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-3 rounded-lg shadow-xs animate-in fade-in duration-150">
      <div className="flex items-center justify-between gap-3 border-b border-emerald-500/20 pb-3">
        <div className="flex items-center gap-2">
          <Leaf className="size-5 text-emerald-600" />
          <h3 className="font-bold text-sm uppercase tracking-wider text-emerald-950 dark:text-emerald-200">
            Bilan Carbone &amp; Impact RSE Entreprise
          </h3>
        </div>
        <Badge
          variant="outline"
          className="border-emerald-600/40 text-emerald-600 bg-emerald-500/10 font-mono text-[10px]"
        >
          {metrics.reportPeriod}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="border border-emerald-500/20 bg-background/60 p-3 rounded-md">
          <span className="at-eyebrow text-[10px] text-muted-foreground block mb-1">
            Émissions CO₂ Évitées
          </span>
          <span className="font-mono text-2xl font-extrabold text-emerald-600">
            {metrics.co2EmissionsAvoidedKg} kg
          </span>
          <span className="text-[10px] text-muted-foreground block mt-0.5">
            Équivalent fabrication neuve
          </span>
        </div>
        <div className="border border-emerald-500/20 bg-background/60 p-3 rounded-md">
          <span className="at-eyebrow text-[10px] text-muted-foreground block mb-1">
            Déchets Électroniques Évités
          </span>
          <span className="font-mono text-2xl font-extrabold text-emerald-600">
            {metrics.electronicWasteSavedKg} kg
          </span>
          <span className="text-[10px] text-muted-foreground block mt-0.5">
            Recyclage &amp; Reconditionnement
          </span>
        </div>
        <div className="border border-emerald-500/20 bg-background/60 p-3 rounded-md">
          <span className="at-eyebrow text-[10px] text-muted-foreground block mb-1">
            Taux d'Économie Circulaire
          </span>
          <span className="font-mono text-2xl font-extrabold text-emerald-600">
            {metrics.circularEconomyScorePercent}%
          </span>
          <span className="text-[10px] text-muted-foreground block mt-0.5">
            Défense du cycle de vie
          </span>
        </div>
        <div className="border border-emerald-500/20 bg-background/60 p-3 rounded-md">
          <span className="at-eyebrow text-[10px] text-muted-foreground block mb-1">
            Économies Financières CAPEX
          </span>
          <span className="font-mono text-xl font-extrabold text-primary">
            {formatFcfa(metrics.financialSavingsFcfa)}
          </span>
          <span className="text-[10px] text-muted-foreground block mt-0.5">
            vs réapprovisionnement neuf
          </span>
        </div>
      </div>
    </div>
  );
}
