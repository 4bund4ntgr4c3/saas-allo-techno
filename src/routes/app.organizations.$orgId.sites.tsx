import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Laptop, Loader2, MapPin, Phone, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n/context";
import {
  createOrgSite,
  deleteOrgSite,
  getMyOrganizations,
  getOrgSites,
} from "@/lib/org.functions";

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
            ? departments.split(",").map((d) => d.trim()).filter(Boolean)
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
            <h1 className="at-display text-2xl font-bold">{t("org.sites.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("org.sites.subtitle")}</p>
          </div>
          <Button variant="primaryBlock" onClick={() => setShowForm((v) => !v)}>
            {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
            {t("org.sites.add")}
          </Button>
        </div>
      </div>

      {showForm ? (
        <form
          className="grid gap-4 rounded-sm border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-3"
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
              {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {t("org.sites.form.submit")}
            </Button>
          </div>
        </form>
      ) : null}

      {sites.isLoading ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : sites.data?.length === 0 ? (
        <p className="rounded-sm border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t("org.sites.empty")}
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sites.data?.map((s) => (
            <li key={s.id} className="flex flex-col gap-3 rounded-sm border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-sm bg-accent">
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[s.address, s.city].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    if (confirm(t("org.sites.delete.confirm"))) remove.mutate(s.id);
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <dl className="mt-auto space-y-1 text-xs text-muted-foreground">
                {s.phone ? (
                  <div className="flex items-center gap-1.5">
                    <Phone className="size-3" />
                    {s.phone}
                  </div>
                ) : null}
                {s.manager ? (
                  <div>
                    {t("org.sites.form.manager")} : <span className="text-foreground">{s.manager}</span>
                  </div>
                ) : null}
                {s.departments.length > 0 ? (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {s.departments.map((d) => (
                      <span key={d} className="rounded-sm bg-accent px-1.5 py-0.5 text-[10px]">
                        {d}
                      </span>
                    ))}
                  </div>
                ) : null}
              </dl>
              <p className="flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
                <Laptop className="size-3" />
                {t("org.sites.equipmentCount").replace("{0}", String(s.equipment_count))}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
