import * as React from "react";
import { Shield, ShieldAlert, CheckCircle2, Loader2, AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  getHardwareAssetsVaultFn,
  reportAssetStolenFn,
  type HardwareAssetRecord,
} from "@/lib/hardware-asset-vault.functions";

export function HardwareAssetVaultModal() {
  const formTopRef = React.useRef<HTMLDivElement>(null);
  const [assets, setAssets] = React.useState<HardwareAssetRecord[]>([]);
  const [selectedAssetTag, setSelectedAssetTag] = React.useState("AT-ASSET-0841");
  const [incidentDetails, setIncidentDetails] = React.useState("Vol avec effraction dans véhicule de fonction à Ganhi Cotonou");
  const [loading, setLoading] = React.useState(false);
  const [stolenReportSuccess, setStolenReportSuccess] = React.useState<{ pv: string; msg: string } | null>(null);

  React.useEffect(() => {
    getHardwareAssetsVaultFn().then((res) => {
      setAssets(res.assets);
      if (res.assets && res.assets.length > 0 && res.assets[0]?.assetTag) {
        setSelectedAssetTag(res.assets[0].assetTag);
      }
    }).catch(() => {});
  }, []);

  React.useEffect(() => {
    if (stolenReportSuccess && formTopRef.current) {
      formTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [stolenReportSuccess]);

  const handleReportStolen = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await reportAssetStolenFn({
        data: {
          assetTag: selectedAssetTag,
          incidentDetails,
        },
      });
      if (res.success) {
        setStolenReportSuccess({ pv: res.policePvNumber, msg: res.message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={formTopRef} className="border border-border bg-card p-5 sm:p-7 rounded-2xl max-w-3xl mx-auto space-y-6 shadow-xl animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Shield className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Coffre-Fort Matériel &amp; Registre Anti-Vol DSI
            </h3>
            <p className="text-xs text-muted-foreground">
              Protection cryptographique des numéros de série, UUID cartes mères et blocage réseau immédiat
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-xs text-emerald-600 border-emerald-600/40 bg-emerald-600/10 font-bold">
          {assets.length} Actifs Scellés
        </Badge>
      </div>

      {stolenReportSuccess ? (
        <div className="border border-destructive/40 bg-destructive/5 p-6 rounded-2xl text-center space-y-4 shadow-sm animate-in zoom-in-95 duration-200">
          <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertOctagon className="size-7" />
          </div>
          <h4 className="text-lg font-bold text-destructive">Signalement de Vol &amp; Blacklistage Activé</h4>
          <Badge variant="outline" className="font-mono text-sm text-destructive border-destructive/40 font-bold">
            PV Déclaration : {stolenReportSuccess.pv}
          </Badge>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            {stolenReportSuccess.msg} Le numéro de série et l'UUID de carte mère sont verrouillés dans toute la zone UEMOA.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setStolenReportSuccess(null)}
            className="text-xs"
          >
            Retour au Registre
          </Button>
        </div>
      ) : (
        <div className="space-y-6 text-xs">
          {/* Active Assets Table */}
          <div className="space-y-2">
            <span className="font-bold text-xs uppercase tracking-wide text-foreground block">
              Parc Informatique Protégé sous Scellé :
            </span>

            <div className="space-y-3">
              {assets.map((a) => (
                <div
                  key={a.assetTag}
                  className="p-4 rounded-xl border border-border bg-surface/60 space-y-2 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-border/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 text-[10px]">
                        {a.assetTag}
                      </span>
                      <strong className="text-foreground">{a.deviceModel}</strong>
                    </div>
                    <Badge variant="outline" className="text-emerald-600 border-emerald-600/30 text-[10px] font-bold">
                      <CheckCircle2 className="size-3 mr-1" /> Protégé &amp; En Ligne
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                    <div>
                      <span>Affecté à : </span>
                      <strong className="text-foreground">{a.assignedEmployee}</strong>
                    </div>
                    <div>
                      <span>S/N Fabricant : </span>
                      <strong className="font-mono text-foreground">{a.serialNumber}</strong>
                    </div>
                  </div>

                  <div className="bg-background p-2 rounded-lg border border-border flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                    <span className="truncate">UUID Carte : {a.motherboardUuid}</span>
                    <span className="shrink-0 text-foreground font-bold">MAC: {a.macAddressWifi}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stolen Report Form */}
          <form onSubmit={handleReportStolen} className="p-4 rounded-xl bg-destructive/5 border border-destructive/30 space-y-3">
            <span className="font-bold text-destructive uppercase tracking-wide flex items-center gap-1.5 text-xs">
              <ShieldAlert className="size-4" /> Procédure d'Urgence — Déclarer un Appareil Volé :
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-muted-foreground block mb-1 text-[11px]">Actif concerné :</label>
                <select
                  value={selectedAssetTag}
                  onChange={(e) => setSelectedAssetTag(e.target.value)}
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground font-mono"
                >
                  {assets.map((a) => (
                    <option key={a.assetTag} value={a.assetTag}>
                      {a.assetTag} - {a.deviceModel} ({a.serialNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-muted-foreground block mb-1 text-[11px]">Détails du sinistre / Lieu :</label>
                <Input
                  required
                  value={incidentDetails}
                  onChange={(e) => setIncidentDetails(e.target.value)}
                  placeholder="Lieu et circonstances"
                  className="text-xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              variant="destructive"
              className="w-full font-bold uppercase tracking-wider text-xs h-9 mt-1"
            >
              {loading ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : null}
              {loading ? "Verrouillage Réseau..." : "Blacklister l'Actif & Générer le PV de Vol Police"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
