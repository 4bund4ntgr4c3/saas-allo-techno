import { loadEnv } from "vite";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
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
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      nitro({
        defaultPreset: "cloudflare-module",
        compatibilityDate: "2026-08-01",
        routeRules: {
          // Cache CDN des pages publiques (HTML SSR) : s-maxage + revalidation
          // en arrière-plan, sans purge manuelle (stale-while-revalidate).
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
        },
      }),
      viteReact(),
      ...(process.env["ANALYZE"]
        ? [visualizer({ open: true, filename: "bundle-stats.html" })]
        : []),
    ],
  };
});
