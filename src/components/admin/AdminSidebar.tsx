import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  BarChart3, BadgeCheck, ChevronDown, FileText, History,
  LayoutDashboard, MailPlus, Package, PieChart, RadioTower, RotateCcw,
  ShieldCheck, ShoppingCart, TrendingUp, Users, Wrench, Webhook,
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
  children?: NavItem[];
  badge?: string;
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
      {
        labelKey: "admin.nav.analytics",
        icon: BarChart3,
        children: [
          { labelKey: "admin.stats.tab", to: "/admin/stats", icon: PieChart },
          { labelKey: "admin.tab.kpis", to: "/admin/kpis", icon: TrendingUp },
          { labelKey: "admin.tab.analytics", to: "/admin/analytics", icon: BarChart3 },
          { labelKey: "admin.tab.funnel", to: "/admin/analytics-advanced", icon: TrendingUp },
          { labelKey: "admin.tab.sla", to: "/admin/sla", icon: BarChart3 },
          { labelKey: "admin.tab.satisfaction", to: "/admin/satisfaction", icon: TrendingUp },
        ],
      },
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
      { labelKey: "admin.tab.chat", to: "/admin/chat", icon: MailPlus, badge: "3" },
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
  if (item.children) {
    return item.children.some((child) => isItemActive(pathname, child, locale));
  }
  return false;
}

function findExpandedItems(pathname: string, locale: string): Set<string> {
  const expanded = new Set<string>();
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (item.children && isItemActive(pathname, item, locale)) {
        expanded.add(item.labelKey);
      }
    }
  }
  return expanded;
}

function NavItemLink({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
}) {
  const { t } = useI18n();

  if (item.children) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors duration-150",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70",
        )}
      >
        <item.icon
          className={cn(
            "size-4 shrink-0 transition-colors",
            isActive ? "text-foreground" : "text-muted-foreground",
          )}
        />
        <span className="flex-1 text-left truncate">{t(item.labelKey)}</span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
            isActive && "rotate-180",
          )}
        />
      </button>
    );
  }

  return (
    <Link
      to={item.to!}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors duration-150",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70",
      )}
    >
      <item.icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          isActive ? "text-foreground" : "text-muted-foreground",
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

  const [expandedItems, setExpandedItems] = useState<Set<string>>(() =>
    findExpandedItems(location.pathname, t("locale") as string),
  );

  const toggleItem = (labelKey: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(labelKey)) {
        next.delete(labelKey);
      } else {
        next.add(labelKey);
      }
      return next;
    });
  };

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold tracking-tight">
            AT
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold tracking-tight">Allô Techno</span>
            <span className="text-xs text-muted-foreground">Admin</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <ScrollArea className="h-full">
          <div className="p-2">
            {NAV_GROUPS.map((group) => (
              <div key={group.labelKey} className="mb-4">
                <p className="mb-1 px-2.5 text-[11px] font-medium text-muted-foreground group-data-[collapsible=icon]:hidden">
                  {t(group.labelKey)}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = isItemActive(location.pathname, item, t("locale") as string);
                    const isExpanded = expandedItems.has(item.labelKey);

                    return (
                      <div key={item.labelKey}>
                        <NavItemLink
                          item={item}
                          isActive={isActive}
                          {...(item.children ? { onClick: () => toggleItem(item.labelKey) } : {})}
                        />

                        {item.children && (
                          <div
                            className={cn(
                              "overflow-hidden transition-all duration-200",
                              isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0",
                            )}
                          >
                            <div className="ml-4 border-l border-border pl-3 py-0.5 space-y-0.5">
                              {item.children.map((child) => {
                                const childActive = child.to
                                  ? (child.to === "/admin"
                                      ? location.pathname === "/admin" || location.pathname === `/${t("locale")}/admin`
                                      : location.pathname.includes(child.to))
                                  : false;
                                return (
                                  <Link
                                    key={child.labelKey}
                                    to={child.to!}
                                    className={cn(
                                      "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors duration-150",
                                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                      childActive
                                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                                        : "text-sidebar-foreground/60",
                                    )}
                                  >
                                    <span className="truncate">{t(child.labelKey)}</span>
                                    {child.badge && (
                                      <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                                        {child.badge}
                                      </span>
                                    )}
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {!item.children && item.badge && (
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary group-data-[collapsible=icon]:hidden">
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
            <span className="text-xs text-muted-foreground">{t("admin.nav.administrator")}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
