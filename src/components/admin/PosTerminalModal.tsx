import * as React from "react";
import { ShoppingBag, Printer, Banknote, Smartphone, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";
import {
  processPosCheckoutFn,
  type PosLineItem,
  type PosTransactionResult,
} from "@/lib/pos-cashier.functions";

const PRESET_CATALOG_ITEMS: PosLineItem[] = [
  {
    id: "REP-01",
    label: "Forfait Repâtage Thermique Arctic MX-4",
    unitPriceFcfa: 15000,
    quantity: 1,
    category: "reparation",
  },
  {
    id: "REP-02",
    label: "Remplacement Écran FHD 15.6'' Slim 30 Pin",
    unitPriceFcfa: 45000,
    quantity: 1,
    category: "reparation",
  },
  {
    id: "ACC-01",
    label: "Chargeur Universel USB-C GaN 65W PD",
    unitPriceFcfa: 18000,
    quantity: 1,
    category: "accessoire",
  },
  {
    id: "PIE-01",
    label: "SSD NVMe 512 Go PCIe 4.0",
    unitPriceFcfa: 28000,
    quantity: 1,
    category: "piece_detachee",
  },
];

export function PosTerminalModal() {
  const [cart, setCart] = React.useState<PosLineItem[]>([
    {
      id: "REP-01",
      label: "Forfait Repâtage Thermique Arctic MX-4",
      unitPriceFcfa: 15000,
      quantity: 1,
      category: "reparation",
    },
  ]);
  const [cashierName] = React.useState("Gervais Dossou (Caisse Comptoir Haie Vive)");
  const [cashPaid, setCashPaid] = React.useState<number>(15000);
  const [momoPaid, setMomoPaid] = React.useState<number>(0);
  const cardPaid = 0;

  const [loading, setLoading] = React.useState(false);
  const [receipt, setReceipt] = React.useState<PosTransactionResult | null>(null);

  const totalCart = cart.reduce((sum, i) => sum + i.unitPriceFcfa * i.quantity, 0);

  const addItemToCart = (item: PosLineItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItemFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await processPosCheckoutFn({
        data: {
          cashierName,
          items: cart,
          cashReceivedFcfa: cashPaid,
          momoReceivedFcfa: momoPaid,
          cardReceivedFcfa: cardPaid,
        },
      });
      setReceipt(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-border bg-card p-5 sm:p-7 rounded-2xl max-w-3xl mx-auto space-y-6 shadow-xl animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <ShoppingBag className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Terminal de Caisse Tactile POS &amp; Impression Thermique
            </h3>
            <p className="text-xs text-muted-foreground">
              Encaissement express au comptoir atelier avec émission du ticket fiscal normalisé
              e-MECeF
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-xs text-emerald-600 border-emerald-600/40 bg-emerald-600/10 font-bold"
        >
          Imprimante ESC/POS Prête
        </Badge>
      </div>

      {receipt ? (
        <div className="border border-border bg-surface p-6 rounded-2xl max-w-md mx-auto space-y-4 shadow-sm text-center">
          <div className="border border-dashed border-border bg-card p-5 rounded-xl space-y-3 font-mono text-xs text-foreground">
            <strong className="text-sm uppercase block tracking-wider font-extrabold text-primary">
              Allô Techno Africa — Ticket de Caisse
            </strong>
            <div className="text-[11px] text-muted-foreground">
              {receipt.receiptNumber} · {receipt.timestamp}
            </div>

            <div className="border-t border-b border-border/60 py-2 space-y-1 text-left text-[11px]">
              {cart.map((i) => (
                <div key={i.id} className="flex justify-between">
                  <span>
                    {i.quantity}x {i.label}
                  </span>
                  <span className="font-bold">{formatFcfa(i.unitPriceFcfa * i.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between font-bold text-sm text-primary">
              <span>TOTAL PAYÉ :</span>
              <span>{formatFcfa(receipt.totalFcfa)}</span>
            </div>

            {receipt.changeDueFcfa > 0 && (
              <div className="flex justify-between text-[11px] text-emerald-600 font-bold">
                <span>Monnaie Rendue :</span>
                <span>{formatFcfa(receipt.changeDueFcfa)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-border/60 text-[10px] text-muted-foreground">
              <span className="font-bold block text-foreground">{receipt.mecefSecurityCode}</span>
              <span>Signature Électronique DGI Bénin Validée</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setReceipt(null)} className="w-1/2 text-xs">
              Nouvelle Vente
            </Button>
            <Button
              variant="technical"
              onClick={() => window.print()}
              className="w-1/2 text-xs font-bold uppercase"
            >
              <Printer className="size-3.5 mr-1.5" /> Imprimer Ticket (80mm)
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Preset Buttons Catalog (Col 1-7) */}
          <div className="md:col-span-7 space-y-3">
            <span className="font-bold text-xs uppercase tracking-wide text-foreground block">
              Articles &amp; Prestations Rapides :
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {PRESET_CATALOG_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => addItemToCart(item)}
                  className="p-3 rounded-xl border border-border bg-surface hover:border-primary text-left transition-all space-y-1 group"
                >
                  <span className="font-bold text-foreground block group-hover:text-primary transition-colors leading-tight">
                    {item.label}
                  </span>
                  <span className="font-mono text-primary font-extrabold block">
                    {formatFcfa(item.unitPriceFcfa)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Cart & Split Payment (Col 8-12) */}
          <div className="md:col-span-5 border border-border bg-surface/60 p-4 rounded-xl space-y-4 text-xs">
            <span className="font-bold text-foreground uppercase tracking-wide block">
              Panier Comptoir ({cart.length} lignes)
            </span>

            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-card p-2 rounded-lg border border-border"
                >
                  <div className="truncate pr-2">
                    <span className="font-medium text-foreground block truncate">{item.label}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {item.quantity} x {formatFcfa(item.unitPriceFcfa)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItemFromCart(item.id)}
                    className="text-muted-foreground hover:text-destructive p-1"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-border flex justify-between items-baseline">
              <span className="font-bold text-foreground">Total à Payer :</span>
              <strong className="text-base font-mono font-extrabold text-primary">
                {formatFcfa(totalCart)}
              </strong>
            </div>

            {/* Split Payment inputs */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <div className="flex items-center gap-2">
                <Banknote className="size-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] text-muted-foreground w-16">Espèces :</span>
                <Input
                  type="number"
                  min={0}
                  value={cashPaid}
                  onChange={(e) => setCashPaid(Number(e.target.value))}
                  className="h-7 text-xs font-mono font-bold"
                />
              </div>

              <div className="flex items-center gap-2">
                <Smartphone className="size-4 text-amber-500 shrink-0" />
                <span className="text-[11px] text-muted-foreground w-16">MoMo :</span>
                <Input
                  type="number"
                  min={0}
                  value={momoPaid}
                  onChange={(e) => setMomoPaid(Number(e.target.value))}
                  className="h-7 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <Button
              onClick={handleCheckout}
              disabled={loading || cart.length === 0}
              variant="technical"
              className="w-full font-bold uppercase tracking-wider text-xs h-9 mt-2"
            >
              {loading ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : null}
              {loading ? "Encaissement..." : `Encaisser ${formatFcfa(totalCart)} &rarr;`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
