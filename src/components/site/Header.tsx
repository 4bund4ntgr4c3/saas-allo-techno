import { Link } from "@tanstack/react-router";
import { Menu, Moon, Search, ShoppingBag, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { COMPANY } from "@/data/catalog/company";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/shop/cart";
import { useSession } from "@/hooks/useSession";
import { openSearch } from "@/lib/search-events";
import { useI18n } from "@/lib/i18n/context";
import { PushNotificationToggle } from "@/components/site/PushNotificationToggle";
import { prefetchRoute } from "@/lib/prefetch";

const TOP_LEFT = [
  { to: "/$locale/about", label: "nav.about" },
  { to: "/$locale/work-at", label: "nav.work-at" },
  { to: "/$locale/entreprises", label: "nav.entreprises" },
] as const;

const TOP_RIGHT = [
  { to: "/$locale/magasins", label: "nav.magasins" },
  { to: "/$locale/blog", label: "nav.blog" },
  { to: "/$locale/contact", label: "nav.contact" },
] as const;

const NAV = [
  { to: "/$locale/reparations", label: "nav.reparations" },
  { to: "/$locale/catalogue", label: "nav.catalogue" },
  { to: "/$locale/services", label: "nav.services" },
  { to: "/$locale/boutique", label: "nav.boutique" },
  { to: "/$locale/promotions", label: "nav.promotions" },
] as const;

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const stored = localStorage.getItem("at-theme");
    const isDark = stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("at-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? t("header.theme.light") : t("header.theme.dark")}
      className="grid size-9 place-items-center rounded-sm border border-border text-muted-foreground transition-colors hover:text-foreground"
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

function CartButton() {
  const { count, openDrawer } = useCart();
  const { t } = useI18n();
  return (
    <button
      onClick={openDrawer}
      aria-label={`${t("nav.panier")}, ${count} ${count > 1 ? t("header.cart.articles") : t("header.cart.article")}`}
      className="relative grid size-9 place-items-center rounded-sm border border-border text-muted-foreground transition-colors hover:text-foreground"
    >
      <ShoppingBag className="size-4" />
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 font-mono text-[10px] font-bold text-primary-foreground">
          {count}
        </span>
      )}
    </button>
  );
}

export function Header() {
  const { user } = useSession();
  const { t, locale } = useI18n();
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      {/* Top utility bar */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4 sm:px-6">
          <nav aria-label="Utility" className="hidden items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground md:flex">
            {TOP_LEFT.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                params={{ locale }}
                className="transition-colors hover:text-foreground"
                onMouseEnter={() => prefetchRoute(`/${locale}${item.to.replace("/$locale", "")}`)}
                onFocus={() => prefetchRoute(`/${locale}${item.to.replace("/$locale", "")}`)}
              >
                {t(item.label)}
              </Link>
            ))}
          </nav>
          <nav aria-label="Utility" className="hidden items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground md:flex">
            {TOP_RIGHT.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                params={{ locale }}
                className="transition-colors hover:text-foreground"
                onMouseEnter={() => prefetchRoute(`/${locale}${item.to.replace("/$locale", "")}`)}
                onFocus={() => prefetchRoute(`/${locale}${item.to.replace("/$locale", "")}`)}
              >
                {t(item.label)}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main nav bar */}
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="at-display text-xl">
            Allô Techno
          </Link>
          <nav
            aria-label={t("header.desktop-nav")}
            className="hidden gap-5 text-sm font-medium text-muted-foreground lg:flex"
          >
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                params={{ locale }}
                className="transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
                onMouseEnter={() => prefetchRoute(`/${locale}${item.to.replace("/$locale", "")}`)}
                onFocus={() => prefetchRoute(`/${locale}${item.to.replace("/$locale", "")}`)}
              >
                {t(item.label)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden flex-col items-end sm:flex">
            <span className="at-eyebrow">{COMPANY.city}</span>
            <a
              href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
              className="font-mono text-xs hover:text-primary"
            >
              {COMPANY.phone}
            </a>
          </div>
          <button
            onClick={openSearch}
            aria-label={t("header.search")}
            className="grid size-9 place-items-center rounded-sm border border-border text-muted-foreground transition-colors hover:text-foreground"
          >
            <Search className="size-4" />
          </button>
          <PushNotificationToggle />
          <CartButton />
          <ThemeToggle />
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link to={user ? "/mon-compte" : "/auth"}>
              {user ? t("nav.mon-compte") : t("nav.connexion")}
            </Link>
          </Button>
          <Button asChild variant="technical" size="sm" className="hidden sm:inline-flex">
            <Link
              to="/$locale/reservation"
              params={{ locale }}
              onMouseEnter={() => prefetchRoute(`/${locale}/reservation`)}
              onFocus={() => prefetchRoute(`/${locale}/reservation`)}
            >
              {t("nav.reservation")}
            </Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <button
                aria-label={t("header.open-menu")}
                className="grid size-9 place-items-center rounded-sm border border-border lg:hidden"
              >
                <Menu className="size-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="at-display text-lg">{t("header.menu")}</SheetTitle>
              <nav className="mt-6 flex flex-col gap-1" aria-label={t("header.mobile-nav")}>
                {[
                  ...NAV,
                  ...TOP_LEFT,
                  ...TOP_RIGHT.filter(
                    (r) => !(TOP_LEFT as readonly { to: string }[]).some((l) => l.to === r.to),
                  ),
                  { to: "/panier", label: t("nav.panier") },
                  { to: "/reservation", label: t("nav.reservation") },
                  {
                    to: user ? "/mon-compte" : "/auth",
                    label: user ? t("nav.mon-compte") : t("nav.connexion"),
                  },
                  { to: "/devis", label: t("nav.devis") },
                  { to: "/tarifs", label: t("nav.tarifs") },
                  { to: "/suivi", label: t("nav.suivi") },
                  { to: "/garantie", label: t("nav.garantie") },
                  { to: "/reprise", label: t("nav.reprise") },
                  { to: "/avis", label: t("nav.avis") },
                  { to: "/guides", label: t("nav.guides") },
                  { to: "/reconditionnes", label: t("nav.reconditionnes") },
                  { to: "/reclamation", label: t("nav.reclamation") },
                  { to: "/engagements", label: t("nav.engagements") },
                  { to: "/faq", label: t("nav.faq") },
                ].map((i) => (
                  <Link
                    key={i.to}
                    to={i.to}
                    className="border-b border-border py-3 text-sm font-semibold uppercase tracking-wide"
                  >
                    {i.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
