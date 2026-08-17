import * as React from "react";
import { PackageOpen, Bell, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getLostItemsFn,
  notifyOwnerLostItemFn,
  type LostItem,
} from "@/lib/lost-and-found.functions";

export function LostAndFoundDrawer() {
  const [items, setItems] = React.useState<LostItem[]>([]);
  const [pendingCount, setPendingCount] = React.useState(0);
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [notifiedMap, setNotifiedMap] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    getLostItemsFn()
      .then((res) => {
        setItems(res.items);
        setPendingCount(res.pendingCount);
      })
      .catch(() => {});
  }, []);

  const handleNotify = async (itemId: string) => {
    setLoadingId(itemId);
    try {
      const res = await notifyOwnerLostItemFn({ data: { itemId } });
      if (res.success) {
        setNotifiedMap((prev) => ({ ...prev, [itemId]: true }));
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="border border-border bg-card p-5 sm:p-6 rounded-2xl space-y-5 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <PackageOpen className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">
              Registre Objets Oubliés &amp; Accessoires (Lost &amp; Found)
            </h3>
            <p className="text-xs text-muted-foreground">
              Traçabilité des chargeurs, clés USB et adaptateurs oubliés par les clients
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-xs font-bold text-amber-600 border-amber-600/40 bg-amber-600/10"
        >
          {pendingCount} Objets en Garde Atelier
        </Badge>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const isNotified = notifiedMap[item.id] || item.status === "notifie";

          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                item.status === "restitue"
                  ? "border-border/60 bg-surface/30 opacity-70"
                  : "border-border bg-surface/70"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                    {item.id.toUpperCase()}
                  </span>
                  <h4 className="text-xs font-bold text-foreground">{item.itemDescription}</h4>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3 text-primary" /> {item.locationFound} (
                    {item.foundDate})
                  </span>
                  {item.ownerName && (
                    <>
                      <span>·</span>
                      <span>
                        Propriétaire présumé :{" "}
                        <strong className="text-foreground">{item.ownerName}</strong> (
                        {item.linkedTicketRef})
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {item.status === "restitue" ? (
                  <Badge
                    variant="outline"
                    className="text-emerald-600 border-emerald-600/40 bg-emerald-600/10 text-xs"
                  >
                    <CheckCircle2 className="size-3 mr-1" /> Restitué
                  </Badge>
                ) : isNotified ? (
                  <Badge
                    variant="outline"
                    className="text-amber-600 border-amber-600/40 bg-amber-600/10 text-xs"
                  >
                    <Bell className="size-3 mr-1" /> Client Notifié
                  </Badge>
                ) : (
                  <Button
                    variant="technical"
                    size="sm"
                    disabled={loadingId === item.id || !item.ownerPhone}
                    onClick={() => handleNotify(item.id)}
                    className="text-xs font-bold uppercase tracking-wider h-8"
                  >
                    {loadingId === item.id ? (
                      <Loader2 className="size-3 mr-1 animate-spin" />
                    ) : (
                      <Bell className="size-3 mr-1" />
                    )}
                    Alerter par SMS
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
