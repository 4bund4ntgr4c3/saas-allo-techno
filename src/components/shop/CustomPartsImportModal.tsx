import * as React from "react";
import { Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";

export function CustomPartsImportModal() {
  const [hub, setHub] = React.useState<"paris" | "dubai" | "shenzhen">("paris");
  const [partCategory, setPartCategory] = React.useState<"dalle_oled" | "gpu_bga" | "carte_mere_oem" | "clavier_tactile">("dalle_oled");
  const [partReference, setPartReference] = React.useState("LP140WF7-SPB1");

  const importEstimate = React.useMemo(() => {
    let partBaseCost = 55000;
    if (partCategory === "carte_mere_oem") partBaseCost = 145000;
    else if (partCategory === "gpu_bga") partBaseCost = 68000;
    else if (partCategory === "clavier_tactile") partBaseCost = 35000;

    let airFreight = hub === "paris" ? 22000 : hub === "dubai" ? 18000 : 28000;
    let delayDays = hub === "paris" ? "3 à 5 jours ouvrés" : hub === "dubai" ? "4 à 6 jours ouvrés" : "6 à 8 jours ouvrés";

    const total = partBaseCost + airFreight + 10000; // 10k pose atelier & test

    return {
      partBaseCost,
      airFreight,
      delayDays,
      total,
    };
  }, [hub, partCategory]);

  return (
    <div className="border border-border bg-card p-5 sm:p-7 rounded-2xl max-w-xl mx-auto space-y-6 shadow-xl animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Plane className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Importation Express Pièces Rares &amp; Introuvables
            </h3>
            <p className="text-xs text-muted-foreground">
              Acheminement prioritaire sous 3 à 8 jours depuis Paris, Dubaï et Shenzhen
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/40 bg-primary/10">
          Fret Aérien Sécurisé
        </Badge>
      </div>

      <div className="space-y-4 text-xs">
        {/* Hub Selection */}
        <div>
          <label className="text-muted-foreground block mb-1.5 font-bold">1. Hub Logistique d'Origine :</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "paris", label: "Paris Roissy (DHL 3-5j)" },
              { id: "dubai", label: "Dubaï Fret (4-6j)" },
              { id: "shenzhen", label: "Shenzhen Hub (6-8j)" },
            ].map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => setHub(h.id as "paris" | "dubai" | "shenzhen")}
                className={`p-2.5 rounded-lg border text-center font-semibold transition-all ${
                  hub === h.id
                    ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>

        {/* Part Type */}
        <div>
          <label className="text-muted-foreground block mb-1.5 font-bold">2. Type de Composant Spécifique :</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "dalle_oled", label: "Dalle Écran OLED / 4K Tactile" },
              { id: "carte_mere_oem", label: "Carte Mère Neuve d'Origine" },
              { id: "gpu_bga", label: "Puce Graphique GPU / CPU BGA" },
              { id: "clavier_tactile", label: "Topcase & Clavier Spécifique" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPartCategory(p.id as "dalle_oled" | "gpu_bga" | "carte_mere_oem" | "clavier_tactile")}
                className={`p-2.5 rounded-lg border text-left font-semibold transition-all ${
                  partCategory === p.id
                    ? "border-primary bg-primary/10 border-primary text-foreground font-bold shadow-xs"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Part Reference Input */}
        <div>
          <label className="text-muted-foreground block mb-1">3. Référence inscrite au dos de la pièce :</label>
          <Input
            value={partReference}
            onChange={(e) => setPartReference(e.target.value)}
            placeholder="ex: LP140WF7-SPB1 ou 820-00850-A"
            className="font-mono text-xs"
          />
        </div>
      </div>

      {/* ─── Breakdown Box ─── */}
      <div className="border border-border bg-surface/60 p-4 rounded-xl space-y-2.5 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Coût total estimé (Pièce + Vol DHL + Pose atelier) :</span>
          <strong className="font-mono text-primary text-base font-bold">{formatFcfa(importEstimate.total)}</strong>
        </div>

        <div className="flex justify-between items-center text-[11px] text-muted-foreground border-t border-border/60 pt-2">
          <span>Délai moyen d'arrivée à l'atelier :</span>
          <strong className="text-foreground font-mono">{importEstimate.delayDays}</strong>
        </div>
      </div>

      <Button
        asChild
        variant="technical"
        className="w-full font-bold uppercase tracking-wider text-xs h-9"
      >
        <a
          href={`https://wa.me/22960000000?text=${encodeURIComponent(
            `Bonjour Allô Techno Import, je souhaite commander en express la pièce rare "${partReference}" (${partCategory}) via le hub ${hub.toUpperCase()} pour un coût estimé de ${formatFcfa(
              importEstimate.total,
            )}.`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Lancer l'Approvisionnement Aérien Express &rarr;
        </a>
      </Button>
    </div>
  );
}
