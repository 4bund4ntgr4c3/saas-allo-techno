import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { Loader2, ImagePlus, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFcfa } from "@/data/catalog";
import {
  addCatalogPhoto,
  deleteBrand,
  deleteCatalogPhoto,
  deleteCategory,
  deleteDevice,
  deleteFault,
  getCatalogUpload,
  listCatalog,
  upsertBrand,
  upsertCategory,
  upsertDevice,
  upsertFault,
  type CatalogBrand,
  type CatalogCategory,
  type CatalogDevice,
  type CatalogFault,
  type CatalogPhoto,
} from "@/lib/catalog.functions";

const field =
  "h-11 w-full rounded-sm border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function CatalogSection() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const listFn = useServerFn(listCatalog);
  const [brandSlug, setBrandSlug] = useState<string | null>(null);
  const [deviceSlug, setDeviceSlug] = useState<string | null>(null);

  const catalog = useQuery({
    queryKey: ["catalog"],
    queryFn: () => listFn({ data: {} }),
  });

  if (catalog.isLoading) {
    return <p className="text-sm text-muted-foreground">{t("admin.catalog.loading")}</p>;
  }

  if (catalog.isError) {
    return (
      <div>
        <h2 className="text-lg font-semibold">{t("admin.catalog.title")}</h2>
        <p className="mt-4 text-sm text-destructive">
          {t("admin.catalog.error.load")}
        </p>
      </div>
    );
  }

  const data = catalog.data ?? { categories: [], brands: [], devices: [], faults: [], photos: [] };
  const selectedBrand = data.brands.find((b) => b.slug === brandSlug) ?? null;
  const devices = data.devices.filter((d) => d.brand_slug === selectedBrand?.slug);
  const selectedDevice = devices.find((d) => d.slug === deviceSlug) ?? null;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["catalog"] });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">{t("admin.catalog.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("admin.catalog.subtitle")}
        </p>
      </div>
      <CategoriesPanel categories={data.categories} onChanged={invalidate} />
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <BrandPanel
          brands={data.brands}
          selectedSlug={selectedBrand?.slug ?? null}
          onSelect={(slug) => {
            setBrandSlug(slug);
            setDeviceSlug(null);
          }}
          onChanged={invalidate}
        />
        <DevicePanel
          brand={selectedBrand}
          devices={devices}
          categories={data.categories}
          deviceSlug={deviceSlug}
          onSelectDevice={setDeviceSlug}
          onChanged={invalidate}
        />
        <DeviceDetailPanel
          device={selectedDevice}
          faults={data.faults.filter((f) => f.device_slug === selectedDevice?.slug)}
          photos={data.photos.filter((p) => p.device_slug === selectedDevice?.slug)}
          onChanged={invalidate}
        />
      </div>
    </div>
  );
}

