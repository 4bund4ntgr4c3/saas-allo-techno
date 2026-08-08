import { createFileRoute } from "@tanstack/react-router";

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
          console.error("[reminders] CRON_TOKEN absent — job non configuré");
          return new Response("Not configured", { status: 503 });
        }

        const auth = request.headers.get("authorization") ?? "";
        const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
        const { safeEqual } = await import("@/lib/security");
        if (!safeEqual(bearer, token)) {
          console.warn("[reminders] jeton d'authentification invalide");
          return new Response("Unauthorized", { status: 401 });
        }

        const { runReminders } = await import("@/lib/reminders.functions");
        try {
          const result = await runReminders();
          return new Response(JSON.stringify(result), {
            headers: { "content-type": "application/json" },
          });
        } catch (err) {
          console.error("[reminders] exécution échouée", err);
          return new Response("Server error", { status: 500 });
        }
      },
    },
  },
});
