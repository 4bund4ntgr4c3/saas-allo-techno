import { Leaf, FileDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatFcfa } from "@/data/catalog/company";
import { generateEsgReportPdf } from "@/lib/esg-pdf";
import type { Organization } from "@/lib/org.functions";
import type { EsgMetrics } from "@/lib/esg.functions";

export interface EsgMetricsData {
  repairedUnitsCount?: number;
  reportPeriod: string;
  co2EmissionsAvoidedKg: number;
  electronicWasteSavedKg: number;
  circularEconomyScorePercent: number;
  financialSavingsFcfa: number;
}

export interface EsgMetricsCardProps {
  metrics: EsgMetricsData;
  organization?: Organization | null;
}

export function EsgMetricsCard({ metrics, organization }: EsgMetricsCardProps) {
  const handleDownloadPdf = () => {
    if (!organization) return;
    const fullMetrics: EsgMetrics = {
      repairedUnitsCount: metrics.repairedUnitsCount ?? 18,
      reportPeriod: metrics.reportPeriod,
      co2EmissionsAvoidedKg: metrics.co2EmissionsAvoidedKg,
      electronicWasteSavedKg: metrics.electronicWasteSavedKg,
      circularEconomyScorePercent: metrics.circularEconomyScorePercent,
      financialSavingsFcfa: metrics.financialSavingsFcfa,
    };
    generateEsgReportPdf(organization, fullMetrics);
  };

  return (
    <div className="border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-3 rounded-lg shadow-xs animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-3">
        <div className="flex items-center gap-2">
          <Leaf className="size-5 text-emerald-600 shrink-0" />
          <h3 className="font-bold text-sm uppercase tracking-wider text-emerald-950 dark:text-emerald-200">
            Bilan Carbone &amp; Impact RSE Entreprise
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-emerald-600/40 text-emerald-600 bg-emerald-500/10 font-mono text-[10px]"
          >
            {metrics.reportPeriod}
          </Badge>
          {organization && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              className="h-7 text-xs font-mono border-emerald-600/40 text-emerald-700 hover:bg-emerald-600 hover:text-white"
            >
              <FileDown className="mr-1.5 size-3.5" />
              Télécharger Rapport PDF
            </Button>
          )}
        </div>
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
