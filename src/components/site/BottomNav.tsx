import { Link, useRouterState } from "@tanstack/react-router";
import { House, ShoppingBag, Wrench, ScanSearch, User } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  labelKey: string;
  fallback: string;
  icon: typeof House;
  badge?: number;
};

export function BottomNav() {
  const { t, locale } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const items: NavItem[] = [
    { to: "/$locale", labelKey: "nav.accueil", fallback: "Accueil", icon: House },
    { to: "/$locale/boutique", labelKey: "nav.boutique", fallback: "Boutique", icon: ShoppingBag },
    { to: "/$locale/reparations", labelKey: "nav.reparations", fallback: "Réparer", icon: Wrench },
    { to: "/$locale/suivi", labelKey: "nav.suivi", fallback: "Suivi", icon: ScanSearch },
    { to: "/mon-compte", labelKey: "nav.mon-compte", fallback: "Compte", icon: User },
  ];

  const isActive = (to: string) => {
    if (to === "/mon-compte") return pathname.startsWith("/mon-compte");
    const path = to.replace("/$locale", `/${locale}`);
    if (to === "/$locale") return pathname === `/${locale}` || pathname === `/${locale}/`;
    return pathname.startsWith(path);
  };

  return (
    <nav
      aria-label={t("nav.bottom") !== "nav.bottom" ? t("nav.bottom") : "Navigation principale"}
      className="fixed bottom-4 left-3 right-3 z-40 sm:bottom-6 sm:left-4 sm:right-4 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-[480px] grid-cols-5 rounded-2xl border border-border bg-background/95 shadow-xl backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          const label = t(item.labelKey) !== item.labelKey ? t(item.labelKey) : item.fallback;
          return (
            <Link
              key={item.to}
              to={item.to}
              {...(item.to.includes("$locale") ? { params: { locale } } : {})}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 px-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="relative">
                <Icon className={cn("size-5", active && "fill-primary/15")} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 font-mono text-[9px] font-bold leading-none text-primary-foreground">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </span>
              <span className="leading-none">{label}</span>
              {active && <span className="absolute inset-x-3 top-0 h-0.5 bg-primary" aria-hidden />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
