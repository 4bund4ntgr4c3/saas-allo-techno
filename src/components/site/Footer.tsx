import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
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
    <li className="mb-2 flex items-center justify-between gap-4 border border-border bg-card px-3 py-2">
      <span className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={`size-1.5 rounded-full ${open ? "bg-emerald-500" : "bg-destructive"}`}
        />
        <span className={open ? "text-emerald-500" : "text-destructive"}>
          {open ? "Ouvert" : "Fermé"}
        </span>
      </span>
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {timeLabel}
      </span>
    </li>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <span className="at-display text-2xl">Allô Techno</span>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
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
                  className="grid size-11 place-items-center border border-border font-mono text-xs transition-colors hover:bg-foreground hover:text-background"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h2 className="at-eyebrow mb-6 text-foreground">Horaires</h2>
            <ul className="space-y-2 text-xs font-medium text-muted-foreground">
              <OpenNow />
              {COMPANY.hours.map((h) => (
                <li
                  key={h.d}
                  className={`flex justify-between gap-4 ${h.h === "Fermé" ? "text-primary" : ""}`}
                >
                  <span>{h.d}</span>
                  <span className="font-mono">{h.h}</span>
                </li>
              ))}
            </ul>
            <h2 className="at-eyebrow mt-8 mb-4 text-foreground">Services</h2>
            <ul className="space-y-2 text-xs font-medium text-muted-foreground">
              <li>
                <Link to="/devis" className="hover:text-primary">
                  Devis instantané
                </Link>
              </li>
              <li>
                <Link to="/reprise" className="hover:text-primary">
                  Reprise d'appareils
                </Link>
              </li>
              <li>
                <Link to="/garantie" className="hover:text-primary">
                  Garantie
                </Link>
              </li>
              <li>
                <Link to="/avis" className="hover:text-primary">
                  Avis clients
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-primary">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="at-eyebrow mb-6 text-foreground">Localisation</h2>
            <p className="mb-4 text-xs font-medium text-muted-foreground">{COMPANY.address}</p>
            <p className="mb-1 font-mono text-xs">{COMPANY.phone}</p>
            <p className="mb-6 font-mono text-xs text-muted-foreground">{COMPANY.email}</p>
            <Link
              to="/contact"
              className="border-b-2 border-primary pb-1 text-[10px] font-extrabold uppercase tracking-widest"
            >
              Ouvrir la carte
            </Link>
          </div>
        </div>

        <div className="mt-16 flex flex-col justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <span className="font-mono text-[10px] uppercase text-muted-foreground">
            © {new Date().getFullYear()} Allô Techno Bénin. Tous droits réservés.
          </span>
          <div className="flex gap-6">
            <Link to="/garantie" className="text-[10px] font-bold uppercase tracking-wider">
              Garanties
            </Link>
            <Link to="/mentions-legales" className="text-[10px] font-bold uppercase tracking-wider">
              Mentions légales
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
