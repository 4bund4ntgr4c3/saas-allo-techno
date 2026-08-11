import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";

type TabItem = {
  labelKey: string;
  to: string;
};

type SectionConfig = {
  labelKey: string;
  tabs: TabItem[];
};

const SECTIONS: Record<string, SectionConfig> = {
  analytics: {
    labelKey: "admin.nav.analytics",
    tabs: [
      { labelKey: "admin.stats.tab", to: "/admin/stats" },
      { labelKey: "admin.tab.kpis", to: "/admin/kpis" },
      { labelKey: "admin.tab.analytics", to: "/admin/analytics" },
      { labelKey: "admin.tab.funnel", to: "/admin/analytics-advanced" },
      { labelKey: "admin.tab.sla", to: "/admin/sla" },
      { labelKey: "admin.tab.satisfaction", to: "/admin/satisfaction" },
    ],
  },
  content: {
    labelKey: "admin.nav.content",
    tabs: [
      { labelKey: "admin.tab.contenu", to: "/admin/contenu" },
      { labelKey: "admin.tab.catalogue", to: "/admin/catalogue" },
      { labelKey: "admin.tab.kb", to: "/admin/kb" },
      { labelKey: "admin.tab.inventaire", to: "/admin/inventaire" },
    ],
  },
  tools: {
    labelKey: "admin.nav.tools",
    tabs: [
      { labelKey: "admin.tab.leads", to: "/admin/leads" },
      { labelKey: "admin.tab.reclamations", to: "/admin/reclamations" },
      { labelKey: "admin.tab.parrainage", to: "/admin/parrainage" },
      { labelKey: "admin.tab.rapports", to: "/admin/rapports" },
      { labelKey: "admin.audit.title", to: "/admin/audit" },
    ],
  },
  system: {
    labelKey: "admin.nav.system",
    tabs: [
      { labelKey: "admin.tab.securite", to: "/admin/securite" },
      { labelKey: "admin.tab.notifs", to: "/admin/notifications" },
      { labelKey: "admin.tab.marketing", to: "/admin/marketing" },
      { labelKey: "admin.tab.webhooks", to: "/admin/webhooks" },
      { labelKey: "admin.tab.chat", to: "/admin/chat" },
    ],
  },
};

function getSectionForPath(pathname: string): SectionConfig | null {
  for (const section of Object.values(SECTIONS)) {
    if (section.tabs.some((tab) => pathname.includes(tab.to))) {
      return section;
    }
  }
  return null;
}

export function AdminSectionTabs() {
  const { t } = useI18n();
  const location = useLocation();
  const section = getSectionForPath(location.pathname);

  if (!section) return null;

  return (
    <div className="mb-6">
      <nav className="flex gap-1 rounded-lg bg-muted p-1">
        {section.tabs.map((tab) => {
          const isActive = location.pathname.includes(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(tab.labelKey)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
