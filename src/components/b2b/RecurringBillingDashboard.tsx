import * as React from "react";
import { CreditCard, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";
import {
  getB2bSubscriptionsFn,
  type RecurringSubscription,
} from "@/lib/recurring-billing-engine";

export function RecurringBillingDashboard() {
  const [subscriptions, setSubscriptions] = React.useState<RecurringSubscription[]>([]);
  const [totalMrr, setTotalMrr] = React.useState(0);
  const [collectionRate, setCollectionRate] = React.useState(100);

  React.useEffect(() => {
    getB2bSubscriptionsFn().then((res) => {
      setSubscriptions(res.subscriptions);
      setTotalMrr(res.totalMrrFcfa);
      setCollectionRate(res.collectionRatePercent);
    }).catch(() => {});
  }, []);

  return (
    <div className="border border-border bg-card p-5 sm:p-6 rounded-2xl space-y-5 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <CreditCard className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">
              Gestionnaire d'Abonnements B2B &amp; Facturation e-MECeF
            </h3>
            <p className="text-xs text-muted-foreground">
              Prélèvements récurrents MoMo/Bancaires et normalisation fiscale automatique DGI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs font-bold text-emerald-600 border-emerald-600/40 bg-emerald-600/10">
            Recouvrement : {collectionRate}%
          </Badge>
          <Badge variant="outline" className="font-mono text-xs font-bold text-primary border-primary/40 bg-primary/10">
            MRR : {formatFcfa(totalMrr)} / mois
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        {subscriptions.map((sub) => (
          <div
            key={sub.subscriptionId}
            className="p-4 rounded-xl border border-border bg-surface/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                  {sub.subscriptionId}
                </span>
                <strong className="text-xs text-foreground">{sub.clientCompanyName}</strong>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  IFU : {sub.clientIfu}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                <span>Formule : <strong className="text-foreground">{sub.planName}</strong></span>
                <span>·</span>
                <span>Dernière e-MECeF : <strong className="font-mono text-foreground">{sub.lastInvoiceMecefCode}</strong></span>
                <span>·</span>
                <span>Prochain prélèvement : <strong className="text-foreground">{sub.nextBillingDate}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <strong className="text-sm font-mono font-bold text-primary block">
                  {formatFcfa(sub.monthlyAmountFcfa)}
                </strong>
                <span className="text-[10px] text-muted-foreground capitalize">{sub.billingCycle}</span>
              </div>

              <Badge variant="outline" className="text-emerald-600 border-emerald-600/40 bg-emerald-600/10 text-xs">
                <CheckCircle2 className="size-3 mr-1" /> Prélèvement Actif
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
