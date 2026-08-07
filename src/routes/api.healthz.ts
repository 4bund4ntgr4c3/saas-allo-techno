import { createFileRoute } from "@tanstack/react-router";

/**
 * Endpoint de monitoring (uptime) — GET /api/healthz.
 * Route API brute (pas une serverFn) : accessible aux vérificateurs externes
 * (UptimeRobot, Pingdom, Cloudflare Health Checks…). Ne renvoie aucune donnée
 * sensible — uniquement l'état du service et les variables essentielles.
 */
export const Route = createFileRoute("/api/healthz")({
  server: {
    handlers: {
      GET: async () => {
        const status = {
          status: "ok",
          service: "allo-techno",
          time: new Date().toISOString(),
          checks: {
            database: null as boolean | null,
          },
        } as {
          status: string;
          service: string;
          time: string;
          checks: { database: boolean | null };
        };

        // Vérification légère de la configuration Supabase (sans réseau bloquant).
        const supabaseUrl = process.env["SUPABASE_URL"];
        const supabaseKey = process.env["SUPABASE_SECRET_KEY"];
        status.checks.database = Boolean(supabaseUrl && supabaseKey);

        return Response.json(status, { status: 200 });
      },
    },
  },
});
