import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import {
  getInventory,
  getLowStockParts,
  createPart,
  recordMovement,
  getStockMovements,
  type Part,
  type StockMovement,
} from "@/lib/inventory.functions";
import { formatFcfa } from "@/data/catalog/company";
import { field } from "@/components/admin/primitives/AdminField";
import {
  Plus,
  ArrowDown,
  ArrowUp,
  Check,
  X,
  History,
} from "lucide-react";

export function AdminInventory() {
  const { t } = useI18n();
  const [parts, setParts] = useState<Part[]>([]);
  const [lowStock, setLowStock] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [movementsPartId, setMovementsPartId] = useState<string | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
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

  const load = async () => {
    setLoading(true);
    try {
      const [all, low] = await Promise.all([getInventory(), getLowStockParts()]);
      setParts(all);
      setLowStock(low);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
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
    load();
  };

  const handleMovement = async (partId: string, type: "in" | "out") => {
    const qty = prompt(type === "in" ? t("admin.inventory.prompt.addQuantity") : t("admin.inventory.prompt.removeQuantity"));
    if (!qty || isNaN(parseInt(qty))) return;
    await recordMovement({
      data: {
        part_id: partId,
        type,
        quantity: parseInt(qty),
        reason: type === "in" ? t("admin.inventory.reason.supply") : t("admin.inventory.reason.repairUse"),
        reservation_id: null,
        performed_by: "admin",
      },
    });
    load();
  };

  const showMovements = async (partId: string) => {
    setMovementsPartId(partId);
    const m = await getStockMovements({ data: { part_id: partId } });
    setMovements(m);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">{t("admin.inventory")}</h3>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="mr-1 size-3" /> {t("admin.catalog.button.add")}
        </Button>
      </div>

      {lowStock.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="size-4 text-amber-600" />
            <span className="text-sm font-bold text-amber-800">{t("admin.inventory.lowStock")} ({lowStock.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((p) => (
              <span
                key={p.id}
                className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800"
              >
                {p.name} ({p.quantity}/{p.min_quantity})
              </span>
            ))}
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
        <p className="text-sm text-muted-foreground text-center py-8">{t("admin.inventory.empty")}</p>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-4 py-2 text-xs font-medium">{t("admin.inventory.table.part")}</th>
                  <th className="px-4 py-2 text-xs font-medium">SKU</th>
                  <th className="px-4 py-2 text-xs font-medium">{t("admin.inventory.table.stock")}</th>
                  <th className="px-4 py-2 text-xs font-medium">{t("admin.inventory.table.threshold")}</th>
                  <th className="px-4 py-2 text-xs font-medium">{t("admin.inventory.table.price")}</th>
                  <th className="px-4 py-2 text-xs font-medium">{t("admin.inventory.table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {p.brand} {p.model}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">{p.sku}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm font-bold ${p.quantity <= p.min_quantity ? "text-destructive" : "text-success"}`}
                      >
                        {p.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{p.min_quantity}</td>
                    <td className="px-4 py-3 text-xs">{formatFcfa(p.unit_price)}</td>
                    <td className="px-4 py-3">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
                  {new Date(m.created_at).toLocaleDateString("fr-BJ")}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
