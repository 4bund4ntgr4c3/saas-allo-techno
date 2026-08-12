import { createFileRoute, Link } from "@tanstack/react-router";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { CtaBand } from "@/components/site/Blocks";
import { useCompare } from "@/components/shop/compare";
import { ACCESSORIES, formatFcfa } from "@/data/catalog";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";
import { localeSeo } from "@/lib/seo";

export const Route = createFileRoute("/$locale/boutique/comparer")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const seo = localeSeo(locale, "/boutique/comparer");
    return {
      meta: [
        { title: translate(locale, "boutique.compare.meta-title") },
        { name: "description", content: translate(locale, "boutique.compare.meta-description") },
        ...seo.meta,
      ],
      links: [...seo.links],
    };
  },
  component: ComparePage,
});

function ComparePage() {
  const { slugs, remove, clear } = useCompare();
  const { locale, t } = useI18n();

  const products = slugs
    .map((s) => ACCESSORIES.find((a) => a.slug === s))
    .filter((p): p is (typeof ACCESSORIES)[number] => p !== undefined);

  const rows: { label: string; key: string; fn?: (p: (typeof ACCESSORIES)[number]) => string }[] = [
    { label: t("boutique.compare.category"), key: "cat", fn: (p) => p.category },
    { label: t("boutique.compare.price"), key: "price", fn: (p) => formatFcfa(p.price) },
    { label: t("boutique.compare.stock"), key: "stock", fn: (p) => String(p.stock) },
    { label: t("boutique.compare.grade"), key: "grade", fn: (p) => p.grade ?? "—" },
    { label: t("boutique.compare.storage"), key: "gb", fn: (p) => p.gb ?? "—" },
    { label: t("boutique.compare.warranty"), key: "warranty", fn: (p) => p.warranty ?? "—" },
  ];

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="at-eyebrow">{t("boutique.compare.eyebrow")}</span>
            <Breadcrumb className="rounded-sm border border-border px-2 py-1">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/$locale" params={{ locale }}>
                      {t("action.accueil")}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/$locale/boutique" params={{ locale }}>
                      {t("boutique.title")}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t("boutique.compare.title")}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <h1 className="at-display text-4xl md:text-5xl">{t("boutique.compare.title")}</h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            {t("boutique.compare.text", [String(products.length)])}
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {products.length === 0 ? (
            <div className="border border-border bg-card p-12 text-center">
              <p className="text-sm text-muted-foreground">{t("boutique.compare.empty")}</p>
              <Button asChild variant="technical" className="mt-6">
                <Link to="/$locale/boutique" params={{ locale }}>
                  {t("boutique.compare.browse")}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3 pr-4 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t("boutique.compare.product")}
                    </th>
                    {products.map((p) => (
                      <th key={p.slug} className="px-4 py-3 text-left">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link
                              to="/$locale/boutique/$slug"
                              params={{ locale, slug: p.slug }}
                              className="font-bold hover:text-primary"
                            >
                              {p.name}
                            </Link>
                          </div>
                          <button
                            onClick={() => remove(p.slug)}
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                            aria-label={`Retirer ${p.name}`}
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key} className="border-b border-border last:border-0">
                      <td className="py-3 pr-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {row.label}
                      </td>
                      {products.map((p) => (
                        <td key={p.slug} className="px-4 py-3 font-medium">
                          {row.fn!(p)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-8 flex gap-3">
                <Button asChild variant="technical">
                  <Link to="/$locale/boutique" params={{ locale }}>
                    {t("boutique.compare.browse")}
                  </Link>
                </Button>
                <Button variant="technicalOutline" onClick={clear}>
                  <Trash2 className="size-4" /> {t("boutique.compare.clear")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
