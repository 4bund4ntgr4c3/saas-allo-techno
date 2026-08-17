import * as React from "react";
import { Wifi, Gauge, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function WifiOptimizerModal() {
  const [testing, setTesting] = React.useState(false);
  const [ping, setPing] = React.useState(18);
  const [downloadMbps, setDownloadMbps] = React.useState(42.5);
  const [uploadMbps, setUploadMbps] = React.useState(15.2);

  const runTest = () => {
    setTesting(true);
    setTimeout(() => {
      setPing(Math.floor(12 + Math.random() * 15));
      setDownloadMbps(Math.round((35 + Math.random() * 40) * 10) / 10);
      setUploadMbps(Math.round((12 + Math.random() * 20) * 10) / 10);
      setTesting(false);
    }, 1500);
  };

  return (
    <div className="border border-border bg-card p-5 sm:p-7 rounded-2xl max-w-xl mx-auto space-y-6 shadow-xl animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Wifi className="size-5 text-primary" />
          <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">
            Testeur de Débit Wi-Fi &amp; Optimiseur Réseau
          </h3>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-[10px] text-emerald-600 border-emerald-600/40 bg-emerald-600/10"
        >
          Serveur : Cotonou IXP / Lagos
        </Badge>
      </div>

      {/* ─── Speedometer Box ─── */}
      <div className="bg-surface p-5 rounded-xl border border-border text-center space-y-4">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase block">Latence Ping</span>
            <strong className="font-mono text-lg font-bold text-foreground">
              {testing ? "..." : `${ping} ms`}
            </strong>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase block">
              Téléchargement
            </span>
            <strong className="font-mono text-lg font-bold text-emerald-600">
              {testing ? "..." : `${downloadMbps} Mbps`}
            </strong>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase block">
              Envoi (Upload)
            </span>
            <strong className="font-mono text-lg font-bold text-primary">
              {testing ? "..." : `${uploadMbps} Mbps`}
            </strong>
          </div>
        </div>

        <Button
          variant="technical"
          size="sm"
          disabled={testing}
          onClick={runTest}
          className="text-xs font-bold uppercase tracking-wider h-8"
        >
          {testing ? (
            <Loader2 className="size-3.5 mr-1.5 animate-spin" />
          ) : (
            <Gauge className="size-3.5 mr-1.5" />
          )}
          {testing ? "Mesure en cours..." : "Lancer le Test de Vitesse"}
        </Button>
      </div>

      {/* ─── Wi-Fi Optimization Advice ─── */}
      <div className="space-y-3">
        <span className="font-bold text-xs text-foreground uppercase tracking-wide block">
          Recommandations d'Optimisation Atelier :
        </span>

        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-lg border border-border bg-surface/50 flex items-start gap-2.5">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground">Basculez sur la bande 5 GHz ou Wi-Fi 6 :</strong>
              <p className="text-muted-foreground text-[11px] mt-0.5">
                La bande 2.4 GHz est saturée à Cotonou par les box voisines. La bande 5 GHz offre
                jusqu'à 3x plus de débit pour les visioconférences.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border bg-surface/50 flex items-start gap-2.5">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground">
                Équipez vos bureaux d'un réseau Mesh TP-Link Deco :
              </strong>
              <p className="text-muted-foreground text-[11px] mt-0.5">
                Élimine les zones blanches sans signal à travers les murs en béton épais sans perte
                de débit.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Button
        asChild
        variant="outline"
        className="w-full font-bold uppercase tracking-wider text-xs h-9"
      >
        <a
          href={`https://wa.me/22960000000?text=${encodeURIComponent(
            `Bonjour Allô Techno, j'ai effectué le test de débit Wi-Fi (${downloadMbps} Mbps, ${ping}ms). Je souhaite être conseillé pour l'installation d'une borne Wi-Fi Mesh ou d'un câblage RJ45.`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Demander une Optimisation Réseau à Domicile / Bureau &rarr;
        </a>
      </Button>
    </div>
  );
}
