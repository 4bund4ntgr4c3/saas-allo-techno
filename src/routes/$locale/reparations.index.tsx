import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Clock, Home, ShieldCheck, Store, Wallet } from "lucide-react";
import { SectionHeader, CtaBand } from "@/components/site/Blocks";
import { DeviceSearch } from "@/components/site/DeviceSearch";
import { PageBreadcrumb } from "@/components/site/PageBreadcrumb";
import { DEVICES, devicesOfBrand } from "@/data/catalog/devices";
import { BRANDS, CATEGORIES } from "@/data/catalog/static";
import { categoryMedia } from "@/data/device-media";
import { BrandLogo } from "@/components/site/BrandLogo";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import { faqSchema, localeSeo } from "@/lib/seo";

export const Route = createFileRoute("/$locale/reparations/")({
  validateSearch: (
    s: Record<string, unknown>,
  ): {
    categorie?: string;
    device?: string;
    panne?: string;
    date?: string;
    creneau?: string;
    heure?: string;
    src?: string;
  } => {
    const result: {
      categorie?: string;
      device?: string;
      panne?: string;
      date?: string;
      creneau?: string;
      heure?: string;
      src?: string;
    } = {};
    const c = s["categorie"];
    if (typeof c === "string") result.categorie = c;
    const device = s["device"];
    if (typeof device === "string") result.device = device;
    const panne = s["panne"];
    if (typeof panne === "string") result.panne = panne;
    const date = s["date"];
    if (typeof date === "string") result.date = date;
    const creneau = s["creneau"];
    if (typeof creneau === "string") result.creneau = creneau;
    const heure = s["heure"];
    if (typeof heure === "string") result.heure = heure;
    const src = s["src"];
    if (typeof src === "string") result.src = src;
    return result;
  },
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale);
    const suffix = "/reparations";
    const seo = localeSeo(locale, suffix);
    const faq = faqSchema([
      { q: translate(locale, "faq.reparations.q1"), a: translate(locale, "faq.reparations.a1") },
      { q: translate(locale, "faq.reparations.q2"), a: translate(locale, "faq.reparations.a2") },
      { q: translate(locale, "faq.reparations.q3"), a: translate(locale, "faq.reparations.a3") },
      { q: translate(locale, "faq.reparations.q4"), a: translate(locale, "faq.reparations.a4") },
      { q: translate(locale, "faq.reparations.q5"), a: translate(locale, "faq.reparations.a5") },
      { q: translate(locale, "faq.reparations.q6"), a: translate(locale, "faq.reparations.a6") },
    ]);
    return {
      meta: [
        { title: translate(locale, "reparations.meta.title") },
        {
          name: "description",
          content: translate(locale, "reparations.meta.description"),
        },
        { property: "og:title", content: translate(locale, "reparations.meta.ogTitle") },
        {
          property: "og:description",
          content: translate(locale, "reparations.meta.ogDescription"),
        },
        ...seo.meta,
      ],
      links: [...seo.links],
      scripts: [{ type: "application/ld+json", children: JSON.stringify(faq) }],
    };
  },
  component: Reparations,
});

function Reparations() {
  const { categorie, device, panne, date, heure } = Route.useSearch();
  const { locale, t } = useI18n();
  return (
    <>
      <section className="border-b border-border py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <span className="at-eyebrow">{t("reparations.index.eyebrow")}</span>
              <PageBreadcrumb items={[{ label: t("nav.reparations") }]} />
            </div>
            <h1 className="at-display text-4xl md:text-5xl">{t("reparations.index.title")}</h1>
            <p className="mt-6 max-w-xl text-muted-foreground">
              {t("reparations.index.hero", [DEVICES.length, BRANDS.length])}
            </p>
          </div>
          <div className="mt-10">
            <DeviceSearch
              initialCategory={categorie ?? null}
              initialDevice={device ?? null}
              initialPanne={panne ?? null}
              initialDate={date ?? null}
              initialHeure={heure ?? null}
            />
          </div>
          <ul className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Clock,
                t: t("reparations.index.featureExpress.t"),
                d: t("reparations.index.featureExpress.d"),
              },
              {
                icon: ShieldCheck,
                t: t("reparations.index.featureGarantee.t"),
                d: t("reparations.index.featureGarantee.d"),
              },
              {
                icon: Wallet,
                t: t("reparations.index.featurePrice.t"),
                d: t("reparations.index.featurePrice.d"),
              },
              {
                icon: BadgeCheck,
                t: t("reparations.index.featureCertified.t"),
                d: t("reparations.index.featureCertified.d"),
              },
            ].map((f) => (
              <li key={f.t} className="flex gap-3 bg-card p-4">
                <f.icon className="mt-0.5 size-5 shrink-0 text-primary" strokeWidth={1.5} />
                <span>
                  <span className="block text-sm font-bold tracking-tight">{f.t}</span>
                  <span className="text-xs text-muted-foreground">{f.d}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-2">
            {[
              {
                icon: Store,
                t: t("reparations.index.store.t"),
                d: t("reparations.index.store.d"),
              },
              { icon: Home, t: t("reparations.index.home.t"), d: t("reparations.index.home.d") },
            ].map((m) => (
              <div key={m.t} className="bg-card p-5">
                <m.icon className="size-6 text-primary" strokeWidth={1.5} />
                <p className="mt-3 text-sm font-bold uppercase tracking-tight">{m.t}</p>
                <p className="mt-1 text-xs text-muted-foreground">{m.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow={t("reparations.index.brandsEyebrow")}
            title={t("reparations.index.brandsTitle")}
            right={
              <Link
                to="/$locale/catalogue"
                params={{ locale }}
                className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/80"
              >
                {t("reparations.index.brandsLink")}
              </Link>
            }
          />
          <div className="grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
            {BRANDS.map((b) => (
              <Link
                key={b.slug}
                to="/$locale/reparations/$brand"
                params={{ locale, brand: b.slug }}
                className="group bg-card p-8 transition-colors hover:bg-surface"
              >
                <BrandLogo
                  slug={b.slug}
                  name={b.name}
                  className="mb-4 block size-10 text-primary"
                />
                <h2 className="text-xl font-extrabold uppercase tracking-tight">{b.name}</h2>
                <p className="mt-2 font-mono text-[10px] uppercase text-muted-foreground">
                  {t(b.tag)}
                </p>
                <p className="mt-6 font-mono text-xs text-primary">
                  {t("reparations.index.brandCount", [devicesOfBrand(b.slug).length])}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow={t("reparations.index.categoriesEyebrow")}
            title={t("reparations.index.categoriesTitle")}
            text={t("reparations.index.categoriesText")}
          />
          <div className="grid gap-px border border-border bg-border md:grid-cols-3">
            {CATEGORIES.map((c) => {
              const list = DEVICES.filter((d) => d.category === c);
              const Icon = categoryMedia(c)?.icon;
              return (
                <div key={c} className="bg-card p-8">
                  <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide">
                    {Icon && <Icon className="size-5 text-primary" strokeWidth={1.5} />}
                    {t(c)}
                  </h3>
                  <ul className="mt-4 space-y-2">
                    {list.map((d) => (
                      <li key={d.slug}>
                        <Link
                          to="/$locale/appareil/$slug"
                          params={{ locale, slug: d.slug }}
                          className="text-sm text-muted-foreground hover:text-primary"
                        >
                          {d.name}
                        </Link>
                      </li>
                    ))}
                    {list.length === 0 && (
                      <li className="text-sm text-muted-foreground">
                        {t("reparations.index.quote")}
                      </li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
