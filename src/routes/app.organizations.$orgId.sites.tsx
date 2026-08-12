import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building,
  Laptop,
  Loader2,
  MapPin,
  Phone,
  Plus,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n/context";
import { createOrgSite, deleteOrgSite, getMyOrganizations, getOrgSites } from "@/lib/org.functions";

export const Route = createFileRoute("/app/organizations/$orgId/sites")({
  component: SitesList,
});

function SitesList() {
  const { orgId } = Route.useParams();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const orgs = useQuery({ queryKey: ["app", "orgs"], queryFn: () => getMyOrganizations() });
  const org = orgs.data?.find((o) => o.id === orgId);

  const sites = useQuery({
    queryKey: ["app", "org", orgId, "sites"],
    queryFn: () => getOrgSites({ data: { org_id: orgId } }),
    enabled: Boolean(org),
  });

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Cotonou");
  const [phone, setPhone] = useState("");
  const [manager, setManager] = useState("");
  const [departments, setDepartments] = useState("");

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["app", "org", orgId, "sites"] });
    await queryClient.invalidateQueries({ queryKey: ["app", "org", orgId, "equipment"] });
  };

  const create = useMutation({
    mutationFn: () =>
      createOrgSite({
        data: {
          org_id: orgId,
          name,
          address: address || null,
          city,
          phone,
          manager: manager || null,
          departments: departments
            ? departments
                .split(",")
                .map((d) => d.trim())
                .filter(Boolean)
            : [],
        },
      }),
    onSuccess: async () => {
      toast.success(t("org.sites.form.success"));
      setShowForm(false);
      setName("");
      setAddress("");
      setCity("Cotonou");
      setPhone("");
      setManager("");
      setDepartments("");
      await invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: (siteId: string) => deleteOrgSite({ data: { site_id: siteId } }),
    onSuccess: async () => {
      toast.success(t("org.sites.delete.success"));
      await invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const totalDepartments = useMemo(
    () => (sites.data ?? []).reduce((sum, s) => sum + (s.departments?.length ?? 0), 0),
    [sites.data],
  );

  const totalEquipment = useMemo(
    () => (sites.data ?? []).reduce((sum, s) => sum + (s.equipment_count ?? 0), 0),
    [sites.data],
  );

  if (!org) {
    return (
      <div className="flex items-center justify-center py-20">
        {orgs.isLoading ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        ) : (
          <p className="text-sm text-muted-foreground">{t("org.error.notfound")}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="at-in">
        <Link
          to="/app/organizations/$orgId"
          params={{ orgId }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {org.name}
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="at-eyebrow mb-1 block">{t("org.sites.title")}</span>
            <h1 className="at-display text-2xl font-bold">{t("org.sites.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("org.sites.subtitle")}</p>
          </div>
          <Button variant="primaryBlock" onClick={() => setShowForm((v) => !v)}>
            {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
            {t("org.sites.add")}
          </Button>
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="at-in grid grid-cols-3 gap-3" style={{ animationDelay: "60ms" }}>
        <div className="flex items-center gap-3 border border-border bg-card p-4">
          <div className="flex size-10 items-center justify-center bg-muted text-accent">
            <MapPin className="size-5" />
          </div>
          <div>
            <p className="font-mono text-2xl font-bold tabular-nums">{sites.data?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground">{t("org.sites.title")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border border-border bg-card p-4">
          <div className="flex size-10 items-center justify-center bg-muted text-primary">
            <Building className="size-5" />
          </div>
          <div>
            <p className="font-mono text-2xl font-bold tabular-nums">{totalDepartments}</p>
            <p className="text-xs text-muted-foreground">{t("org.sites.form.departments")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border border-border bg-card p-4">
          <div className="flex size-10 items-center justify-center bg-muted text-success">
            <Laptop className="size-5" />
          </div>
          <div>
            <p className="font-mono text-2xl font-bold tabular-nums">{totalEquipment}</p>
            <p className="text-xs text-muted-foreground">{t("org.equipment.title")}</p>
          </div>
        </div>
      </div>

      {/* ─── Create Site Form ─── */}
      {showForm ? (
        <form
          className="at-in grid gap-4 border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <div>
            <Label htmlFor="site-name">{t("org.sites.form.name")}</Label>
            <Input
              id="site-name"
              required
              className="mt-1.5"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="site-address">{t("org.sites.form.address")}</Label>
            <Input
              id="site-address"
              className="mt-1.5"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="site-city">{t("org.sites.form.city")}</Label>
            <Input
              id="site-city"
              className="mt-1.5"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="site-phone">{t("org.sites.form.phone")}</Label>
            <Input
              id="site-phone"
              className="mt-1.5"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="site-manager">{t("org.sites.form.manager")}</Label>
            <Input
              id="site-manager"
              className="mt-1.5"
              value={manager}
              onChange={(e) => setManager(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="site-depts">{t("org.sites.form.departments")}</Label>
            <Input
              id="site-depts"
              className="mt-1.5"
              placeholder={t("org.sites.form.departments.placeholder")}
              value={departments}
              onChange={(e) => setDepartments(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="submit" variant="primaryBlock" disabled={create.isPending}>
              {create.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              {t("org.sites.form.submit")}
            </Button>
          </div>
        </form>
      ) : null}

      {/* ─── Sites Grid ─── */}
      <div className="at-in" style={{ animationDelay: "120ms" }}>
        {sites.isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : sites.data?.length === 0 ? (
          <div className="rounded-sm border border-dashed border-border py-16 text-center">
            <MapPin className="mx-auto size-10 text-muted-foreground" />
            <p className="mt-4 text-sm font-medium">{t("org.sites.empty")}</p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sites.data?.map((s) => (
              <li
                key={s.id}
                className="group flex flex-col gap-3 border border-border bg-card p-4 transition-colors hover:border-primary/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center bg-accent/10 text-accent">
                      <MapPin className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{s.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[s.address, s.city].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    onClick={() => {
                      if (confirm(t("org.sites.delete.confirm"))) remove.mutate(s.id);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>

                <dl className="mt-auto space-y-1.5 text-xs text-muted-foreground">
                  {s.phone ? (
                    <div className="flex items-center gap-1.5">
                      <Phone className="size-3 shrink-0" />
                      <span>{s.phone}</span>
                    </div>
                  ) : null}
                  {s.manager ? (
                    <div className="flex items-center gap-1.5">
                      <User className="size-3 shrink-0" />
                      <span className="text-foreground">{s.manager}</span>
                    </div>
                  ) : null}
                  {s.departments.length > 0 ? (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {s.departments.map((d) => (
                        <Badge key={d} variant="outline" className="text-[10px] font-normal">
                          {d}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </dl>

                <div className="flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
                  <Laptop className="size-3" />
                  {t("org.sites.equipmentCount").replace("{0}", String(s.equipment_count))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
