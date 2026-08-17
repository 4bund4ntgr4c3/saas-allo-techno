import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Phone, Mail } from "lucide-react";
import { COMPANY, formatFcfa } from "@/data/catalog/company";
import { OPEN_SCHEDULE, isOpenNow } from "@/lib/reservation-schema";
import { useI18n } from "@/lib/i18n/context";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";
import { NewsletterForm } from "@/components/site/NewsletterForm";
import { Button } from "@/components/ui/button";
import { prefetchRoute } from "@/lib/prefetch";

function OpenNow() {
  const { t, locale } = useI18n();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const open = now ? isOpenNow(now) : false;
  const schedule = now ? OPEN_SCHEDULE[now.getDay()] : undefined;
  const timeLabel = now
    ? now.toLocaleTimeString(locale === "en" ? "en-GB" : "fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "\u00A0";
  const next = schedule
    ? open
      ? t("status.close-at", [schedule[1]])
      : t("status.open-at", [schedule[0]])
    : t("status.reopens-monday");

  return (
    <div className="inline-flex flex-wrap items-center justify-center gap-2 max-w-full border border-border bg-card px-3 py-2 shadow-sm transition-all duration-200 hover:shadow-md text-center">
      <div className="inline-flex items-center gap-2">
        <span className="relative flex size-2">
          <span
            className={`absolute inline-flex size-full animate-ping opacity-75 ${
              open ? "bg-success" : "bg-destructive"
            }`}
          />
          <span
            className={`relative inline-flex size-2 ${open ? "bg-success" : "bg-destructive"}`}
          />
        </span>
        <span
          className={`text-[11px] font-bold uppercase tracking-wider ${
            open ? "text-success" : "text-destructive"
          }`}
        >
          {open ? t("status.open") : t("status.closed")}
        </span>
      </div>
      <span className="hidden sm:inline-block h-3 w-px bg-border" />
      <span className="text-[11px] text-muted-foreground">{next}</span>
      <span className="hidden sm:inline-block h-3 w-px bg-border" />
      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <Clock className="size-3" />
        {timeLabel}
      </span>
    </div>
  );
}

export function Footer() {
  const { t, locale } = useI18n();

  const isEn = locale === "en";

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 md:grid-cols-12">
          {/* Brand + Contact (Col 1-4) */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className="at-display text-2xl font-black tracking-tight">Allô Techno</span>
              <span className="text-[10px] font-mono font-bold uppercase bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded">
                Africa Hub
              </span>
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
              {t("footer.description")}
            </p>
            <ul className="space-y-2.5 text-xs font-medium text-muted-foreground pt-1">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
                <span>{COMPANY.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="size-3.5 shrink-0 text-primary" />
                <span className="font-mono">{COMPANY.phone}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="size-3.5 shrink-0 text-primary" />
                <span className="font-mono text-muted-foreground">{COMPANY.email}</span>
              </li>
            </ul>
            <div className="flex gap-2.5 pt-2">
              {["FB", "IG", "WA"].map((s) => (
                <a
                  key={s}
                  href={s === "WA" ? `https://wa.me/${COMPANY.whatsapp.replace(/\D/g, "")}` : "#"}
                  aria-label={s === "WA" ? "WhatsApp" : s === "FB" ? "Facebook" : "Instagram"}
                  className="grid size-9 place-items-center border border-border font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-all duration-200 hover:border-primary hover:bg-primary hover:text-primary-foreground rounded-lg"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* 1. Réparations & Dépannage (Col 5-6) */}
          <div className="md:col-span-2">
            <h2 className="at-eyebrow mb-4 text-foreground font-bold">
              {isEn ? "Repairs & SAV" : "Réparations & SAV"}
            </h2>
            <ul className="space-y-2 text-xs font-medium text-muted-foreground">
              {[
                {
                  to: "/$locale/reparations",
                  label: isEn ? "All Repairs" : "Toutes les Réparations",
                },
                { to: "/$locale/devis", label: isEn ? "Instant Quote" : "Devis Express en Ligne" },
                {
                  to: "/$locale/reservation",
                  label: isEn ? "Book Workshop Visit" : "Prendre Rendez-vous",
                },
                {
                  to: "/$locale/depannage-domicile",
                  label: isEn ? "VIP Home Repair" : "Dépannage à Domicile",
                },
                {
                  to: "/$locale/suivi",
                  label: isEn ? "Track Repair Status" : "Suivre ma Réparation",
                },
                {
                  to: "/$locale/premiers-secours",
                  label: isEn ? "First Aid & Spills" : "Premiers Secours SAV",
                },
                { to: "/$locale/tarifs", label: isEn ? "Price Catalog" : "Grille Tarifaire" },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    params={{ locale }}
                    className="inline-flex items-center gap-1 transition-colors duration-200 hover:text-primary"
                    onMouseEnter={() =>
                      prefetchRoute(`/${locale}${link.to.replace("/$locale", "")}`)
                    }
                    onFocus={() => prefetchRoute(`/${locale}${link.to.replace("/$locale", "")}`)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 2. Boutique, Vente & Offres (Col 7-8) */}
          <div className="md:col-span-2">
            <h2 className="at-eyebrow mb-4 text-foreground font-bold">
              {isEn ? "Shop & Circular Economy" : "Boutique & Reconditionné"}
            </h2>
            <ul className="space-y-2 text-xs font-medium text-muted-foreground">
              {[
                { to: "/$locale/boutique", label: isEn ? "Online Store" : "Boutique & Pièces" },
                {
                  to: "/$locale/reconditionnes",
                  label: isEn ? "Refurbished PC & Mac" : "PC & Mac Reconditionnés",
                },
                {
                  to: "/$locale/marketplace-sequestre",
                  label: isEn ? "Escrow Certified Marketplace" : "Marketplace Séquestre",
                },
                { to: "/$locale/reprise", label: isEn ? "Trade-in Cash" : "Rachat & Reprise Cash" },
                {
                  to: "/$locale/abonnements",
                  label: isEn ? "Serenity Subscriptions" : "Abonnements Sérénité",
                },
                {
                  to: "/$locale/parrainage",
                  label: isEn ? "Referral & Earn MoMo" : "Parrainage Mobile Money",
                },
                {
                  to: "/$locale/promotions",
                  label: isEn ? "Current Deals" : "Bons Plans & Promos",
                },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    params={{ locale }}
                    className="inline-flex items-center gap-1 transition-colors duration-200 hover:text-primary"
                    onMouseEnter={() =>
                      prefetchRoute(`/${locale}${link.to.replace("/$locale", "")}`)
                    }
                    onFocus={() => prefetchRoute(`/${locale}${link.to.replace("/$locale", "")}`)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Entreprises & Solutions B2B (Col 9-10) */}
          <div className="md:col-span-2">
            <h2 className="at-eyebrow mb-4 text-foreground font-bold">
              {isEn ? "B2B & IT Teams" : "Solutions Entreprises"}
            </h2>
            <ul className="space-y-2 text-xs font-medium text-muted-foreground">
              {[
                {
                  to: "/$locale/entreprises",
                  label: isEn ? "B2B Maintenance SLA" : "Maintenance de Flotte SLA",
                },
                {
                  to: "/$locale/catalogue",
                  label: isEn ? "Parts Catalog" : "Catalogue Pièces Détachées",
                },
                {
                  to: "/$locale/outils",
                  label: isEn ? "Toolbox & Drivers" : "Boîte à Outils & Pilotes",
                },
                {
                  to: "/$locale/guide-esd",
                  label: isEn ? "ESD Safety Guide" : "Guide Sécurité ESD",
                },
                {
                  to: "/$locale/guides",
                  label: isEn ? "Self-Repair Guides" : "Tutoriels & Guides",
                },
                {
                  to: "/$locale/engagements",
                  label: isEn ? "CSR & Commitments" : "Engagements & Écologie",
                },
                {
                  to: "/$locale/garantie",
                  label: isEn ? "Warranty Terms" : "Conditions de Garantie",
                },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    params={{ locale }}
                    className="inline-flex items-center gap-1 transition-colors duration-200 hover:text-primary"
                    onMouseEnter={() =>
                      prefetchRoute(`/${locale}${link.to.replace("/$locale", "")}`)
                    }
                    onFocus={() => prefetchRoute(`/${locale}${link.to.replace("/$locale", "")}`)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 4. Société & Contact (Col 11-12) */}
          <div className="md:col-span-2">
            <h2 className="at-eyebrow mb-4 text-foreground font-bold">
              {isEn ? "About & Connect" : "Allô Techno Hub"}
            </h2>
            <ul className="space-y-2 text-xs font-medium text-muted-foreground">
              {[
                { to: "/$locale/about", label: isEn ? "About Us" : "Notre Histoire & Atelier" },
                { to: "/$locale/magasins", label: isEn ? "Our Workshops" : "Nos Points d'Atelier" },
                {
                  to: "/$locale/quartiers",
                  label: isEn ? "Coverage Areas" : "Zones Desservies Cotonou",
                },
                { to: "/$locale/contact", label: isEn ? "Contact Support" : "Nous Contacter" },
                { to: "/$locale/avis", label: isEn ? "Customer Reviews" : "Avis Clients Vérifiés" },
                {
                  to: "/$locale/work-at",
                  label: isEn ? "Careers / Work At" : "Recrutement & Carrières",
                },
                { to: "/$locale/blog", label: isEn ? "Tech Blog" : "Blog & Actualités Tech" },
                {
                  to: "/$locale/changelog",
                  label: isEn ? "Changelog & Updates" : "Changelog & Mises à Jour",
                },
                {
                  to: "/$locale/mentions-legales",
                  label: isEn ? "Legal Notice" : "Mentions Légales & RGPD",
                },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    params={{ locale }}
                    className="inline-flex items-center gap-1 transition-colors duration-200 hover:text-primary"
                    onMouseEnter={() =>
                      prefetchRoute(`/${locale}${link.to.replace("/$locale", "")}`)
                    }
                    onFocus={() => prefetchRoute(`/${locale}${link.to.replace("/$locale", "")}`)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer CTA & Newsletter */}
        <div className="mt-12 border-t border-border/60 pt-12">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            {/* CTA Section */}
            <div className="space-y-4 lg:col-span-6">
              <h2 className="at-display text-2xl font-bold text-foreground md:text-3xl">
                {t("blocks.cta.title")}
              </h2>
              <p className="max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {t("blocks.cta.text", [COMPANY.city, formatFcfa(50000)])}
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Button asChild size="sm">
                  <Link to="/$locale/reservation" params={{ locale }}>
                    {t("blocks.cta.reserve")}
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/$locale/devis" params={{ locale }}>
                    {t("blocks.cta.devis")}
                  </Link>
                </Button>
              </div>
            </div>

            {/* Newsletter Form */}
            <div className="lg:col-span-6">
              <NewsletterForm />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:px-6 md:flex-row">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            © {new Date().getFullYear()} Allô Techno Africa. {t("footer.rights")}
          </span>
          <OpenNow />
          <div className="flex flex-wrap items-center justify-center gap-3 text-center sm:gap-4">
            <Link
              to="/$locale/garantie"
              params={{ locale }}
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-colors duration-200 hover:text-foreground"
              onMouseEnter={() => prefetchRoute(`/${locale}/garantie`)}
              onFocus={() => prefetchRoute(`/${locale}/garantie`)}
            >
              {t("footer.garanties")}
            </Link>
            <Link
              to="/$locale/mentions-legales"
              params={{ locale }}
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-colors duration-200 hover:text-foreground"
              onMouseEnter={() => prefetchRoute(`/${locale}/mentions-legales`)}
              onFocus={() => prefetchRoute(`/${locale}/mentions-legales`)}
            >
              {t("footer.mentions-legales")}
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}
