import * as React from "react";
import { Navigation, Phone, MapPin, ShieldCheck, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface CourierMission {
  missionId: string;
  reference: string;
  courierName: string;
  courierPhone: string;
  motoPlate: string;
  pickupAddress: string;
  destinationAddress: string;
  status: "en_route_pickup" | "colis_recupere" | "en_transit_atelier" | "livre";
  etaMinutes: number;
  progressPercent: number;
}

export const MOCK_COURIER_MISSION: CourierMission = {
  missionId: "CR-2026-881",
  reference: "SAV-8492",
  courierName: "Rodrigue Dossou",
  courierPhone: "+229 97 00 12 34",
  motoPlate: "BJ-AB-4491",
  pickupAddress: "Immeuble Marina, Boulevard de la Marina, Cotonou",
  destinationAddress: "Atelier Allô Techno, Zogbadjè / UAC, Abomey-Calavi",
  status: "en_transit_atelier",
  etaMinutes: 18,
  progressPercent: 65,
};

export function CourierLiveTrackerModal({
  mission = MOCK_COURIER_MISSION,
}: {
  mission?: CourierMission;
}) {
  const [progress, setProgress] = React.useState(mission.progressPercent);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev < 95 ? prev + 1 : prev));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const getStatusLabel = () => {
    switch (mission.status) {
      case "en_route_pickup":
        return "Coursier en route vers votre adresse";
      case "colis_recupere":
        return "Appareil pris en charge par le coursier";
      case "en_transit_atelier":
        return "En acheminement sécurisé vers le laboratoire";
      case "livre":
        return "Appareil réceptionné à l'atelier";
    }
  };

  return (
    <div className="border border-border bg-card p-5 sm:p-6 rounded-2xl max-w-lg mx-auto shadow-xl space-y-5 animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Bike className="size-5 text-primary" />
          <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">
            Suivi Coursier Express en Direct
          </h3>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-[10px] text-emerald-600 border-emerald-600/40 bg-emerald-600/10"
        >
          GPS Actif · 100% Sécurisé
        </Badge>
      </div>

      {/* ─── Courier Profile Pill ─── */}
      <div className="flex items-center justify-between bg-surface p-3.5 rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-bold text-primary text-sm">
            {mission.courierName
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div>
            <h4 className="font-bold text-xs text-foreground">{mission.courierName}</h4>
            <p className="text-[11px] text-muted-foreground">Moto : {mission.motoPlate}</p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="text-xs h-8">
          <a href={`tel:${mission.courierPhone.replace(/\s+/g, "")}`}>
            <Phone className="size-3.5 mr-1 text-emerald-600" /> Appeler
          </a>
        </Button>
      </div>

      {/* ─── Realtime Progress Track ─── */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-primary">{getStatusLabel()}</span>
          <span className="font-mono text-foreground">
            Arrivée estimée : ~{mission.etaMinutes} min
          </span>
        </div>

        {/* Barre de progression avec icône coursier */}
        <div className="relative w-full h-3 bg-surface rounded-full overflow-hidden border border-border">
          <div
            className="h-full bg-primary transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ─── Route Steps Timeline ─── */}
      <div className="space-y-3 bg-surface/50 p-4 rounded-xl border border-border/80 text-xs">
        <div className="flex items-start gap-2.5">
          <MapPin className="size-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] text-muted-foreground block">
              Point de Collecte Client :
            </span>
            <strong className="text-foreground">{mission.pickupAddress}</strong>
          </div>
        </div>

        <div className="flex items-start gap-2.5 border-t border-border/60 pt-2.5">
          <Navigation className="size-4 text-primary shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] text-muted-foreground block">Laboratoire Technique :</span>
            <strong className="text-foreground">{mission.destinationAddress}</strong>
          </div>
        </div>
      </div>

      <div className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
        <ShieldCheck className="size-3.5 text-emerald-600" />
        <span>Transport sous scellé antivol &amp; mallette isotherme antichoc</span>
      </div>
    </div>
  );
}
