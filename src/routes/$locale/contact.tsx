import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { CtaBand, MobileMoneyBar } from "@/components/site/Blocks";
import { LeadForm } from "@/components/site/LeadForm";
import { COMPANY } from "@/data/catalog";
import { ErrorRoute } from "@/components/ErrorRoute";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";

export const Route = createFileRoute("/$locale/contact")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    return {
      meta: [
        { title: translate(locale, "contact.meta.title") },
        { name: "description", content: translate(locale, "contact.meta.description") },
        { property: "og:title", content: translate(locale, "contact.og.title") },
        { property: "og:description", content: translate(locale, "contact.og.description") },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: ErrorRoute,
  component: Contact,
});

function Contact() {
  const tel = COMPANY.phone.replace(/\s/g, "");
  const wa = COMPANY.whatsapp.replace(/\D/g, "");
  const map = `https://www.openstreetmap.org/export/embed.html?bbox=${COMPANY.lng - 0.01}%2C${COMPANY.lat - 0.01}%2C${COMPANY.lng + 0.01}%2C${COMPANY.lat + 0.01}&layer=mapnik&marker=${COMPANY.lat}%2C${COMPANY.lng}`;
  const { t } = useI18n();

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">{t("contact.eyebrow")}</span>
          <h1 className="at-display text-4xl md:text-6xl">{t("contact.title")}</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">{t("contact.intro")}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div className="space-y-px border border-border bg-border">
            <div className="flex gap-4 bg-card p-6">
              <MapPin className="size-5 shrink-0 text-primary" />
              <div>
                <span className="at-eyebrow">{t("contact.address")}</span>
                <p className="mt-1 text-sm">{COMPANY.address}</p>
              </div>
            </div>
            <div className="flex gap-4 bg-card p-6">
              <Phone className="size-5 shrink-0 text-primary" />
              <div>
                <span className="at-eyebrow">{t("contact.phone")}</span>
                <p className="mt-1 font-mono text-sm">
                  <a href={`tel:${tel}`} className="hover:text-primary">
                    {COMPANY.phone}
                  </a>
                </p>
              </div>
            </div>
            <div className="flex gap-4 bg-card p-6">
              <MessageCircle className="size-5 shrink-0 text-primary" />
              <div>
                <span className="at-eyebrow">{t("contact.whatsapp")}</span>
                <p className="mt-1 text-sm">
                  <a
                    href={`https://wa.me/${wa}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-primary"
                  >
                    {t("contact.startChat")}
                  </a>
                </p>
              </div>
            </div>
            <div className="flex gap-4 bg-card p-6">
              <Mail className="size-5 shrink-0 text-primary" />
              <div>
                <span className="at-eyebrow">{t("contact.email")}</span>
                <p className="mt-1 text-sm">
                  <a href={`mailto:${COMPANY.email}`} className="hover:text-primary">
                    {COMPANY.email}
                  </a>
                </p>
              </div>
            </div>
            <div className="flex gap-4 bg-card p-6">
              <Clock className="size-5 shrink-0 text-primary" />
              <div className="w-full">
                <span className="at-eyebrow">{t("contact.hours")}</span>
                <ul className="mt-2 space-y-1 text-xs font-medium text-muted-foreground">
                  {COMPANY.hours.map((h) => {
                    const hourKey = h.d.includes("Lundi")
                      ? t("contact.hours.monfri")
                      : h.d.includes("Samedi")
                        ? t("contact.hours.sat")
                        : t("contact.hours.sun");
                    return (
                      <li key={h.d} className="flex justify-between gap-6">
                        <span>{hourKey}</span>
                        <span className="font-mono">
                          {h.h === "Fermé" ? t("contact.hours.closed") : h.h}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>

          <div className="border border-border">
            <iframe
              title={t("contact.mapTitle")}
              src={map}
              loading="lazy"
              className="h-full min-h-96 w-full"
            />
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-7xl px-4 sm:px-6">
          <MobileMoneyBar />
        </div>
      </section>

      <section className="border-t border-border py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <span className="at-eyebrow mb-4 block">{t("contact.form.eyebrow")}</span>
            <h2 className="at-display text-3xl">{t("contact.form.title")}</h2>
            <p className="mt-4 max-w-md text-sm text-muted-foreground">{t("contact.form.text")}</p>
          </div>
          <LeadForm
            source="contact"
            title={t("contact.form.formTitle")}
            description={t("contact.form.description")}
            successText={t("contact.form.success")}
          />
        </div>
      </section>

      <CtaBand />
    </>
  );
}
