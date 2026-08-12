import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, FileText, MessageSquare, ShoppingBag } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { DataTable } from "@/components/admin/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import {
  getInventory,
  getLowStockParts,
  createPart,
  recordMovement,
  getStockMovements,
  createSupplierOrderFromLowStock,
  getInventoryValuation,
  type Part,
  type StockMovement,
  type SupplierOrderDraft,
} from "@/lib/inventory.functions";
import { formatFcfa } from "@/data/catalog/company";
import { field } from "@/components/admin/primitives/AdminField";
import { Plus, ArrowDown, ArrowUp, Check, X, History } from "lucide-react";

export function AdminInventory() {
  const { t } = useI18n();
  const [parts, setParts] = useState<Part[]>([]);
  const [lowStock, setLowStock] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [movementsPartId, setMovementsPartId] = useState<string | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [supplierOrder, setSupplierOrder] = useState<SupplierOrderDraft | null>(null);
  const [valuation, setValuation] = useState<{
    totalValue: number;
    totalUnits: number;
    totalReferences: number;
    lowStockCount: number;
  } | null>(null);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    brand: "",
    model: "",
    quantity: "0",
    min_quantity: "5",
    unit_price: "0",
    location: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [allParts, low, val] = await Promise.all([
        getInventory(),
        getLowStockParts(),
        getInventoryValuation(),
      ]);
      setParts(allParts);
      setLowStock(low);
      setValuation(val);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSupplierOrder = async () => {
    try {
      const draft = await createSupplierOrderFromLowStock();
      setSupplierOrder(draft);
    } catch {
      //
    }
  };

  const exportOrderWhatsApp = (draft: SupplierOrderDraft) => {
    let msg = `*ALLÔ TECHNO — Bon de Commande Fournisseur (${draft.order_reference})*\n\n`;
    draft.items.forEach((item, idx) => {
      msg += `${idx + 1}. *${item.name}* (${item.brand} ${item.model}) - Réf: ${item.sku}\n   Quantité : *${item.recommended_order} pcs*\n`;
    });
    msg += `\n*Montant estimé total :* ${formatFcfa(draft.total_estimated_cost)}\nMerci de nous confirmer la disponibilité et le délai de livraison.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const columns: ColumnDef<Part>[] = [
    {
      accessorKey: "name",
      header: t("admin.inventory.table.part"),
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div>
            <p className="font-medium">{p.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {p.brand} {p.model}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => <span className="text-xs font-mono">{row.original.sku}</span>,
    },
    {
      accessorKey: "quantity",
      header: t("admin.inventory.table.stock"),
      cell: ({ row }) => {
        const p = row.original;
        return (
          <span
            className={`text-sm font-bold ${p.quantity <= p.min_quantity ? "text-destructive" : "text-success"}`}
          >
            {p.quantity}
          </span>
        );
      },
    },
    {
      accessorKey: "min_quantity",
      header: t("admin.inventory.table.threshold"),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.min_quantity}</span>
      ),
    },
    {
      accessorKey: "unit_price",
      header: t("admin.inventory.table.price"),
      cell: ({ row }) => <span className="text-xs">{formatFcfa(row.original.unit_price)}</span>,
    },
    {
      id: "actions",
      header: t("admin.inventory.table.actions"),
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleMovement(p.id, "in")}
              title={t("admin.inventory.action.stockIn")}
            >
              <ArrowDown className="size-3 text-success" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleMovement(p.id, "out")}
              title={t("admin.inventory.action.stockOut")}
            >
              <ArrowUp className="size-3 text-destructive" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => showMovements(p.id)}
              title={t("admin.inventory.action.history")}
            >
              <History className="size-3" />
            </Button>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async () => {
    if (!form.name || !form.sku) return;
    await createPart({
      data: {
        ...form,
        quantity: parseInt(form.quantity) || 0,
        min_quantity: parseInt(form.min_quantity) || 5,
        unit_price: parseFloat(form.unit_price) || 0,
        supplier_id: null,
        active: true,
      } as never,
    });
    setShowNew(false);
    setForm({
      name: "",
      sku: "",
      category: "",
      brand: "",
      model: "",
      quantity: "0",
      min_quantity: "5",
      unit_price: "0",
      location: "",
    });
    loadData();
  };

  const handleMovement = async (partId: string, type: "in" | "out") => {
    const qty = prompt(
      type === "in"
        ? t("admin.inventory.prompt.addQuantity")
        : t("admin.inventory.prompt.removeQuantity"),
    );
    if (!qty || isNaN(parseInt(qty))) return;
    await recordMovement({
      data: {
        part_id: partId,
        type,
        quantity: parseInt(qty),
        reason:
          type === "in"
            ? t("admin.inventory.reason.supply")
            : t("admin.inventory.reason.repairUse"),
        reservation_id: null,
        performed_by: "admin",
      },
    });
    loadData();
  };

  const showMovements = async (partId: string) => {
    setMovementsPartId(partId);
    const m = await getStockMovements({ data: { part_id: partId } });
    setMovements(m);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="at-eyebrow">{t("admin.inventory.eyebrow")}</p>
          <h2 className="mt-1 text-xl font-semibold">{t("admin.inventory.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.inventory.description")}</p>
        </div>
        <div className="flex items-center gap-2">
          {lowStock.length > 0 && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleGenerateSupplierOrder}
              className="gap-1.5 font-bold"
            >
              <ShoppingBag className="size-3.5" />
              <span>Générer Bon Fournisseur</span>
            </Button>
          )}
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="mr-1 size-3" /> {t("admin.catalog.button.add")}
          </Button>
        </div>
      </div>

      {/* Valuation KPIs */}
      {valuation && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-card p-4 space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase">
              Valeur du Stock
            </p>
            <p className="text-lg font-black font-mono text-primary">
              {formatFcfa(valuation.totalValue)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase">
              Unités Totales
            </p>
            <p className="text-lg font-black font-mono text-foreground">
              {valuation.totalUnits} pièces
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase">
              Références Actives
            </p>
            <p className="text-lg font-black font-mono text-foreground">
              {valuation.totalReferences}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase">
              Sous Seuil Critique
            </p>
            <p
              className={`text-lg font-black font-mono ${valuation.lowStockCount > 0 ? "text-amber-500" : "text-success"}`}
            >
              {valuation.lowStockCount}
            </p>
          </div>
        </div>
      )}

      {lowStock.length > 0 && (
        <div className="rounded-xl border border-amber-300/60 bg-amber-500/10 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-600" />
              <span className="text-sm font-bold text-amber-800 dark:text-amber-300">
                {t("admin.inventory.lowStock")} ({lowStock.length} références à réapprovisionner)
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1.5 bg-background"
              onClick={handleGenerateSupplierOrder}
            >
              <FileText className="size-3.5 text-primary" />
              <span>Préparer commande</span>
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((p) => (
              <span
                key={p.id}
                className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-900 dark:text-amber-200"
              >
                {p.name} ({p.quantity}/{p.min_quantity})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Supplier Order Modal */}
      {supplierOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-2xl rounded-xl bg-card border border-border p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <div>
                <h3 className="font-bold text-base">Bon de Commande Fournisseur Rapide</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Réf :{" "}
                  <span className="font-mono font-bold text-foreground">
                    {supplierOrder.order_reference}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setSupplierOrder(null)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border/60 pr-1">
              {supplierOrder.items.map((item) => (
                <div
                  key={item.part_id}
                  className="py-2.5 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {item.brand} {item.model} • SKU: {item.sku}
                    </p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="font-bold text-primary">
                      Quantité conseillée :{" "}
                      <span className="font-mono text-sm">{item.recommended_order}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {formatFcfa(item.total_cost)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-3 flex items-center justify-between shrink-0">
              <div>
                <p className="text-[11px] text-muted-foreground">Estimation totale :</p>
                <p className="text-base font-extrabold text-foreground font-mono">
                  {formatFcfa(supplierOrder.total_estimated_cost)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSupplierOrder(null)}>
                  Fermer
                </Button>
                <Button
                  size="sm"
                  className="bg-success text-white hover:bg-success/90 gap-1.5 font-bold"
                  onClick={() => exportOrderWhatsApp(supplierOrder)}
                >
                  <MessageSquare className="size-3.5" />
                  <span>Envoyer par WhatsApp</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNew && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <input
              placeholder={t("admin.inventory.form.name")}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={field}
            />
            <input
              placeholder={t("admin.inventory.form.sku")}
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className={field}
            />
            <input
              placeholder={t("admin.inventory.form.category")}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={field}
            />
            <input
              placeholder={t("admin.inventory.form.brand")}
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className={field}
            />
            <input
              placeholder={t("admin.inventory.form.model")}
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              className={field}
            />
            <input
              placeholder={t("admin.inventory.form.quantity")}
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className={field}
            />
            <input
              placeholder={t("admin.inventory.form.minThreshold")}
              type="number"
              value={form.min_quantity}
              onChange={(e) => setForm({ ...form, min_quantity: e.target.value })}
              className={field}
            />
            <input
              placeholder={t("admin.inventory.form.unitPrice")}
              type="number"
              value={form.unit_price}
              onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
              className={field}
            />
            <input
              placeholder={t("admin.inventory.form.location")}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className={field}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate}>
              <Check className="mr-1 size-3" /> {t("admin.webhooks.form.save")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowNew(false)}>
              <X className="mr-1 size-3" /> {t("admin.webhooks.form.cancel")}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : parts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {t("admin.inventory.empty")}
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={parts}
          searchKey="name"
          searchPlaceholder={t("admin.inventory.search")}
          emptyTitle={t("admin.inventory.empty")}
          emptyIcon={<AlertTriangle className="size-6" />}
        />
      )}

      {movementsPartId && (
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold">{t("admin.inventory.movements")}</h4>
            <Button size="sm" variant="ghost" onClick={() => setMovementsPartId(null)}>
              <X className="size-3" />
            </Button>
          </div>
          {movements.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("admin.inventory.noMovements")}</p>
          ) : (
            movements.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between text-xs py-1 border-b last:border-0"
              >
                <span>{m.reason}</span>
                <span
                  className={`font-bold ${m.type === "in" || m.type === "return" ? "text-success" : "text-destructive"}`}
                >
                  {m.type === "in" || m.type === "return" ? "+" : "-"}
                  {m.quantity}
                </span>
                <span className="text-muted-foreground">
                  {new Date(m.created_at).toLocaleDateString(t("locale") as string)}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
