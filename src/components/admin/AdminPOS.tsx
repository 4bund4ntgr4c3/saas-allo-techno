import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Search, CheckCircle2, Printer, Receipt, Plus, Trash2, ShoppingBag } from "lucide-react";
import { formatFcfa } from "@/data/catalog/company";
import { field } from "@/components/admin/primitives/AdminField";
import { recordPosPayment, type PosReceipt } from "@/lib/pos.functions";
import { searchAdminReservations, type ReservationSearchRow } from "@/lib/admin.functions";

interface PosItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const QUICK_ACCESSORIES = [
  { id: "acc-1", name: "Verre Trempé 9D (Pose incluse)", price: 2500 },
  { id: "acc-2", name: "Câble Type-C vers Lightning (Fast Charge)", price: 3500 },
  { id: "acc-3", name: "Câble Type-C vers Type-C (60W)", price: 3000 },
  { id: "acc-4", name: "Chargeur Rapide 20W Power Delivery", price: 6500 },
  { id: "acc-5", name: "Coque Antichoc Renforcée", price: 4000 },
  { id: "acc-6", name: "Écouteurs Stéréo Filaire Jack/Type-C", price: 3500 },
];

export function AdminPOS() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReservation, setSelectedReservation] = useState<ReservationSearchRow | null>(null);
  const [cartItems, setCartItems] = useState<PosItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"especes" | "mtn" | "moov" | "celtiis">(
    "especes",
  );
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [lastReceipt, setLastReceipt] = useState<PosReceipt | null>(null);

  // Search reservations
  const searchFn = useServerFn(searchAdminReservations);
  const reservationsQuery = useQuery({
    queryKey: ["pos-reservations", searchQuery],
    enabled: searchQuery.trim().length >= 2,
    queryFn: () => searchFn({ data: { q: searchQuery.trim() } }),
  });

  const handleSelectReservation = (res: ReservationSearchRow) => {
    setSelectedReservation(res);
    setCustomerName(res.customer_name ?? "");
    setCustomerPhone(res.phone ?? "");
    // Add quote as item if exists
    if (res.quote_amount) {
      setCartItems([
        {
          id: `quote-${res.id}`,
          name: `Réparation ${res.device ?? ""} (${res.reference ?? ""})`,
          price: res.quote_amount,
          quantity: 1,
        },
      ]);
    }
    setSearchQuery("");
  };

  const handleAddAccessory = (acc: { id: string; name: string; price: number }) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === acc.id);
      if (existing) {
        return prev.map((item) =>
          item.id === acc.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...prev, { ...acc, quantity: 1 }];
    });
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const receivedNum = Number(amountReceived) || 0;
  const changeDue = Math.max(0, receivedNum - totalAmount);

  // Checkout Mutation
  const checkoutFn = useServerFn(recordPosPayment);
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (totalAmount <= 0) throw new Error("Le panier est vide");

      // L'encaissement passe par la serverFn (staff) : le montant est
      // recalculé côté serveur et la ligne `payments` est insérée avec le
      // rôle service (l'insertion directe est bloquée par RLS).
      return checkoutFn({
        data: {
          reservationId: selectedReservation?.id ?? null,
          items: cartItems.map((it) => ({
            slug: it.id.startsWith("quote-") ? "quote" : it.id,
            qty: it.quantity,
          })),
          method: paymentMethod,
          customerName: customerName.trim() || "Client Comptoir",
          customerPhone: customerPhone.trim(),
          amountReceived: paymentMethod === "especes" ? receivedNum || totalAmount : undefined,
        },
      });
    },
    onSuccess: (receipt) => {
      setLastReceipt(receipt);
      toast.success("Encaissement validé avec succès !");
      // Reset form
      setCartItems([]);
      setSelectedReservation(null);
      setCustomerName("");
      setCustomerPhone("");
      setAmountReceived("");
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["dash-revenue"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'encaissement");
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="at-eyebrow">Atelier & Boutique</p>
          <h2 className="mt-1 text-xl font-semibold">Caisse & Encaissement Comptoir (POS)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Encaissement direct en espèces ou Mobile Money pour réparations et accessoires.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Search & Catalog */}
        <div className="lg:col-span-7 space-y-6">
          {/* Reservation Search Card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Search className="size-3.5 text-primary" />
              <span>1. Associer un dossier de réparation</span>
            </h3>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher par n° de dossier (ex: AT-RES-...), nom ou téléphone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${field} pl-9 w-full text-xs`}
              />
            </div>

            {/* Results dropdown */}
            {searchQuery.trim().length >= 2 && (
              <div className="rounded-lg border border-border bg-background divide-y divide-border overflow-hidden max-h-56 overflow-y-auto">
                {reservationsQuery.isLoading ? (
                  <p className="p-3 text-xs text-muted-foreground text-center">
                    Recherche en cours...
                  </p>
                ) : (reservationsQuery.data ?? []).length === 0 ? (
                  <p className="p-3 text-xs text-muted-foreground text-center">
                    Aucun dossier trouvé.
                  </p>
                ) : (
                  (reservationsQuery.data ?? []).map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleSelectReservation(r)}
                      className="w-full text-left p-3 hover:bg-muted/60 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <span className="font-mono text-xs font-bold text-primary mr-2">
                          {r.reference}
                        </span>
                        <span className="text-xs font-medium text-foreground">
                          {r.customer_name}
                        </span>
                        <p className="text-[11px] text-muted-foreground">
                          {r.device} • {r.issue}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-success block">
                          {r.quote_amount ? formatFcfa(r.quote_amount) : "Devis en attente"}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase">
                          {r.payment_status}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {selectedReservation && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-primary">
                    {selectedReservation.reference}
                  </span>
                  <p className="text-xs font-medium text-foreground">
                    {selectedReservation.customer_name} • {selectedReservation.device}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedReservation(null)}
                  className="text-xs text-destructive hover:bg-destructive/10"
                >
                  Détacher
                </Button>
              </div>
            )}
          </div>

          {/* Quick accessories */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ShoppingBag className="size-3.5 text-primary" />
              <span>2. Ventes directes d'accessoires rapides</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {QUICK_ACCESSORIES.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => handleAddAccessory(acc)}
                  className="p-3 rounded-lg border border-border bg-muted/20 hover:border-primary/50 hover:bg-primary/5 text-left transition-all flex flex-col justify-between"
                >
                  <p className="text-xs font-semibold leading-tight">{acc.name}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">{formatFcfa(acc.price)}</span>
                    <Plus className="size-3.5 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Cart & Checkout */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-5 shadow-sm">
            <h3 className="font-bold text-sm flex items-center justify-between border-b border-border pb-3">
              <span className="flex items-center gap-1.5">
                <Receipt className="size-4 text-primary" />
                <span>Ticket de Caisse</span>
              </span>
              <span className="text-xs text-muted-foreground">{cartItems.length} article(s)</span>
            </h3>

            {/* Cart item list */}
            <div className="space-y-2 min-h-32 max-h-60 overflow-y-auto divide-y divide-border/60">
              {cartItems.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Aucun article. Sélectionnez un dossier ou un accessoire.
                </p>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="pt-2 first:pt-0 flex items-center justify-between text-xs"
                  >
                    <div className="flex-1 pr-2">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.quantity} x {formatFcfa(item.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{formatFcfa(item.price * item.quantity)}</span>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-muted-foreground hover:text-destructive p-1"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total */}
            <div className="border-t border-border pt-3 space-y-1.5">
              <div className="flex justify-between items-center text-sm font-extrabold">
                <span>TOTAL À PAYER :</span>
                <span className="text-primary text-base font-mono">{formatFcfa(totalAmount)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 pt-2 border-t border-border">
              <label className="text-xs font-bold text-muted-foreground block">
                Mode de règlement :
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: "especes", label: "💵 Espèces", sub: "Rendu monnaie" },
                    { id: "mtn", label: "🟡 MTN MoMo", sub: "Mobile Money" },
                    { id: "moov", label: "🔵 Moov Money", sub: "Flooz" },
                    { id: "celtiis", label: "🟣 Celtiis Cash", sub: "SBIN" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      paymentMethod === m.id
                        ? "border-primary bg-primary/10 font-bold"
                        : "border-border bg-muted/20 hover:bg-muted/40"
                    }`}
                  >
                    <p className="text-xs leading-none">{m.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{m.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Calculator if Espèces */}
            {paymentMethod === "especes" && totalAmount > 0 && (
              <div className="bg-muted/40 p-3 rounded-lg border border-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Montant reçu :</span>
                  <input
                    type="number"
                    placeholder={String(totalAmount)}
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className={`${field} w-28 text-right font-mono text-xs py-1`}
                  />
                </div>
                {receivedNum > totalAmount && (
                  <div className="flex items-center justify-between text-xs font-bold text-success border-t border-border pt-1.5">
                    <span>Monnaie à rendre :</span>
                    <span className="font-mono text-sm">{formatFcfa(changeDue)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Submit checkout */}
            <Button
              className="w-full gap-2 font-bold"
              size="lg"
              disabled={totalAmount <= 0 || checkoutMutation.isPending}
              onClick={() => checkoutMutation.mutate()}
            >
              <CheckCircle2 className="size-4" />
              <span>
                {checkoutMutation.isPending
                  ? "Validation en cours..."
                  : `Encaisser ${formatFcfa(totalAmount)}`}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal if completed */}
      {lastReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-sm rounded-xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h4 className="font-bold text-sm">Ticket d'encaissement</h4>
              <button
                onClick={() => setLastReceipt(null)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {/* Receipt Body */}
            <div
              id="pos-thermal-receipt"
              className="bg-white text-black p-4 rounded font-mono text-xs space-y-3 border"
            >
              <div className="text-center border-b border-black pb-2">
                <p className="font-bold text-sm">ALLÔ TECHNO</p>
                <p className="text-[10px]">Atelier Abomey-Calavi</p>
                <p className="text-[9px]">Tél : +229 97 00 00 00</p>
                <p className="text-[9px] mt-1">{lastReceipt.date}</p>
                <p className="text-[9px]">Réf : {lastReceipt.receiptId}</p>
              </div>

              <div className="space-y-1 border-b border-black pb-2">
                <p className="text-[10px]">
                  <span className="font-bold">Client :</span> {lastReceipt.customerName}
                </p>
                {lastReceipt.customerPhone && (
                  <p className="text-[10px]">
                    <span className="font-bold">Tél :</span> {lastReceipt.customerPhone}
                  </p>
                )}
                {lastReceipt.reservationRef && (
                  <p className="text-[10px]">
                    <span className="font-bold">Dossier :</span> {lastReceipt.reservationRef}
                  </p>
                )}
              </div>

              <div className="space-y-1 border-b border-black pb-2">
                {lastReceipt.items.map((it, i: number) => (
                  <div key={i} className="flex justify-between text-[10px]">
                    <span className="truncate max-w-[160px]">
                      {it.quantity}x {it.name}
                    </span>
                    <span className="font-bold">{formatFcfa(it.price * it.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-1 font-bold text-right text-xs">
                <div className="flex justify-between">
                  <span>TOTAL :</span>
                  <span>{formatFcfa(lastReceipt.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-black/70 font-normal">
                  <span>Mode :</span>
                  <span className="uppercase">{lastReceipt.paymentMethod}</span>
                </div>
                {lastReceipt.paymentMethod === "especes" && (
                  <>
                    <div className="flex justify-between text-[10px] text-black/70 font-normal">
                      <span>Reçu :</span>
                      <span>{formatFcfa(lastReceipt.amountReceived)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-black/70 font-normal">
                      <span>Rendu :</span>
                      <span>{formatFcfa(lastReceipt.changeDue)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center pt-2 border-t border-black text-[9px]">
                <p>Merci pour votre confiance !</p>
                <p>Garantie réparation : 3 mois</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setLastReceipt(null)}>
                Fermer
              </Button>
              <Button size="sm" onClick={() => window.print()} className="gap-1.5">
                <Printer className="size-3.5" />
                <span>Imprimer le reçu</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
