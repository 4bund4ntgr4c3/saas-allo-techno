import { Link, useLocation } from "@tanstack/react-router";
import {
  BarChart3, BadgeCheck, FileText, History, LayoutDashboard, MailPlus,
  Package, PieChart, RadioTower, RotateCcw, ShieldCheck, ShoppingCart,
  TrendingUp, Users, Wrench, Webhook,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

type NavItem = {
  labelKey: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

type NavGroup = {
  labelKey: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: "admin.nav.overview",
    items: [
      { labelKey: "admin.nav.dashboard", to: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    labelKey: "admin.nav.operations",
    items: [
      { labelKey: "admin.tab.dossiers", to: "/admin/dossiers", icon: RadioTower },
      { labelKey: "admin.tab.atelier", to: "/admin/atelier", icon: Wrench },
      { labelKey: "admin.tab.commandes", to: "/admin/commandes", icon: ShoppingCart },
      { labelKey: "admin.tab.retours", to: "/admin/retours", icon: RotateCcw },
      { labelKey: "admin.tab.remboursements", to: "/admin/remboursements", icon: RotateCcw },
    ],
  },
  {
    labelKey: "admin.nav.team",
    items: [
      { labelKey: "admin.tab.equipe", to: "/admin/equipe", icon: Users },
      { labelKey: "admin.tab.fournisseurs", to: "/admin/fournisseurs", icon: Package },
      { labelKey: "admin.tab.ateliers", to: "/admin/ateliers", icon: Wrench },
    ],
  },
  {
    labelKey: "admin.nav.analytics",
    items: [
      { labelKey: "admin.stats.tab", to: "/admin/stats", icon: PieChart },
      { labelKey: "admin.tab.kpis", to: "/admin/kpis", icon: TrendingUp },
      { labelKey: "admin.tab.analytics", to: "/admin/analytics", icon: BarChart3 },
      { labelKey: "admin.tab.funnel", to: "/admin/analytics-advanced", icon: TrendingUp },
      { labelKey: "admin.tab.sla", to: "/admin/sla", icon: BarChart3 },
      { labelKey: "admin.tab.satisfaction", to: "/admin/satisfaction", icon: TrendingUp },
    ],
  },
  {
    labelKey: "admin.nav.content",
    items: [
      { labelKey: "admin.tab.contenu", to: "/admin/contenu", icon: FileText },
      { labelKey: "admin.tab.catalogue", to: "/admin/catalogue", icon: Package },
      { labelKey: "admin.tab.kb", to: "/admin/kb", icon: FileText },
      { labelKey: "admin.tab.inventaire", to: "/admin/inventaire", icon: Package },
    ],
  },
  {
    labelKey: "admin.nav.tools",
    items: [
      { labelKey: "admin.tab.leads", to: "/admin/leads", icon: MailPlus },
      { labelKey: "admin.tab.reclamations", to: "/admin/reclamations", icon: BadgeCheck },
      { labelKey: "admin.tab.parrainage", to: "/admin/parrainage", icon: Users },
      { labelKey: "admin.tab.rapports", to: "/admin/rapports", icon: BarChart3 },
      { labelKey: "admin.audit.title", to: "/admin/audit", icon: History },
    ],
  },
  {
    labelKey: "admin.nav.system",
    items: [
      { labelKey: "admin.tab.securite", to: "/admin/securite", icon: ShieldCheck },
      { labelKey: "admin.tab.notifs", to: "/admin/notifications", icon: MailPlus },
      { labelKey: "admin.tab.marketing", to: "/admin/marketing", icon: MailPlus },
      { labelKey: "admin.tab.webhooks", to: "/admin/webhooks", icon: Webhook },
      { labelKey: "admin.tab.chat", to: "/admin/chat", icon: MailPlus },
    ],
  },
];

export function AdminSidebar({ user }: { user: { email?: string; id: string } }) {
  const { t } = useI18n();
  const location = useLocation();
  const initials = (user.email ?? "A").slice(0, 2).toUpperCase();

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/admin">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <span className="text-xs font-bold">AT</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Allô Techno</span>
                  <span className="truncate text-xs text-muted-foreground">Admin</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.labelKey}>
            <SidebarGroupLabel>{t(group.labelKey)}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive =
                  item.to === "/admin"
                    ? location.pathname === "/admin" || location.pathname === `/${t("locale")}/admin`
                    : location.pathname.includes(item.to);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={t(item.labelKey)}>
                      <Link to={item.to}>
                        <item.icon className="size-4" />
                        <span>{t(item.labelKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.badge !== undefined && (
                      <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.email ?? "Admin"}</span>
                <span className="truncate text-xs text-muted-foreground">{t("admin.nav.administrator")}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
