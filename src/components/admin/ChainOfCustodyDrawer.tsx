import * as React from "react";
import { Lock, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getChainOfCustodyLogsFn,
  type EvidenceTransferEvent,
} from "@/lib/chain-of-custody.functions";

export function ChainOfCustodyDrawer() {
  const [records, setRecords] = React.useState<EvidenceTransferEvent[]>([]);

  React.useEffect(() => {
    getChainOfCustodyLogsFn()
      .then((res) => setRecords(res.records))
      .catch(() => {});
  }, []);

  return (
    <div className="border border-border bg-card p-5 sm:p-6 rounded-2xl space-y-5 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Lock className="size-5 text-destructive shrink-0" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">
              Chaîne de Garde Médicolégale &amp; Scellés Judiciaires
            </h3>
            <p className="text-xs text-muted-foreground">
              Traçabilité certifiée des pièces à conviction, transferts de main à main et hachage
              forensique
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-xs font-bold text-destructive border-destructive/40 bg-destructive/10"
        >
          Norme ISO/IEC 27037 Forensics
        </Badge>
      </div>

      <div className="space-y-3">
        {records.map((rec) => (
          <div
            key={rec.eventId}
            className="p-4 rounded-xl border border-border bg-surface/60 space-y-3 shadow-xs text-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded border border-destructive/20">
                  {rec.evidenceId}
                </span>
                <strong className="text-foreground">{rec.deviceDescription}</strong>
              </div>
              <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono">
                S/N : {rec.serialNumber}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground text-[11px]">
              <div>
                <span className="block text-[10px] text-muted-foreground">Cédant (Origine) :</span>
                <strong className="text-foreground">{rec.sourceCustodian}</strong>
              </div>
              <div>
                <span className="block text-[10px] text-muted-foreground">
                  Dépositaire Actuel :
                </span>
                <strong className="text-foreground">{rec.targetCustodian}</strong>
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground">
              <span>
                Motif : <strong className="text-foreground">{rec.reasonForTransfer}</strong>
              </span>
              <span> · {rec.timestamp}</span>
            </div>

            <div className="bg-background p-2.5 rounded-lg border border-border flex items-center gap-2 text-[10px] font-mono text-muted-foreground overflow-x-auto">
              <Hash className="size-3 text-destructive shrink-0" />
              <span className="text-foreground font-bold shrink-0">
                Scellé : {rec.securityBagSealNumber}
              </span>
              <span className="truncate text-muted-foreground">({rec.sha256SealHash})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
