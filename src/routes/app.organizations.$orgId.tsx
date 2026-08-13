import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  Laptop,
  LifeBuoy,
  Loader2,
  MapPin,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  Hash,
  Globe,
  Mail,
  Phone,
  Briefcase,
} from "lucide-react";
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
  type Organization,
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

const NAV_ITEMS = [
  { label: "Aperçu Général", to: "", icon: Building2 },
  { label: "Parc Matériel", to: "equipment", icon: Laptop },
  { label: "Sites / Agences", to: "sites", icon: MapPin },
  { label: "Tickets IT", to: "tickets", icon: LifeBuoy },
  { label: "Maintenance", to: "maintenance", icon: ShieldCheck },
  { label: "Facturation & SLA", to: "billing", icon: CreditCard },
] as const;

const ROLE_COLORS: Record<string, string> = {
  admin_org: "bg-primary/10 text-primary border-primary/20",
  responsable_maintenance: "bg-accent/10 text-accent border-accent/20",
  responsable_site: "bg-success/10 text-success border-success/20",
  comptabilite: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  lecture_seule: "bg-muted text-muted-foreground",
  membre: "bg-muted text-muted-foreground",
};

const DEFAULT_DEMO_ORG: Organization = {
  id: "demo-oragroup",
  name: "Oragroup Bénin (Siège Cotonou)",
  trade_name: "Oragroup SA",
  registration_number: "RB/COT/26 B 10948",
  address: "Boulevard de la Marina, Cotonou",
  country: "Bénin",
  phone: "+229 21 31 00 00",
  email: "contact@oragroup-benin.com",
  sector: "Services Financiers & Banque",
  size: "grande",
  site_count: 3,
  equipment_count: 45,
  status: "active",
  member_role: "admin_org",
  member_count: 5,
  created_at: new Date().toISOString(),
};

