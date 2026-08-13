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
      className="grid size-9 place-items-center border border-border text-muted-foreground transition-colors hover:text-foreground"
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
      className="relative grid size-9 place-items-center border border-border text-muted-foreground transition-colors hover:text-foreground"
    >
      <ShoppingBag className="size-4" />
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center bg-primary px-1 font-mono text-[10px] font-bold text-primary-foreground">
          {count}
        </span>
      )}
    </button>
  );
}

export function Header() {
  const { user } = useSession();
  const { t, locale } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  const getLabel = (lbl: string) => {
    if (lbl.startsWith("nav.")) {
      const translated = t(lbl);
      return translated !== lbl ? translated : lbl.replace("nav.", "").toUpperCase();
    }
    return lbl;
  };

  const getHref = (path: string) => {
    if (path.startsWith("/$locale")) return path;
    return `/$locale${path.startsWith("/") ? path : `/${path}`}`;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      {/* Top utility bar */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4 sm:px-6">
          <nav
            aria-label="Utility"
            className="hidden items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground md:flex"
          >
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
          <nav
            aria-label="Utility"
            className="hidden items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground md:flex"
          >
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
            className="grid size-9 place-items-center border border-border text-muted-foreground transition-colors hover:text-foreground"
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
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/demo">{t("nav.demo")}</Link>
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

          {/* Mobile Navigation Drawer */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                aria-label={t("header.open-menu")}
                className="grid size-9 place-items-center border border-border lg:hidden text-foreground hover:bg-muted"
              >
                <Menu className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0 flex flex-col justify-between overflow-y-auto bg-card">
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <SheetTitle className="at-display text-xl font-bold">Allô Techno</SheetTitle>
                </div>

                {/* Primary Action Buttons for Mobile */}
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="technical" size="sm" className="w-full text-xs font-bold">
                    <Link
                      to="/$locale/reservation"
                      params={{ locale }}
                      onClick={() => setMobileOpen(false)}
                    >
                      {t("nav.reservation")}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-full text-xs font-bold">
                    <Link
                      to={user ? "/mon-compte" : "/auth"}
                      onClick={() => setMobileOpen(false)}
                    >
                      {user ? t("nav.mon-compte") : t("nav.connexion")}
                    </Link>
                  </Button>
                </div>

                {/* Navigation Links Grouped & Cleanly Translated */}
                <nav className="flex flex-col space-y-4" aria-label={t("header.mobile-nav")}>
                  {/* Services & Boutique */}
                  <div>
                    <span className="at-eyebrow text-[10px] text-muted-foreground uppercase tracking-widest block mb-2 font-mono">
                      Services &amp; Offres
                    </span>
                    <div className="flex flex-col border border-border divide-y divide-border bg-surface">
                      {[
                        { to: "/$locale/reparations", label: "nav.reparations" },
                        { to: "/$locale/catalogue", label: "nav.catalogue" },
                        { to: "/$locale/services", label: "nav.services" },
                        { to: "/$locale/boutique", label: "nav.boutique" },
                        { to: "/$locale/promotions", label: "nav.promotions" },
                        { to: "/$locale/reconditionnes", label: "nav.reconditionnes" },
                        { to: "/$locale/entreprises", label: "nav.entreprises" },
                      ].map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          params={{ locale }}
                          onClick={() => setMobileOpen(false)}
                          className="px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted hover:text-primary transition-colors flex items-center justify-between"
                        >
                          <span>{getLabel(item.label)}</span>
                          <span className="text-muted-foreground text-xs">&rarr;</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Espace Pro & Suivi */}
                  <div>
                    <span className="at-eyebrow text-[10px] text-muted-foreground uppercase tracking-widest block mb-2 font-mono">
                      Espace Client &amp; Suivi
                    </span>
                    <div className="flex flex-col border border-border divide-y divide-border bg-surface">
                      {[
                        { to: "/suivi", label: "nav.suivi" },
                        { to: "/devis", label: "nav.devis" },
                        { to: "/tarifs", label: "nav.tarifs" },
                        { to: "/app", label: "Portail Entreprises B2B" },
                        { to: "/demo", label: "nav.demo" },
                      ].map((item) => (
                        <Link
                          key={item.to}
                          to={getHref(item.to)}
                          params={{ locale }}
                          onClick={() => setMobileOpen(false)}
                          className="px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center justify-between"
                        >
                          <span>{getLabel(item.label)}</span>
                          <span className="text-muted-foreground text-xs">&rarr;</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* A propos & Informations */}
                  <div>
                    <span className="at-eyebrow text-[10px] text-muted-foreground uppercase tracking-widest block mb-2 font-mono">
                      À propos &amp; Support
                    </span>
                    <div className="flex flex-col border border-border divide-y divide-border bg-surface">
                      {[
                        { to: "/$locale/about", label: "nav.about" },
                        { to: "/$locale/contact", label: "nav.contact" },
                        { to: "/$locale/magasins", label: "nav.magasins" },
                        { to: "/$locale/blog", label: "nav.blog" },
                        { to: "/$locale/faq", label: "nav.faq" },
                        { to: "/$locale/guides", label: "nav.guides" },
                      ].map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          params={{ locale }}
                          onClick={() => setMobileOpen(false)}
                          className="px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          {getLabel(item.label)}
                        </Link>
                      ))}
                    </div>
                  </div>
                </nav>
              </div>

              {/* Footer Phone Info */}
              <div className="p-4 border-t border-border bg-surface text-center text-xs text-muted-foreground space-y-1">
                <span className="at-eyebrow text-[10px] block">{COMPANY.city}</span>
                <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="font-mono text-sm font-bold text-primary block">
                  {COMPANY.phone}
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
