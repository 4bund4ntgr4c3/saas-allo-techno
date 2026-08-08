import { createFileRoute } from "@tanstack/react-router";
import { DEVICES } from "@/data/catalog";
import { COMPANY } from "@/data/catalog/company";
import { POSTS } from "@/data/catalog/static";

const BASE = COMPANY.url.replace(/\/$/, "");

const STATIC_PAGES = [
  { path: "reparations", changefreq: "weekly", priority: "0.8" },
  { path: "tarifs", changefreq: "weekly", priority: "0.7" },
  { path: "boutique", changefreq: "weekly", priority: "0.7" },
  { path: "services", changefreq: "monthly", priority: "0.6" },
  { path: "blog", changefreq: "daily", priority: "0.9" },
  { path: "faq", changefreq: "monthly", priority: "0.5" },
  { path: "contact", changefreq: "monthly", priority: "0.5" },
  { path: "engagements", changefreq: "monthly", priority: "0.4" },
  { path: "guides", changefreq: "weekly", priority: "0.6" },
  { path: "magasins", changefreq: "monthly", priority: "0.5" },
  { path: "devis", changefreq: "weekly", priority: "0.7" },
  { path: "garantie", changefreq: "monthly", priority: "0.4" },
  { path: "reprise", changefreq: "monthly", priority: "0.4" },
  { path: "avis", changefreq: "weekly", priority: "0.6" },
  { path: "entreprises", changefreq: "monthly", priority: "0.4" },
  { path: "reclamation", changefreq: "monthly", priority: "0.4" },
  { path: "reconditionnes", changefreq: "weekly", priority: "0.6" },
  { path: "quartiers", changefreq: "monthly", priority: "0.4" },
];

const LOCALES = ["fr", "en"];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(loc: string, lastmod: string, changefreq: string, priority: string): string {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export const Route = createFileRoute("/api/sitemap")({
  server: {
    handlers: {
      GET: async () => {
        const now = new Date().toISOString();
        const entries: string[] = [];

        // Homepage
        for (const locale of LOCALES) {
          entries.push(urlEntry(`${BASE}/${locale}`, now, "daily", "1.0"));
        }

        // Static pages
        for (const page of STATIC_PAGES) {
          for (const locale of LOCALES) {
            entries.push(
              urlEntry(`${BASE}/${locale}/${page.path}`, now, page.changefreq, page.priority),
            );
          }
        }

        // Blog posts
        for (const post of POSTS) {
          for (const locale of LOCALES) {
            entries.push(
              urlEntry(`${BASE}/${locale}/blog/${post.slug}`, post.date ?? now, "monthly", "0.7"),
            );
          }
        }

        // Device pages
        for (const device of DEVICES) {
          for (const locale of LOCALES) {
            entries.push(
              urlEntry(
                `${BASE}/${locale}/reparations/${device.brand}/${device.slug}`,
                now,
                "monthly",
                "0.6",
              ),
            );
          }
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
          },
        });
      },
    },
  },
});
