import * as React from "react";
import { MapPin, Clock, Truck, Zap, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";
import { COVERAGE_ZONES, type CoverageZone } from "@/data/catalog/locations";

export function CoverageZoneEstimator() {
  const [search, setSearch] = React.useState("");
  const [selectedZone, setSelectedZone] = React.useState<CoverageZone>(COVERAGE_ZONES[0]!);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return COVERAGE_ZONES.slice(0, 6);
    return COVERAGE_ZONES.filter(
      (z) =>
        z.quartier.toLowerCase().includes(q) ||
        z.commune.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <div className="border border-border bg-card p-5 sm:p-6 space-y-5 rounded-lg shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <MapPin className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-foreground">
              Délais d'Intervention &amp; Collecte par Quartier
            </h3>
            <p className="text-xs text-muted-foreground">
              Grand Cotonou, Abomey-Calavi &amp; Axes Principaux
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] uppercase border-primary/40 text-primary bg-primary/10">
          Coursier Express &lt; 45min
        </Badge>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher votre quartier ou commune (ex: Haie Vive, Zogbadjè, Ganhi...)"
          className="pl-9 text-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ─── Selected Zone Focus Banner ─── */}
      <div className="border border-primary/30 bg-primary/5 p-4 rounded-md space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] at-eyebrow text-muted-foreground block">Zone Sélectionnée</span>
            <strong className="text-sm font-bold text-foreground">
              {selectedZone.quartier} ({selectedZone.commune})
            </strong>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-background border border-border px-3 py-1.5 rounded text-xs font-mono font-bold text-foreground">
              <Clock className="size-3.5 text-primary" />
              <span>Arrivée : ~{selectedZone.estimatedArrivalMinutes} min</span>
            </div>
            <div className="flex items-center gap-1.5 bg-background border border-border px-3 py-1.5 rounded text-xs font-mono font-bold text-primary">
              <Truck className="size-3.5" />
              <span>{formatFcfa(selectedZone.baseDeliveryFeeFcfa)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Fast Selection Pills ─── */}
      <div>
        <span className="text-[10px] text-muted-foreground at-eyebrow mb-2 block">
          Quartiers Fréquents :
        </span>
        <div className="flex flex-wrap gap-2">
          {filtered.map((z) => {
            const isSelected = selectedZone.id === z.id;
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => setSelectedZone(z)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                    : "border-border bg-surface hover:border-primary/60 text-foreground"
                }`}
              >
                <span>{z.quartier}</span>
                <span className={`text-[10px] font-mono ${isSelected ? "text-primary-foreground/90" : "text-muted-foreground"}`}>
                  ~{z.estimatedArrivalMinutes}m
                </span>
                {z.expressAvailable && (
                  <Zap className={`size-3 ${isSelected ? "text-amber-300" : "text-amber-500"}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
