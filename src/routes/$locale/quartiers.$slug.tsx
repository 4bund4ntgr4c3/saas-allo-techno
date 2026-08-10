import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { BadgeCheck, Clock, Home } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CtaBand, SectionHeader } from "@/components/site/Blocks";
import { LeadForm } from "@/components/site/LeadForm";
import { PageBreadcrumb } from "@/components/site/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { BRANDS } from "@/data/catalog";
import { QUARTIERS, quartierBySlug, type QuartierInfo } from "@/data/local-seo";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import "@/lib/i18n/segments/quartiers";
import { breadcrumbSchema, localeSeo, localeUrl, localBusinessSchema } from "@/lib/seo";

const QUARTIER_BRAND_SLUGS = ["apple", "samsung", "tecno", "infinix"];

const SERVICE_ICONS: LucideIcon[] = [BadgeCheck, Clock, Home];

export const Route = createFileRoute("/$locale/quartiers/$slug")({
  loader: ({ params }): QuartierInfo => {
    const quartier = quartierBySlug(params.slug);
    if (!quartier) throw notFound();
    return quartier;
  },

  head: ({ params, loaderData }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale);
    const name = loaderData?.name ?? params.slug;
    if (!loaderData) {
      return {
        meta: [
          { title: translate(locale, "quartiers.slug.notFoundTitle") },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const suffix = `/quartiers/${params.slug}`;
    const seo = localeSeo(locale, suffix);
    const url = localeUrl(locale, suffix);
    const localBusiness = localBusinessSchema({
      areaServed: [name, "Abomey-Calavi", ...QUARTIERS],
    });
    const breadcrumbs = breadcrumbSchema([
      {
        name: translate(locale, "quartiers.breadcrumb"),
        url: localeUrl(locale, "/quartiers"),
      },
      { name, url },
    ]);
    return {
      meta: [
        { title: translate(locale, "quartiers.slug.meta.title", [name]) },
        {
          name: "description",
          content: translate(locale, "quartiers.slug.meta.description", [name]),
        },
        {
          property: "og:title",
          content: translate(locale, "quartiers.slug.meta.og.title", [name]),
        },
        {
          property: "og:description",
          content: translate(locale, "quartiers.slug.meta.og.description", [name]),
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...seo.meta,
      ],
      links: [...seo.links],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(localBusiness) },
        { type: "application/ld+json", children: JSON.stringify(breadcrumbs) },
      ],
    };
  },
  component: QuartierPage,
});

function QuartierPage() {
  const quartier = Route.useLoaderData() as QuartierInfo;
  const { locale, t } = useI18n();
  const local = quartier.local[locale];
  const brands = BRANDS.filter((b) => QUARTIER_BRAND_SLUGS.includes(b.slug));
  const srcParam = `quartier-${quartier.slug}`;

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="at-eyebrow">{t("quartiers.page.eyebrow")}</span>
            <PageBreadcrumb items={[{ to: `/$locale/quartiers`, label: t("nav.quartiers") }, { label: quartier.name }]} />
          </div>
          <h1 className="at-display text-4xl md:text-6xl">
            {t("quartiers.slug.title", [quartier.name])}
          </h1>
          <p className="mt-6 max-w-2xl leading-relaxed text-muted-foreground">{local.intro}</p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("quartiers.slug.landmarks", [local.landmarks])}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button asChild variant="technical" size="lg">
              <Link
                to="/$locale/reparations"
                params={{ locale }}
                search={{ src: srcParam } as never}
              >
                {t("quartiers.cta")}
              </Link>
            </Button>
            <p className="max-w-md text-sm text-muted-foreground">{t("quartiers.cta.hint")}</p>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow={t("quartiers.page.eyebrow")}
            title={t("quartiers.services.title")}
            text={t("quartiers.visit")}
          />
          <div className="grid gap-px border border-border bg-border md:grid-cols-3">
            {[1, 2, 3].map((n) => {
              const Icon = SERVICE_ICONS[n - 1] ?? BadgeCheck;
              return (
                <article key={n} className="flex flex-col bg-card p-8">
                  <Icon className="size-6 text-primary" strokeWidth={1.5} aria-hidden="true" />
                  <h2 className="mt-4 text-lg font-bold tracking-tight">
                    {t(`quartiers.services.d${n}.title`)}
                  </h2>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {t(`quartiers.services.d${n}.text`)}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow={t("quartiers.page.eyebrow")}
            title={t("quartiers.slug.brands", [quartier.name])}
          />
          <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {brands.map((b) => (
              <Link
                key={b.slug}
                to="/$locale/reparations/$brand"
                params={{ locale, brand: b.slug }}
                className="bg-card p-8 transition-colors hover:bg-surface"
              >
                <h2 className="text-lg font-bold tracking-tight">{b.name}</h2>
                <p className="mt-3 text-sm text-muted-foreground">{t(b.tag)}</p>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-primary">
                  {t("reparations.brand.devisCta")} →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            eyebrow={t("quartiers.page.eyebrow")}
            title={t("quartiers.form.title", [quartier.name])}
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("quartiers.form.description")}
            </p>
            <LeadForm
              source="devis"
              sourceDetail={srcParam}
              title={t("quartiers.form.title", [quartier.name])}
              description={t("quartiers.form.description")}
              successText={t("quartiers.form.success")}
            />
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
