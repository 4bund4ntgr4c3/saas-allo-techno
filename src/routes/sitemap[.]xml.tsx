import { createFileRoute } from "@tanstack/react-router";

const STATIC_PATHS = [
  "/",
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

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { BRANDS, DEVICES, POSTS, ACCESSORIES } = await import("@/data/catalog");
        const origin = new URL(request.url).origin;
        const urls = [
          ...STATIC_PATHS,
          ...BRANDS.map((b) => `/reparations/${b.slug}`),
          ...DEVICES.map((d) => `/appareil/${d.slug}`),
          ...POSTS.map((p) => `/blog/${p.slug}`),
          ...ACCESSORIES.map((a) => `/boutique/${a.slug}`),
        ];

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${origin}${u}</loc></url>`).join("\n")}
</urlset>`;

        return new Response(xml, {
          headers: { "Content-Type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});
