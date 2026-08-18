import * as React from "react";
import { Recycle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getEwasteLedgerFn, type EwasteScrapBatch } from "@/lib/green-ewaste-ledger.functions";

export function GreenEwasteLedgerDrawer() {
  const [batches, setBatches] = React.useState<EwasteScrapBatch[]>([]);
  const [totalGold, setTotalGold] = React.useState(0);
  const [totalKg, setTotalKg] = React.useState(0);

  React.useEffect(() => {
    getEwasteLedgerFn()
      .then((res) => {
        setBatches(res.batches);
        setTotalGold(res.totalGoldGramsAllTime);
        setTotalKg(res.totalKgProcessed);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="border border-border bg-card p-5 sm:p-6 rounded-2xl space-y-5 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Recycle className="size-5 text-emerald-600 shrink-0" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">
              Registre DEEE &amp; Valorisation Métaux Précieux
            </h3>
            <p className="text-xs text-muted-foreground">
              Traçabilité des cartes mères recyclées et pesée certifiée de l'or, cuivre et tantale
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="font-mono text-xs font-bold text-amber-600 border-amber-600/40 bg-amber-600/10"
          >
            {totalGold}g d'Or Pur Récupéré
          </Badge>
          <Badge
            variant="outline"
            className="font-mono text-xs font-bold text-emerald-600 border-emerald-600/40 bg-emerald-600/10"
          >
            {totalKg} kg DEEE Recyclés
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        {batches.map((batch) => (
          <div
            key={batch.batchId}
            className="p-4 rounded-xl border border-border bg-surface/60 space-y-3 shadow-xs text-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold text-emerald-600 bg-emerald-600/10 px-1.5 py-0.5 rounded border border-emerald-600/20">
                  {batch.batchId}
                </span>
                <strong className="text-foreground">{batch.sourceType}</strong>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">
                Date : {batch.recycledDate} · Poids brut : <strong>{batch.totalWeightKg} kg</strong>
              </span>
            </div>

            {/* Extracted Metals Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-card border border-border">
                <span className="text-[10px] text-muted-foreground block">Or (Au)</span>
                <strong className="font-mono text-amber-500 font-bold">
                  {batch.extractedPreciousMetals.goldGrams} g
                </strong>
              </div>

              <div className="p-2 rounded-lg bg-card border border-border">
                <span className="text-[10px] text-muted-foreground block">Argent (Ag)</span>
                <strong className="font-mono text-slate-400 font-bold">
                  {batch.extractedPreciousMetals.silverGrams} g
                </strong>
              </div>

              <div className="p-2 rounded-lg bg-card border border-border">
                <span className="text-[10px] text-muted-foreground block">Cuivre (Cu)</span>
                <strong className="font-mono text-orange-600 font-bold">
                  {batch.extractedPreciousMetals.copperGrams / 1000} kg
                </strong>
              </div>

              <div className="p-2 rounded-lg bg-card border border-border">
                <span className="text-[10px] text-muted-foreground block">Tantale (Ta)</span>
                <strong className="font-mono text-blue-500 font-bold">
                  {batch.extractedPreciousMetals.tantalumGrams} g
                </strong>
              </div>
            </div>

            <div className="bg-background p-2 rounded-lg border border-border flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span>Fonderie Agréée : {batch.destinationSmelter}</span>
              <span className="text-emerald-600 font-bold">
                {batch.officialRseCertificateNumber}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
