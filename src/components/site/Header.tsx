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
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";

const NAV = [
  { to: "/$locale/reparations", label: "nav.reparations" },
  { to: "/$locale/catalogue", label: "nav.catalogue" },
  { to: "/$locale/tarifs", label: "nav.tarifs" },
  { to: "/$locale/boutique", label: "nav.boutique" },
  { to: "/$locale/suivi", label: "nav.suivi" },
  { to: "/$locale/entreprises", label: "nav.entreprises" },
  { to: "/$locale/blog", label: "nav.blog" },
] as const;

function ThemeToggle() {
  const [dark, setDark] = useState(false);

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
      aria-label={dark ? "Activer le mode clair" : "Activer le mode sombre"}
      className="grid size-11 place-items-center rounded-sm border border-border text-muted-foreground transition-colors hover:text-foreground"
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

function CartButton() {
  const { count } = useCart();
  const { locale } = useI18n();
  return (
    <Link
      to="/$locale/panier"
      params={{ locale }}
      aria-label={`Panier, ${count} article${count > 1 ? "s" : ""}`}
      className="relative grid size-11 place-items-center rounded-sm border border-border text-muted-foreground transition-colors hover:text-foreground"
    >
      <ShoppingBag className="size-4" />
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 font-mono text-[10px] font-bold text-primary-foreground">
          {count}
        </span>
      )}
    </Link>
  );
}

export function Header() {
  const { user } = useSession();
  const { t, locale } = useI18n();
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="at-display text-xl">
            Allô Techno
          </Link>
          <nav
            aria-label={t("header.desktop-nav")}
            className="hidden gap-6 text-sm font-medium text-muted-foreground lg:flex"
          >
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                params={{ locale }}
                className="transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {t(item.label)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
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
            className="grid size-11 place-items-center rounded-sm border border-border text-muted-foreground transition-colors hover:text-foreground"
          >
            <Search className="size-4" />
          </button>
          <CartButton />
          <ThemeToggle />
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link to={user ? "/mon-compte" : "/auth"}>
              {user ? t("nav.mon-compte") : t("nav.connexion")}
            </Link>
          </Button>
          <Button asChild variant="technical" size="sm" className="hidden sm:inline-flex">
            <Link to="/$locale/reservation" params={{ locale }}>
              {t("nav.reservation")}
            </Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <button
                aria-label={t("header.open-menu")}
                className="grid size-11 place-items-center rounded-sm border border-border lg:hidden"
              >
                <Menu className="size-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="at-display text-lg">{t("header.menu")}</SheetTitle>
              <nav className="mt-6 flex flex-col gap-1" aria-label={t("header.mobile-nav")}>
                {[
                  ...NAV,
                  { to: "/panier", label: t("nav.panier") },
                  { to: "/reservation", label: t("nav.reservation") },
                  {
                    to: user ? "/mon-compte" : "/auth",
                    label: user ? t("nav.mon-compte") : t("nav.connexion"),
                  },
                  { to: "/devis", label: t("nav.devis") },
                  { to: "/garantie", label: t("nav.garantie") },
                  { to: "/reprise", label: t("nav.reprise") },
                  { to: "/avis", label: t("nav.avis") },
                  { to: "/faq", label: t("nav.faq") },
                  { to: "/contact", label: t("nav.contact") },
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
