import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { EditSiteModal, type EditingSiteData } from "@/components/b2b/sites/EditSiteModal";
import { SiteCard } from "@/components/b2b/sites/SiteCard";
import { useI18n } from "@/lib/i18n/context";
import { parseError } from "@/lib/error-parser";
import {
  createOrgSite,
  deleteOrgSite,
  getMyOrganizations,
  getOrgSites,
  updateOrgSite,
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
  const [editingSite, setEditingSite] = useState<EditingSiteData | null>(null);

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
    onError: (err: unknown) => {
      const parsed = parseError(err, t("org.sites.form.error"));
      toast.error(parsed.message);
    },
  });

  const updateSiteMut = useMutation({
    mutationFn: async (data: EditingSiteData) => {
      await updateOrgSite({
        data: {
          site_id: data.id,
          name: data.name,
          address: data.address || null,
          city: data.city,
          phone: data.phone,
          manager: data.manager || null,
          departments: data.departments,
        },
      });
    },
    onSuccess: async () => {
      toast.success("Site et départements mis à jour avec succès !");
      setEditingSite(null);
      await invalidate();
    },
    onError: (err: unknown) => {
      const parsed = parseError(err, "Erreur lors de la mise à jour du site");
      toast.error(parsed.message);
    },
  });

  const remove = useMutation({
    mutationFn: (siteId: string) => deleteOrgSite({ data: { site_id: siteId } }),
    onSuccess: async () => {
      toast.success(t("org.sites.delete.success"));
      setEditingSite(null);
      await invalidate();
    },
    onError: (err: unknown) => {
      const parsed = parseError(err, t("org.sites.delete.error"));
      toast.error(parsed.message);
    },
  });

  if (!org) {
    return (
      <div className="p-6">
        {orgs.isLoading ? (
          <LoadingState message={t("common.loading")} />
        ) : (
          <EmptyState title={t("org.error.notfound")} description="Vérifiez vos autorisations." />
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
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="at-display text-2xl font-bold">{t("org.sites.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("org.sites.subtitle")}</p>
          </div>
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? <X className="size-4 mr-1" /> : <Plus className="size-4 mr-1" />}
            {t("org.sites.add")}
          </Button>
        </div>
      </div>

      {/* ─── MODAL D'ÉDITION & CONFIGURATION EXTRAITE ─── */}
      <EditSiteModal
        site={editingSite}
        isOpen={Boolean(editingSite)}
        onClose={() => setEditingSite(null)}
        onSave={(data) => updateSiteMut.mutate(data)}
        onDelete={(siteId) => remove.mutate(siteId)}
        isSaving={updateSiteMut.isPending}
        isDeleting={remove.isPending}
      />

      {/* ─── Create Site Form ─── */}
      {showForm ? (
        <form
          className="at-in grid gap-4 border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-3 rounded-lg shadow-sm"
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
            <Button type="submit" disabled={create.isPending}>
              <Plus className="size-4 mr-1" />
              {t("org.sites.form.submit")}
            </Button>
          </div>
        </form>
      ) : null}

      {/* ─── Sites Grid ─── */}
      <div className="at-in">
        {sites.isLoading ? (
          <LoadingState message={t("common.loading")} />
        ) : sites.data?.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title={t("org.sites.empty")}
            description="Ajoutez un premier site ou agence pour votre organisation."
            action={
              <Button size="sm" onClick={() => setShowForm(true)}>
                <Plus className="size-4 mr-1" />
                {t("org.sites.add")}
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sites.data?.map((s) => (
              <SiteCard
                key={s.id}
                site={s}
                onClick={() =>
                  setEditingSite({
                    id: s.id,
                    name: s.name,
                    address: s.address || "",
                    city: s.city || "Cotonou",
                    phone: s.phone || "",
                    manager: s.manager || "",
                    departments: s.departments || [],
                  })
                }
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
