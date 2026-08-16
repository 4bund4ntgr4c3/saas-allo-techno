import * as React from "react";
import { Laptop, Smartphone, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { formatFcfa } from "@/data/catalog/company";
import {
  POPULAR_TRADE_IN_MODELS,
  calculateTradeInValue,
  type CosmeticState,
  type FunctionalState,
} from "@/lib/trade-in";

export function TradeInEstimator() {
  const [selectedModelId, setSelectedModelId] = React.useState(POPULAR_TRADE_IN_MODELS[0]!.id);
  const [category, setCategory] = React.useState<"laptop" | "smartphone">("laptop");
  const [cosmetic, setCosmetic] = React.useState<CosmeticState>("bon_etat");
  const [functional, setFunctional] = React.useState<FunctionalState>("parfait");
  const hasCharger = true;

  const availableModels = React.useMemo(
    () => POPULAR_TRADE_IN_MODELS.filter((m) => m.category === category),
    [category],
  );

  React.useEffect(() => {
    if (availableModels.length > 0 && !availableModels.some((m) => m.id === selectedModelId)) {
      setSelectedModelId(availableModels[0]!.id);
    }
  }, [category, availableModels, selectedModelId]);

  const valuation = React.useMemo(
    () =>
      calculateTradeInValue({
        modelId: selectedModelId,
        cosmetic,
        functional,
        hasCharger,
      }),
    [selectedModelId, cosmetic, functional, hasCharger],
  );

  return (
    <div className="border border-border bg-card p-5 sm:p-7 rounded-xl space-y-6 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <RefreshCw className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Simulateur de Reprise &amp; Trade-In Argus
            </h3>
            <p className="text-xs text-muted-foreground">
              Estimez la valeur de rachat de votre ancien appareil en 3 clics
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] uppercase border-primary/40 text-primary bg-primary/10">
          +10% en Bon d'Achat Réparation
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ─── Options Selection Form ─── */}
        <div className="lg:col-span-7 space-y-4">
          {/* Category Toggle */}
          <div>
            <Label className="text-xs text-muted-foreground block mb-1.5">1. Catégorie :</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCategory("laptop")}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                  category === "laptop"
                    ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                <Laptop className="size-4" /> Ordinateurs Portables
              </button>
              <button
                type="button"
                onClick={() => setCategory("smartphone")}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                  category === "smartphone"
                    ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                <Smartphone className="size-4" /> Smartphones
              </button>
            </div>
          </div>

          {/* Model Selector */}
          <div>
            <Label className="text-xs text-muted-foreground block mb-1.5">2. Modèle :</Label>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="w-full bg-background border border-border rounded-lg p-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.brand} — {m.model}
                </option>
              ))}
            </select>
          </div>

          {/* Cosmetic Condition */}
          <div>
            <Label className="text-xs text-muted-foreground block mb-1.5">3. État Esthétique :</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: "comme_neuf", label: "Comme neuf" },
                { id: "bon_etat", label: "Bon état" },
                { id: "rayures_visibles", label: "Rayures" },
                { id: "chassis_abime", label: "Châssis abîmé" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCosmetic(item.id as CosmeticState)}
                  className={`p-2 rounded border text-[11px] font-medium transition-all ${
                    cosmetic === item.id
                      ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Functional Condition */}
          <div>
            <Label className="text-xs text-muted-foreground block mb-1.5">4. État Fonctionnel :</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: "parfait", label: "100% Fonctionnel" },
                { id: "batterie_usee", label: "Batterie usée" },
                { id: "ecran_fissure", label: "Écran fissuré" },
                { id: "ne_sallume_plus", label: "Ne s'allume plus" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFunctional(item.id as FunctionalState)}
                  className={`p-2 rounded border text-[11px] font-medium transition-all ${
                    functional === item.id
                      ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Result Valuation Card ─── */}
        <div className="lg:col-span-5 flex flex-col justify-between border border-primary/40 bg-primary/5 p-5 rounded-xl space-y-4">
          <div>
            <span className="at-eyebrow text-muted-foreground text-[10px] block">
              Valeur Estimée de Reprise
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <strong className="text-2xl sm:text-3xl font-mono font-extrabold text-foreground">
                {formatFcfa(valuation.estimatedValueFcfa)}
              </strong>
              <span className="text-xs text-muted-foreground">Cash Immédiat</span>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-background border border-border space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Valeur brute :</span>
                <span className="font-mono font-bold">{formatFcfa(valuation.estimatedValueFcfa)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-emerald-600 font-semibold">
                <span className="flex items-center gap-1">
                  <Sparkles className="size-3" /> Bonus Bon d'Achat (+10%) :
                </span>
                <span className="font-mono">+{formatFcfa(valuation.bonusVoucherFcfa)}</span>
              </div>
              <div className="border-t border-border pt-2 flex items-center justify-between text-sm font-bold text-foreground">
                <span>En Bon d'Achat Allô Techno :</span>
                <span className="font-mono text-primary text-base">
                  {formatFcfa(valuation.totalVoucherFcfa)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Button
              asChild
              variant="technical"
              className="w-full font-bold uppercase tracking-wider text-xs"
            >
              <a
                href={`https://wa.me/22960000000?text=${encodeURIComponent(
                  `Bonjour Allô Techno, je souhaite faire reprendre mon ${valuation.device.brand} ${valuation.device.model} estimé à ${formatFcfa(
                    valuation.totalVoucherFcfa,
                  )} sur le simulateur.`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Valider la Reprise en Atelier &rarr;
              </a>
            </Button>
            <p className="text-[10px] text-center text-muted-foreground">
              Offre ferme après diagnostic rapide de 15 minutes en boutique
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
