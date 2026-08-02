import { Link } from "@tanstack/react-router";
import { Menu, Moon, ShoppingBag, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { COMPANY } from "@/data/catalog";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/shop/cart";
import { useSession } from "@/hooks/useSession";

const NAV = [
  { to: "/reparations", label: "Réparations" },
  { to: "/tarifs", label: "Tarifs" },
  { to: "/boutique", label: "Boutique" },
  { to: "/suivi", label: "Suivi" },
  { to: "/entreprises", label: "Entreprises" },
  { to: "/blog", label: "Blog" },
] as const;

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("at-theme");
    const isDark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
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
  return (
    <Link
      to="/panier"
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
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="at-display text-xl">
            Allô Techno
          </Link>
          <nav aria-label="Navigation principale" className="hidden gap-6 text-sm font-medium text-muted-foreground lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden flex-col items-end sm:flex">
            <span className="at-eyebrow">{COMPANY.city}</span>
            <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="font-mono text-xs hover:text-primary">
              {COMPANY.phone}
            </a>
          </div>
          <CartButton />
          <ThemeToggle />
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link to={user ? "/mon-compte" : "/auth"}>{user ? "Mon compte" : "Connexion"}</Link>
          </Button>
          <Button asChild variant="technical" size="sm" className="hidden sm:inline-flex">
            <Link to="/reservation">Réserver</Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <button
                aria-label="Ouvrir le menu"
                className="grid size-11 place-items-center rounded-sm border border-border lg:hidden"
              >
                <Menu className="size-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="at-display text-lg">Menu</SheetTitle>
              <nav className="mt-6 flex flex-col gap-1">
                {[...NAV, { to: "/panier", label: "Panier" }, { to: "/reservation", label: "Réserver" }, { to: "/devis", label: "Devis instantané" }, { to: "/garantie", label: "Garantie" }, { to: "/reprise", label: "Reprise" }, { to: "/avis", label: "Avis clients" }, { to: "/faq", label: "FAQ" }, { to: "/contact", label: "Contact" }].map((i) => (
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
