import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, MapPin, MessageCircle, Phone, Store } from "lucide-react";
import { CtaBand } from "@/components/site/Blocks";
import { Button } from "@/components/ui/button";
import { COMPANY } from "@/data/catalog/company";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";
import { localeSeo } from "@/lib/seo";

export const Route = createFileRoute("/$locale/magasins")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const suffix = "/magasins";
    const seo = localeSeo(locale, suffix);
    return {
      meta: [
        { title: translate(locale, "magasins.meta.title") },
        { name: "description", content: translate(locale, "magasins.meta.description") },
        { property: "og:title", content: translate(locale, "magasins.meta.og.title") },
        {
          property: "og:description",
          content: translate(locale, "magasins.meta.og.description"),
        },
        ...seo.meta,
      ],
      links: [...seo.links],
    };
  },
  component: Magasins,
});

function Magasins() {
  const { locale, t } = useI18n();
  const mapSrc = `https://maps.google.com/maps?q=${COMPANY.lat},${COMPANY.lng}&z=15&output=embed`;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${COMPANY.lat},${COMPANY.lng}`;
  const tel = COMPANY.phone.replace(/\s/g, "");
  const wa = `https://wa.me/${COMPANY.whatsapp.replace(/\D/g, "")}`;

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">{t("magasins.eyebrow")}</span>
          <h1 className="at-display text-4xl md:text-6xl">{t("magasins.title")}</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">{t("magasins.hero")}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-start gap-px border border-border bg-border lg:grid-cols-2">
            <div className="bg-card p-8">
              <div className="flex items-center gap-3">
                <Store className="size-6 text-primary" strokeWidth={1.5} />
                <h2 className="at-display text-2xl">{COMPANY.name}</h2>
              </div>
              <dl className="mt-8 space-y-5 text-sm">
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.5} />
                  <div>
                    <dt className="at-eyebrow">{t("magasins.address")}</dt>
                    <dd className="mt-1">{COMPANY.address}</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Phone className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.5} />
                  <div>
                    <dt className="at-eyebrow">{t("magasins.phone")}</dt>
                    <dd className="mt-1">
                      <a href={`tel:${tel}`} className="font-mono hover:text-primary">
                        {COMPANY.phone}
                      </a>
                    </dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MessageCircle
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    strokeWidth={1.5}
                  />
                  <div>
                    <dt className="at-eyebrow">{t("magasins.whatsapp")}</dt>
                    <dd className="mt-1">
                      <a
                        href={wa}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono hover:text-primary"
                      >
                        {COMPANY.whatsapp}
                      </a>
                    </dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.5} />
                  <div>
                    <dt className="at-eyebrow">{t("magasins.hours")}</dt>
                    <dd className="mt-1">
                      <ul className="space-y-1">
                        {COMPANY.hours.map((h) => (
                          <li key={h.d} className="flex justify-between gap-6">
                            <span>{h.d}</span>
                            <span className="font-mono text-muted-foreground">{h.h}</span>
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                </div>
              </dl>
              <p className="mt-6 font-mono text-[10px] uppercase tracking-wider text-primary">
                {t("magasins.pickup")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild variant="technical">
                  <Link to="/$locale/reparations" params={{ locale }}>
                    {t("magasins.cta")}
                  </Link>
                </Button>
                <Button asChild variant="technicalOutline">
                  <a href={directions} target="_blank" rel="noreferrer">
                    {t("magasins.directions")}
                  </a>
                </Button>
              </div>
            </div>

            <iframe
              title={t("magasins.map.alt")}
              src={mapSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[420px] w-full border-0 lg:h-full"
            />
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
