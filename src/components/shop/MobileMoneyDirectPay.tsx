import * as React from "react";
import { CheckCircle2, Loader2, Smartphone, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";

export type MoMoProvider = "mtn" | "moov" | "celtiis";

export interface MobileMoneyDirectPayProps {
  amountFcfa: number;
  reference: string;
  onPaymentSuccess: (transactionId: string) => void;
  onCancel?: () => void;
}

export function detectMomoProvider(phoneRaw: string): MoMoProvider {
  const digits = phoneRaw.replace(/\D/g, "");
  const num = digits.startsWith("229") ? digits.slice(3) : digits;
  const prefix2 = num.slice(0, 2);

  // MTN Bénin : 61, 62, 66, 67, 69, 96, 97, 51, 52, 53, 54
  if (["61", "62", "66", "67", "69", "96", "97", "51", "52", "53", "54", "44", "45"].includes(prefix2)) {
    return "mtn";
  }
  // Moov Money Bénin : 94, 95, 60, 63, 64, 65, 68
  if (["94", "95", "60", "63", "64", "65", "68", "55", "56"].includes(prefix2)) {
    return "moov";
  }
  // Celtiis Cash : 40, 41, 42, 43, 90, 91, 92, 93
  return "celtiis";
}

export function MobileMoneyDirectPay({
  amountFcfa,
  reference,
  onPaymentSuccess,
  onCancel,
}: MobileMoneyDirectPayProps) {
  const [phone, setPhone] = React.useState("");
  const [provider, setProvider] = React.useState<MoMoProvider>("mtn");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [step, setStep] = React.useState<"input" | "waiting_prompt" | "success">("input");
  const [countdown, setCountdown] = React.useState(45);

  React.useEffect(() => {
    if (phone.length >= 2) {
      setProvider(detectMomoProvider(phone));
    }
  }, [phone]);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "waiting_prompt" && countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    } else if (step === "waiting_prompt" && countdown === 0) {
      // Simulation confirmation automatique après décompte
      setStep("success");
      onPaymentSuccess(`MOMO-BJ-${Date.now().toString().slice(-6)}`);
    }
    return () => clearTimeout(timer);
  }, [step, countdown, onPaymentSuccess]);

  const handleInitiatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || phone.replace(/\D/g, "").length < 8) {
      alert("Veuillez saisir un numéro de téléphone Mobile Money Bénin valide (8 chiffres).");
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep("waiting_prompt");
    }, 1200);
  };

  const getProviderConfig = () => {
    switch (provider) {
      case "mtn":
        return {
          name: "MTN Mobile Money",
          color: "bg-yellow-400 text-yellow-950 border-yellow-500",
          ussdCode: "*460#",
        };
      case "moov":
        return {
          name: "Moov Money",
          color: "bg-blue-600 text-white border-blue-700",
          ussdCode: "*155#",
        };
      case "celtiis":
        return {
          name: "Celtiis Cash",
          color: "bg-emerald-600 text-white border-emerald-700",
          ussdCode: "*880#",
        };
    }
  };

  const cfg = getProviderConfig();

  return (
    <div className="border border-border bg-card p-5 sm:p-6 rounded-xl space-y-5 shadow-lg max-w-md mx-auto animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Smartphone className="size-5 text-primary" />
          <h3 className="font-bold text-sm uppercase tracking-wide">
            Paiement Mobile Money Direct
          </h3>
        </div>
        <Badge variant="outline" className="font-mono text-[10px]">
          Bénin (+229)
        </Badge>
      </div>

      <div className="bg-surface p-3.5 rounded-lg flex items-center justify-between">
        <div>
          <span className="text-[10px] at-eyebrow text-muted-foreground block">Montant à Régler</span>
          <strong className="text-xl font-mono font-extrabold text-foreground">
            {formatFcfa(amountFcfa)}
          </strong>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-muted-foreground block">Réf Dossier</span>
          <span className="font-mono text-xs font-bold text-primary">{reference}</span>
        </div>
      </div>

      {step === "input" && (
        <form onSubmit={handleInitiatePayment} className="space-y-4">
          <div>
            <Label className="text-xs">Numéro Mobile Money (MTN, Moov, Celtiis)</Label>
            <div className="mt-1 relative flex items-center">
              <span className="absolute left-3 text-xs font-mono font-bold text-muted-foreground">
                +229
              </span>
              <Input
                className="pl-14 font-mono text-base font-bold"
                placeholder="97 00 00 00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={12}
                autoFocus
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Opérateur détecté :</span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded border ${cfg.color}`}>
              {cfg.name}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            {onCancel && (
              <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                Annuler
              </Button>
            )}
            <Button
              type="submit"
              variant="technical"
              size="sm"
              disabled={isProcessing || !phone.trim()}
              className="font-bold uppercase tracking-wider"
            >
              {isProcessing ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : (
                <Zap className="mr-1.5 size-4" />
              )}
              Valider le Paiement &rarr;
            </Button>
          </div>
        </form>
      )}

      {step === "waiting_prompt" && (
        <div className="text-center space-y-4 py-4 animate-in zoom-in-95 duration-200">
          <div className="relative size-16 mx-auto flex items-center justify-center rounded-full bg-primary/10 text-primary">
            <Smartphone className="size-8 animate-bounce" />
          </div>

          <div>
            <h4 className="font-bold text-sm text-foreground">
              Demande envoyée sur votre téléphone (+229 {phone})
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Veuillez confirmer la transaction en saisissant votre code secret Mobile Money ou tapez{" "}
              <strong className="font-mono text-primary">{cfg.ussdCode}</strong>.
            </p>
          </div>

          <div className="font-mono text-xs text-muted-foreground bg-surface py-2 rounded">
            Délai d'attente : <strong>{countdown}s</strong>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setStep("success");
              onPaymentSuccess(`MOMO-BJ-${Date.now().toString().slice(-6)}`);
            }}
            className="text-xs"
          >
            J'ai validé sur mon téléphone &rarr;
          </Button>
        </div>
      )}

      {step === "success" && (
        <div className="text-center space-y-3 py-4 animate-in zoom-in-95 duration-200">
          <CheckCircle2 className="size-12 text-emerald-600 mx-auto" />
          <h4 className="font-bold text-base text-foreground">Paiement Validé avec Succès !</h4>
          <p className="text-xs text-muted-foreground">
            Votre règlement a été enregistré et la quittance numérique a été émise.
          </p>
        </div>
      )}
    </div>
  );
}
