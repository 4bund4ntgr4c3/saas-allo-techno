import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import {
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";
import {
  getEnterpriseBranchesFn,
  type EnterpriseBranch,
} from "@/lib/enterprise-branches.functions";

export const Route = createFileRoute(
  "/$locale/app/organizations/$orgId/branches",
)({
  component: EnterpriseBranchesPage,
});

function EnterpriseBranchesPage() {
  const params = Route.useParams();
  const [branches, setBranches] = React.useState<EnterpriseBranch[]>([]);
  const [totalFleet, setTotalFleet] = React.useState(0);

  React.useEffect(() => {
    getEnterpriseBranchesFn({ data: { orgId: params.orgId } })
      .then((res) => {
        setBranches(res.branches);
        setTotalFleet(res.totalFleetCount);
      })
      .catch(() => {});
  }, [params.orgId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-foreground">
              Gestion Multi-Filiales &amp; Succursales
            </h1>
            <Badge variant="outline" className="font-mono text-xs text-primary border-primary/40 bg-primary/10">
              {totalFleet} Postes Actifs
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Supervision budgétaire décentralisée, agences régionales et circuit d'approbation hiérarchique
          </p>
        </div>

        <Button variant="technical" size="sm" className="text-xs font-bold uppercase">
          <Plus className="size-3.5 mr-1" /> Nouvelle Succursale
        </Button>
      </div>

      {/* Branches List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {branches.map((b) => {
          const spendPercent = Math.min(100, (b.currentMonthSpentFcfa / b.monthlyBudgetCapFcfa) * 100);
          return (
            <div
              key={b.branchId}
              className="border border-border bg-card p-5 rounded-2xl space-y-4 shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {b.city}
                  </span>
                  {b.pendingApprovalsCount > 0 ? (
                    <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-600/40 bg-amber-600/10 font-bold">
                      <AlertCircle className="size-3 mr-1" /> {b.pendingApprovalsCount} Devis en Attente
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-600/40 bg-emerald-600/10">
                      <CheckCircle2 className="size-3 mr-1" /> Conforme
                    </Badge>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-sm text-foreground">{b.branchName}</h3>
                  <span className="text-xs text-muted-foreground block mt-0.5">
                    Responsable : {b.localManagerName}
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-border/60 text-xs">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Budget Consommé :</span>
                    <span className="font-mono font-bold text-foreground">
                      {formatFcfa(b.currentMonthSpentFcfa)} / {formatFcfa(b.monthlyBudgetCapFcfa)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        spendPercent > 80 ? "bg-amber-500" : "bg-primary"
                      }`}
                      style={{ width: `${spendPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Parc de l'agence :</span>
                <strong className="font-mono font-bold text-foreground">{b.activeFleetCount} PC &amp; Mac</strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
