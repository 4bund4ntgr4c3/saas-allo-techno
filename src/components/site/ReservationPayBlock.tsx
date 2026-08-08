import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatFcfa } from "@/data/catalog/company";
import { useI18n } from "@/lib/i18n/context";
import "@/lib/i18n/segments/suivi";
import {
  getReservationPaymentStatus,
  initiateFedaPayReservationPayment,
  initiateKkiapayReservationPayment,
  initiateReservationPayment,
} from "@/lib/payments.functions";

const FLUTTERWAVE_METHODS = ["MTN MoMo", "Moov Money", "Celtiis"] as const;
type FlutterwaveMethod = (typeof FLUTTERWAVE_METHODS)[number];

type PayProvider = "flutterwave" | "fedapay" | "kkiapay";

const PROVIDERS: { key: PayProvider; label: string }[] = [
  { key: "flutterwave", label: "suivi.pay.provider.flutterwave" },
  { key: "fedapay", label: "suivi.pay.provider.fedapay" },
  { key: "kkiapay", label: "suivi.pay.provider.kkiapay" },
];

/**
 * Bloc « Payer en ligne » pour un devis approuvé de réservation : choix du
 * prestataire (Flutterwave Mobile Money, FedaPay ou KKiaPay), ouverture du
 * checkout dans un nouvel onglet, puis sondage du statut du paiement (toutes
 * les 4 s, ~10 essais). Prop `userId` (espace client) : notifies et invalide
 * la liste des réservations à la confirmation.
 */
export function ReservationPayBlock({
  reference,
  amount,
  alreadyPaid = false,
  userId,
}: {
  reference: string;
  amount: number;
  alreadyPaid?: boolean;
  userId?: string;
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const payFlutterwave = useServerFn(initiateReservationPayment);
  const payFedaPay = useServerFn(initiateFedaPayReservationPayment);
  const payKkiaPay = useServerFn(initiateKkiapayReservationPayment);
  const checkPay = useServerFn(getReservationPaymentStatus);
  const [provider, setProvider] = useState<PayProvider>("flutterwave");
  const [method, setMethod] = useState<FlutterwaveMethod>("MTN MoMo");
  const [phase, setPhase] = useState<"idle" | "redirecting" | "pending" | "paid" | "failed">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const busy = phase === "redirecting" || phase === "pending";

  const finish = (status: "paid" | "failed") => {
    setPhase(status);
    if (!userId) return;
    if (status === "paid") {
      toast.success("Paiement confirmé. Merci !");
      queryClient.invalidateQueries({ queryKey: ["reservations", userId] });
    } else {
      toast.error("Le paiement a échoué. Vous pouvez réessayer.");
    }
  };

  const pay = async () => {
    if (busy) return;
    setError(null);
    setPhase("redirecting");
    try {
      const res =
        provider === "fedapay"
          ? await payFedaPay({ data: { reference } })
          : provider === "kkiapay"
            ? await payKkiaPay({ data: { reference } })
            : await payFlutterwave({ data: { reference, method } });
      if (!res.ok) {
        setPhase("failed");
        setError(res.error || t("suivi.pay.error"));
        return;
      }
      if (res.alreadyPaid || res.url === null) {
        finish("paid");
        return;
      }
      window.open(res.url, "_blank", "noopener,noreferrer");
      setPhase("pending");
      for (let attempt = 0; attempt < 10; attempt += 1) {
        await new Promise((r) => setTimeout(r, 4000));
        const status = await checkPay({ data: { reference } });
        if (status.status === "paid") {
          finish("paid");
          return;
        }
        if (status.status === "failed") {
          finish("failed");
          return;
        }
      }
      setPhase("failed");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("suivi.pay.error"));
      setPhase("failed");
    }
  };

  if (alreadyPaid) {
    return (
      <div className="mt-6 flex items-center gap-2 border border-success/40 bg-success/10 p-4">
        <CheckCircle2 className="size-4 shrink-0 text-success" />
        <p className="text-sm font-semibold">{t("suivi.pay.paid")}</p>
      </div>
    );
  }

  const payLabel =
    provider === "flutterwave"
      ? t("suivi.pay.button", [formatFcfa(amount)])
      : provider === "fedapay"
        ? t("suivi.pay.fedapay", [formatFcfa(amount)])
        : t("suivi.pay.kkiapay", [formatFcfa(amount)]);

  return (
    <div className="mt-6 border border-border bg-surface p-4">
      <span className="at-eyebrow">{t("suivi.pay.title")}</span>
      <p className="mt-2 text-xs text-muted-foreground">{t("suivi.pay.intro")}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Prestataire">
        {PROVIDERS.map((p) => (
          <button
            key={p.key}
            type="button"
            disabled={busy}
            aria-pressed={provider === p.key}
            onClick={() => setProvider(p.key)}
            className={`rounded-sm border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide outline-none focus:border-primary ${
              provider === p.key
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:border-primary/50"
            }`}
          >
            {t(p.label)}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {provider === "flutterwave" && (
          <select
            aria-label={t("suivi.pay.method")}
            value={method}
            disabled={busy}
            onChange={(e) => setMethod(e.target.value as FlutterwaveMethod)}
            className="border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {FLUTTERWAVE_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        )}
        <Button variant="technical" disabled={busy || amount <= 0} onClick={() => void pay()}>
          <Wallet className="mr-2 size-4" />
          {phase === "redirecting" ? t("suivi.pay.redirecting") : payLabel}
        </Button>
      </div>
      {phase === "pending" && (
        <p className="mt-3 text-xs text-muted-foreground">{t("suivi.pay.pending")}</p>
      )}
      {phase === "paid" && (
        <p className="mt-3 w-fit rounded-sm border border-success/50 px-3 py-1 font-mono text-xs uppercase text-success">
          {t("suivi.pay.paid")}
        </p>
      )}
      {phase === "failed" && (
        <p role="alert" className="mt-3 text-xs text-destructive">
          {error ?? t("suivi.pay.failed")}
        </p>
      )}
    </div>
  );
}
