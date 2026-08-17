import * as React from "react";
import { Globe, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";
import { getSharedSparesCatalogFn, type SharedSparePart } from "@/lib/spares-exchange.functions";

export function SparesExchangeBoard() {
  const [spares, setSpares] = React.useState<SharedSparePart[]>([]);
  const [totalUnits, setTotalUnits] = React.useState(0);

  React.useEffect(() => {
    getSharedSparesCatalogFn()
      .then((res) => {
        setSpares(res.spares);
        setTotalUnits(res.totalStockUnits);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="border border-border bg-card p-5 sm:p-6 rounded-2xl space-y-6 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Globe className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">
              Bourse de Pièces Rares &amp; Mutualisation UEMOA
            </h3>
            <p className="text-xs text-muted-foreground">
              Réseau d'approvisionnement express reliant les laboratoires de Cotonou, Lomé, Abidjan
              et Dakar
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-xs font-bold text-primary border-primary/40 bg-primary/10"
        >
          {totalUnits} Pièces Critiques Disponibles
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {spares.map((part) => (
          <div
            key={part.partId}
            className="p-4 rounded-xl border border-border bg-surface/60 space-y-3 shadow-xs flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {part.holdingWorkshopCity}
                </span>
                <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono">
                  {part.quantityAvailable} en stock
                </Badge>
              </div>

              <div>
                <strong className="text-xs text-foreground block font-bold leading-snug">
                  {part.componentRef}
                </strong>
                <span className="text-[10px] text-muted-foreground">{part.category}</span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold pt-1">
                <Plane className="size-3.5" />
                <span>Livraison Express sous {part.expressDeliveryHours}h</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between">
              <strong className="font-mono text-sm font-extrabold text-primary">
                {formatFcfa(part.unitPriceFcfa)}
              </strong>

              <Button
                asChild
                variant="technical"
                size="sm"
                className="text-[10px] font-bold uppercase h-7 px-3"
              >
                <a
                  href={`https://wa.me/22960000000?text=${encodeURIComponent(
                    `Bonjour Allô Techno Bourse UEMOA, je souhaite réserver la pièce "${part.componentRef}" (${part.partId}) située à ${part.holdingWorkshopCity}.`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Commander &rarr;
                </a>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
