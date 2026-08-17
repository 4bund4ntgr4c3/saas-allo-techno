import * as React from "react";
import { Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";

export function ServerRoomConfiguratorModal() {
  const [rackSize, setRackSize] = React.useState<"12u" | "24u" | "42u">("24u");
  const [switchCount, setSwitchCount] = React.useState(2);
  const [upsType, setUpsType] = React.useState<"1kva" | "3kva" | "6kva">("3kva");
  const [includeFiberRouter, setIncludeFiberRouter] = React.useState(true);

  const pricing = React.useMemo(() => {
    const rackCost = rackSize === "12u" ? 180000 : rackSize === "24u" ? 320000 : 580000;
    const switchCost = switchCount * 145000; // Switch Gigabit 24p PoE+ Manageable
    const upsCost = upsType === "1kva" ? 220000 : upsType === "3kva" ? 480000 : 950000;
    const routerCost = includeFiberRouter ? 165000 : 0;
    const patchPanelCost = 45000 * switchCount;
    const installationLabor = 120000;

    const total = rackCost + switchCost + upsCost + routerCost + patchPanelCost + installationLabor;
    return {
      rackCost,
      switchCost,
      upsCost,
      routerCost,
      patchPanelCost,
      installationLabor,
      total,
    };
  }, [rackSize, switchCount, upsType, includeFiberRouter]);

  return (
    <div className="border border-border bg-card p-5 sm:p-7 rounded-2xl max-w-2xl mx-auto space-y-6 shadow-xl animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Server className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Configurateur de Baie de Brassage &amp; Réseau
            </h3>
            <p className="text-xs text-muted-foreground">
              Dimensionnez votre infrastructure réseau d'entreprise (Switches PoE, Onduleur, Routeur
              Multi-WAN)
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-[10px] text-primary border-primary/40 bg-primary/10"
        >
          Architecture Certifiée
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
        {/* Rack Height */}
        <div className="space-y-2">
          <span className="font-bold text-foreground block text-[11px]">
            1. Taille de la Baie Informatique :
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "12u", label: "12U (Agence)" },
              { id: "24u", label: "24U (PME)" },
              { id: "42u", label: "42U (Siège)" },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRackSize(r.id as "12u" | "24u" | "42u")}
                className={`p-2 rounded-lg border text-center font-semibold transition-all ${
                  rackSize === r.id
                    ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Switch Count */}
        <div className="space-y-2">
          <span className="font-bold text-foreground block text-[11px]">
            2. Switchs 24 Ports PoE+ Gigabit :
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 4].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setSwitchCount(count)}
                className={`p-2 rounded-lg border text-center font-semibold transition-all ${
                  switchCount === count
                    ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                {count} Switch ({count * 24} ports)
              </button>
            ))}
          </div>
        </div>

        {/* UPS Power */}
        <div className="space-y-2">
          <span className="font-bold text-foreground block text-[11px]">
            3. Onduleur Rackable Online :
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "1kva", label: "1 kVA (30 min)" },
              { id: "3kva", label: "3 kVA (2h)" },
              { id: "6kva", label: "6 kVA (4h)" },
            ].map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => setUpsType(u.id as "1kva" | "3kva" | "6kva")}
                className={`p-2 rounded-lg border text-center font-semibold transition-all ${
                  upsType === u.id
                    ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fiber Router Option */}
        <div className="space-y-2">
          <span className="font-bold text-foreground block text-[11px]">
            4. Routeur Multi-WAN Fibre / 4G :
          </span>
          <button
            type="button"
            onClick={() => setIncludeFiberRouter((v) => !v)}
            className={`w-full p-2.5 rounded-lg border text-left font-semibold transition-all ${
              includeFiberRouter
                ? "border-emerald-600 bg-emerald-600/10 text-emerald-800"
                : "border-border bg-surface text-muted-foreground"
            }`}
          >
            {includeFiberRouter ? "✓ Routeur Multi-WAN Inclus" : "✕ Pas de Routeur"}
          </button>
        </div>
      </div>

      {/* ─── Breakdown & Total ─── */}
      <div className="border border-border bg-surface/70 p-4 rounded-xl space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">
            Baie {rackSize.toUpperCase()} + {switchCount * 24} Ports PoE + Onduleur{" "}
            {upsType.toUpperCase()} :
          </span>
          <strong className="font-mono text-primary text-base font-bold">
            {formatFcfa(pricing.total)}
          </strong>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-muted-foreground border-t border-border/60 pt-2">
          <div>
            Baie : <strong className="text-foreground">{formatFcfa(pricing.rackCost)}</strong>
          </div>
          <div>
            Switches : <strong className="text-foreground">{formatFcfa(pricing.switchCost)}</strong>
          </div>
          <div>
            Onduleur : <strong className="text-foreground">{formatFcfa(pricing.upsCost)}</strong>
          </div>
          <div>
            Pose &amp; Câblage :{" "}
            <strong className="text-foreground">{formatFcfa(pricing.installationLabor)}</strong>
          </div>
        </div>
      </div>

      <Button
        asChild
        variant="technical"
        className="w-full font-bold uppercase tracking-wider text-xs"
      >
        <a
          href={`https://wa.me/22960000000?text=${encodeURIComponent(
            `Bonjour Allô Techno Réseaux, nous souhaitons recevoir une proposition pour une baie ${rackSize.toUpperCase()} (${switchCount * 24} ports PoE, onduleur ${upsType.toUpperCase()}) d'un montant estimé de ${formatFcfa(
              pricing.total,
            )}.`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Commander cette Configuration Baie Serveur &rarr;
        </a>
      </Button>
    </div>
  );
}
