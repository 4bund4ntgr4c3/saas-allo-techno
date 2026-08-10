import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CtaBand, SectionHeader } from "@/components/site/Blocks";
import {
  BRANDS,
  brandBySlug,
  devicesOfBrand,
  formatFcfa,
  POSTS,
  type Brand,
  type Device,
} from "@/data/catalog";
import { brandLocal, QUARTIERS } from "@/data/local-seo";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import "@/lib/i18n/segments/reparations";
import { breadcrumbSchema, faqSchema, localeSeo, localeUrl, serviceSchema } from "@/lib/seo";

export const Route = createFileRoute("/$locale/reparations/$brand")({
  loader: ({ params }): { brand: Brand; devices: Device[] } => {
    const brand = brandBySlug(params.brand);
    if (!brand) throw notFound();
    return { brand, devices: devicesOfBrand(brand.slug) };
  },

  head: ({ params, loaderData }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale);
    const name = loaderData?.brand.name ?? translate(locale, "reparations.brand.fallback");
    if (!loaderData) {
      return {
        meta: [
          { title: translate(locale, "reparations.brand.notFoundTitle") },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const suffix = `/reparations/${params.brand}`;
    const seo = localeSeo(locale, suffix);
    const url = localeUrl(locale, suffix);
    const service = serviceSchema({
      name: translate(locale, "reparations.brand.service", [name]),
      description: translate(locale, "reparations.brand.meta.description", [name]),
      url,
      brand: name,
    });
    const faq = faqSchema(brandLocal(loaderData.brand).faq);
    const breadcrumbs = breadcrumbSchema([
      {
        name: translate(locale, "reparations.brand.breadcrumb"),
        url: localeUrl(locale, "/reparations"),
      },
      { name, url },
    ]);
    return {
      meta: [
        { title: translate(locale, "reparations.brand.title", [name]) },
        {
          name: "description",
          content: translate(locale, "reparations.brand.meta.description", [name]),
        },
        {
          property: "og:title",
          content: translate(locale, "reparations.brand.meta.ogTitle", [name]),
        },
        {
          property: "og:description",
          content: translate(locale, "reparations.brand.meta.ogDescription", [name]),
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...seo.meta,
      ],
      links: [...seo.links],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(service) },
        { type: "application/ld+json", children: JSON.stringify(faq) },
        { type: "application/ld+json", children: JSON.stringify(breadcrumbs) },
      ],
    };
  },
  component: BrandPage,
});

function BrandPage() {
  const { brand, devices } = Route.useLoaderData() as { brand: Brand; devices: Device[] };
  const local = brandLocal(brand);
  const localPosts = POSTS.filter((p) => p.category === "Local").slice(0, 3);
  const { locale, t } = useI18n();

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <nav aria-label="Breadcrumb" className="mb-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <Link to="/$locale/reparations" params={{ locale }} className="hover:text-primary">
              {t("reparations.brand.breadcrumb")}
            </Link>{" "}
            /{" "}
            <Link to="/$locale/catalogue" params={{ locale }} className="hover:text-primary">
              {t("reparations.brand.breadcrumbCatalog")}
            </Link>{" "}
            / {brand.name}
          </nav>
          <h1 className="at-display text-4xl md:text-6xl">
            {t("reparations.brand.title", [brand.name])}
          </h1>
          <p className="mt-6 max-w-xl text-muted-foreground">
            {t(brand.tag)}. {t("reparations.brand.hero")}
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {local.intro}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {QUARTIERS.map((q) => (
              <span
                key={q}
                className="border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
              >
                {q}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow={t("reparations.brand.freqEyebrow")}
            title={t("reparations.brand.freqTitle", [brand.name])}
          />
          <div className="grid gap-px border border-border bg-border md:grid-cols-3">
            {local.pannes.map((p) => (
              <div key={p.title} className="bg-card p-8">
                <h3 className="text-lg font-bold tracking-tight">{p.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow={t("reparations.brand.modelsEyebrow")}
            title={t("reparations.brand.modelsTitle", [brand.name])}
            text={
              devices.length
                ? t("reparations.brand.modelsText")
                : t("reparations.brand.modelsEmptyText")
            }
          />

          {devices.length > 0 ? (
            <div className="grid gap-px border border-border bg-border md:grid-cols-2">
              {devices.map((d) => (
                <Link
                  key={d.slug}
                  to="/$locale/appareil/$slug"
                  params={{ locale, slug: d.slug }}
                  className="bg-card p-8 transition-colors hover:bg-surface"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-lg font-bold tracking-tight">{d.name}</h3>
                    <span className="font-mono text-[10px] uppercase text-muted-foreground">
                      {t(d.category)} · {d.year}
                    </span>
                  </div>
                  <ul className="mt-4 space-y-1">
                    {d.faults.slice(0, 3).map((f) => (
                      <li key={f.slug} className="flex justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">{t(f.label)}</span>
                        <span className="font-mono text-xs text-primary">
                          {formatFcfa(f.price)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 font-mono text-[10px] uppercase text-primary">
                    {t("reparations.brand.faultsCount", [d.faults.length])}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="border border-border bg-card p-10">
              <p className="text-sm text-muted-foreground">
                {t("reparations.brand.devisEmpty", [brand.name, brand.devices.join(", ")])}
              </p>
              <Button asChild variant="technical" className="mt-6">
                <Link to="/$locale/devis" params={{ locale }}>
                  {t("reparations.brand.devisCta")}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-border bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow={t("reparations.brand.faqEyebrow")}
            title={t("reparations.brand.faqTitle", [brand.name])}
          />
          <div className="grid gap-px border border-border bg-border md:grid-cols-3">
            {local.faq.map((f) => (
              <div key={f.q} className="bg-card p-8">
                <h3 className="text-base font-bold tracking-tight">{f.q}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-16">
            <SectionHeader
              eyebrow={t("reparations.brand.guidesEyebrow")}
              title={t("reparations.brand.guidesTitle")}
            />
            <div className="grid gap-px border border-border bg-border md:grid-cols-3">
              {localPosts.map((p) => (
                <Link
                  key={p.slug}
                  to="/$locale/blog/$slug"
                  params={{ locale, slug: p.slug }}
                  className="bg-card p-6 transition-colors hover:bg-card/70"
                >
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {p.category}
                  </span>
                  <h3 className="mt-3 text-base font-bold tracking-tight">{p.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{p.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-16" />
          <SectionHeader
            eyebrow={t("reparations.brand.othersEyebrow")}
            title={t("reparations.brand.othersTitle")}
          />
          <div className="flex flex-wrap gap-2">
            {BRANDS.filter((b) => b.slug !== brand.slug).map((b) => (
              <Link
                key={b.slug}
                to="/$locale/reparations/$brand"
                params={{ locale, brand: b.slug }}
                className="border border-border bg-card px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors hover:bg-foreground hover:text-background"
              >
                {b.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