function OrgDetail() {
  const { orgId } = Route.useParams();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const location = useLocation();

  const isChildRoute =
    location.pathname !== `/app/organizations/${orgId}` &&
    location.pathname !== `/app/organizations/${orgId}/`;

  const orgs = useQuery({ queryKey: ["app", "orgs"], queryFn: () => getMyOrganizations() });
  const org = orgs.data?.find((o) => o.id === orgId) ?? { ...DEFAULT_DEMO_ORG, id: orgId };

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
    mutationFn: (role: OrgRole) =>
      setOrgMemberRole({ data: { org_id: orgId, user_id: changingRole!, role } }),
    onSuccess: async () => {
      toast.success(t("org.detail.role.updated"));
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
      <div className="flex items-center justify-center py-20">
        {orgs.isLoading ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        ) : (
          <p className="text-sm text-muted-foreground">{t("org.error.notfound")}</p>
        )}
      </div>
    );
  }

  const STATUS_COLORS: Record<string, string> = {
    active: "bg-success/15 text-success border-success/30",
    suspended: "bg-destructive/15 text-destructive border-destructive/30",
    pending: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  };

  const kpiCards = [
    {
      label: t("org.form.equipmentCount"),
      value: org.equipment_count ?? 45,
      icon: Laptop,
      color: "text-primary",
    },
    {
      label: t("org.form.siteCount"),
      value: org.site_count ?? 3,
      icon: MapPin,
      color: "text-accent",
    },
    {
      label: t("org.detail.members"),
      value: members.data?.length ?? 5,
      icon: Users,
      color: "text-success",
    },
  ];

  const orgInfoItems = [
    { icon: Hash, label: t("org.form.registrationNumber"), value: org.registration_number },
    { icon: MapPin, label: t("org.form.address"), value: org.address },
    { icon: Globe, label: t("org.form.country"), value: org.country },
    { icon: Phone, label: t("org.form.phone"), value: org.phone },
    { icon: Mail, label: t("org.form.email"), value: org.email },
    { icon: Briefcase, label: t("org.form.sector"), value: org.sector },
    {
      icon: Users,
      label: t("org.form.size"),
      value: org.size ? t(`org.form.size.${org.size}`) : "Grande Entreprise",
    },
  ];

  return (
    <div className="space-y-8">
      {/* ─── Back + Header ─── */}
      <div className="at-in">
        <Link
          to="/app"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("org.detail.back")}
        </Link>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center bg-gradient-to-br from-foreground to-foreground/80 text-background shadow-sm">
              <Building2 className="size-7" />
            </div>
            <div>
              <h1 className="at-display text-2xl font-bold md:text-3xl">{org.name}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {org.trade_name ?? org.sector ?? org.country}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`${STATUS_COLORS[org.status] ?? ""} font-mono text-[10px] font-semibold uppercase tracking-wider`}
          >
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

      {/* ─── Navigation Pills Bar (Always Visible) ─── */}
      <nav
        className="at-in flex gap-1 overflow-x-auto border border-border bg-card p-1"
        style={{ animationDelay: "120ms" }}
      >
        {NAV_ITEMS.map((item) => {
          const href = item.to ? `/app/organizations/${orgId}/${item.to}` : `/app/organizations/${orgId}`;
          const isActive = item.to
            ? location.pathname.includes(`/${item.to}`)
            : location.pathname === `/app/organizations/${orgId}` || location.pathname === `/app/organizations/${orgId}/`;
          return (
            <Link
              key={item.to}
              to={href}
              className={`inline-flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
              }`}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* ─── Render Child Subroute Content OR Overview Dashboard ─── */}
      {isChildRoute ? (
        <Outlet />
      ) : (
        <>
          {/* ─── KPI Cards ─── */}
          <div className="at-in grid grid-cols-3 gap-3" style={{ animationDelay: "60ms" }}>
            {kpiCards.map((kpi) => (
              <div key={kpi.label} className="flex items-center gap-3 border border-border bg-card p-4">
                <div className={`flex size-10 items-center justify-center bg-muted ${kpi.color}`}>
                  <kpi.icon className="size-5" />
                </div>
                <div>
                  <p className="font-mono text-2xl font-bold tabular-nums">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ─── Organization Info ─── */}
      <div className="at-in" style={{ animationDelay: "180ms" }}>
        <span className="at-eyebrow mb-3 block">
          {t("org.form.registrationNumber").split(" ")[0]}
        </span>
        <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {orgInfoItems.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3 bg-card p-4">
              <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 truncate text-sm font-medium">{value ?? "—"}</dd>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Team Members ─── */}
      <div className="at-in" style={{ animationDelay: "240ms" }}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <span className="at-eyebrow mb-1 block">{t("org.detail.members")}</span>
            <h2 className="text-lg font-bold">{t("org.detail.members")}</h2>
          </div>
          <Badge variant="outline" className="font-mono">
            {members.data?.length ?? 0}
          </Badge>
        </div>

        <form
          className="mb-5 grid gap-3 border border-border bg-card p-4 sm:grid-cols-[1fr_auto_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            invite.mutate();
          }}
        >
          <div>
            <Label htmlFor="invite-email" className="text-xs">
              {t("org.detail.invite.email")}
            </Label>
            <Input
              id="invite-email"
              type="email"
              required
              className="mt-1"
              placeholder="collaborateur@entreprise.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">{t("org.detail.role")}</Label>
            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as OrgRole)}>
              <SelectTrigger className="mt-1">
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
          <div className="flex items-end">
            <Button
              type="submit"
              variant="primaryBlock"
              disabled={invite.isPending}
              className="w-full"
            >
              {invite.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UserPlus className="size-4" />
              )}
              {t("org.detail.invite.submit")}
            </Button>
          </div>
        </form>

        {members.isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : members.data?.length === 0 ? (
          <div className="rounded-sm border border-dashed border-border p-8 text-center">
            <Users className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">{t("org.detail.members.empty")}</p>
          </div>
        ) : (
          <div className="divide-y divide-border overflow-hidden border border-border bg-card">
            {members.data?.map((m) => (
              <div
                key={m.user_id}
                className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-muted/30"
              >
                <div className="flex size-10 items-center justify-center bg-gradient-to-br from-foreground/90 to-foreground/60 text-xs font-black uppercase text-background">
                  {(m.full_name ?? m.email ?? "?").slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.full_name ?? m.email}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-semibold ${ROLE_COLORS[m.role] ?? ""}`}
                >
                  {t(`org.role.${m.role}`)}
                </Badge>
                <Select
                  value={m.role}
                  onValueChange={(v) => {
                    setChangingRole(m.user_id);
                    changeRole.mutate(v as OrgRole);
                  }}
                >
                  <SelectTrigger className="h-8 w-44 text-xs">
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
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    if (confirm(t("org.detail.remove.confirm"))) remove.mutate(m.user_id);
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
