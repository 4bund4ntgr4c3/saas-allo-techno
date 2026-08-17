import { createFileRoute } from "@tanstack/react-router";
import { createLogger } from "@/lib/logger";

const logger = createLogger("cron-reminders");

/**
 * Déclencheur du job de rappels automatisés (GitHub Actions, cron quotidien
 * 08:00 UTC = 09:00 à Porto-Novo). Authentification par jeton porteur
 * (CRON_TOKEN) comparé à temps constant. Route API brute (pas une serverFn) :
 * non bloquée par le CSRF middleware, comme le webhook Flutterwave.
 */
export const Route = createFileRoute("/api/cron-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env["CRON_TOKEN"];
        if (!token) {
          logger.error("CRON_TOKEN not configured, job will not run");
          return new Response("Not configured", { status: 503 });
        }

        const auth = request.headers.get("authorization") ?? "";
        const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
        const { safeEqual } = await import("@/lib/security");
        if (!safeEqual(bearer, token)) {
          logger.warn("Invalid authentication token");
          return new Response("Unauthorized", { status: 401 });
        }

        const { runReminders } = await import("@/lib/reminders.functions");
        const { runB2BReminders } = await import("@/lib/b2b-reminders.functions");
        try {
          const [b2cResult, b2bResult] = await Promise.all([runReminders(), runB2BReminders()]);
          return new Response(
            JSON.stringify({
              b2c: b2cResult,
              b2b: b2bResult,
              timestamp: new Date().toISOString(),
            }),
            {
              headers: { "content-type": "application/json" },
            },
          );
        } catch (err) {
          logger.error("Reminder execution failed", err as Error);
          return new Response("Server error", { status: 500 });
        }
      },
    },
  },
});
