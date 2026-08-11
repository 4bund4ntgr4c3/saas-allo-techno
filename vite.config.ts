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
            // Regrouper les données du catalogue (DEVICES, marques, helpers) dans
            // un chunk dédié, chargé uniquement par les routes qui en ont besoin —
            // pas dans le bundle initial du premier rendu.
            if (id.includes("/src/data/catalog/")) return "catalog";

            // Heavy charting library → separate chunk (admin-only)
            if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-")) {
              return "vendor-charts";
            }

            // PDF generation (admin reports/invoices) → separate chunk
            if (id.includes("node_modules/jspdf") || id.includes("node_modules/qrcode")) {
              return "vendor-pdf";
            }

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
      nitro({ defaultPreset: "cloudflare-module", compatibilityDate: "2026-08-01" }),
      viteReact(),
      ...(process.env["ANALYZE"]
        ? [visualizer({ open: true, filename: "bundle-stats.html" })]
        : []),
    ],
  };
});
