import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { isSafeOutboundUrl } from "@/lib/security";

export const Route = createFileRoute("/api/push-subscribe")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.slice(7);
        const { data: claims } = await supabaseAdmin.auth.getClaims(token);
        const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : null;
        if (!userId) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { data: isStaff } = await supabaseAdmin.rpc("is_staff", { _user_id: userId });
        if (!isStaff) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        const { data: subscriptions, error } = await supabaseAdmin
          .from("push_subscriptions" as never)
          .select("id, user_id, endpoint, created_at")
          .order("created_at", { ascending: false })
          .limit(1000);

        if (error) {
          console.error("[push] list subscriptions failed", error);
          return Response.json({ error: "Server error" }, { status: 500 });
        }

        return Response.json({ subscriptions: subscriptions ?? [] });
      },

      POST: async ({ request }) => {
        let body: {
          endpoint?: string;
          keys?: { p256dh?: string; auth?: string };
        };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const endpoint = body.endpoint?.trim();
        const p256dh = body.keys?.p256dh?.trim();
        const authKey = body.keys?.auth?.trim();

        if (!endpoint || !p256dh || !authKey) {
          return Response.json({ error: "Missing parameters" }, { status: 400 });
        }

        if (!isSafeOutboundUrl(endpoint)) {
          return Response.json({ error: "Endpoint invalide" }, { status: 400 });
        }

        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.slice(7);
        const { data: claims, error: claimsError } = await supabaseAdmin.auth.getClaims(token);
        const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : null;
        if (claimsError || !userId) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

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
          return Response.json({ error: "Server error" }, { status: 500 });
        }

        return Response.json({ status: "ok" });
      },
    },
  },
});
