import * as React from "react";
import { Lock, CheckCircle2, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getPrivacyRecordsFn, type PrivacyRecord } from "@/lib/privacy-compliance-vault";

export function PrivacyVaultDrawer() {
  const [records, setRecords] = React.useState<PrivacyRecord[]>([]);

  React.useEffect(() => {
    getPrivacyRecordsFn()
      .then((res) => setRecords(res.records))
      .catch(() => {});
  }, []);

  return (
    <div className="border border-border bg-card p-5 sm:p-6 rounded-2xl space-y-5 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Lock className="size-5 text-emerald-600 shrink-0" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">
              Coffre-Fort Cryptographique &amp; Conformité APDP Bénin
            </h3>
            <p className="text-xs text-muted-foreground">
              Registre immuable des consentements et procès-verbaux de destruction de données
              (SHA-256)
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-xs font-bold text-emerald-600 border-emerald-600/40 bg-emerald-600/10"
        >
          Scellé NIST SP 800-88 Conforme
        </Badge>
      </div>

      <div className="space-y-3">
        {records.map((rec) => (
          <div
            key={rec.recordId}
            className="p-4 rounded-xl border border-border bg-surface/60 space-y-2 shadow-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                  {rec.recordId}
                </span>
                <strong className="text-xs text-foreground">{rec.clientName}</strong>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  {rec.clientType}
                </Badge>
              </div>

              <Badge
                variant="outline"
                className="text-emerald-600 border-emerald-600/40 bg-emerald-600/10 text-xs font-bold"
              >
                <CheckCircle2 className="size-3 mr-1" /> Scellé Inaltérable
              </Badge>
            </div>

            <div className="text-xs text-muted-foreground">
              Action Certifiée :{" "}
              <strong className="text-foreground">{rec.actionType.replace(/_/g, " ")}</strong> ·{" "}
              {rec.timestamp}
            </div>

            <div className="bg-background p-2.5 rounded-lg border border-border flex items-center gap-2 text-[11px] font-mono text-muted-foreground overflow-x-auto">
              <Hash className="size-3.5 text-primary shrink-0" />
              <span className="text-foreground font-bold shrink-0">Empreinte SHA-256 :</span>
              <span className="truncate">{rec.sha256ProofHash}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
