import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, FileSpreadsheet, Laptop, Loader2, Plus, QrCode, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/context";
import { parseEquipmentFile } from "@/lib/equipment-import";
import {
  createEquipment,
  getMyOrganizations,
  getOrgEquipment,
  getOrgSites,
  EQUIPMENT_STATUSES,
  type EquipmentInput,
  type EquipmentStatus,
} from "@/lib/org.functions";

export const Route = createFileRoute("/app/organizations/$orgId/equipment")({
  component: EquipmentList,
});

export const EQUIPMENT_TYPES = [
  "ordinateur",
  "ecran",
  "imprimante",
  "serveur",
  "smartphone",
  "tablette",
  "reseau",
  "autre",
];

function EquipmentList() {
  const { orgId } = Route.useParams();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const orgs = useQuery({ queryKey: ["app", "orgs"], queryFn: () => getMyOrganizations() });
  const org = orgs.data?.find((o) => o.id === orgId);

  const equipment = useQuery({
    queryKey: ["app", "org", orgId, "equipment"],
    queryFn: () => getOrgEquipment({ data: { org_id: orgId } }),
    enabled: Boolean(org),
  });

  const sites = useQuery({
    queryKey: ["app", "org", orgId, "sites"],
    queryFn: () => getOrgSites({ data: { org_id: orgId } }),
    enabled: Boolean(org),
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<EquipmentStatus | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<EquipmentInput & { type: string }>({
    name: "",
    type: "ordinateur",
    brand: "",
    model: "",
    serial_number: "",
    asset_tag: "",
    purchase_date: "",
    assigned_to: "",
    location: "",
    notes: "",
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (equipment.data ?? []).filter((e) => {
      if (status !== "all" && e.status !== status) return false;
      if (!q) return true;
      return [e.name, e.brand, e.model, e.serial_number, e.asset_tag, e.assigned_to, e.location]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [equipment.data, search, status]);

  const create = useMutation({
    mutationFn: () =>
      createEquipment({
        data: {
          org_id: orgId,
          name: form.name,
          type: form.type,
          brand: form.brand || null,
          model: form.model || null,
          serial_number: form.serial_number || null,
          asset_tag: form.asset_tag || null,
          site_id: form.site_id ?? null,
          purchase_date: form.purchase_date || null,
          assigned_to: form.assigned_to || null,
          location: form.location || null,
          notes: form.notes || null,
        },
      }),
    onSuccess: async (res) => {
      toast.success(t("org.equipment.form.success"));
      setShowForm(false);
      setForm({
        name: "",
        type: "ordinateur",
        brand: "",
        model: "",
        serial_number: "",
        asset_tag: "",
        purchase_date: "",
        assigned_to: "",
        location: "",
        notes: "",
      });
      await queryClient.invalidateQueries({ queryKey: ["app", "org", orgId, "equipment"] });
      navigate({
        to: "/app/organizations/$orgId/equipment/$equipmentId",
        params: { orgId, equipmentId: res.equipment_id },
      });
    },
    onError: (err) => toast.error(t("org.equipment.form.error").replace("{0}", err.message)),
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const summary = parseEquipmentFile(buffer);

      if (summary.validRows.length === 0) {
        toast.error("Aucun équipement valide trouvé dans le fichier.");
        return;
      }

      toast.success(
        `${summary.validRows.length} équipement(s) analysés avec succès ! (${summary.duplicatesCount} doublon(s) ignoré(s))`,
      );

      // Create each valid item batch
      for (const item of summary.validRows) {
        await createEquipment({
          data: {
            org_id: orgId,
            name: `${item.brand} ${item.model}`,
            type: item.type,
            brand: item.brand,
            model: item.model,
            serial_number: item.serial_number,
            notes: item.notes ?? null,
          },
        }).catch(() => null);
      }

      await queryClient.invalidateQueries({ queryKey: ["app", "org", orgId, "equipment"] });
      toast.success("Importation terminée et ajoutée au parc matériel !");
    } catch {
      toast.error("Erreur lors de la lecture du fichier Excel/CSV.");
    } finally {
      event.target.value = "";
    }
  };

  if (!org) {
    return (
      <p className="text-sm text-muted-foreground">
        {orgs.isLoading ? t("common.loading") : t("org.error.notfound")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/app/organizations/$orgId"
          params={{ orgId }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {org.name}
        </Link>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="at-display text-2xl font-bold">{t("org.equipment.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("org.equipment.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 px-3 py-2 border border-border bg-card hover:bg-muted text-foreground text-xs font-bold transition-all rounded-xs shadow-xs">
              <FileSpreadsheet className="size-4 text-primary" />
              <span>Import Excel/CSV</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
            <Button variant="primaryBlock" onClick={() => setShowForm((v) => !v)}>
              {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
              {t("org.equipment.add")}
            </Button>
          </div>
        </div>
      </div>

      {showForm ? (
        <form
          className="grid gap-4 border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <div>
            <Label htmlFor="eq-name">{t("org.equipment.form.name")}</Label>
            <Input
              id="eq-name"
              required
              className="mt-1.5"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("org.equipment.form.type")}</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EQUIPMENT_TYPES.map((ty) => (
                  <SelectItem key={ty} value={ty}>
                    {t(`org.equipment.type.${ty}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="eq-brand">{t("org.equipment.form.brand")}</Label>
            <Input
              id="eq-brand"
              className="mt-1.5"
              value={form.brand ?? ""}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="eq-model">{t("org.equipment.form.model")}</Label>
            <Input
              id="eq-model"
              className="mt-1.5"
              value={form.model ?? ""}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="eq-serial">{t("org.equipment.form.serial")}</Label>
            <Input
              id="eq-serial"
              className="mt-1.5"
              value={form.serial_number ?? ""}
              onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="eq-tag">{t("org.equipment.form.assetTag")}</Label>
            <Input
              id="eq-tag"
              className="mt-1.5"
              value={form.asset_tag ?? ""}
              onChange={(e) => setForm({ ...form, asset_tag: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="eq-date">{t("org.equipment.form.purchaseDate")}</Label>
            <Input
              id="eq-date"
              type="date"
              className="mt-1.5"
              value={form.purchase_date ?? ""}
              onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("org.sites.title")}</Label>
            <Select
              value={form.site_id ?? "none"}
              onValueChange={(v) => setForm({ ...form, site_id: v === "none" ? null : v })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {sites.data?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="eq-to">{t("org.equipment.form.assignedTo")}</Label>
            <Input
              id="eq-to"
              className="mt-1.5"
              value={form.assigned_to ?? ""}
              onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="eq-loc">{t("org.equipment.form.location")}</Label>
            <Input
              id="eq-loc"
              className="mt-1.5"
              value={form.location ?? ""}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Label htmlFor="eq-notes">{t("org.equipment.form.notes")}</Label>
            <Input
              id="eq-notes"
              className="mt-1.5"
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="submit" variant="primaryBlock" disabled={create.isPending}>
              {create.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              {t("org.equipment.form.submit")}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t("org.equipment.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="sm:w-56">
          <Select value={status} onValueChange={(v) => setStatus(v as EquipmentStatus | "all")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("org.equipment.status.all")}</SelectItem>
              {EQUIPMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`org.equipment.status.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {equipment.isLoading ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-sm border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t("org.equipment.empty")}
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <li key={e.id}>
              <Link
                to="/app/organizations/$orgId/equipment/$equipmentId"
                params={{ orgId, equipmentId: e.id }}
                className="group flex h-full flex-col gap-3 border border-border bg-card p-4 transition-colors hover:border-primary"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center bg-accent">
                      <Laptop className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{e.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[e.brand, e.model].filter(Boolean).join(" ") || e.type}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{t(`org.equipment.status.${e.status}`)}</Badge>
                </div>
                <dl className="mt-auto space-y-1 text-xs text-muted-foreground">
                  {e.serial_number ? (
                    <div className="flex justify-between gap-2">
                      <dt>{t("org.equipment.form.serial")}</dt>
                      <dd className="truncate text-foreground">{e.serial_number}</dd>
                    </div>
                  ) : null}
                  {e.asset_tag ? (
                    <div className="flex justify-between gap-2">
                      <dt>{t("org.equipment.form.assetTag")}</dt>
                      <dd className="truncate text-foreground">{e.asset_tag}</dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-2">
                    <dt>{t("org.equipment.form.location")}</dt>
                    <dd className="truncate text-foreground">
                      {[e.location, e.site_name].filter(Boolean).join(" · ") || "—"}
                    </dd>
                  </div>
                </dl>
                <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <QrCode className="size-3" />
                    {e.qr_id}
                  </span>
                  <span className="font-medium text-primary group-hover:underline">
                    {t("org.equipment.view")}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
