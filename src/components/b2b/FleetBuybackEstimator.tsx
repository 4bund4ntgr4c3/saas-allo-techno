import * as React from "react";
import { Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";

export function FleetBuybackEstimator() {
  const [deviceCount, setDeviceCount] = React.useState<number>(20);
  const [tier, setTier] = React.useState<"i3_entry" | "i5_pro" | "macbook_i7">("i5_pro");
  const [condition, setCondition] = React.useState<"fonctionnel" | "batterie_usée" | "pour_pieces">(
    "fonctionnel",
  );

  const calculation = React.useMemo(() => {
    let baseUnitVal = 65000;
    if (tier === "i3_entry") baseUnitVal = 40000;
    else if (tier === "macbook_i7") baseUnitVal = 140000;

    let conditionMultiplier = 1.0;
    if (condition === "batterie_usée") conditionMultiplier = 0.75;
    else if (condition === "pour_pieces") conditionMultiplier = 0.4;

    const unitPrice = Math.round(baseUnitVal * conditionMultiplier);
    const totalCash = unitPrice * deviceCount;
    const totalStoreCredit = Math.round(totalCash * 1.15); // +15% sous forme d'avoir flotte

    return {
      unitPrice,
      totalCash,
      totalStoreCredit,
    };
  }, [deviceCount, tier, condition]);

  return (
    <div className="border border-border bg-card p-5 sm:p-7 rounded-2xl space-y-6 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Coins className="size-5 text-amber-500 shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Rachat &amp; Reprise de Flotte Informatique d'Entreprise
            </h3>
            <p className="text-xs text-muted-foreground">
              Valorisez vos anciens PC et Mac lors du renouvellement de vos postes de travail
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-[10px] text-emerald-600 border-emerald-600/40 bg-emerald-600/10 font-bold"
        >
          Paiement Cash ou Avoir +15%
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-6 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">
              1. Nombre de postes à renouveler :
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 20, 50, 100].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setDeviceCount(n)}
                  className={`p-2 rounded-lg border text-center text-xs font-semibold transition-all ${
                    deviceCount === n
                      ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n} Postes
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">
              2. Typologie de la flotte :
            </label>
            <div className="space-y-2">
              {[
                { id: "i3_entry", label: "PC Bureautique Standard (Core i3 / 8 Go RAM)" },
                { id: "i5_pro", label: "PC Professionnels (Dell / Lenovo Core i5 / 16 Go SSD)" },
                { id: "macbook_i7", label: "Haut de Gamme & MacBook (Apple M1/M2 ou Core i7)" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTier(item.id as "i3_entry" | "i5_pro" | "macbook_i7")}
                  className={`w-full p-2.5 rounded-lg border text-left text-xs font-semibold transition-all ${
                    tier === item.id
                      ? "border-primary bg-primary/10 shadow-xs text-foreground font-bold"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">
              3. État général constaté :
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "fonctionnel", label: "100% Fonctionnel" },
                { id: "batterie_usée", label: "Batterie Faible" },
                { id: "pour_pieces", label: "Pour Pièces / HS" },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    setCondition(c.id as "fonctionnel" | "batterie_usée" | "pour_pieces")
                  }
                  className={`p-2 rounded-lg border text-center text-xs font-semibold transition-all ${
                    condition === c.id
                      ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Evaluation Output */}
        <div className="lg:col-span-6 border border-border bg-surface/50 p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <span className="at-eyebrow text-muted-foreground text-[10px] block">
              Offre Globale de Rachat Estimée ({deviceCount} Ordinateurs)
            </span>
            <div className="mt-2 space-y-3">
              <div className="p-3.5 rounded-xl bg-card border border-border">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide block">
                  Option 1 : Paiement Virement / Chèque Direct
                </span>
                <strong className="text-2xl font-mono font-extrabold text-foreground block mt-0.5">
                  {formatFcfa(calculation.totalCash)}
                </strong>
                <span className="text-[11px] text-muted-foreground">
                  Soit ~{formatFcfa(calculation.unitPrice)} par poste enlevé
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-600/10 border border-emerald-600/30">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wide">
                    Option 2 : Avoir Flotte Reconditionnée (+15%)
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-emerald-600 text-white font-bold border-0"
                  >
                    +15% Offert
                  </Badge>
                </div>
                <strong className="text-2xl font-mono font-extrabold text-emerald-700 block mt-0.5">
                  {formatFcfa(calculation.totalStoreCredit)}
                </strong>
                <span className="text-[11px] text-emerald-800/80">
                  Déductible immédiatement sur l'achat de PC portables neufs/garantis
                </span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
              Enlèvement sur site à Cotonou/Calavi inclus + Certificat d'effacement sécurisé des
              disques durs (NIST 800-88).
            </p>
          </div>

          <Button
            asChild
            variant="technical"
            className="w-full font-bold uppercase tracking-wider text-xs h-9"
          >
            <a
              href={`https://wa.me/22960000000?text=${encodeURIComponent(
                `Bonjour Allô Techno Rachat de Flotte, nous souhaitons faire expertiser un lot de ${deviceCount} ordinateurs (${tier}, ${condition}) pour une valeur estimée de ${formatFcfa(
                  calculation.totalCash,
                )}.`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Demander un Audit de Rachat sur Site &rarr;
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
