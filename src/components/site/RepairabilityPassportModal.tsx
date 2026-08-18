import * as React from "react";
import { CheckCircle2, Leaf, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { calculateRepairabilityPassport } from "@/lib/repairability-passport";

export function RepairabilityPassportModal() {
  const formTopRef = React.useRef<HTMLDivElement>(null);
  const [deviceModel, setDeviceModel] = React.useState("Lenovo ThinkPad T14 Gen 2 (AMD Ryzen 5 Pro)");
  const [isModular, setIsModular] = React.useState(true);
  const [hasSchematics, setHasSchematics] = React.useState(true);

  const passport = React.useMemo(() => {
    return calculateRepairabilityPassport(deviceModel, isModular, hasSchematics);
  }, [deviceModel, isModular, hasSchematics]);

  return (
    <div ref={formTopRef} className="border border-border bg-card p-5 sm:p-7 rounded-2xl max-w-2xl mx-auto space-y-6 shadow-xl animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Leaf className="size-5 text-emerald-600 shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Passeport Numérique Circulaire &amp; Indice de Réparabilité
            </h3>
            <p className="text-xs text-muted-foreground">
              Notation officielle sur 10 selon la démontabilité, le prix des pièces et la longévité
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-xs text-emerald-600 border-emerald-600/40 bg-emerald-600/10 font-bold">
          Score : {passport.overallScoreOutOf10} / 10
        </Badge>
      </div>

      {/* Input Form */}
      <div className="space-y-4 text-xs">
        <div>
          <label className="text-muted-foreground block mb-1">Modèle d'ordinateur ou équipement :</label>
          <Input
            required
            value={deviceModel}
            onChange={(e) => setDeviceModel(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setIsModular(!isModular)}
            className={`p-3 rounded-xl border text-left transition-all ${
              isModular ? "border-primary bg-primary/10" : "border-border bg-surface"
            }`}
          >
            <strong className="text-foreground block text-xs">Châssis Modulaire &amp; Vis Standard</strong>
            <span className="text-[10px] text-muted-foreground">Composants (RAM, SSD, Clavier) remplaçables</span>
          </button>

          <button
            type="button"
            onClick={() => setHasSchematics(!hasSchematics)}
            className={`p-3 rounded-xl border text-left transition-all ${
              hasSchematics ? "border-primary bg-primary/10" : "border-border bg-surface"
            }`}
          >
            <strong className="text-foreground block text-xs">Schémas Vectoriels Disponibles</strong>
            <span className="text-[10px] text-muted-foreground">Documentation électronique de laboratoire</span>
          </button>
        </div>
      </div>

      {/* Passport Preview Card */}
      <div className="border border-border bg-surface/80 p-5 rounded-2xl space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div>
            <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 mr-2">
              {passport.circularPassportNumber}
            </span>
            <strong className="text-foreground text-sm">{deviceModel}</strong>
          </div>
          <Badge className="bg-emerald-600 text-white font-bold text-xs">
            Classe {passport.ratingClass}
          </Badge>
        </div>

        {/* Detailed Criteria Scores */}
        <div className="space-y-2">
          <span className="font-bold text-foreground uppercase tracking-wide block text-[11px]">
            Détail des 5 Critères Réglementaires :
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
            <div className="p-2.5 rounded-lg bg-card border border-border flex justify-between">
              <span>Documentation technique :</span>
              <strong className="font-mono text-foreground">{passport.criteriaBreakdown.documentationAvailability} / 20</strong>
            </div>

            <div className="p-2.5 rounded-lg bg-card border border-border flex justify-between">
              <span>Facilité de démontage :</span>
              <strong className="font-mono text-foreground">{passport.criteriaBreakdown.disassemblyEase} / 20</strong>
            </div>

            <div className="p-2.5 rounded-lg bg-card border border-border flex justify-between">
              <span>Disponibilité des pièces :</span>
              <strong className="font-mono text-foreground">{passport.criteriaBreakdown.sparePartsAvailability} / 20</strong>
            </div>

            <div className="p-2.5 rounded-lg bg-card border border-border flex justify-between">
              <span>Rapport de prix des pièces :</span>
              <strong className="font-mono text-foreground">{passport.criteriaBreakdown.sparePartsPricingRatio} / 20</strong>
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/60">
          <span>Durabilité estimée : <strong>{passport.expectedDeviceLifespanYears} ans</strong></span>
          <span className="font-bold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="size-3.5" /> Reconditionné Certifié Allô Techno
          </span>
        </div>
      </div>

      <Button
        variant="technical"
        onClick={() => window.print()}
        className="w-full font-bold uppercase tracking-wider text-xs h-9"
      >
        <Printer className="size-3.5 mr-1.5" /> Imprimer l'Étiquette Passeport Circulaire avec QR Code
      </Button>
    </div>
  );
}
