import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Phone, Mail } from "lucide-react";
import { COMPANY } from "@/data/catalog/company";
import { OPEN_SCHEDULE, isOpenNow } from "@/lib/reservation-schema";
import { useI18n } from "@/lib/i18n/context";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";
import { prefetchRoute } from "@/lib/prefetch";

function OpenNow() {
  const { t, locale } = useI18n();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const open = isOpenNow(now);
  const schedule = OPEN_SCHEDULE[now.getDay()];
  const timeLabel = now.toLocaleTimeString(locale === "en" ? "en-GB" : "fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const next = schedule
    ? open
      ? t("status.close-at", [schedule[1]])
      : t("status.open-at", [schedule[0]])
    : t("status.reopens-monday");

  return (
    <div className="inline-flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 shadow-sm transition-all duration-200 hover:shadow-md">
      <span className="relative flex size-2">
        <span
          className={`absolute inline-flex size-full animate-ping rounded-full opacity-75 ${
            open ? "bg-success" : "bg-destructive"
          }`}
        />
        <span
          className={`relative inline-flex size-2 rounded-full ${
            open ? "bg-success" : "bg-destructive"
          }`}
        />
      </span>
      <span
        className={`text-[11px] font-bold uppercase tracking-wider ${
          open ? "text-success" : "text-destructive"
        }`}
      >
        {open ? t("status.open") : t("status.closed")}
      </span>
      <span className="h-3 w-px bg-border" />
      <span className="text-[11px] text-muted-foreground">{next}</span>
      <span className="h-3 w-px bg-border" />
      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <Clock className="size-3" />
        {timeLabel}
      </span>
    </div>
  );
}

export function Footer() {
  const { t, locale } = useI18n();
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 md:grid-cols-5">
          {/* Brand + Contact (merged) */}
          <div className="md:col-span-2">
            <span className="at-display text-2xl">Allô Techno</span>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {t("footer.description")}
            </p>
            <ul className="mt-6 space-y-2.5 text-xs font-medium text-muted-foreground">
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
            <div className="mt-6 flex gap-3">
              {["FB", "IG", "WA"].map((s) => (
                <a
                  key={s}
                  href={s === "WA" ? `https://wa.me/${COMPANY.whatsapp.replace(/\D/g, "")}` : "#"}
                  aria-label={s === "WA" ? "WhatsApp" : s === "FB" ? "Facebook" : "Instagram"}
                  className="grid size-10 place-items-center rounded-lg border border-border font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-all duration-200 hover:border-primary hover:bg-primary hover:text-primary-foreground"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h2 className="at-eyebrow mb-5 text-foreground">{t("footer.services")}</h2>
            <ul
              aria-label={t("footer.services")}
              className="space-y-2.5 text-xs font-medium text-muted-foreground"
            >
              {[
                { to: "/$locale/reparations", label: t("footer.nos-reparations") },
                { to: "/$locale/tarifs", label: t("footer.grille-tarifaire") },
                { to: "/$locale/devis", label: t("nav.devis") },
                { to: "/$locale/reservation", label: t("footer.prendre-rendez-vous") },
                { to: "/$locale/services", label: t("nav.services") },
                { to: "/$locale/promotions", label: t("nav.promotions") },
                { to: "/$locale/magasins", label: t("nav.magasins") },
                { to: "/$locale/reprise", label: t("footer.reprise-appareils") },
                { to: "/$locale/garantie", label: t("footer.garanties") },
                { to: "/$locale/reconditionnes", label: t("nav.reconditionnes") },
                { to: "/$locale/guides", label: t("nav.guides") },
                { to: "/$locale/reclamation", label: t("nav.reclamation") },
                { to: "/$locale/engagements", label: t("nav.engagements") },
                { to: "/$locale/quartiers", label: t("nav.quartiers") },
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

          {/* Entreprises */}
          <div>
            <h2 className="at-eyebrow mb-5 text-foreground">{t("footer.entreprises")}</h2>
            <ul
              aria-label={t("footer.entreprises")}
              className="space-y-2.5 text-xs font-medium text-muted-foreground"
            >
              {[
                { to: "/$locale/entreprises", label: t("footer.solutions-b2b") },
                { to: "/$locale/suivi", label: t("footer.suivre-reparation") },
                { to: "/$locale/avis", label: t("nav.avis") },
                { to: "/$locale/faq", label: t("nav.faq") },
                { to: "/$locale/blog", label: t("nav.blog") },
                { to: "/$locale/changelog", label: t("nav.changelog") },
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

          {/* Boutique */}
          <div>
            <h2 className="at-eyebrow mb-5 text-foreground">{t("nav.boutique")}</h2>
            <ul
              aria-label={t("nav.boutique")}
              className="space-y-2.5 text-xs font-medium text-muted-foreground"
            >
              {[
                { to: "/$locale/boutique", label: t("nav.store") },
                { to: "/$locale/reconditionnes", label: t("nav.reconditionnes") },
                { to: "/$locale/panier", label: t("nav.panier") },
                { to: "/$locale/contact", label: t("nav.contact") },
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
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:px-6 md:flex-row">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            © {new Date().getFullYear()} {t("footer.rights")}
          </span>
          <OpenNow />
          <div className="flex items-center gap-4">
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
