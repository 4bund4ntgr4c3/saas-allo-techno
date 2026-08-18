import * as React from "react";
import { Cloud, Lock, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  createEmergencyCloudBackupFn,
  type CloudVaultBackupReceipt,
} from "@/lib/emergency-cloud-vault.functions";

export function EmergencyCloudVaultModal() {
  const formTopRef = React.useRef<HTMLDivElement>(null);
  const [clientFullName, setClientFullName] = React.useState("Dr. Rodrigue Mensah");
  const [clientPhone, setClientPhone] = React.useState("97001122");
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([
    "Dossier Bureau & Documents",
    "Comptabilité & Factures",
    "Base de Données / E-mails Outlook",
  ]);

  const [loading, setLoading] = React.useState(false);
  const [receipt, setReceipt] = React.useState<CloudVaultBackupReceipt | null>(null);

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter((c) => c !== cat));
      }
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleCreateBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createEmergencyCloudBackupFn({
        data: {
          clientFullName,
          clientPhone,
          categories: selectedCategories,
        },
      });
      setReceipt(res);
      if (formTopRef.current) {
        formTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={formTopRef}
      className="border border-border bg-card p-5 sm:p-7 rounded-2xl max-w-2xl mx-auto space-y-6 shadow-xl animate-in fade-in duration-200"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Cloud className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Coffre-Fort Cloud de Sauvegarde d'Urgence Pré-Atelier
            </h3>
            <p className="text-xs text-muted-foreground">
              Archive chiffrée AES-256 de vos fichiers vitaux avant ouverture technique en atelier
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-xs text-emerald-600 border-emerald-600/40 bg-emerald-600/10 font-bold"
        >
          Chiffrement AES-256
        </Badge>
      </div>

      {receipt ? (
        <div className="border border-emerald-600/30 bg-surface/80 p-6 rounded-2xl text-center space-y-4 shadow-sm animate-in zoom-in-95 duration-200 text-xs">
          <div className="size-12 rounded-full bg-emerald-600/10 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="size-7" />
          </div>
          <h4 className="text-lg font-bold text-foreground">
            Sauvegarde Cloud Sécurisée &amp; Verrouillée
          </h4>
          <Badge variant="outline" className="font-mono text-sm text-primary font-bold">
            ID Coffre : {receipt.vaultArchiveId}
          </Badge>

          <div className="p-4 rounded-xl bg-background border border-border space-y-2 max-w-md mx-auto text-left">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Volume Sauvegardé :</span>
              <strong className="font-mono text-foreground">
                {receipt.totalSizeMegabytes / 1000} Go Chiffrés
              </strong>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Code PIN de Restauration :</span>
              <strong className="font-mono text-base font-extrabold text-emerald-600">
                {receipt.retrievalPinCode}
              </strong>
            </div>
            <div className="text-[10px] text-muted-foreground pt-1 truncate">
              Empreinte SHA-256 : {receipt.encryptedHashSha256}
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
            Vos données sont conservées pendant {receipt.expirationDays} jours dans notre datacenter
            souverain. Conservez votre code PIN précieusement.
          </p>

          <Button
            type="button"
            variant="outline"
            onClick={() => setReceipt(null)}
            className="text-xs"
          >
            Nouvelle Sauvegarde
          </Button>
        </div>
      ) : (
        <form onSubmit={handleCreateBackup} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-muted-foreground block mb-1">
                Nom &amp; Prénom du Propriétaire :
              </label>
              <Input
                required
                value={clientFullName}
                onChange={(e) => setClientFullName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-muted-foreground block mb-1">
                Téléphone Mobile (Réception PIN) :
              </label>
              <Input
                required
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="font-mono font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-muted-foreground block">
              Dossiers vitaux à chiffrer et sauvegarder :
            </label>
            <div className="space-y-2">
              {[
                "Dossier Bureau & Documents",
                "Comptabilité & Factures",
                "Base de Données / E-mails Outlook",
                "Photos & Projets Personnels",
              ].map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 font-bold"
                        : "border-border bg-surface text-muted-foreground"
                    }`}
                  >
                    <span>{cat}</span>
                    {isSelected && <CheckCircle2 className="size-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            variant="technical"
            className="w-full font-bold uppercase tracking-wider text-xs h-9 mt-2"
          >
            {loading ? (
              <Loader2 className="size-4 mr-1.5 animate-spin" />
            ) : (
              <Lock className="size-4 mr-1.5" />
            )}
            {loading
              ? "Chiffrement AES-256 en cours..."
              : "Sécuriser mes Fichiers dans le Cloud Allô Techno"}
          </Button>
        </form>
      )}
    </div>
  );
}
