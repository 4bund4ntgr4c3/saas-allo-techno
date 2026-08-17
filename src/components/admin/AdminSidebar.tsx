import { Link, useLocation } from "@tanstack/react-router";
import {
  BarChart3,
  BadgeCheck,
  Bell,
  BookOpen,
  CreditCard,
  FileText,
  History,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Package,
  PieChart,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  ToggleLeft,
  TrendingUp,
  Truck,
  Users,
  Wrench,
  Webhook,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
} from "@/components/ui/sidebar";

type NavItem = {
  labelKey: string;
  to?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

type NavGroup = {
  labelKey: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: "admin.nav.overview",
    items: [{ labelKey: "admin.nav.dashboard", to: "/admin", icon: LayoutDashboard }],
  },
  {
    labelKey: "admin.nav.operations",
    items: [
      { labelKey: "admin.tab.dossiers", to: "/admin/dossiers", icon: FileText },
      { labelKey: "admin.tab.atelier", to: "/admin/atelier", icon: Wrench },
      { labelKey: "admin.tab.caisse", to: "/admin/caisse", icon: CreditCard },
      { labelKey: "admin.tab.livraisons", to: "/admin/livraisons", icon: Truck },
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
      { labelKey: "admin.tab.kb", to: "/admin/kb", icon: BookOpen },
      { labelKey: "admin.tab.inventaire", to: "/admin/inventaire", icon: Package },
    ],
  },
  {
    labelKey: "admin.nav.tools",
    items: [
      { labelKey: "admin.tab.leads", to: "/admin/leads", icon: TrendingUp },
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
      { labelKey: "admin.tab.notifs", to: "/admin/notifications", icon: Bell },
      { labelKey: "admin.tab.marketing", to: "/admin/marketing", icon: Megaphone },
      { labelKey: "admin.tab.webhooks", to: "/admin/webhooks", icon: Webhook },
      { labelKey: "admin.tab.featureFlags", to: "/admin/feature-flags", icon: ToggleLeft },
      { labelKey: "admin.tab.chat", to: "/admin/chat", icon: MessageSquare, badge: "3" },
    ],
  },
];

function isItemActive(pathname: string, item: NavItem, locale: string): boolean {
  if (item.to) {
    if (item.to === "/admin") {
      return pathname === "/admin" || pathname === `/${locale}/admin`;
    }
    return pathname.includes(item.to);
  }
  return false;
}

function NavItemLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const { t } = useI18n();

  return (
    <Link
      to={item.to!}
      className={cn(
        "relative flex items-center gap-2.5 px-2.5 py-2 text-sm font-medium transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isActive
          ? "bg-primary/8 text-foreground"
          : "text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
      )}
    >
      {/* Active indicator bar */}
      {isActive && <span className="absolute inset-y-0 left-0 w-0.5 bg-primary" />}
      <item.icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          isActive ? "text-primary" : "text-muted-foreground",
        )}
      />
      <span className="truncate">{t(item.labelKey)}</span>
    </Link>
  );
}

export function AdminSidebar({ user }: { user: { email?: string; id: string } }) {
  const { t } = useI18n();
  const location = useLocation();
  const initials = (user.email ?? "A").slice(0, 2).toUpperCase();

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-3">
          {/* Logo mark */}
          <div className="flex size-9 shrink-0 items-center justify-center border border-primary/20 bg-primary text-primary-foreground">
            <span className="at-display text-sm">AT</span>
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="at-display truncate text-base">
              All<span className="text-primary">ô</span> Techn
              <span className="text-primary">o</span>
            </span>
            <span className="at-eyebrow mt-0.5">Backoffice</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <ScrollArea className="h-full">
          <div className="p-2" data-tour="admin-sidebar">
            {NAV_GROUPS.map((group) => (
              <div key={group.labelKey} className="mb-4">
                <p className="at-eyebrow mb-1 px-2.5 group-data-[collapsible=icon]:hidden">
                  {t(group.labelKey)}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = isItemActive(location.pathname, item, t("locale") as string);

                    return (
                      <div key={item.labelKey} className="relative">
                        <NavItemLink item={item} isActive={isActive} />
                        {item.badge && (
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex size-5 items-center justify-center bg-primary/10 text-[10px] font-bold text-primary group-data-[collapsible=icon]:hidden">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <div className="flex items-center gap-3 px-3 py-3 group-data-[collapsible=icon]:justify-center">
          <Avatar className="size-9 border border-border">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-medium">{user.email ?? "Admin"}</span>
            <span className="at-eyebrow mt-0.5">{t("admin.nav.administrator")}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
