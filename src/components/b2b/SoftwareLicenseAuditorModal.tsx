import * as React from "react";
import { FileCheck, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";
import {
  auditSoftwareLicensesFn,
  type SoftwareAuditReport,
} from "@/lib/software-license-auditor.functions";

export function SoftwareLicenseAuditorModal() {
  const formTopRef = React.useRef<HTMLDivElement>(null);
  const [companyName, setCompanyName] = React.useState("Port Autonome de Cotonou (PAC)");
  const [deviceCount, setDeviceCount] = React.useState<number>(40);
  const [loading, setLoading] = React.useState(false);
  const [report, setReport] = React.useState<SoftwareAuditReport | null>(null);

  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await auditSoftwareLicensesFn({
        data: {
          companyName,
          deviceCount,
        },
      });
      setReport(res);
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
      className="border border-border bg-card p-5 sm:p-7 rounded-2xl max-w-3xl mx-auto space-y-6 shadow-xl animate-in fade-in duration-200"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <FileCheck className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Audit de Conformité Licences &amp; SAM DSI
            </h3>
            <p className="text-xs text-muted-foreground">
              Détection des versions pirates/expirées et devis de régularisation en licences
              officielles
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-xs text-amber-600 border-amber-600/40 bg-amber-600/10 font-bold"
        >
          Audit SAM Express
        </Badge>
      </div>

      <form onSubmit={handleRunAudit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-muted-foreground block mb-1">Nom de l'Organisation :</label>
            <Input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>

          <div>
            <label className="text-muted-foreground block mb-1">
              Nombre d'ordinateurs du parc :
            </label>
            <Input
              type="number"
              min={1}
              max={1000}
              required
              value={deviceCount}
              onChange={(e) => setDeviceCount(Number(e.target.value))}
              className="font-mono font-bold"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          variant="technical"
          className="w-full font-bold uppercase tracking-wider text-xs h-9 mt-1"
        >
          {loading ? (
            <Loader2 className="size-4 mr-1.5 animate-spin" />
          ) : (
            <Sparkles className="size-4 mr-1.5" />
          )}
          {loading ? "Audit du parc en cours..." : "Lancer l'Audit de Conformité des Licences"}
        </Button>
      </form>

      {report && (
        <div className="space-y-5 pt-2 border-t border-border animate-in fade-in duration-200 text-xs">
          {/* Summary Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-destructive/40 bg-destructive/5 space-y-1">
              <span className="text-[10px] text-destructive font-bold block">
                Score de Conformité
              </span>
              <strong className="font-mono text-xl font-extrabold text-destructive block">
                {report.complianceScorePercent}%
              </strong>
              <span className="text-[10px] text-destructive">Risque de pénalité éditeur</span>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-surface/60 space-y-1">
              <span className="text-[10px] text-muted-foreground block">
                Budget Régularisation OEM
              </span>
              <strong className="font-mono text-xl font-extrabold text-primary block">
                {formatFcfa(report.totalRegularizationBudgetFcfa)}
              </strong>
              <span className="text-[10px] text-muted-foreground">Licences officielles à vie</span>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-surface/60 space-y-1">
              <span className="text-[10px] text-muted-foreground block">
                Risque d'Amende Évitée
              </span>
              <strong className="font-mono text-xl font-extrabold text-emerald-600 block">
                {formatFcfa(report.potentialFineRiskFcfa)}
              </strong>
              <span className="text-[10px] text-muted-foreground">Sanction juridique DGI/BSA</span>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="space-y-2">
            <span className="font-bold text-foreground uppercase tracking-wide block text-xs">
              Détail par Logiciel &amp; Licences Manquantes :
            </span>

            <div className="space-y-2.5">
              {report.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs"
                >
                  <div className="space-y-0.5">
                    <strong className="text-foreground text-xs block">{item.softwareName}</strong>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-emerald-600 font-medium">
                        {item.legitimateLicensedCount} conformes
                      </span>
                      <span className="text-destructive font-bold">
                        · {item.unlicensedPiratedCount} non conformes
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        item.complianceRiskLevel === "critique"
                          ? "text-destructive border-destructive/30 bg-destructive/5 text-[10px]"
                          : "text-amber-600 border-amber-600/30 bg-amber-600/5 text-[10px]"
                      }
                    >
                      {item.complianceRiskLevel === "critique" ? "Risque Élevé" : "Risque Moyen"}
                    </Badge>
                    <strong className="font-mono text-sm text-primary">
                      {formatFcfa(item.unlicensedPiratedCount * item.regularizationUnitCostFcfa)}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <Button
            asChild
            variant="technical"
            className="w-full font-bold uppercase tracking-wider text-xs h-9"
          >
            <a
              href={`https://wa.me/22960000000?text=${encodeURIComponent(
                `Bonjour Allô Techno Licences, nous souhaitons commander le pack de régularisation SAM (${formatFcfa(
                  report.totalRegularizationBudgetFcfa,
                )}) pour ${report.organizationName}.`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Commander les Licences Officielles &rarr;
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
