import * as React from "react";
import { ShieldCheck, CheckCircle2, Lock, Loader2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { submitAutoDeployBatchFn } from "@/lib/zero-touch-deployment.functions";

export function ZeroTouchDeploymentModal() {
  const formTopRef = React.useRef<HTMLDivElement>(null);
  const [step, setStep] = React.useState<1 | 2>(1);

  // States with default first selection
  const [clientCompanyName, setClientCompanyName] = React.useState("Banque Atlantique Bénin");
  const [deviceCount, setDeviceCount] = React.useState<number>(25);
  const [osTarget, setOsTarget] = React.useState("Windows 11 Pro");
  const [mdmProvider, setMdmProvider] = React.useState("Microsoft Intune");
  const encryptionPolicy = "BitLocker XTS-AES-256 + Séquestre Clé";
  const vpnCorporateConfig = true;

  const [loading, setLoading] = React.useState(false);
  const [submittedBatchId, setSubmittedBatchId] = React.useState<string | null>(null);

  // Auto-scroll when step changes
  React.useEffect(() => {
    if (formTopRef.current) {
      formTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [step]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await submitAutoDeployBatchFn({
        data: {
          clientCompanyName,
          deviceCount,
          osTarget,
          mdmProvider,
          encryptionPolicy,
          preinstalledApps: ["Microsoft 365 ProPlus", "Adobe Acrobat Pro", "Client VPN WireGuard", "Antivirus SentinelOne"],
          vpnCorporateConfig,
        },
      });
      if (res.success) {
        setSubmittedBatchId(res.batchId);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={formTopRef} className="border border-border bg-card p-5 sm:p-7 rounded-2xl max-w-2xl mx-auto space-y-6 shadow-xl animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Layers className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Allô AutoDeploy — Masterisation &amp; Déploiement Zero-Touch
            </h3>
            <p className="text-xs text-muted-foreground">
              Préparation industrielle et personnalisation de flottes avant livraison aux collaborateurs
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/40 bg-primary/10">
          Enrôlement MDM Prêt
        </Badge>
      </div>

      {submittedBatchId ? (
        <div className="border border-emerald-600/30 bg-surface/80 p-6 rounded-2xl text-center space-y-4 shadow-sm animate-in zoom-in-95 duration-200">
          <div className="size-12 rounded-full bg-emerald-600/10 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="size-7" />
          </div>
          <h4 className="text-lg font-bold text-foreground">Masterisation Zero-Touch Lancée</h4>
          <Badge variant="outline" className="font-mono text-sm text-primary font-bold">
            Batch Déploiement : {submittedBatchId}
          </Badge>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            Les {deviceCount} ordinateurs sont flashés simultanément sur notre banc Gigabit PXE avec chiffrement BitLocker et vos règles de sécurité d'entreprise.
          </p>
          <div className="pt-2">
            <Button asChild variant="technical" className="text-xs font-bold uppercase">
              <a
                href={`https://wa.me/22960000000?text=${encodeURIComponent(
                  `Bonjour Allô Techno Déploiement, nous confirmons le lot de masterisation N° ${submittedBatchId} pour ${deviceCount} postes (${clientCompanyName}).`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Suivre l'Avancement du Flashage &rarr;
              </a>
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {step === 1 ? (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-muted-foreground block mb-1">Raison Sociale de l'Entreprise :</label>
                  <Input
                    required
                    value={clientCompanyName}
                    onChange={(e) => setClientCompanyName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-muted-foreground block mb-1">Nombre de postes à masteriser :</label>
                  <Input
                    type="number"
                    min={1}
                    max={200}
                    required
                    value={deviceCount}
                    onChange={(e) => setDeviceCount(Number(e.target.value))}
                    className="font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-muted-foreground block mb-1">Système d'Exploitation Cible :</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Windows 11 Pro", "macOS Sequoia", "Ubuntu Pro LTS"].map((os) => (
                    <button
                      key={os}
                      type="button"
                      onClick={() => setOsTarget(os)}
                      className={`p-2 rounded-lg border text-center font-semibold transition-all ${
                        osTarget === os
                          ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                          : "border-border bg-surface text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {os}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-muted-foreground block mb-1">Gestionnaire de Parc MDM :</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Microsoft Intune",
                    "Jamf Pro",
                    "Google Workspace Endpoint",
                    "Aucun (Image Locale)",
                  ].map((mdm) => (
                    <button
                      key={mdm}
                      type="button"
                      onClick={() => setMdmProvider(mdm)}
                      className={`p-2.5 rounded-lg border text-left font-semibold transition-all ${
                        mdmProvider === mdm
                          ? "border-primary bg-primary/10 border-primary text-foreground font-bold shadow-xs"
                          : "border-border bg-surface text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {mdm}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                onClick={() => setStep(2)}
                variant="technical"
                className="w-full font-bold uppercase tracking-wider text-xs h-9 mt-2"
              >
                Configurer la Sécurité &amp; le Chiffrement &rarr;
              </Button>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-surface/70 border border-border space-y-2">
                <span className="font-bold text-foreground block text-xs uppercase tracking-wide">
                  Politique de Sécurité Matérielle Appliquée :
                </span>
                <div className="space-y-1.5 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Lock className="size-3.5 text-emerald-600" />
                    <span>Chiffrement matériel : <strong className="text-foreground">{encryptionPolicy}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-3.5 text-primary" />
                    <span>Verrouillage BIOS par mot de passe administrateur DSI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-blue-600" />
                    <span>Applications incluses : Microsoft 365, SentinelOne, WireGuard VPN</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="w-1/3 text-xs"
                >
                  &larr; Retour
                </Button>
                <Button
                  type="submit"
                  variant="technical"
                  disabled={loading}
                  className="w-2/3 font-bold uppercase tracking-wider text-xs h-9"
                >
                  {loading ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : null}
                  {loading ? "Déploiement..." : `Lancer la Masterisation (${deviceCount} Postes)`}
                </Button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
