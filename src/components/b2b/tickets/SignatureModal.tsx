import * as React from "react";
import { X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignaturePad } from "@/components/ui/SignaturePad";

export interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  documentRef?: string;
  onSignComplete: (data: { signerName: string; signatureBase64: string; signedAt: string }) => void;
}

export function SignatureModal({
  isOpen,
  onClose,
  title = "Signature Électronique de l'Intervention",
  documentRef,
  onSignComplete,
}: SignatureModalProps) {
  const [signerName, setSignerName] = React.useState("");

  if (!isOpen) return null;

  const handleSaveSignature = (dataUrl: string) => {
    if (!signerName.trim()) {
      alert("Veuillez renseigner le nom et prénom du signataire.");
      return;
    }
    onSignComplete({
      signerName: signerName.trim(),
      signatureBase64: dataUrl,
      signedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg border border-border bg-card p-6 shadow-xl rounded-lg space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            <div>
              <h3 className="text-base font-bold uppercase tracking-wide text-foreground">
                {title}
              </h3>
              {documentRef && (
                <p className="font-mono text-xs text-muted-foreground">Réf : {documentRef}</p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="size-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">
              Nom &amp; Prénom du Signataire (Client / Responsable IT)
            </Label>
            <Input
              className="mt-1"
              placeholder="Ex: Jean DOSSOU"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              autoFocus
            />
          </div>

          <SignaturePad onSave={handleSaveSignature} />
        </div>
      </div>
    </div>
  );
}
