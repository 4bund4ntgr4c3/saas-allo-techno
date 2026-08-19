import { loadEnv } from "vite";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(async ({ mode }) => {
  const loadedEnv = loadEnv(mode, process.cwd(), "VITE_");
  const envDefine: Record<string, string> = {};
  for (const [key, value] of Object.entries(loadedEnv)) {
    envDefine[`import.meta.env.${key}`] = JSON.stringify(value);
  }

  return {
    define: envDefine,
    resolve: {
      alias: { "@": `${process.cwd()}/src` },
      tsconfigPaths: true,
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
      ignoreOutdatedRequests: true,
    },
    server: {
      host: "::",
      port: 8080,
    },
    // manualChunks (bundle client) : les warnings Nitro
    // « manualChunks option is ignored » concernent uniquement la passe SSR —
    // le bundle client les applique bien (vérifié : sans cette config, React
    // (250 Ko) fusionne dans l'entrée et xlsx (354 Ko) dans la route equipment).
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            // Données du catalogue (DEVICES) : module dédié hors du premier rendu.
            // Le barrel (index.ts) est léger (company/static/accessories) et ne
            // re-exporte pas DEVICES ; ./devices est importé uniquement par des
            // routes lazy (ou en import dynamique depuis les loaders) — il forme
            // donc un chunk partagé chargé à la demande.
            if (id.includes("/src/data/catalog/devices")) {
              return "catalog";
            }

            // React core → chunk dédié chargé avec l'entrée, séparé des libs
            // lourdes (recharts/d3) pour ne pas embarquer les graphiques admin
            // dans le premier rendu.
            if (id.includes("node_modules/react") || id.includes("node_modules/scheduler")) {
              return "vendor-react";
            }

            // Heavy charting library → separate chunk (admin-only).
            // Note: pas de règle ici — recharts/d3 sont tous importés en lazy
            // (AdminKpis, StatsDashboard, AdminAnalyticsAdvanced, chart.tsx) ;
            // ils forment naturellement un chunk partagé hors du premier rendu.

            // PDF generation (admin reports/invoices) → separate chunk.
            // Note: règle retirée — le helper __vitePreload (partagé) était
            // hébergé dans ce chunk et tirait jspdf dans le premier rendu.
            // jspdf/qrcode sont tous importés en lazy (suivi, mon-compte,
            // dossiers, devis...) et forment naturellement un chunk partagé.

            // Excel export (admin) → separate chunk
            if (id.includes("node_modules/xlsx")) {
              return "vendor-xlsx";
            }

            // QR code scanner (camera-heavy, rarely used) → separate chunk
            if (id.includes("node_modules/html5-qrcode")) {
              return "vendor-qr";
            }

            return undefined;
          },
        },
      },
    },
    plugins: [
      tanstackStart({
        importProtection: {
          behavior: "error",
          client: {
            files: ["**/server/**"],
            specifiers: ["server-only"],
          },
        },
        server: { entry: "server" },
      }),
      tailwindcss(),
      nitro({
        defaultPreset: "cloudflare-module",
        compatibilityDate: "2026-08-01",
        routeRules: {
          // Cache CDN des pages publiques (HTML SSR) : s-maxage + revalidation
          // en arrière-plan, sans purge manuelle (stale-while-revalidate).
          // Les réponses avec Set-Cookie ne sont jamais mises en cache ; les
          // pages dynamiques par utilisateur (suivi, panier, réservation…)
          // sont volontairement exclues.
          "/fr": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/fr/": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en/": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/fr/blog/**": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en/blog/**": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/fr/catalogue": {
            headers: { "cache-control": "public, s-maxage=600, stale-while-revalidate=600" },
          },
          "/en/catalogue": {
            headers: { "cache-control": "public, s-maxage=600, stale-while-revalidate=600" },
          },
          "/fr/avis": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en/avis": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/fr/boutique/**": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en/boutique/**": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/fr/reparations/**": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en/reparations/**": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/fr/appareil/**": {
            headers: { "cache-control": "public, s-maxage=600, stale-while-revalidate=600" },
          },
          "/en/appareil/**": {
            headers: { "cache-control": "public, s-maxage=600, stale-while-revalidate=600" },
          },
          "/fr/services": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en/services": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/fr/garantie": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en/garantie": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/fr/engagements": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en/engagements": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/fr/magasins": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en/magasins": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/fr/promotions": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en/promotions": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/fr/reconditionnes": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en/reconditionnes": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/fr/quartiers/**": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en/quartiers/**": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/fr/faq": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en/faq": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/fr/guides/**": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en/guides/**": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/fr/work-at": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en/work-at": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/fr/about": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en/about": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/fr/contact": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en/contact": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/fr/mentions-legales": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en/mentions-legales": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/fr/tarifs": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en/tarifs": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/fr/changelog": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en/changelog": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/fr/outils": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en/outils": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/fr/devis": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en/devis": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/fr/abonnements": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en/abonnements": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/fr/parrainage": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en/parrainage": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/fr/premiers-secours": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en/premiers-secours": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/fr/depannage-domicile": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en/depannage-domicile": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/fr/diagnostic-auto": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en/diagnostic-auto": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/fr/guide-esd": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en/guide-esd": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/fr/reprise": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en/reprise": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/fr/marketplace-sequestre": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
          "/en/marketplace-sequestre": {
            headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=300" },
          },
        },
      }),
      viteReact(),
      ...(process.env["ANALYZE"]
        ? [visualizer({ open: true, filename: "bundle-stats.html" })]
        : []),
    ],
  };
});
