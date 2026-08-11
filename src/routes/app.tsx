import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Home, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { getMyOrganizations } from "@/lib/org.functions";
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

function AppLayout() {
  const { t } = useI18n();
  const orgs = useQuery({ queryKey: ["app", "orgs"], queryFn: () => getMyOrganizations() });

  const onLogout = async () => {
    await supabase.auth.signOut();
    window.location.assign("/");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header
        className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur"
        data-tour="app-header"
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="font-mono text-sm font-black uppercase tracking-widest">
              Allô&nbsp;Techno
            </Link>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              / {t("org.nav.app")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              {t("org.nav.backToSite")}
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <LogOut className="size-4" />
              {t("org.logout")}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row">
        <aside className="md:w-56 md:shrink-0">
          <nav
            className="flex gap-1 overflow-x-auto rounded-sm border border-border bg-card p-1 md:flex-col"
            data-tour="app-nav"
          >
            <Link
              to="/app"
              className="inline-flex items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Home className="size-4" />
              {t("org.nav.organizations")}
            </Link>
            {orgs.data?.map((org) => (
              <Link
                key={org.id}
                to="/app/organizations/$orgId"
                params={{ orgId: org.id }}
                className="inline-flex items-center gap-2 rounded-sm px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Building2 className="size-4 shrink-0" />
                <span className="truncate">{org.name}</span>
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1" data-tour="app-main">
          <Outlet />
        </main>
      </div>

      <TourLauncher />
      <TourOverlay />
    </div>
  );
}
