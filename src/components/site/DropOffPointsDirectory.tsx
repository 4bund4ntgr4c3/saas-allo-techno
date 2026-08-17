import * as React from "react";
import { MapPin, Clock, Phone, Bus, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DROP_OFF_POINTS } from "@/data/catalog/drop-off-points";

export function DropOffPointsDirectory() {
  const [selectedCity, setSelectedCity] = React.useState<string>("Tous");

  const cities = ["Tous", "Cotonou", "Abomey-Calavi", "Porto-Novo"];

  const filteredPoints = React.useMemo(() => {
    if (selectedCity === "Tous") return DROP_OFF_POINTS;
    return DROP_OFF_POINTS.filter((p) => p.city === selectedCity);
  }, [selectedCity]);

  return (
    <div className="border border-border bg-card p-5 sm:p-7 rounded-2xl space-y-6 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <MapPin className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Points Relais &amp; Dépôt Express Partenaires
            </h3>
            <p className="text-xs text-muted-foreground">
              Déposez votre ordinateur dans l'un de nos espaces partenaires agréés avec navette quotidienne
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {cities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => setSelectedCity(city)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCity === city
                  ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPoints.map((point) => (
          <div key={point.id} className="border border-border bg-surface/50 p-4 rounded-xl space-y-3 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-[10px] text-primary uppercase font-bold tracking-wider block">
                  {point.city} · {point.neighborhood}
                </span>
                <h4 className="font-bold text-sm text-foreground">{point.name}</h4>
              </div>
              {point.hasFreeWifi && (
                <Badge variant="outline" className="text-emerald-600 border-emerald-600/30 text-[10px] py-0.5">
                  <Wifi className="size-3 mr-1" /> Wifi Gratuit
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground">{point.address}</p>

            <div className="space-y-1.5 border-t border-border pt-2.5 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-3.5 text-primary shrink-0" />
                <span>{point.openingHours}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Bus className="size-3.5 text-emerald-600 shrink-0" />
                <span>Navette Allô Techno : <strong className="text-foreground">{point.shuttlePickupTime}</strong></span>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between">
              <span className="text-[11px] font-mono text-muted-foreground">{point.phone}</span>
              <Button asChild variant="outline" size="sm" className="text-xs h-7">
                <a href={`tel:${point.phone.replace(/\s+/g, "")}`}>
                  <Phone className="size-3 mr-1" /> Contacter
                </a>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
