import { createFileRoute } from "@tanstack/react-router";
import { createLogger } from "@/lib/logger";

const logger = createLogger("cron-demo-reset");

/**
 * Déclencheur du job de réinitialisation automatique de l'environnement de démonstration
 * (GitHub Actions / Cloudflare Cron Triggers, planifié chaque heure).
 *
 * Authentification par jeton porteur (CRON_TOKEN) comparé à temps constant.
 * Route API brute (non bloquée par le CSRF middleware).
 */
export const Route = createFileRoute("/api/cron-demo-reset")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env["CRON_TOKEN"];
        if (!token) {
          logger.error("CRON_TOKEN not configured, demo reset job will not run");
          return new Response("Not configured", { status: 503 });
        }

        const auth = request.headers.get("authorization") ?? "";
        const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
        const { safeEqual } = await import("@/lib/security");
        if (!safeEqual(bearer, token)) {
          logger.warn("Invalid authentication token for demo reset");
          return new Response("Unauthorized", { status: 401 });
        }

        const { resetAndSeedDemoEnvironment } = await import("@/lib/demo.functions");
        try {
          const result = await resetAndSeedDemoEnvironment();
          logger.info("Demo environment successfully reset and re-seeded", result);
          return new Response(JSON.stringify(result), {
            headers: { "content-type": "application/json" },
          });
        } catch (err) {
          logger.error("Demo environment reset failed", err as Error);
          return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
