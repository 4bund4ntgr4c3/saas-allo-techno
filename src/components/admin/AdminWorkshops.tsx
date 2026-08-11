import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import {
  getWorkshops,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
} from "@/lib/workshops.functions";
import { MapPin, Phone, Mail, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { field } from "@/components/admin/primitives/AdminField";

interface Workshop {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  lat: number;
  lng: number;
  timezone: string;
  active: boolean;
  created_at: string;
}

export function AdminWorkshops() {
  const { t } = useI18n();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    timezone: "Africa/Porto-Novo",
  });

  const load = async () => {
    setLoading(true);
    try {
      setWorkshops(await getWorkshops());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateWorkshop({ data: { id: editingId, ...form, lat: 0, lng: 0, active: true } });
      } else {
        await createWorkshop({ data: { ...form, lat: 0, lng: 0, active: true } as never });
      }
      setEditingId(null);
      setShowNew(false);
      setForm({
        name: "",
        address: "",
        city: "",
        phone: "",
        email: "",
        timezone: "Africa/Porto-Novo",
      });
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("admin.workshops.deleteConfirm"))) return;
    await deleteWorkshop({ data: { id } });
    load();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="at-eyebrow">{t("admin.workshops.eyebrow")}</p>
          <h2 className="mt-1 text-xl font-semibold">{t("admin.workshops.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.workshops.description")}</p>
        </div>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="mr-1 size-3" /> {t("admin.workshops.add")}
        </Button>
      </div>

      {showNew && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder={t("admin.workshops.placeholder.name")}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={field}
            />
            <input
              placeholder={t("admin.workshops.placeholder.city")}
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className={field}
            />
            <input
              placeholder={t("admin.workshops.placeholder.address")}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={field}
            />
            <input
              placeholder={t("admin.workshops.placeholder.phone")}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={field}
            />
            <input
              placeholder={t("admin.workshops.placeholder.email")}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={field}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>
              <Check className="mr-1 size-3" /> {t("admin.webhooks.form.save")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowNew(false);
                setEditingId(null);
              }}
            >
              <X className="mr-1 size-3" /> {t("admin.webhooks.form.cancel")}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : workshops.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">{t("admin.workshops.empty")}</p>
      ) : (
        <div className="space-y-2">
          {workshops.map((w) => (
            <div
              key={w.id}
              className="flex items-center justify-between rounded-lg border bg-card p-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MapPin className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">{w.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {w.city} — {w.address}
                  </p>
                  <div className="flex gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Phone className="size-2" /> {w.phone}
                    </span>
                    {w.email && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Mail className="size-2" /> {w.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingId(w.id);
                    setForm({
                      name: w.name,
                      address: w.address,
                      city: w.city,
                      phone: w.phone,
                      email: w.email ?? "",
                      timezone: w.timezone,
                    });
                    setShowNew(true);
                  }}
                >
                  <Pencil className="size-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(w.id)}>
                  <Trash2 className="size-3 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