function CategoriesPanel({
  categories,
  onChanged,
}: {
  categories: CatalogCategory[];
  onChanged: () => void;
}) {
  const upsertFn = useServerFn(upsertCategory);
  const deleteFn = useServerFn(deleteCategory);
  const { t } = useI18n();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ slug: "", label: "", sort: 0, active: true });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setEditing(null);
    setForm({ slug: "", label: "", sort: 0, active: true });
    setError(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await upsertFn({
        data: {
          slug: form.slug.trim(),
          label: form.label.trim(),
          sort: form.sort,
          active: form.active,
        },
      });
      toast.success(editing ? t("admin.catalog.category.toast.updated") : t("admin.catalog.category.toast.added"));
      reset();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.catalog.error.save"));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (slug: string) => {
    setBusy(true);
    try {
      await deleteFn({ data: { slug } });
      toast.success(t("admin.catalog.category.toast.deleted"));
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.catalog.error.delete"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{t("admin.catalog.category.title")}</h3>
        <Button variant="outline" size="sm" onClick={reset}>
          <Plus className="size-3.5" /> {t("admin.catalog.button.add")}
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <span
            key={c.slug}
            className="inline-flex items-center gap-2 rounded-sm border border-border bg-surface px-2 py-1 text-xs"
          >
            {c.label}
            {!c.active && <span className="text-muted-foreground">{t("admin.catalog.status.inactive")}</span>}
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              aria-label={`Modifier ${c.label}`}
              onClick={() => {
                setEditing(c.slug);
                setForm({ slug: c.slug, label: c.label, sort: c.sort, active: c.active });
              }}
            >
              <Pencil className="size-3" />
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:text-destructive"
              disabled={busy}
              aria-label={`Supprimer ${c.label}`}
              onClick={() => remove(c.slug)}
            >
              <Trash2 className="size-3" />
            </button>
          </span>
        ))}
        {categories.length === 0 && (
          <p className="text-xs text-muted-foreground">{t("admin.catalog.category.empty")}</p>
        )}
      </div>
      <form onSubmit={save} className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
        <label className="block">
          <span className="at-eyebrow mb-1 block text-[11px]">{t("admin.catalog.form.label")}</span>
          <input
            className={field}
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            required
          />
        </label>
        <label className="block">
          <span className="at-eyebrow mb-1 block text-[11px]">{t("admin.catalog.form.slug")}</span>
          <input
            className={field}
            value={form.slug}
            disabled={editing !== null}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                slug: e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]+/g, "-")
                  .replace(/^-+|-+$/g, ""),
              }))
            }
            required
          />
        </label>
        <label className="block">
          <span className="at-eyebrow mb-1 block text-[11px]">{t("admin.catalog.form.sort")}</span>
          <input
            type="number"
            min={0}
            className={field}
            value={form.sort}
            onChange={(e) => setForm((f) => ({ ...f, sort: Number(e.target.value) || 0 }))}
          />
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
          />
          {t("admin.catalog.form.visible")}
        </label>
        {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
        <div className="sm:col-span-2">
          <Button
            type="submit"
            variant="technical"
            size="sm"
            disabled={busy || !form.label.trim() || !form.slug.trim()}
          >
            {busy ? t("admin.catalog.button.saving") : editing ? t("admin.catalog.button.save") : t("admin.catalog.button.add")}
          </Button>
        </div>
      </form>
    </div>
  );
}

