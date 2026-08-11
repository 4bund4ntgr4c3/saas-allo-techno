import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Building2, Laptop, LifeBuoy, Loader2, MapPin, Trash2, UserPlus } from "lucide-react";
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
  getMyOrganizations,
  getOrgMembers,
  inviteOrgMember,
  removeOrgMember,
  setOrgMemberRole,
  type OrgRole,
} from "@/lib/org.functions";

export const Route = createFileRoute("/app/organizations/$orgId")({
  component: OrgDetail,
});

const ROLES: OrgRole[] = [
  "admin_org",
  "responsable_maintenance",
  "responsable_site",
  "comptabilite",
  "lecture_seule",
  "membre",
];

function OrgDetail() {
  const { orgId } = Route.useParams();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const orgs = useQuery({ queryKey: ["app", "orgs"], queryFn: () => getMyOrganizations() });
  const org = orgs.data?.find((o) => o.id === orgId);

  const members = useQuery({
    queryKey: ["app", "org", orgId, "members"],
    queryFn: () => getOrgMembers({ data: { org_id: orgId } }),
    enabled: Boolean(org),
  });

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrgRole>("membre");
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["app", "orgs"] });
    await queryClient.invalidateQueries({ queryKey: ["app", "org", orgId, "members"] });
  };

  const invite = useMutation({
    mutationFn: () =>
      inviteOrgMember({ data: { org_id: orgId, email: inviteEmail, role: inviteRole } }),
    onSuccess: async () => {
      toast.success(t("org.detail.invite.success"));
      setInviteEmail("");
      await invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const changeRole = useMutation({
    mutationFn: (role: OrgRole) => {
      if (!changingRole) throw new Error("Utilisateur manquant");
      return setOrgMemberRole({ data: { org_id: orgId, user_id: changingRole, role } });
    },
    onSuccess: async () => {
      setChangingRole(null);
      await invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: (userId: string) => removeOrgMember({ data: { org_id: orgId, user_id: userId } }),
    onSuccess: async () => {
      toast.success(t("org.detail.remove.success"));
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
    <div className="space-y-8">
      <div>
        <Link
          to="/app"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("org.detail.back")}
        </Link>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-sm bg-foreground text-background">
              <Building2 className="size-6" />
            </div>
            <div>
              <h1 className="at-display text-2xl font-bold">{org.name}</h1>
              <p className="text-sm text-muted-foreground">
                {org.trade_name ?? org.registration_number ?? org.sector ?? org.country}
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
      </div>

      <dl className="grid gap-4 rounded-sm border border-border bg-card p-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["org.form.registrationNumber", org.registration_number],
          ["org.form.address", org.address],
          ["org.form.country", org.country],
          ["org.form.phone", org.phone],
          ["org.form.email", org.email],
          ["org.form.sector", org.sector],
          ["org.form.size", org.size ? t(`org.form.size.${org.size}`) : null],
          ["org.form.siteCount", org.site_count],
          ["org.form.equipmentCount", org.equipment_count],
        ].map(([label, value]) => (
          <div key={String(label)}>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              {t(String(label))}
            </dt>
            <dd className="mt-1 font-medium">{value ?? "—"}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap gap-2">
        <Link
          to="/app/organizations/$orgId/equipment"
          params={{ orgId }}
          className="inline-flex items-center gap-2 rounded-sm border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary"
        >
          <Laptop className="size-4" />
          {t("org.equipment.title")}
        </Link>
        <Link
          to="/app/organizations/$orgId/sites"
          params={{ orgId }}
          className="inline-flex items-center gap-2 rounded-sm border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary"
        >
          <MapPin className="size-4" />
          {t("org.sites.title")}
        </Link>
        <Link
          to="/app/organizations/$orgId/tickets"
          params={{ orgId }}
          className="inline-flex items-center gap-2 rounded-sm border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary"
        >
          <LifeBuoy className="size-4" />
          {t("org.tickets.title")}
        </Link>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-bold">{t("org.detail.members")}</h2>

        <form
          className="mb-5 flex flex-col gap-3 rounded-sm border border-border bg-card p-4 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            invite.mutate();
          }}
        >
          <div className="flex-1">
            <Label htmlFor="invite-email">{t("org.detail.invite.email")}</Label>
            <Input
              id="invite-email"
              type="email"
              required
              className="mt-1.5"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
          <div className="sm:w-56">
            <Label>{t("org.detail.role")}</Label>
            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as OrgRole)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(`org.role.${r}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" variant="primaryBlock" disabled={invite.isPending}>
            {invite.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserPlus className="size-4" />
            )}
            {t("org.detail.invite.submit")}
          </Button>
        </form>

        {members.isLoading ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : members.data?.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("org.detail.members.empty")}</p>
        ) : (
          <ul className="divide-y divide-border rounded-sm border border-border bg-card">
            {members.data?.map((m) => (
              <li key={m.user_id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="flex size-9 items-center justify-center rounded-sm bg-accent text-xs font-black uppercase">
                  {(m.full_name ?? m.email ?? "?").slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.full_name ?? m.email}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                </div>
                <Select
                  value={m.role}
                  onValueChange={(v) => {
                    setChangingRole(m.user_id);
                    changeRole.mutate(v as OrgRole);
                  }}
                >
                  <SelectTrigger className="h-9 w-52">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {t(`org.role.${r}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    if (confirm(t("org.detail.remove.confirm"))) remove.mutate(m.user_id);
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="rounded-sm border border-dashed border-border p-4 text-xs text-muted-foreground">
        {t("org.phase1.hint")}
      </p>
    </div>
  );
}
