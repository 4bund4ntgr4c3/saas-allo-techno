import * as React from "react";
import { CreditCard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";

export function InstallmentPaymentCalculator({ initialAmount = 120000 }: { initialAmount?: number }) {
  const [totalAmount, setTotalAmount] = React.useState(initialAmount);
  const [installments, setInstallments] = React.useState<3 | 4>(3);

  const monthlyPayment = React.useMemo(() => {
    return Math.round(totalAmount / installments);
  }, [totalAmount, installments]);

  const schedule = React.useMemo(() => {
    const dates = [];
    const now = new Date();
    for (let i = 0; i < installments; i++) {
      const d = new Date(now.getTime() + i * 30 * 864e5);
      dates.push({
        step: i + 1,
        label: i === 0 ? "Aujourd'hui (Dépôt)" : `Échéance +${i * 30} jours`,
        date: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }),
        amount: monthlyPayment,
      });
    }
    return dates;
  }, [installments, monthlyPayment]);

  return (
    <div className="border border-border bg-card p-5 sm:p-6 rounded-2xl space-y-5 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <CreditCard className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">
              Paiement Échelonné en 3x ou 4x par Mobile Money
            </h3>
            <p className="text-xs text-muted-foreground">
              Réglez vos réparations importantes en plusieurs fois sans frais cachés
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-xs text-emerald-600 border-emerald-600/40 bg-emerald-600/10 font-bold">
          0% d'Intérêts
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="text-muted-foreground block mb-1">Montant de la réparation (FCFA) :</label>
          <Input
            type="number"
            min={30000}
            max={1000000}
            step={5000}
            value={totalAmount}
            onChange={(e) => setTotalAmount(Number(e.target.value))}
            className="font-mono font-bold text-sm"
          />
        </div>

        <div>
          <label className="text-muted-foreground block mb-1">Nombre d'échéances :</label>
          <div className="grid grid-cols-2 gap-2">
            {[3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setInstallments(n as 3 | 4)}
                className={`p-2.5 rounded-lg border text-center font-semibold transition-all ${
                  installments === n
                    ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                Paiement en {n}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Payment Schedule Breakdown ─── */}
      <div className="space-y-2.5 bg-surface/60 p-4 rounded-xl border border-border">
        <span className="text-[11px] font-bold text-foreground uppercase tracking-wide block">
          Calendrier des Prélèvements Mobile Money :
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          {schedule.map((item) => (
            <div key={item.step} className="bg-background p-3 rounded-lg border border-border space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[10px] text-primary font-bold">Versement 0{item.step}</span>
                <span className="text-[10px] text-muted-foreground">{item.date}</span>
              </div>
              <strong className="font-mono text-foreground block text-sm font-bold">{formatFcfa(item.amount)}</strong>
              <span className="text-[10px] text-muted-foreground block">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
          <span>Prélèvement automatique sécurisé MTN MoMo / Moov Money avec rappel SMS 48h avant</span>
        </div>
        <Button
          asChild
          variant="technical"
          size="sm"
          className="text-xs font-bold uppercase tracking-wider shrink-0"
        >
          <a
            href={`https://wa.me/22960000000?text=${encodeURIComponent(
              `Bonjour Allô Techno, je souhaite souscrire au paiement en ${installments}x de ${formatFcfa(
                monthlyPayment,
              )}/mois pour ma réparation de ${formatFcfa(totalAmount)}.`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Activer le Paiement en {installments}x &rarr;
          </a>
        </Button>
      </div>
    </div>
  );
}
