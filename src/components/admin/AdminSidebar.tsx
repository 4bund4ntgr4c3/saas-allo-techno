import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  BarChart3, BadgeCheck, ChevronRight, FileText, History, LayoutDashboard,
  MailPlus, Package, PieChart, RadioTower, RotateCcw, ShieldCheck,
  ShoppingCart, TrendingUp, Users, Wrench, Webhook,
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
  to: string;
  icon: React.ComponentType<{ className?: string }>;
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

function isActivePath(pathname: string, to: string, locale: string) {
  if (to === "/admin") {
    return pathname === "/admin" || pathname === `/${locale}/admin`;
  }
  return pathname.includes(to);
}

function findActiveGroup(pathname: string, locale: string): number {
  for (let i = NAV_GROUPS.length - 1; i >= 0; i--) {
    const group = NAV_GROUPS[i];
    if (!group) continue;
    for (const item of group.items) {
      if (isActivePath(pathname, item.to, locale)) return i;
    }
  }
  return 0;
}

export function AdminSidebar({ user }: { user: { email?: string; id: string } }) {
  const { t } = useI18n();
  const location = useLocation();
  const initials = (user.email ?? "A").slice(0, 2).toUpperCase();

  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(() => {
    const locale = t("locale") as string;
    const active = findActiveGroup(location.pathname, locale);
    return new Set([active]);
  });

  const toggleGroup = (index: number) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground at-display text-sm">
            AT
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold tracking-tight">Allô Techno</span>
            <span className="at-eyebrow !text-[9px]">Administration</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <ScrollArea className="h-full">
          <div className="space-y-1 p-2">
            {NAV_GROUPS.map((group, groupIndex) => {
              const isExpanded = expandedGroups.has(groupIndex);
              const hasActiveChild = group.items.some((item) =>
                isActivePath(location.pathname, item.to, t("locale")),
              );

              return (
                <div key={group.labelKey}>
                  {/* Group header — clickable to expand/collapse */}
                  <button
                    onClick={() => toggleGroup(groupIndex)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wider transition-colors",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      hasActiveChild ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    <ChevronRight
                      className={cn(
                        "size-3 shrink-0 transition-transform duration-200",
                        isExpanded && "rotate-90",
                      )}
                    />
                    <span className="group-data-[collapsible=icon]:hidden">
                      {t(group.labelKey)}
                    </span>
                  </button>

                  {/* Group items — animated expand/collapse */}
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-200",
                      isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0",
                    )}
                  >
                    <div className="ml-3 border-l border-border pl-3 py-1 space-y-0.5">
                      {group.items.map((item) => {
                        const isActive = isActivePath(
                          location.pathname,
                          item.to,
                          t("locale"),
                        );
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            className={cn(
                              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-all duration-150",
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
                                isActive ? "text-primary" : "text-muted-foreground",
                              )}
                            />
                            <span className="group-data-[collapsible=icon]:hidden truncate">
                              {t(item.labelKey)}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <div className="flex items-center gap-3 px-3 py-3 group-data-[collapsible=icon]:justify-center">
          <Avatar className="size-9 border border-border">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold at-display !text-[10px]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-medium">{user.email ?? "Admin"}</span>
            <span className="at-eyebrow !text-[9px]">{t("admin.nav.administrator")}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
