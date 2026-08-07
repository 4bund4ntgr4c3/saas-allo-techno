import { createFileRoute } from "@tanstack/react-router";
import type { Locale } from "@/lib/i18n/locales";

const STATIC_PATHS = [
  "",
  "/reparations",
  "/catalogue",
  "/tarifs",
  "/boutique",
  "/blog",
  "/avis",
  "/faq",
  "/garantie",
  "/contact",
  "/devis",
  "/reprise",
  "/entreprises",
  "/suivi",
  "/reservation",
  "/mentions-legales",
];

const LOCALES: Locale[] = ["fr", "en"];

/**
 * Sitemap localisé : une entrée <url> par langue pour chaque chemin, chacune
 * portant son propre <loc> et les liens hreflang alternés (fr / en / x-default)
 * pointant vers les variantes de la même page.
 */
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { BRANDS, DEVICES, POSTS, ACCESSORIES } = await import("@/data/catalog");
        const origin = new URL(request.url).origin;

        const paths = [
          ...STATIC_PATHS,
          ...BRANDS.map((b) => `/reparations/${b.slug}`),
          ...DEVICES.map((d) => `/appareil/${d.slug}`),
          ...POSTS.map((p) => `/blog/${p.slug}`),
          ...ACCESSORIES.map((a) => `/boutique/${a.slug}`),
        ];

        const abs = (locale: Locale, u: string) => `${origin}/${locale}${u}`;

        const blocks = paths
          .map((u) =>
            LOCALES.map((l) => {
              const hreflangs = LOCALES.map(
                (alt) =>
                  `    <xhtml:link rel="alternate" hreflang="${alt}" href="${abs(alt, u)}" />`,
              ).join("\n");
              return `  <url>
    <loc>${abs(l, u)}</loc>
${hreflangs}
    <xhtml:link rel="alternate" hreflang="x-default" href="${abs("fr", u)}" />
  </url>`;
            }).join("\n"),
          )
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${blocks}
</urlset>`;

        return new Response(xml, {
          headers: { "Content-Type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});
