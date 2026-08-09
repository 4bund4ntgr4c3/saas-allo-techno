import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/push-subscribe")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: subscriptions, error } = await supabaseAdmin
          .from("push_subscriptions" as never)
          .select("id, user_id, endpoint, created_at")
          .order("created_at", { ascending: false })
          .limit(1000);

        if (error) {
          console.error("[push] list subscriptions failed", error);
          return Response.json({ error: "Erreur serveur" }, { status: 500 });
        }

        return Response.json({ subscriptions: subscriptions ?? [] });
      },

      POST: async ({ request }) => {
        let body: {
          endpoint?: string;
          keys?: { p256dh?: string; auth?: string };
          user_id?: string;
        };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "JSON invalide" }, { status: 400 });
        }

        const endpoint = body.endpoint?.trim();
        const p256dh = body.keys?.p256dh?.trim();
        const authKey = body.keys?.auth?.trim();
        const userId = body.user_id?.trim();

        if (!endpoint || !p256dh || !authKey || !userId) {
          return Response.json({ error: "Paramètres manquants" }, { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { error } = await supabaseAdmin.from("push_subscriptions" as never).upsert(
          {
            user_id: userId,
            endpoint,
            p256dh,
            auth_key: authKey,
          } as never,
          { onConflict: "user_id,endpoint" },
        );

        if (error) {
          console.error("[push] upsert subscription failed", error);
          return Response.json({ error: "Erreur serveur" }, { status: 500 });
        }

        return Response.json({ status: "ok" });
      },
    },
  },
});
