import * as React from "react";
import { Plane, Clock, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MOCK_TRACKED_PARTS, type PartTransitStatus } from "@/lib/parts-tracker";

export function SupplierPartsTracker() {
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return MOCK_TRACKED_PARTS;
    return MOCK_TRACKED_PARTS.filter(
      (p) =>
        p.partName.toLowerCase().includes(q) ||
        p.deviceTarget.toLowerCase().includes(q) ||
        p.ticketReference.toLowerCase().includes(q) ||
        p.trackingNumber.toLowerCase().includes(q),
    );
  }, [search]);

  const getStatusBadge = (status: PartTransitStatus) => {
    switch (status) {
      case "commande_validee":
        return <Badge variant="outline" className="text-muted-foreground border-border">Commande Validée</Badge>;
      case "en_transit_aerien":
        return <Badge variant="outline" className="text-blue-500 border-blue-500/40 bg-blue-500/10">En Vol Aérien</Badge>;
      case "en_douane_cotonou":
        return <Badge variant="outline" className="text-amber-500 border-amber-500/40 bg-amber-500/10">Douane Cadjèhoun</Badge>;
      case "arrive_atelier":
        return <Badge variant="outline" className="text-emerald-600 border-emerald-600/40 bg-emerald-600/10">Reçu en Atelier</Badge>;
      case "installe":
        return <Badge variant="outline" className="text-primary border-primary/40 bg-primary/10">Installé &amp; Testé</Badge>;
    }
  };

  return (
    <div className="border border-border bg-card p-5 sm:p-6 rounded-xl space-y-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Plane className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">
              Traçabilité des Pièces &amp; Fret Aérien
            </h3>
            <p className="text-xs text-muted-foreground">
              Approvisionnements express certifiés (Dubaï, Paris, Shenzhen &rarr; Cotonou)
            </p>
          </div>
        </div>
        <div className="w-full sm:w-64">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Filtrer par réf, pièce..."
              className="pl-8 text-xs h-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filtered.map((part) => (
          <div
            key={part.id}
            className="border border-border bg-surface/60 p-4 rounded-lg space-y-3 transition-all hover:border-primary/40"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-[10px] font-bold text-primary block">
                  Dossier : {part.ticketReference}
                </span>
                <h4 className="text-xs font-bold text-foreground line-clamp-1">{part.partName}</h4>
                <p className="text-[11px] text-muted-foreground">{part.deviceTarget}</p>
              </div>
              {getStatusBadge(part.status)}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-border/60 pt-2 text-muted-foreground">
              <div>
                <span>Origine : </span>
                <strong className="text-foreground">{part.originHub}</strong>
              </div>
              <div>
                <span>Transporteur : </span>
                <strong className="text-foreground">{part.carrier}</strong>
              </div>
              <div>
                <span>Suivi : </span>
                <span className="font-mono text-foreground font-semibold">{part.trackingNumber}</span>
              </div>
              <div className="flex items-center gap-1 text-primary font-bold">
                <Clock className="size-3" />
                <span>
                  {part.estimatedArrivalDays === 0
                    ? "Disponible à l'atelier"
                    : `Arrivée estimée : ~${part.estimatedArrivalDays} j`}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
