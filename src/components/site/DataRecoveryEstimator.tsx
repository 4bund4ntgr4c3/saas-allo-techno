import * as React from "react";
import { Database, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";
import {
  estimateDataRecovery,
  type StorageMedium,
  type DamageSeverity,
} from "@/lib/data-recovery";

export function DataRecoveryEstimator() {
  const [medium, setMedium] = React.useState<StorageMedium>("hdd_externe");
  const [severity, setSeverity] = React.useState<DamageSeverity>("logique_simple");

  const estimate = React.useMemo(() => {
    return estimateDataRecovery(medium, severity);
  }, [medium, severity]);

  return (
    <div className="border border-border bg-card p-5 sm:p-7 rounded-2xl space-y-6 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Database className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Laboratoire de Récupération de Données &amp; Salle Blanche
            </h3>
            <p className="text-xs text-muted-foreground">
              Estimez le coût et les délais de sauvetage de vos fichiers (photos, comptabilité, thèses)
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] text-emerald-600 border-emerald-600/40 bg-emerald-600/10">
          Taux de Réussite : {estimate.successRatePercent}%
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-6 space-y-4">
          <div>
            <span className="at-eyebrow text-[10px] text-muted-foreground block mb-2">1. Type de Support de Stockage</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "hdd_externe", label: "Disque Dur Externe USB" },
                { id: "hdd_interne", label: "Disque Dur PC / Mac (HDD)" },
                { id: "ssd_nvme", label: "SSD NVMe / M.2" },
                { id: "cle_usb", label: "Clé USB / Carte SD" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMedium(m.id as StorageMedium)}
                  className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all ${
                    medium === m.id
                      ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="at-eyebrow text-[10px] text-muted-foreground block mb-2">2. Type de Panne Constatée</span>
            <div className="space-y-2">
              {[
                {
                  id: "logique_simple",
                  title: "Panne Logique (Suppression, Formatage, Virus)",
                  desc: "Le disque tourne normalement mais les fichiers ne sont plus visibles.",
                },
                {
                  id: "electronique_pcb",
                  title: "Panne Électronique (Ne s'allume plus, odeur de brûlé)",
                  desc: "Le disque n'est pas alimenté ou court-circuit sur la carte mère PCB.",
                },
                {
                  id: "mecanique_salle_blanche",
                  title: "Panne Mécanique / Choc (Bruit de claquement 'Clic-Clic')",
                  desc: "Têtes de lecture bloquées ou endommagées après une chute au sol.",
                },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSeverity(s.id as DamageSeverity)}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${
                    severity === s.id
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
              Estimation Forfaitaire de Sauvetage
            </span>
            <strong className="text-2xl sm:text-3xl font-mono font-extrabold text-primary block mt-1">
              {formatFcfa(estimate.estimatedPriceFcfa.min)} — {formatFcfa(estimate.estimatedPriceFcfa.max)}
            </strong>
            <p className="text-xs text-muted-foreground mt-1">
              Garantie « Zéro Donnée Récupérée = Zéro Franc Facturé ».
            </p>

            <div className="mt-4 space-y-2.5 border-t border-border pt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Procédé technique :</span>
                <span className="font-semibold text-foreground text-right max-w-[200px]">{estimate.laboratoryTechnique}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Délai moyen d'extraction :</span>
                <span className="font-mono font-bold text-foreground">{estimate.turnaroundDays}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-bold">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="size-3.5" /> Confidentialité Garantie :
                </span>
                <span>Accord NDA &amp; Chiffrement</span>
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
                `Bonjour Allô Techno Laboratoire, je souhaite déposer un support pour récupération de données : "${medium}" avec panne "${severity}".`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Déposer mon Disque en Laboratoire &rarr;
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
