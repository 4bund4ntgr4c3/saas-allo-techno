import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Check, Clock, Package, ShieldCheck } from "lucide-react";
import { CtaBand, SectionHeader } from "@/components/site/Blocks";
import { PageBreadcrumb } from "@/components/site/PageBreadcrumb";
import { brandName, deviceBySlug, devicesOfBrand, formatFcfa, type Device } from "@/data/catalog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import "@/lib/i18n/segments/appareil";
import type { Locale } from "@/lib/i18n/locales";
import { localeSeo } from "@/lib/seo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/$locale/appareil/$slug")({
  loader: ({ params }): { device: Device; siblings: Device[] } => {
    const device = deviceBySlug(params.slug);
    if (!device) throw notFound();
    return {
      device,
      siblings: devicesOfBrand(device.brand).filter((d) => d.slug !== device.slug),
    };
  },
  head: ({ params, loaderData }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    if (!loaderData) {
      return {
        meta: [
          { title: translate(locale, "appareil.meta.notfound.title") },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const d = loaderData.device;
    const min = Math.min(...d.faults.map((f) => f.price));
    const faults = d.faults
      .slice(0, 3)
      .map((f) => translate(locale, f.label).toLowerCase())
      .join(", ");
    const suffix = `/appareil/${params.slug}`;
    const seo = localeSeo(locale, suffix);
    return {
      meta: [
        { title: translate(locale, "appareil.meta.title", [d.name]) },
        {
          name: "description",
          content: translate(locale, "appareil.meta.description", [
            d.name,
            faults,
            formatFcfa(min),
          ]),
        },
        { property: "og:title", content: translate(locale, "appareil.meta.og.title", [d.name]) },
        {
          property: "og:description",
          content: translate(locale, "appareil.meta.og.description", [d.faults.length]),
        },
        { property: "og:type", content: "product" },
        ...seo.meta,
      ],
      links: [...seo.links],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            serviceType: translate(locale, "appareil.serviceType", [d.name]),
            provider: { "@type": "LocalBusiness", name: "Allô Techno" },
            areaServed: "Abomey-Calavi, Bénin",
            offers: d.faults.map((f) => ({
              "@type": "Offer",
              name: translate(locale, f.label),
              price: f.price,
              priceCurrency: "XOF",
            })),
          }),
        },
      ],
    };
  },
  component: DevicePage,
});

function DevicePage() {
  const { device, siblings } = Route.useLoaderData() as { device: Device; siblings: Device[] };
  const min = Math.min(...device.faults.map((f) => f.price));
  const { locale, t } = useI18n();

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="at-eyebrow">{t("appareil.eyebrow")}</span>
            <PageBreadcrumb items={[{ to: `/$locale/catalogue`, label: t("nav.catalogue") }, { label: device.name }]} />
          </div>
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <h1 className="at-display text-4xl md:text-6xl">{device.name}</h1>
              <p className="mt-4 font-mono text-xs uppercase text-muted-foreground">
                {brandName(device.brand)} · {t(device.category)} · {device.year}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="technical" size="lg">
                <Link
                  to="/$locale/reservation"
                  params={{ locale }}
                  search={{ device: device.slug }}
                >
                  {t("appareil.reserve")}
                </Link>
              </Button>
              <Button asChild variant="technicalOutline" size="lg">
                <Link to="/$locale/devis" params={{ locale }}>
                  {t("appareil.quote")}
                </Link>
              </Button>
            </div>
          </div>
          <p className="mt-8 font-mono text-sm">
            {t("appareil.from")} <span className="text-primary">{formatFcfa(min)}</span>
          </p>
        </div>
      </section>

      {/* Pannes & tarifs */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow={t("appareil.faults.eyebrow")}
            title={t("appareil.faults.title")}
            text={t("appareil.faults.text")}
          />
          <div className="overflow-hidden border border-border">
            <div className="hidden grid-cols-12 gap-4 border-b border-border bg-surface p-4 md:grid">
              <span className="at-eyebrow col-span-5">{t("appareil.col.intervention")}</span>
              <span className="at-eyebrow col-span-2">{t("appareil.col.delay")}</span>
              <span className="at-eyebrow col-span-2">{t("appareil.col.warranty")}</span>
              <span className="at-eyebrow col-span-2">{t("appareil.col.part")}</span>
              <span className="at-eyebrow col-span-1 text-right">{t("appareil.col.price")}</span>
            </div>
            {device.faults.map((f) => (
              <div
                key={f.slug}
                className="grid gap-2 border-b border-border p-5 transition-colors last:border-0 hover:bg-surface md:grid-cols-12 md:gap-4"
              >
                <span className="font-bold md:col-span-5">{t(f.label)}</span>
                <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground md:col-span-2">
                  <Clock className="size-3.5" /> {t(f.duration)}
                </span>
                <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground md:col-span-2">
                  <ShieldCheck className="size-3.5" /> {t(f.warranty)}
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-muted-foreground md:col-span-2">
                  <Package className="size-3.5 shrink-0" /> {t(f.part)}
                </span>
                <span className="font-mono text-sm font-medium text-primary md:col-span-1 md:text-right">
                  {formatFcfa(f.price)}
                </span>
              </div>
            ))}
          </div>

          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-success" />{" "}
                {t(`appareil.points.${["one", "two", "three"][i]}`)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ appareil */}
      <section className="border-t border-border bg-surface py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHeader
            eyebrow={t("appareil.faq.eyebrow")}
            title={t("appareil.faq.title", [device.name])}
          />
          <Accordion type="single" collapsible className="border border-border bg-card">
            <AccordionItem value="1" className="px-6">
              <AccordionTrigger>{t("appareil.faq.q1")}</AccordionTrigger>
              <AccordionContent>{t("appareil.faq.a1")}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="2" className="px-6">
              <AccordionTrigger>{t("appareil.faq.q2")}</AccordionTrigger>
              <AccordionContent>{t("appareil.faq.a2")}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="3" className="px-6">
              <AccordionTrigger>{t("appareil.faq.q3")}</AccordionTrigger>
              <AccordionContent>{t("appareil.faq.a3")}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="4" className="px-6">
              <AccordionTrigger>{t("appareil.faq.q4")}</AccordionTrigger>
              <AccordionContent>{t("appareil.faq.a4")}</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {siblings.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeader
              eyebrow={t("appareil.siblings.eyebrow")}
              title={t("appareil.siblings.title", [brandName(device.brand)])}
            />
            <div className="grid gap-px border border-border bg-border md:grid-cols-3">
              {siblings.map((d) => (
                <Link
                  key={d.slug}
                  to="/$locale/appareil/$slug"
                  params={{ locale, slug: d.slug }}
                  className="bg-card p-6 transition-colors hover:bg-surface"
                >
                  <span className="font-bold">{d.name}</span>
                  <span className="mt-2 block font-mono text-[10px] uppercase text-muted-foreground">
                    {t(d.category)} ·{" "}
                    {t("appareil.siblings.from", [
                      formatFcfa(Math.min(...d.faults.map((x) => x.price))),
                    ])}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <CtaBand />
    </>
  );
}
