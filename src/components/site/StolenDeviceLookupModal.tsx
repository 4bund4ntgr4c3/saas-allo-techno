import * as React from "react";
import { ShieldAlert, Search, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  checkDeviceStolenStatusFn,
  reportStolenDeviceFn,
  type StolenDeviceRecord,
} from "@/lib/stolen-device-registry.functions";

export function StolenDeviceLookupModal() {
  const [serial, setSerial] = React.useState("");
  const [result, setResult] = React.useState<StolenDeviceRecord | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [isDeclaring, setIsDeclaring] = React.useState(false);
  const [declModel, setDeclModel] = React.useState("");
  const [declPv, setDeclPv] = React.useState("");
  const [declName, setDeclName] = React.useState("");
  const [declPhone, setDeclPhone] = React.useState("97000000");
  const [declSuccess, setDeclSuccess] = React.useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serial.trim()) return;
    setLoading(true);
    try {
      const res = await checkDeviceStolenStatusFn({
        data: { serialNumber: serial.trim() },
      });
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  const handleDeclare = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await reportStolenDeviceFn({
        data: {
          serialNumber: serial.trim(),
          deviceModel: declModel.trim(),
          policeReportNumber: declPv.trim(),
          declarantName: declName.trim(),
          declarantPhone: declPhone.trim(),
        },
      });
      if (res.success) {
        setDeclSuccess(res.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-border bg-card p-5 sm:p-6 rounded-2xl max-w-lg mx-auto space-y-5 shadow-lg animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-5 text-primary" />
          <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">
            Registre Anti-Recel &amp; Matériel Volé
          </h3>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-[10px] text-primary border-primary/40 bg-primary/10"
        >
          Base Nationale Sécurisée
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground">
        Vérifiez avant achat ou dépôt si un numéro de série fait l'objet d'un signalement de vol ou
        d'une plainte en cours.
      </p>

      {!isDeclaring ? (
        <form onSubmit={handleLookup} className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ex : C02G1234MD6R ou 5CD1234XYZ"
              value={serial}
              onChange={(e) => setSerial(e.target.value.toUpperCase())}
              className="font-mono text-xs uppercase"
              required
            />
            <Button
              type="submit"
              variant="technical"
              disabled={loading || !serial.trim()}
              className="text-xs font-bold shrink-0 uppercase tracking-wider"
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Search className="size-3.5 mr-1" />
              )}
              Vérifier
            </Button>
          </div>

          {result && (
            <div
              className={`p-4 rounded-xl border space-y-2.5 text-xs animate-in zoom-in-95 duration-150 ${
                result.isFlaggedStolen
                  ? "border-destructive/40 bg-destructive/10 text-destructive-foreground"
                  : "border-emerald-600/40 bg-emerald-600/10 text-emerald-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  {result.isFlaggedStolen ? (
                    <>
                      <AlertTriangle className="size-4 text-destructive" /> ALERTE MATÉRIEL VOLÉ
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-4 text-emerald-600" /> APPAREIL INTÈGRE &amp; NON
                      FICHÉ
                    </>
                  )}
                </span>
                <span className="font-mono font-bold">{result.serialNumber}</span>
              </div>

              <p className="text-xs text-foreground font-medium">{result.statusNotes}</p>

              {result.isFlaggedStolen && (
                <div className="border-t border-destructive/30 pt-2 text-[11px] space-y-1 text-muted-foreground">
                  <div>
                    Modèle : <strong className="text-foreground">{result.deviceModel}</strong>
                  </div>
                  <div>
                    Plainte N° :{" "}
                    <strong className="text-foreground">{result.policeReportNumber}</strong>
                  </div>
                  <div>
                    Déclarant : <strong className="text-foreground">{result.declarantName}</strong>{" "}
                    ({result.declarationDate})
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setIsDeclaring(true)}
              className="text-xs text-muted-foreground hover:text-primary transition-colors underline font-medium"
            >
              Vous êtes victime d'un vol ? Déclarer votre numéro de série &rarr;
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleDeclare} className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">Fiche de Déclaration de Vol</span>
            <button
              type="button"
              onClick={() => setIsDeclaring(false)}
              className="text-xs text-primary underline"
            >
              Retour à la recherche
            </button>
          </div>

          <Input
            placeholder="Numéro de Série (S/N) ou IMEI"
            value={serial}
            onChange={(e) => setSerial(e.target.value.toUpperCase())}
            className="font-mono text-xs"
            required
          />
          <Input
            placeholder="Modèle exact (ex: MacBook Pro 14 M1)"
            value={declModel}
            onChange={(e) => setDeclModel(e.target.value)}
            className="text-xs"
            required
          />
          <Input
            placeholder="Numéro du PV de plainte (Police / Gendarmerie)"
            value={declPv}
            onChange={(e) => setDeclPv(e.target.value)}
            className="text-xs"
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Nom ou Entreprise"
              value={declName}
              onChange={(e) => setDeclName(e.target.value)}
              className="text-xs"
              required
            />
            <Input
              placeholder="Téléphone contact"
              value={declPhone}
              onChange={(e) => setDeclPhone(e.target.value)}
              className="text-xs font-mono"
              required
            />
          </div>

          <Button
            type="submit"
            variant="destructive"
            disabled={loading}
            className="w-full text-xs font-bold uppercase tracking-wider"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
            Enregistrer le Signalement Anti-Recel &rarr;
          </Button>

          {declSuccess && (
            <div className="p-3 bg-emerald-600/10 border border-emerald-600/30 rounded-lg text-xs text-emerald-700 font-semibold">
              {declSuccess}
            </div>
          )}
        </form>
      )}
    </div>
  );
}
