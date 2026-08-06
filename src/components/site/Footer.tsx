import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Phone, Mail } from "lucide-react";
import { COMPANY } from "@/data/catalog";
import { OPEN_SCHEDULE, isOpenNow } from "@/lib/reservation-schema";

function OpenNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const open = isOpenNow(now);
  const schedule = OPEN_SCHEDULE[now.getDay()];
  const timeLabel = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const next = schedule
    ? open
      ? `Fermeture ${schedule[1]}`
      : `Ouverture ${schedule[0]}`
    : "Rouvre lundi 08:30";

  return (
    <div className="inline-flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 shadow-sm transition-all duration-200 hover:shadow-md">
      {/* Status dot with glow */}
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

      {/* Status text */}
      <span
        className={`text-[11px] font-bold uppercase tracking-wider ${
          open ? "text-success" : "text-destructive"
        }`}
      >
        {open ? "Ouvert" : "Fermé"}
      </span>

      {/* Separator */}
      <span className="h-3 w-px bg-border" />

      {/* Next event */}
      <span className="text-[11px] text-muted-foreground">{next}</span>

      {/* Separator */}
      <span className="h-3 w-px bg-border" />

      {/* Time */}
      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <Clock className="size-3" />
        {timeLabel}
      </span>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      {/* Main footer content */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 md:grid-cols-5">
          {/* Brand column */}
          <div className="md:col-span-2">
            <span className="at-display text-2xl">Allô Techno</span>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Expertise technique certifiée à {COMPANY.city}. Nous redonnons vie à vos outils de
              travail et de divertissement : smartphones, tablettes, MacBook, iMac, consoles et
              montres connectées.
            </p>
            <div className="mt-8 flex gap-3">
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

          {/* Services column */}
          <div>
            <h2 className="at-eyebrow mb-5 text-foreground">Services</h2>
            <ul className="space-y-2.5 text-xs font-medium text-muted-foreground">
              {[
                { to: "/reparations", label: "Nos réparations" },
                { to: "/tarifs", label: "Grille tarifaire" },
                { to: "/devis", label: "Devis instantané" },
                { to: "/reservation", label: "Prendre rendez-vous" },
                { to: "/reprise", label: "Reprise d'appareils" },
                { to: "/garantie", label: "Garantie" },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="inline-flex items-center gap-1 transition-colors duration-200 hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Entreprises column */}
          <div>
            <h2 className="at-eyebrow mb-5 text-foreground">Entreprises</h2>
            <ul className="space-y-2.5 text-xs font-medium text-muted-foreground">
              {[
                { to: "/entreprises", label: "Solutions B2B" },
                { to: "/suivi", label: "Suivre une réparation" },
                { to: "/avis", label: "Avis clients" },
                { to: "/faq", label: "Questions fréquentes" },
                { to: "/blog", label: "Blog & conseils" },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="inline-flex items-center gap-1 transition-colors duration-200 hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact column */}
          <div>
            <h2 className="at-eyebrow mb-5 text-foreground">Contact</h2>
            <ul className="space-y-3 text-xs font-medium text-muted-foreground">
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
            <Link
              to="/contact"
              className="mt-6 inline-flex items-center gap-1.5 border-b-2 border-primary pb-0.5 text-[10px] font-extrabold uppercase tracking-widest text-foreground transition-colors duration-200 hover:border-foreground hover:text-primary"
            >
              Ouvrir la carte
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:px-6 md:flex-row">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            © {new Date().getFullYear()} Allô Techno Bénin. Tous droits réservés.
          </span>
          <OpenNow />
          <div className="flex gap-6">
            <Link
              to="/garantie"
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              Garanties
            </Link>
            <Link
              to="/mentions-legales"
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              Mentions légales
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
