import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Building2, Loader2, Plus, Users } from "lucide-react";
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
import {
  createOrganization,
  getMyOrganizations,
  type OrganizationInput,
} from "@/lib/org.functions";

export const Route = createFileRoute("/app/")({
  component: AppHome,
});

const SIZES = ["1_10", "11_50", "51_200", "200_plus"] as const;

function AppHome() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const orgs = useQuery({ queryKey: ["app", "orgs"], queryFn: () => getMyOrganizations() });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<OrganizationInput>({ name: "", country: "Bénin" });

  const createOrg = useMutation({
    mutationFn: () => createOrganization({ data: form }),
    onSuccess: async () => {
      toast.success(t("org.form.success"));
      setForm({ name: "", country: "Bénin" });
      setShowForm(false);
      await queryClient.invalidateQueries({ queryKey: ["app", "orgs"] });
    },
    onError: (err) => toast.error(t("org.form.error").replace("{0}", err.message)),
  });

  const set = (key: keyof OrganizationInput) => (value: string | number) =>
    setForm((f) => ({ ...f, [key]: value === "" ? null : value }));

  return (
    <div className="space-y-8">
      <div>
        <span className="at-eyebrow mb-2 block">{t("org.eyebrow")}</span>
        <h1 className="at-display text-2xl font-bold md:text-3xl">{t("org.title")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("org.subtitle")}</p>
      </div>

      {orgs.isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          {t("common.loading")}
        </p>
      ) : orgs.data?.length === 0 ? (
        <div className="rounded-sm border border-border bg-card p-8 text-center">
          <Building2 className="mx-auto size-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-bold">{t("org.list.empty.title")}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {t("org.list.empty.text")}
          </p>
          <Button variant="primaryBlock" className="mt-6" onClick={() => setShowForm(true)}>
            <Plus className="size-4" />
            {t("org.list.empty.cta")}
          </Button>
        </div>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">{t("org.list.title")}</h2>
            <Button variant="technical" size="sm" onClick={() => setShowForm((s) => !s)}>
              <Plus className="size-4" />
              {t("org.list.create")}
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {orgs.data?.map((org) => (
              <Link
                key={org.id}
                to="/app/organizations/$orgId"
                params={{ orgId: org.id }}
                className="group border border-border bg-card p-5 transition-colors hover:border-primary/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center bg-foreground text-background">
                      <Building2 className="size-5" />
                    </div>
                    <div>
                      <p className="font-bold">{org.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {org.trade_name ?? org.sector ?? org.country}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {t(
                      org.status === "active"
                        ? "org.list.status.active"
                        : org.status === "suspended"
                          ? "org.list.status.suspended"
                          : "org.list.status.pending",
                    )}
                  </Badge>
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3.5" />
                    {t("org.list.members").replace("{0}", String(org.member_count))}
                  </span>
                  <span>{t(`org.role.${org.member_role}`)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <form
          className="max-w-2xl space-y-5 border border-border bg-card p-6"
          onSubmit={(e) => {
            e.preventDefault();
            createOrg.mutate();
          }}
        >
          <h2 className="text-lg font-bold">{t("org.form.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("org.form.subtitle")}</p>

          <div>
            <Label htmlFor="org-name">{t("org.form.name")}</Label>
            <Input
              id="org-name"
              required
              className="mt-1.5"
              value={form.name ?? ""}
              onChange={(e) => set("name")(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="org-trade">{t("org.form.tradeName")}</Label>
              <Input
                id="org-trade"
                className="mt-1.5"
                value={form.trade_name ?? ""}
                onChange={(e) => set("trade_name")(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="org-registration">{t("org.form.registrationNumber")}</Label>
              <Input
                id="org-registration"
                className="mt-1.5"
                value={form.registration_number ?? ""}
                onChange={(e) => set("registration_number")(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="org-address">{t("org.form.address")}</Label>
              <Input
                id="org-address"
                className="mt-1.5"
                value={form.address ?? ""}
                onChange={(e) => set("address")(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="org-country">{t("org.form.country")}</Label>
              <Input
                id="org-country"
                className="mt-1.5"
                value={form.country ?? "Bénin"}
                onChange={(e) => set("country")(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="org-phone">{t("org.form.phone")}</Label>
              <Input
                id="org-phone"
                className="mt-1.5"
                value={form.phone ?? ""}
                onChange={(e) => set("phone")(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="org-email">{t("org.form.email")}</Label>
              <Input
                id="org-email"
                type="email"
                className="mt-1.5"
                value={form.email ?? ""}
                onChange={(e) => set("email")(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="org-sector">{t("org.form.sector")}</Label>
              <Input
                id="org-sector"
                className="mt-1.5"
                value={form.sector ?? ""}
                onChange={(e) => set("sector")(e.target.value)}
              />
            </div>
            <div>
              <Label>{t("org.form.size")}</Label>
              <Select value={form.size ?? ""} onValueChange={set("size")}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {SIZES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`org.form.size.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="org-sites">{t("org.form.siteCount")}</Label>
                <Input
                  id="org-sites"
                  type="number"
                  min={0}
                  className="mt-1.5"
                  value={form.site_count ?? ""}
                  onChange={(e) => set("site_count")(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="org-equipment">{t("org.form.equipmentCount")}</Label>
                <Input
                  id="org-equipment"
                  type="number"
                  min={0}
                  className="mt-1.5"
                  value={form.equipment_count ?? ""}
                  onChange={(e) => set("equipment_count")(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            variant="primaryBlock"
            disabled={createOrg.isPending}
            className="w-full sm:w-auto"
          >
            {createOrg.isPending && <Loader2 className="size-4 animate-spin" />}
            {t("org.form.submit")}
          </Button>
        </form>
      )}
    </div>
  );
}
