import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
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
  Search,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { getMyOrganizations } from "@/lib/org.functions";
import { SEARCH_OPEN_EVENT } from "@/lib/search-events";
import { Button } from "@/components/ui/button";
import { TourLauncher } from "@/components/tour/TourLauncher";
import { TourOverlay } from "@/components/tour/TourOverlay";
import { OrgSwitcher, type OrgOption } from "@/components/site/OrgSwitcher";

export const Route = createFileRoute("/app")({
  ssr: false,
  beforeLoad: async () => {
    try {
      await supabase.auth.getUser();
      // Allow demo exploration
    } catch {
      // Ignore auth error for demo mode
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const { locale } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const orgs = useQuery({ queryKey: ["app", "orgs"], queryFn: () => getMyOrganizations() });

  const onLogout = async () => {
    await supabase.auth.signOut();
    window.location.assign("/");
  };

  // Detect if we're inside an org
  const orgMatch = location.pathname.match(/\/app\/organizations\/([^/]+)/);
  const activeOrgId = orgMatch?.[1] ?? "demo-oragroup";
  const activeOrg = orgs.data?.find((o) => o.id === activeOrgId) ?? {
    id: activeOrgId,
    name:
      activeOrgId === "demo-bts"
        ? "Bénin Télécoms Services (BTS SA)"
        : "Oragroup Bénin (Siège Cotonou)",
    member_role: "admin_org" as const,
  };

  const orgOptions: OrgOption[] = (
    orgs.data && orgs.data.length > 0
      ? orgs.data
      : [
          { id: "demo-oragroup", name: "Oragroup Bénin (Siège Cotonou)", role: "admin" },
          { id: "demo-bts", name: "Bénin Télécoms Services (BTS SA)", role: "admin" },
        ]
  ).map((o) => ({
    id: o.id,
    name: o.name,
    role: "admin",
  }));

  const navToOrg = (id: string) => {
    navigate({ to: "/app/organizations/$orgId", params: { orgId: id } });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* ─── LEFT SIDEBAR (CLOUDFLARE CONSOLE STYLE) ─── */}
      <aside className="w-64 shrink-0 border-r border-border bg-card flex flex-col h-full z-20">
        {/* Top Sidebar Header: Org Dropdown Selector */}
        <div className="p-3 border-b border-border space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="at-eyebrow text-[10px] text-muted-foreground uppercase font-mono tracking-widest">
              Organisation Active
            </span>
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <OrgSwitcher
            organizations={orgOptions}
            currentOrgId={activeOrgId}
            onSelectOrg={navToOrg}
            onCreateOrg={() => navigate({ to: "/app" })}
          />

          {/* Quick Search Ctrl+K Button */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent(SEARCH_OPEN_EVENT))}
            className="w-full flex items-center justify-between gap-2 rounded border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
          >
            <span className="flex items-center gap-2">
              <Search className="size-3.5" />
              <span>Quick search...</span>
            </span>
            <kbd className="rounded bg-background px-1.5 py-0.5 font-mono text-[9px] font-semibold border border-border">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
          {/* Section 1: Holding & Vue Groupe */}
          <div className="space-y-1">
            <p className="at-eyebrow px-2 text-[10px] text-muted-foreground mb-1">
              Gouvernance Groupe
            </p>
            <Link
              to="/app/group-dashboard"
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded font-medium transition-all ${
                location.pathname === "/app/group-dashboard"
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Building2 className="size-4 shrink-0" />
              <span>Vue Consolidée Groupe</span>
            </Link>
          </div>

          {/* Section 2: Enterprise Management */}
          <div className="space-y-1">
            <p className="at-eyebrow px-2 text-[10px] text-muted-foreground mb-1">
              {activeOrg.name}
            </p>

            <Link
              to="/app/organizations/$orgId"
              params={{ orgId: activeOrgId }}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded font-medium transition-all ${
                location.pathname === `/app/organizations/${activeOrgId}` ||
                location.pathname === `/app/organizations/${activeOrgId}/`
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Home className="size-4 shrink-0" />
              <span>Aperçu Général</span>
            </Link>

            <Link
              to="/app/organizations/$orgId/equipment"
              params={{ orgId: activeOrgId }}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded font-medium transition-all ${
                location.pathname.includes("/equipment")
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Laptop className="size-4 shrink-0" />
              <span>Parc Matériel</span>
            </Link>

            <Link
              to="/app/organizations/$orgId/sites"
              params={{ orgId: activeOrgId }}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded font-medium transition-all ${
                location.pathname.includes("/sites")
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <MapPin className="size-4 shrink-0" />
              <span>Sites &amp; Départements</span>
            </Link>

            <Link
              to="/app/organizations/$orgId/tickets"
              params={{ orgId: activeOrgId }}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded font-medium transition-all ${
                location.pathname.includes("/tickets")
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <LifeBuoy className="size-4 shrink-0" />
              <span>Tickets IT &amp; Support</span>
            </Link>

            <Link
              to="/app/organizations/$orgId/maintenance"
              params={{ orgId: activeOrgId }}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded font-medium transition-all ${
                location.pathname.includes("/maintenance")
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <ShieldCheck className="size-4 shrink-0" />
              <span>Maintenance SLA</span>
            </Link>

            <Link
              to="/app/organizations/$orgId/billing"
              params={{ orgId: activeOrgId }}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded font-medium transition-all ${
                location.pathname.includes("/billing")
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <CreditCard className="size-4 shrink-0" />
              <span>Facturation &amp; RSE</span>
            </Link>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border bg-muted/20">
          <Link
            to="/"
            className="flex items-center justify-between text-xs text-muted-foreground hover:text-foreground"
          >
            <span className="flex items-center gap-1.5">
              <ArrowLeft className="size-3.5" />
              Quitter le Portail B2B
            </span>
            <span className="font-mono text-[9px] uppercase border px-1">Site Public</span>
          </Link>
        </div>
      </aside>

      {/* ─── MAIN WORKSPACE AREA (CLOUDFLARE CONSOLE TOPBAR & CONTENT) ─── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Cloudflare Console Topbar */}
        <header className="h-12 border-b border-border bg-card px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-foreground">{activeOrg.name}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground font-mono">
              Console d'Observabilité &amp; Parc
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent(SEARCH_OPEN_EVENT))}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Search className="size-3.5" />
              <span>Ask AI</span>
            </button>

            <Link
              to="/$locale/contact"
              params={{ locale }}
              className="text-muted-foreground hover:text-foreground"
            >
              Support B2B
            </Link>

            <Button variant="ghost" size="sm" onClick={onLogout} className="h-7 text-xs gap-1.5">
              <LogOut className="size-3.5" />
              Déconnexion
            </Button>
          </div>
        </header>

        {/* Main Route Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <TourLauncher />
      <TourOverlay />
    </div>
  );
}
