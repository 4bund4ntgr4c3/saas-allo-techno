import { Link, useMatches } from "@tanstack/react-router";
import { RadioTower, Sun, Moon, LogOut } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { useTheme } from "@/hooks/use-theme";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useEffect, useState } from "react";

const ROUTE_LABELS: Record<string, string> = {
  admin: "admin.nav.dashboard",
  dossiers: "admin.tab.dossiers",
  atelier: "admin.tab.atelier",
  equipe: "admin.tab.equipe",
  leads: "admin.tab.leads",
  reclamations: "admin.tab.reclamations",
  analytics: "admin.tab.analytics",
  "analytics-advanced": "admin.tab.funnel",
  stats: "admin.stats.tab",
  kpis: "admin.tab.kpis",
  securite: "admin.tab.securite",
  contenu: "admin.tab.contenu",
  catalogue: "admin.tab.catalogue",
  commandes: "admin.tab.commandes",
  remboursements: "admin.tab.remboursements",
  retours: "admin.tab.retours",
  audit: "admin.audit.title",
  ateliers: "admin.tab.ateliers",
  fournisseurs: "admin.tab.fournisseurs",
  parrainage: "admin.tab.parrainage",
  chat: "admin.tab.chat",
  rapports: "admin.tab.rapports",
  inventaire: "admin.tab.inventaire",
  sla: "admin.tab.sla",
  satisfaction: "admin.tab.satisfaction",
  notifications: "admin.tab.notifs",
  kb: "admin.tab.kb",
  marketing: "admin.tab.marketing",
  webhooks: "admin.tab.webhooks",
  caisse: "admin.tab.caisse",
  livraisons: "admin.tab.livraisons",
};

function LiveClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="hidden font-mono text-[11px] tabular-nums text-muted-foreground sm:inline">
      {time.toLocaleTimeString("fr-BJ", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}

export function AdminHeader() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const matches = useMatches();

  const currentSegment = matches.at(-1)?.pathname?.split("/").filter(Boolean).pop() ?? "admin";
  const labelKey = ROUTE_LABELS[currentSegment] ?? "admin.nav.dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                to="/admin"
                data-tour="admin-header"
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <RadioTower className="size-3.5 shrink-0" />
                <span className="font-mono text-xs uppercase tracking-wider">Admin</span>
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {currentSegment !== "admin" && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium text-foreground">
                  {t(labelKey)}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-3">
        {/* Live indicator */}
        <div className="hidden items-center gap-1.5 sm:flex">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping bg-success opacity-60" />
            <span className="relative inline-flex size-2 bg-success" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Live
          </span>
        </div>

        <Separator orientation="vertical" className="h-4" />

        <LiveClock />

        <Separator orientation="vertical" className="h-4" />

        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label={theme === "dark" ? t("header.theme.light") : t("header.theme.dark")}
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="size-8" asChild>
          <a href="/auth" aria-label={t("admin.nav.logout")}>
            <LogOut className="size-4" />
          </a>
        </Button>
      </div>
    </header>
  );
}
