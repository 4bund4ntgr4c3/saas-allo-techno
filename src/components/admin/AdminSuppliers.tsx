import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import {
  getSuppliers,
  createSupplier,
  getSupplierOrders,
  updateSupplierOrderStatus,
} from "@/lib/suppliers.functions";
import { formatFcfa } from "@/data/catalog/company";
import { Truck, Package, Plus, Check, X, Clock, CheckCircle } from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string;
  email: string | null;
  speciality: string;
  rating: number;
  active: boolean;
}

interface SupplierOrder {
  id: string;
  supplier_id: string;
  parts: { name: string; quantity: number; unit_price: number }[];
  total: number;
  status: string;
  expected_delivery: string | null;
}

export function AdminSuppliers() {
  const { t } = useI18n();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    name: "",
    contact_name: "",
    phone: "",
    email: "",
    speciality: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [s, o] = await Promise.all([getSuppliers(), getSupplierOrders()]);
      setSuppliers(s);
      setOrders(o);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!form.name || !form.phone) return;
    await createSupplier({
      data: { ...form, rating: 5, active: true } as never,
    });
    setShowNew(false);
    setForm({ name: "", contact_name: "", phone: "", email: "", speciality: "" });
    load();
  };

  const handleStatus = async (id: string, status: string) => {
    await updateSupplierOrderStatus({
      data: { id, status: status as "pending" },
    });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">{t("admin.suppliers")}</h3>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="mr-1 size-3" /> {t("admin.catalog.button.add")}
        </Button>
      </div>

      {showNew && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder={t("admin.suppliers.placeholder.name")}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
            <input
              placeholder={t("admin.suppliers.placeholder.contact")}
              value={form.contact_name}
              onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
            <input
              placeholder={t("admin.suppliers.placeholder.phone")}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
            <input
              placeholder={t("admin.suppliers.placeholder.email")}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
            <input
              placeholder={t("admin.suppliers.placeholder.speciality")}
              value={form.speciality}
              onChange={(e) => setForm({ ...form, speciality: e.target.value })}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate}>
              <Check className="mr-1 size-3" /> {t("admin.webhooks.form.save")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowNew(false)}
            >
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
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {suppliers.map((s) => (
              <div key={s.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Truck className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {s.speciality || t("admin.suppliers.speciality.general")}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{s.phone}</p>
                {s.email && (
                  <p className="text-xs text-muted-foreground">{s.email}</p>
                )}
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs font-medium">{s.rating}</span>
                  <span className="text-xs text-muted-foreground">/5</span>
                </div>
              </div>
            ))}
          </div>

          {orders.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold">{t("admin.suppliers.orders.title")}</h4>
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-3"
                >
                  <div className="flex items-center gap-3">
                    <Package className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium">
                        {o.parts.length} {t("admin.suppliers.orders.pieces")} — {formatFcfa(o.total)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{o.status}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {o.status === "pending" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStatus(o.id, "ordered")}
                      >
                        <Clock className="size-3" />
                      </Button>
                    )}
                    {o.status === "shipped" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStatus(o.id, "received")}
                      >
                        <CheckCircle className="size-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
