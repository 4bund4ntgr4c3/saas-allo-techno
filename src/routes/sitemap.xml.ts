import { createFileRoute } from "@tanstack/react-router";
import { COMPANY } from "@/data/catalog/company";

export const Route = createFileRoute("/sitemap/xml")({
  server: {
    handlers: {
      GET: async () => {
        const pages = [
          "",
          "/reparations",
          "/services",
          "/entreprises",
          "/boutique",
          "/diagnostic-auto",
          "/parrainage",
          "/premiers-secours",
          "/suivi",
          "/about",
          "/contact",
          "/changelog",
          "/work-at",
          "/work-at/test-technique",
        ];

        const locales = ["fr", "en"];
        const today = new Date().toISOString().split("T")[0];

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;

        locales.forEach((locale) => {
          pages.forEach((page) => {
            const loc = `${COMPANY.url}/${locale}${page}`;
            xml += `  <url>\n`;
            xml += `    <loc>${loc}</loc>\n`;
            xml += `    <lastmod>${today}</lastmod>\n`;
            xml += `    <changefreq>weekly</changefreq>\n`;
            xml += `    <priority>${page === "" ? "1.0" : page === "/reparations" || page === "/entreprises" ? "0.9" : "0.7"}</priority>\n`;
            xml += `    <xhtml:link rel="alternate" hreflang="fr" href="${COMPANY.url}/fr${page}" />\n`;
            xml += `    <xhtml:link rel="alternate" hreflang="en" href="${COMPANY.url}/en${page}" />\n`;
            xml += `  </url>\n`;
          });
        });

        xml += `</urlset>`;

        return new Response(xml, {
          status: 200,
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
