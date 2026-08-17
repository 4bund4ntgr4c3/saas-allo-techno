import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { rateLimit } from "@/lib/security";
import { isPushEnabled, sendPushToAll, sendPushToUser, type PushMessage } from "@/lib/push-sender";

const SendSchema = z.object({
  userId: z.string().uuid().optional(),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(500),
  url: z.string().max(300).optional(),
});

export const Route = createFileRoute("/api/push-send")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await rateLimit("push-send", 20))) {
          return Response.json(
            { error: "Trop de demandes. Réessayez dans une minute." },
            { status: 429 },
          );
        }

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

        if (!isPushEnabled()) {
          return Response.json(
            {
              error:
                "Push désactivé : définir VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY via `wrangler secret put`.",
            },
            { status: 503 },
          );
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const parsed = SendSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json(
            { error: "Paramètres invalides", details: parsed.error.flatten() },
            { status: 400 },
          );
        }

        const message: PushMessage = {
          title: parsed.data.title,
          body: parsed.data.body,
          ...(parsed.data.url ? { url: parsed.data.url } : {}),
        };

        try {
          const result = parsed.data.userId
            ? await sendPushToUser(parsed.data.userId, message)
            : await sendPushToAll(message);
          return Response.json({ status: "ok", ...result });
        } catch (err) {
          console.error("[push] send failed", err);
          return Response.json({ error: "Server error" }, { status: 500 });
        }
      },
    },
  },
});