function BrandPanel({
  brands,
  selectedSlug,
  onSelect,
  onChanged,
}: {
  brands: CatalogBrand[];
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
  onChanged: () => void;
}) {
  const upsertFn = useServerFn(upsertBrand);
  const deleteFn = useServerFn(deleteBrand);
  const { t } = useI18n();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ slug: "", name: "", tag: "", sort: 0, active: true });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setEditing(null);
    setForm({ slug: "", name: "", tag: "", sort: 0, active: true });
    setError(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await upsertFn({
        data: {
          slug: form.slug.trim(),
          name: form.name.trim(),
          tag: form.tag.trim(),
          sort: form.sort,
          active: form.active,
        },
      });
      toast.success(editing ? t("admin.catalog.brand.toast.updated") : t("admin.catalog.brand.toast.added"));
      reset();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.catalog.error.save"));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (slug: string) => {
    setBusy(true);
    try {
      await deleteFn({ data: { slug } });
      if (slug === selectedSlug) onSelect(null);
      toast.success(t("admin.catalog.brand.toast.deleted"));
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.catalog.error.delete"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{t("admin.catalog.brand.title")}</h3>
        <Button variant="outline" size="sm" onClick={reset}>
          <Plus className="size-3.5" /> {t("admin.catalog.button.add")}
        </Button>
      </div>
      <ul className="mt-4 space-y-2">
        {brands.map((b) => {
          const selected = b.slug === selectedSlug;
          return (
            <li
              key={b.slug}
              className={`flex items-center justify-between gap-2 border px-3 py-2 ${
                selected ? "border-primary/60 bg-primary/5" : "border-border bg-surface"
              }`}
            >
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => onSelect(selected ? null : b.slug)}
              >
                <p className="truncate text-sm font-medium">{b.name}</p>
                <p className="truncate font-mono text-[10px] uppercase text-muted-foreground">
                  {b.slug}
                  {b.tag ? ` · ${b.tag}` : ""}
                  {b.active ? "" : ` · ${t("admin.catalog.status.inactive")}`}
                </p>
              </button>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Modifier ${b.name}`}
                  onClick={() => {
                    setEditing(b.slug);
                    setForm({
                      slug: b.slug,
                      name: b.name,
                      tag: b.tag,
                      sort: b.sort,
                      active: b.active,
                    });
                  }}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  disabled={busy}
                  aria-label={`Supprimer ${b.name}`}
                  onClick={() => remove(b.slug)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          );
        })}
        {brands.length === 0 && (
          <li className="rounded-sm border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
            {t("admin.catalog.brand.empty")}
          </li>
        )}
      </ul>
      <form onSubmit={save} className="mt-4 space-y-3 border-t border-border pt-4">
        <p className="text-xs font-semibold">
          {editing ? `Modifier : ${editing}` : t("admin.catalog.brand.form.new")}
        </p>
        <label className="block">
          <span className="at-eyebrow mb-1 block text-[11px]">{t("admin.catalog.form.name")}</span>
          <input
            className={field}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </label>
        <label className="block">
          <span className="at-eyebrow mb-1 block text-[11px]">{t("admin.catalog.form.slug")}</span>
          <input
            className={field}
            value={form.slug}
            disabled={editing !== null}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                slug: e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]+/g, "-")
                  .replace(/^-+|-+$/g, ""),
              }))
            }
            required
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="at-eyebrow mb-1 block text-[11px]">{t("admin.catalog.form.tag")}</span>
            <input
              className={field}
              value={form.tag}
              onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
              placeholder={t("admin.catalog.form.tag_placeholder")}
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-1 block text-[11px]">{t("admin.catalog.form.sort")}</span>
            <input
              type="number"
              min={0}
              className={field}
              value={form.sort}
              onChange={(e) => setForm((f) => ({ ...f, sort: Number(e.target.value) || 0 }))}
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
          />
          {t("admin.catalog.form.visible")}
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          variant="technical"
          size="sm"
          disabled={busy || !form.name.trim() || !form.slug.trim()}
        >
          {busy ? t("admin.catalog.button.saving") : editing ? t("admin.catalog.button.save") : t("admin.catalog.button.add")}
        </Button>
      </form>
    </div>
  );
}

function DevicePanel({
  brand,
  devices,
  categories,
  deviceSlug,
  onSelectDevice,
  onChanged,
}: {
  brand: CatalogBrand | null;
  devices: CatalogDevice[];
  categories: CatalogCategory[];
  deviceSlug: string | null;
  onSelectDevice: (slug: string | null) => void;
  onChanged: () => void;
}) {
  const upsertFn = useServerFn(upsertDevice);
  const deleteFn = useServerFn(deleteDevice);
  const { t } = useI18n();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({
    slug: "",
    name: "",
    categorySlug: "",
    series: "",
    year: 0,
    sort: 0,
    active: true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!brand) {
    return (
      <div className="rounded-sm border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">{t("admin.catalog.device.title")}</h3>
        <p className="mt-4 text-sm text-muted-foreground">
          {t("admin.catalog.device.select_brand")}
        </p>
      </div>
    );
  }

  const reset = () => {
    setEditing(null);
    setForm({
      slug: "",
      name: "",
      categorySlug: categories[0]?.slug ?? "",
      series: "",
      year: 0,
      sort: 0,
      active: true,
    });
    setError(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categorySlug) {
      setError(t("admin.catalog.error.select_category"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await upsertFn({
        data: {
          slug: form.slug.trim(),
          name: form.name.trim(),
          brandSlug: brand.slug,
          categorySlug: form.categorySlug,
          series: form.series.trim(),
          year: form.year,
          sort: form.sort,
          active: form.active,
        },
      });
      toast.success(editing ? t("admin.catalog.device.toast.updated") : t("admin.catalog.device.toast.added"));
      reset();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.catalog.error.save"));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (slug: string) => {
    setBusy(true);
    try {
      await deleteFn({ data: { slug } });
      if (slug === deviceSlug) onSelectDevice(null);
      toast.success(t("admin.catalog.device.toast.deleted"));
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.catalog.error.delete"));
    } finally {
      setBusy(false);
    }
  };

  const categoryLabel = (slug: string) => categories.find((c) => c.slug === slug)?.label ?? slug;

  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{t("admin.catalog.device.title_for")} {brand.name}</h3>
        <Button variant="outline" size="sm" onClick={reset}>
          <Plus className="size-3.5" /> {t("admin.catalog.button.add")}
        </Button>
      </div>
      <ul className="mt-4 space-y-2">
        {devices.map((d) => {
          const selected = d.slug === deviceSlug;
          return (
            <li
              key={d.slug}
              className={`flex items-center justify-between gap-2 border px-3 py-2 ${
                selected ? "border-primary/60 bg-primary/5" : "border-border bg-surface"
              }`}
            >
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => onSelectDevice(selected ? null : d.slug)}
              >
                <p className="truncate text-sm font-medium">{d.name}</p>
                <p className="truncate font-mono text-[10px] uppercase text-muted-foreground">
                  {d.slug} · {categoryLabel(d.category_slug)}
                  {d.year ? ` · ${d.year}` : ""}
                  {d.active ? "" : ` · ${t("admin.catalog.status.inactive")}`}
                </p>
              </button>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Modifier ${d.name}`}
                  onClick={() => {
                    setEditing(d.slug);
                    setForm({
                      slug: d.slug,
                      name: d.name,
                      categorySlug: d.category_slug,
                      series: d.series,
                      year: d.year,
                      sort: d.sort,
                      active: d.active,
                    });
                  }}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  disabled={busy}
                  aria-label={`Supprimer ${d.name}`}
                  onClick={() => remove(d.slug)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          );
        })}
        {devices.length === 0 && (
          <li className="rounded-sm border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
            {t("admin.catalog.device.empty")}
          </li>
        )}
      </ul>
      <form onSubmit={save} className="mt-4 space-y-3 border-t border-border pt-4">
        <p className="text-xs font-semibold">
          {editing ? `Modifier : ${editing}` : t("admin.catalog.device.form.new")}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="at-eyebrow mb-1 block text-[11px]">{t("admin.catalog.form.name")}</span>
            <input
              className={field}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-1 block text-[11px]">{t("admin.catalog.form.slug")}</span>
            <input
              className={field}
              value={form.slug}
              disabled={editing !== null}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  slug: e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]+/g, "-")
                    .replace(/^-+|-+$/g, ""),
                }))
              }
              required
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-1 block text-[11px]">{t("admin.catalog.form.category")}</span>
            <select
              className={field}
              value={form.categorySlug}
              onChange={(e) => setForm((f) => ({ ...f, categorySlug: e.target.value }))}
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="at-eyebrow mb-1 block text-[11px]">{t("admin.catalog.form.series")}</span>
            <input
              className={field}
              value={form.series}
              onChange={(e) => setForm((f) => ({ ...f, series: e.target.value }))}
              placeholder="ex. Galaxy A15"
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-1 block text-[11px]">{t("admin.catalog.form.year")}</span>
            <input
              type="number"
              min={1990}
              max={2100}
              className={field}
              value={form.year}
              onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) || 0 }))}
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-1 block text-[11px]">{t("admin.catalog.form.sort")}</span>
            <input
              type="number"
              min={0}
              className={field}
              value={form.sort}
              onChange={(e) => setForm((f) => ({ ...f, sort: Number(e.target.value) || 0 }))}
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
          />
          {t("admin.catalog.form.visible")}
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          variant="technical"
          size="sm"
          disabled={busy || !form.name.trim() || !form.slug.trim()}
        >
          {busy ? t("admin.catalog.button.saving") : editing ? t("admin.catalog.button.save") : t("admin.catalog.button.add")}
        </Button>
      </form>
    </div>
  );
}

