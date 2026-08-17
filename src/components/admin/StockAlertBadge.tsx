import * as React from "react";
import { Package, ShoppingCart, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";
import {
  getLowStockAlertsFn,
  triggerSupplierRestockOrderFn,
  type StockItemAlert,
} from "@/lib/stock-alerts.functions";

export function StockAlertBadge() {
  const [alerts, setAlerts] = React.useState<StockItemAlert[]>([]);
  const [urgentCount, setUrgentCount] = React.useState(0);
  const [totalBudget, setTotalBudget] = React.useState(0);
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [successOrders, setSuccessOrders] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    getLowStockAlertsFn()
      .then((res) => {
        setAlerts(res.alerts);
        setUrgentCount(res.urgentCount);
        setTotalBudget(res.totalRestockBudgetFcfa);
      })
      .catch(() => {});
  }, []);

  const handleOrder = async (item: StockItemAlert) => {
    const qty = item.minThreshold * 2 - item.currentStock;
    setLoadingId(item.id);
    try {
      const res = await triggerSupplierRestockOrderFn({
        data: {
          itemId: item.id,
          quantityToOrder: Math.max(1, qty),
        },
      });
      if (res.success) {
        setSuccessOrders((prev) => ({ ...prev, [item.id]: res.purchaseOrderId }));
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="border border-border bg-card p-5 sm:p-6 rounded-2xl space-y-5 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Package className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">
              Alertes de Stock &amp; Réapprovisionnement Atelier
            </h3>
            <p className="text-xs text-muted-foreground">
              Surveillance automatique des composants sous le seuil de sécurité
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`font-mono text-xs font-bold ${
              urgentCount > 0
                ? "border-destructive text-destructive bg-destructive/10"
                : "border-emerald-600 text-emerald-600 bg-emerald-600/10"
            }`}
          >
            {urgentCount} Réapprovisionnements Urgents
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.map((item) => {
          const isOrdered = Boolean(successOrders[item.id]);
          const qtyToOrder = item.minThreshold * 2 - item.currentStock;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                item.isUrgent
                  ? "border-destructive/30 bg-destructive/5"
                  : "border-border bg-surface/60"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                    {item.sku}
                  </span>
                  <h4 className="text-xs font-bold text-foreground">{item.name}</h4>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                  <span>
                    Stock actuel : <strong className="text-foreground">{item.currentStock}</strong>{" "}
                    / {item.minThreshold} (min)
                  </span>
                  <span>·</span>
                  <span>
                    Fournisseur :{" "}
                    <strong className="text-foreground">{item.preferredSupplier}</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Coût unitaire :{" "}
                    <strong className="font-mono text-foreground">
                      {formatFcfa(item.unitCostFcfa)}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                {isOrdered ? (
                  <Badge
                    variant="outline"
                    className="text-emerald-600 border-emerald-600/40 bg-emerald-600/10 text-xs py-1"
                  >
                    <CheckCircle2 className="size-3.5 mr-1" />
                    Cde {successOrders[item.id]} émise
                  </Badge>
                ) : (
                  <Button
                    variant={item.isUrgent ? "destructive" : "technical"}
                    size="sm"
                    disabled={loadingId === item.id}
                    onClick={() => handleOrder(item)}
                    className="text-xs font-bold uppercase tracking-wider h-8"
                  >
                    {loadingId === item.id ? (
                      <Loader2 className="size-3 mr-1 animate-spin" />
                    ) : (
                      <ShoppingCart className="size-3 mr-1" />
                    )}
                    Commander (+{qtyToOrder} pcs)
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border pt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>Budget estimé de réapprovisionnement complet :</span>
        <strong className="font-mono text-primary text-sm">{formatFcfa(totalBudget)}</strong>
      </div>
    </div>
  );
}
