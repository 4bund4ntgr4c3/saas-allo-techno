import { createFileRoute, Link, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  Home,
  Laptop,
  LifeBuoy,
  LogOut,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { getMyOrganizations } from "@/lib/org.functions";
import { Button } from "@/components/ui/button";
import { TourLauncher } from "@/components/tour/TourLauncher";
import { TourOverlay } from "@/components/tour/TourOverlay";

export const Route = createFileRoute("/app")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
  },
  component: AppLayout,
});

const ORG_NAV = [
  { labelKey: "org.equipment.title", segment: "equipment", icon: Laptop },
  { labelKey: "org.sites.title", segment: "sites", icon: MapPin },
  { labelKey: "org.tickets.title", segment: "tickets", icon: LifeBuoy },
  { labelKey: "org.nav.maintenance", segment: "maintenance", icon: ShieldCheck },
  { labelKey: "org.nav.billing", segment: "billing", icon: CreditCard },
] as const;

function AppLayout() {
  const { t } = useI18n();
  const location = useLocation();
  const orgs = useQuery({ queryKey: ["app", "orgs"], queryFn: () => getMyOrganizations() });

  const onLogout = async () => {
    await supabase.auth.signOut();
    window.location.assign("/");
  };

  // Detect if we're inside an org
  const orgMatch = location.pathname.match(/\/app\/organizations\/([^/]+)/);
  const activeOrgId = orgMatch?.[1];
  const activeOrg = activeOrgId ? orgs.data?.find((o) => o.id === activeOrgId) : null;

  return (
    <div className="min-h-screen bg-muted/30">
      <header
        className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur"
        data-tour="app-header"
      >
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center border border-primary/20 bg-primary text-primary-foreground">
                <span className="at-display text-xs">AT</span>
              </div>
              <span className="hidden font-mono text-sm font-black uppercase tracking-widest sm:inline">
                Allô&nbsp;Techno
              </span>
            </Link>
            <span className="text-xs text-muted-foreground">
              / {t("org.nav.app")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/">
                <ArrowLeft className="mr-1 inline size-3.5" />
                {t("org.nav.backToSite")}
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="size-4" />
              <span className="hidden sm:inline">{t("org.logout")}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] gap-0 md:flex-row">
        {/* ─── Sidebar ─── */}
        <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:block">
          <nav className="sticky top-14 flex h-[calc(100vh-3.5rem)] flex-col overflow-y-auto" data-tour="app-nav">
            {/* Org list section */}
            <div className="p-3">
              <p className="at-eyebrow mb-2 px-2">{t("org.nav.organizations")}</p>

              <Link
                to="/app"
                className={`relative flex items-center gap-2.5 px-2.5 py-2 text-sm font-medium transition-all ${
                  location.pathname === "/app"
                    ? "bg-primary/8 text-foreground"
                    : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                }`}
              >
                {location.pathname === "/app" && (
                  <span className="absolute inset-y-0 left-0 w-0.5 bg-primary" />
                )}
                <Home className={`size-4 shrink-0 ${location.pathname === "/app" ? "text-primary" : ""}`} />
                {t("org.title")}
              </Link>

              {orgs.data?.map((org) => {
                const isActive = activeOrgId === org.id;
                return (
                  <Link
                    key={org.id}
                    to="/app/organizations/$orgId"
                    params={{ orgId: org.id }}
                    className={`relative flex items-center gap-2.5 px-2.5 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary/8 text-foreground"
                        : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute inset-y-0 left-0 w-0.5 bg-primary" />
                    )}
                    <Building2 className={`size-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                    <span className="truncate">{org.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Active org sub-navigation */}
            {activeOrg && (
              <div className="border-t border-border p-3">
                <p className="at-eyebrow mb-2 px-2">{activeOrg.name}</p>
                {ORG_NAV.map((item) => {
                  const href = `/app/organizations/${activeOrgId}/${item.segment}`;
                  const isActive = location.pathname.includes(`/${item.segment}`);
                  return (
                    <Link
                      key={item.segment}
                      to={href}
                      className={`relative flex items-center gap-2.5 px-2.5 py-2 text-sm font-medium transition-all ${
                        isActive
                          ? "bg-primary/8 text-foreground"
                          : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                      }`}
                    >
                      {isActive && (
                        <span className="absolute inset-y-0 left-0 w-0.5 bg-primary" />
                      )}
                      <item.icon className={`size-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                      <span className="truncate">{t(item.labelKey)}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Footer */}
            <div className="border-t border-border p-3">
              <Link
                to="/"
                className="flex items-center gap-2.5 px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-4 shrink-0" />
                {t("org.nav.backToSite")}
              </Link>
            </div>
          </nav>
        </aside>

        {/* ─── Main Content ─── */}
        <main className="min-w-0 flex-1 p-6 md:p-8" data-tour="app-main">
          <Outlet />
        </main>
      </div>

      <TourLauncher />
      <TourOverlay />
    </div>
  );
}
