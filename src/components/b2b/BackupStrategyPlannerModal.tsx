import * as React from "react";
import { HardDrive, Cloud, Lock, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";

export function BackupStrategyPlannerModal() {
  const [dataVolumeTb, setDataVolumeTb] = React.useState<number>(2);

  const estimate = React.useMemo(() => {
    const nasHardwareCost = dataVolumeTb <= 2 ? 380000 : dataVolumeTb <= 8 ? 650000 : 1200000;
    const monthlyCloudCost = dataVolumeTb * 9500; // ~9 500 FCFA/To/mois chiffré
    const setupFee = 150000;

    return {
      nasHardwareCost,
      monthlyCloudCost,
      setupFee,
      totalInitial: nasHardwareCost + setupFee,
    };
  }, [dataVolumeTb]);

  return (
    <div className="border border-border bg-card p-5 sm:p-7 rounded-2xl max-w-xl mx-auto space-y-6 shadow-xl animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <HardDrive className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Planificateur de Sauvegarde 3-2-1 Anti-Ransomware
            </h3>
            <p className="text-xs text-muted-foreground">
              Architecture de résilience conforme aux exigences ISO 27001 et APDP
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-[10px] text-emerald-600 border-emerald-600/40 bg-emerald-600/10"
        >
          Règle d'Or 3-2-1
        </Badge>
      </div>

      {/* ─── Capacity Selector ─── */}
      <div className="space-y-2 text-xs">
        <label className="font-bold text-foreground block text-[11px]">
          1. Volume de Données Métier &amp; Comptables à Sécuriser :
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { tb: 1, label: "1 To (~10 PC)" },
            { tb: 2, label: "2 To (PME)" },
            { tb: 8, label: "8 To (Cabinet)" },
            { tb: 20, label: "20 To (Siège)" },
          ].map((item) => (
            <button
              key={item.tb}
              type="button"
              onClick={() => setDataVolumeTb(item.tb)}
              className={`p-2.5 rounded-lg border text-center font-semibold transition-all ${
                dataVolumeTb === item.tb
                  ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 3 Pillars Architecture Breakdown ─── */}
      <div className="space-y-2.5 text-xs bg-surface/60 p-4 rounded-xl border border-border">
        <span className="font-bold text-foreground block text-[11px] uppercase tracking-wide">
          Composition du Schéma de Sauvegarde Certifié :
        </span>

        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-2 text-foreground">
            <Server className="size-4 text-primary shrink-0 mt-0.5" />
            <div>
              <strong>1. NAS Synology RAID Local :</strong> Serveur de stockage local 2 ou 4 baies
              avec disques IronWolf Pro.
            </div>
          </div>

          <div className="flex items-start gap-2 text-foreground">
            <Lock className="size-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>2. Snapshots Immuables (WORM) :</strong> Verrouillage Btrfs empêchant tout
              rançongiciel d'effacer les historiques.
            </div>
          </div>

          <div className="flex items-start gap-2 text-foreground">
            <Cloud className="size-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong>3. Réplication Cloud Chiffrée AES-256 :</strong> Sauvegarde nocturne
              externalisée hors du Bénin.
            </div>
          </div>
        </div>
      </div>

      {/* ─── Pricing Summary ─── */}
      <div className="border border-border bg-surface/80 p-4 rounded-xl space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Investissement Matériel &amp; Déploiement :</span>
          <strong className="font-mono text-primary text-sm font-bold">
            {formatFcfa(estimate.totalInitial)}
          </strong>
        </div>
        <div className="flex justify-between items-center border-t border-border/60 pt-2">
          <span className="text-muted-foreground">
            Abonnement Cloud Chiffré ({dataVolumeTb} To) :
          </span>
          <strong className="font-mono text-emerald-600 font-bold">
            {formatFcfa(estimate.monthlyCloudCost)} / mois
          </strong>
        </div>
      </div>

      <Button
        asChild
        variant="technical"
        className="w-full font-bold uppercase tracking-wider text-xs h-9"
      >
        <a
          href={`https://wa.me/22960000000?text=${encodeURIComponent(
            `Bonjour Allô Techno Sauvegardes, nous souhaitons mettre en place un plan de sauvegarde 3-2-1 pour ${dataVolumeTb} To de données d'entreprise.`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Déployer ce Plan de Sauvegarde 3-2-1 &rarr;
        </a>
      </Button>
    </div>
  );
}
