import * as React from "react";
import { Award, QrCode, Smartphone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDigitalLoyaltyCardFn, type DigitalLoyaltyCard } from "@/lib/digital-pass";

export function DigitalWalletCardModal() {
  const [card, setCard] = React.useState<DigitalLoyaltyCard | null>(null);
  const phone = "97000000";

  React.useEffect(() => {
    getDigitalLoyaltyCardFn({ data: { phone } })
      .then(setCard)
      .catch(() => {});
  }, [phone]);

  if (!card) return null;

  return (
    <div className="border border-border bg-card p-5 sm:p-6 rounded-3xl max-w-sm mx-auto shadow-2xl space-y-5 animate-in fade-in duration-200">
      {/* ─── Apple / Google Wallet Header ─── */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Smartphone className="size-5 text-primary" />
          <h3 className="font-bold text-xs uppercase tracking-wide text-foreground">
            Carte Allô Club VIP Numérique
          </h3>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-[10px] text-amber-500 border-amber-500/40 bg-amber-500/10 font-bold"
        >
          {card.tier}
        </Badge>
      </div>

      {/* ─── Pass Card Visual (iPhone Wallet style) ─── */}
      <div className="bg-linear-to-br from-slate-900 via-slate-800 to-primary/80 text-white p-5 rounded-2xl shadow-xl space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-300 uppercase tracking-widest block">
              ALLÔ TECHNO AFRICA
            </span>
            <h4 className="font-extrabold text-sm tracking-tight text-white">
              {card.customerName}
            </h4>
          </div>
          <Award className="size-6 text-amber-400" />
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
          <div>
            <span className="text-[9px] text-slate-300 uppercase block">Points Club</span>
            <strong className="text-sm font-mono font-bold text-white">
              {card.loyaltyPoints} pts
            </strong>
          </div>
          <div>
            <span className="text-[9px] text-slate-300 uppercase block">Remise Atelier</span>
            <strong className="text-sm font-mono font-bold text-emerald-400">
              -{card.discountPercentage}%
            </strong>
          </div>
          <div>
            <span className="text-[9px] text-slate-300 uppercase block">Entretien Offert</span>
            <strong className="text-sm font-mono font-bold text-amber-300">
              {card.freeMaintenanceCount} restant
            </strong>
          </div>
        </div>

        {/* QR Code Bar */}
        <div className="bg-white p-3 rounded-xl flex flex-col items-center justify-center space-y-1 text-slate-900 shadow-inner">
          <QrCode className="size-16 text-slate-900" />
          <span className="font-mono text-[10px] font-bold tracking-widest">
            {card.memberNumber}
          </span>
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-300 pt-1">
          <span>Valable jusqu'au : {card.validUntil}</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="size-3 text-emerald-400" /> Vérifié
          </span>
        </div>
      </div>

      <Button
        asChild
        variant="technical"
        className="w-full text-xs font-bold uppercase tracking-wider h-9"
      >
        <a
          href={`https://wa.me/22960000000?text=${encodeURIComponent(
            `Bonjour Allô Techno, je présente mon pass Allô Club VIP N° ${card.memberNumber} pour bénéficier de mes remises et points de fidélité.`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Présenter mon Pass en Boutique &rarr;
        </a>
      </Button>
    </div>
  );
}