function DeviceDetailPanel({
  device,
  faults,
  photos,
  onChanged,
}: {
  device: CatalogDevice | null;
  faults: CatalogFault[];
  photos: CatalogPhoto[];
  onChanged: () => void;
}) {
  const upsertFn = useServerFn(upsertFault);
  const deleteFn = useServerFn(deleteFault);
  const addPhotoFn = useServerFn(addCatalogPhoto);
  const deletePhotoFn = useServerFn(deleteCatalogPhoto);
  const getUploadFn = useServerFn(getCatalogUpload);
  const { t } = useI18n();
  const [editingFault, setEditingFault] = useState<number | null>(null);
  const [faultForm, setFaultForm] = useState({
    slug: "",
    label: "",
    price: "",
    duration: "",
    warranty: "",
    part: "",
    sort: 0,
  });
  const [photoUrl, setPhotoUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!device) {
    return (
      <div className="rounded-sm border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">{t("admin.catalog.fault.title")}</h3>
        <p className="mt-4 text-sm text-muted-foreground">
          {t("admin.catalog.fault.select_device")}
        </p>
      </div>
    );
  }

  const resetFault = () => {
    setEditingFault(null);
    setFaultForm({ slug: "", label: "", price: "", duration: "", warranty: "", part: "", sort: 0 });
    setError(null);
  };

  const saveFault = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(faultForm.price);
    setBusy(true);
    setError(null);
    try {
      await upsertFn({
        data: {
          id: editingFault,
          deviceSlug: device.slug,
          slug: faultForm.slug.trim(),
          label: faultForm.label.trim(),
          price: Number.isFinite(price) && price >= 0 ? Math.round(price) : 0,
          duration: faultForm.duration.trim(),
          warranty: faultForm.warranty.trim(),
          part: faultForm.part.trim(),
          sort: faultForm.sort,
        },
      });
      toast.success(editingFault ? t("admin.catalog.fault.toast.updated") : t("admin.catalog.fault.toast.added"));
      resetFault();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.catalog.error.save"));
    } finally {
      setBusy(false);
    }
  };

  const removeFault = async (id: number) => {
    setBusy(true);
    try {
      await deleteFn({ data: { id } });
      toast.success(t("admin.catalog.fault.toast.deleted"));
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.catalog.error.delete"));
    } finally {
      setBusy(false);
    }
  };

  const addPhoto = async (url: string) => {
    setBusy(true);
    setError(null);
    try {
      await addPhotoFn({ data: { deviceSlug: device.slug, url } });
      toast.success(t("admin.catalog.photo.toast.added"));
      setPhotoUrl("");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.catalog.photo.error.add"));
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = async (id: number) => {
    setBusy(true);
    try {
      await deletePhotoFn({ data: { id } });
      toast.success(t("admin.catalog.photo.toast.deleted"));
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.catalog.error.delete"));
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const prepared = await getUploadFn({
        data: { fileName: file.name, contentType: file.type, fileSize: file.size },
      });
      const put = await fetch(prepared.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type, "x-upsert": "false" },
        body: file,
      });
      if (!put.ok) throw new Error(`Upload ${put.status}`);
      await addPhotoFn({ data: { deviceSlug: device.slug, url: prepared.path } });
      toast.success(t("admin.catalog.photo.toast.uploaded"));
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.catalog.photo.error.upload"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <h3 className="text-sm font-semibold">{t("admin.catalog.fault.title_for")} {device.name}</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2">{t("admin.catalog.fault.table.fault")}</th>
              <th className="px-3 py-2">{t("admin.catalog.fault.table.price")}</th>
              <th className="px-3 py-2">{t("admin.catalog.fault.table.duration")}</th>
              <th className="px-3 py-2">{t("admin.catalog.fault.table.warranty")}</th>
              <th className="px-3 py-2">{t("admin.catalog.fault.table.part")}</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {faults.map((f) => (
              <tr key={f.id} className="border-b border-border last:border-b-0">
                <td className="px-3 py-2">
                  <p className="font-medium">{f.label}</p>
                  <p className="font-mono text-[10px] uppercase text-muted-foreground">
                    {f.slug} · ordre {f.sort}
                  </p>
                </td>
                <td className="px-3 py-2 font-mono">{formatFcfa(f.price)}</td>
                <td className="px-3 py-2">{f.duration || "—"}</td>
                <td className="px-3 py-2">{f.warranty || "—"}</td>
                <td className="px-3 py-2">{f.part || "—"}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Modifier ${f.label}`}
                      onClick={() => {
                        setEditingFault(f.id);
                        setFaultForm({
                          slug: f.slug,
                          label: f.label,
                          price: String(f.price),
                          duration: f.duration,
                          warranty: f.warranty,
                          part: f.part,
                          sort: f.sort,
                        });
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      disabled={busy}
                      aria-label={`Supprimer ${f.label}`}
                      onClick={() => removeFault(f.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {faults.length === 0 && (
          <p className="py-3 text-xs text-muted-foreground">{t("admin.catalog.fault.empty")}</p>
        )}
      </div>
      <form onSubmit={saveFault} className="mt-4 space-y-3 border-t border-border pt-4">
        <p className="text-xs font-semibold">
          {editingFault ? `Modifier la panne #${editingFault}` : t("admin.catalog.fault.form.new")}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="at-eyebrow mb-1 block text-[11px]">{t("admin.catalog.form.label")}</span>
            <input
              className={field}
              value={faultForm.label}
              onChange={(e) => setFaultForm((f) => ({ ...f, label: e.target.value }))}
              required
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-1 block text-[11px]">{t("admin.catalog.form.slug")}</span>
            <input
              className={field}
              value={faultForm.slug}
              onChange={(e) =>
                setFaultForm((f) => ({
                  ...f,
                  slug: e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]+/g, "-")
                    .replace(/^-+|-+$/g, ""),
                }))
              }
              required
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-1 block text-[11px]">{t("admin.catalog.fault.form.price")}</span>
            <input
              type="number"
              min={0}
              step={500}
              className={field}
              value={faultForm.price}
              onChange={(e) => setFaultForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="ex. 15000"
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-1 block text-[11px]">{t("admin.catalog.fault.table.duration")}</span>
            <input
              className={field}
              value={faultForm.duration}
              onChange={(e) => setFaultForm((f) => ({ ...f, duration: e.target.value }))}
              placeholder={t("admin.catalog.fault.form.duration_placeholder")}
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-1 block text-[11px]">{t("admin.catalog.fault.table.warranty")}</span>
            <input
              className={field}
              value={faultForm.warranty}
              onChange={(e) => setFaultForm((f) => ({ ...f, warranty: e.target.value }))}
              placeholder={t("admin.catalog.fault.form.warranty_placeholder")}
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-1 block text-[11px]">{t("admin.catalog.fault.table.part")}</span>
            <input
              className={field}
              value={faultForm.part}
              onChange={(e) => setFaultForm((f) => ({ ...f, part: e.target.value }))}
              placeholder={t("admin.catalog.fault.form.part_placeholder")}
            />
          </label>
          <label className="block">
            <span className="at-eyebrow mb-1 block text-[11px]">{t("admin.catalog.form.sort")}</span>
            <input
              type="number"
              min={0}
              className={field}
              value={faultForm.sort}
              onChange={(e) => setFaultForm((f) => ({ ...f, sort: Number(e.target.value) || 0 }))}
            />
          </label>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            variant="technical"
            size="sm"
            disabled={busy || !faultForm.label.trim() || !faultForm.slug.trim()}
          >
            {busy ? t("admin.catalog.button.saving") : editingFault ? t("admin.catalog.button.save") : t("admin.catalog.fault.button.add")}
          </Button>
          {editingFault !== null && (
            <Button type="button" variant="outline" size="sm" onClick={resetFault} disabled={busy}>
              {t("admin.catalog.button.cancel")}
            </Button>
          )}
        </div>
      </form>
      <div className="mt-4 border-t border-border pt-4">
        <p className="text-sm font-semibold">{t("admin.catalog.photo.title")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {photos.map((p) => (
            <div key={p.id} className="relative">
              <img
                src={p.url}
                alt={p.alt || device.name}
                loading="lazy"
                decoding="async"
                className="h-16 w-16 rounded-sm border border-border object-cover"
              />
              <button
                type="button"
                className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full border border-border bg-card text-destructive hover:bg-destructive/10"
                disabled={busy}
                aria-label="Supprimer la photo"
                onClick={() => removePhoto(p.id)}
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
          {photos.length === 0 && <p className="text-xs text-muted-foreground">{t("admin.catalog.photo.empty")}</p>}
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label
              htmlFor={`photo-url-${device.slug}`}
              className="mb-1 block text-[11px] text-muted-foreground"
            >
              {t("admin.catalog.photo.url_label")}
            </label>
            <input
              id={`photo-url-${device.slug}`}
              className={`${field} max-w-64 py-1.5 text-xs`}
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://… ou chemin du bucket"
            />
          </div>
          <Button
            size="sm"
            variant="secondary"
            disabled={busy || !photoUrl.trim()}
            onClick={() => addPhoto(photoUrl.trim())}
          >
            {t("admin.catalog.photo.add_button")}
          </Button>
          <label className="flex cursor-pointer items-center gap-2 rounded-sm border border-border px-3 py-1.5 text-xs hover:bg-surface">
            {busy ? (
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
            ) : (
              <ImagePlus className="size-3.5 text-muted-foreground" />
            )}
            {t("admin.catalog.photo.upload_button")}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              className="sr-only"
              disabled={busy}
              onChange={handleUpload}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
