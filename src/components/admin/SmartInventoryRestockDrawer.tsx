import * as React from "react";
import { PackageCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getWarehouseStocksFn,
  type WarehouseStockItem,
} from "@/lib/smart-inventory-restock.functions";

export function SmartInventoryRestockDrawer() {
  const [items, setItems] = React.useState<WarehouseStockItem[]>([]);
  const [alertsCount, setAlertsCount] = React.useState(0);
  const [totalUnits, setTotalUnits] = React.useState(0);

  const fetchStocks = React.useCallback(async () => {
    try {
      const res = await getWarehouseStocksFn();
      setItems(res.items);
      setAlertsCount(res.alertsCount);
      setTotalUnits(res.totalUnitsInHubs);
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  return (
    <div className="border border-border bg-card p-5 sm:p-6 rounded-2xl space-y-5 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <PackageCheck className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">
              Gestion Multi-Entrepôts &amp; Réapprovisionnement Automatique
            </h3>
            <p className="text-xs text-muted-foreground">
              Monitoring des stocks en direct entre Haie Vive, Calavi et Parakou avec alertes seuils
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {alertsCount > 0 && (
            <Badge
              variant="outline"
              className="font-mono text-xs font-bold text-destructive border-destructive/40 bg-destructive/10"
            >
              {alertsCount} Alertes Rupture
            </Badge>
          )}
          <Badge
            variant="outline"
            className="font-mono text-xs font-bold text-primary border-primary/40 bg-primary/10"
          >
            {totalUnits} Unités en Hubs
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const isCritical = item.reorderStatus === "reappro_auto_declenché";

          return (
            <div
              key={item.partSku}
              className={`p-4 rounded-xl border transition-all text-xs space-y-3 ${
                isCritical
                  ? "border-destructive/40 bg-destructive/5"
                  : "border-border bg-surface/60"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 mr-2">
                    {item.partSku}
                  </span>
                  <strong className="text-foreground text-xs">{item.partName}</strong>
                </div>

                {isCritical ? (
                  <Badge
                    variant="outline"
                    className="text-destructive border-destructive/40 bg-destructive/10 text-[10px] font-bold"
                  >
                    <AlertTriangle className="size-3 mr-1" /> Commande Fournisseur Déclenchée (+
                    {item.recommendedOrderUnits} pcs)
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-emerald-600 border-emerald-600/40 bg-emerald-600/10 text-[10px] font-bold"
                  >
                    <CheckCircle2 className="size-3 mr-1" /> Stock Nominal
                  </Badge>
                )}
              </div>

              {/* Warehouse Breakdown Grid */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-card border border-border">
                  <span className="text-[10px] text-muted-foreground block">Hub Haie Vive</span>
                  <strong className="font-mono text-foreground font-bold">
                    {item.haieViveStock} pcs
                  </strong>
                </div>

                <div className="p-2 rounded-lg bg-card border border-border">
                  <span className="text-[10px] text-muted-foreground block">Hub Calavi</span>
                  <strong className="font-mono text-foreground font-bold">
                    {item.calaviStock} pcs
                  </strong>
                </div>

                <div className="p-2 rounded-lg bg-card border border-border">
                  <span className="text-[10px] text-muted-foreground block">Hub Parakou</span>
                  <strong className="font-mono text-foreground font-bold">
                    {item.parakouStock} pcs
                  </strong>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-muted-foreground pt-1">
                <span>
                  Fournisseur Agréé :{" "}
                  <strong className="text-foreground">{item.preferredSupplier}</strong>
                </span>
                <span>
                  Seuil de sécurité global : <strong>{item.safetyThreshold} pcs</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
