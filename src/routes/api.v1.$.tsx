import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { rateLimit } from "@/lib/security";

/** Empreinte SHA-256 (hex) d'une clé API — la base ne stocke jamais la clé brute. */
async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Parse et borne un paramètre d'entier de pagination. */
function parsePageParam(raw: string | null, fallback: number, min: number, max: number): number {
  const value = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}

export const Route = createFileRoute("/api/v1/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const url = new URL(request.url);
        const path = params._splat ?? "";

        const authHeader = request.headers.get("authorization");
        const apiKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

        if (!apiKey) {
          return Response.json({ error: "API key required" }, { status: 401 });
        }

        const { data: keyData, error: keyError } = (await supabaseAdmin
          .from("api_keys" as never)
          .select("user_id, active, rate_limit")
          .eq("key_hash", await sha256Hex(apiKey))
          .eq("active", true)
          .maybeSingle()) as unknown as {
          data: { user_id: string; active: boolean; rate_limit: number | null } | null;
          error: unknown;
        };

        if (keyError || !keyData) {
          return Response.json({ error: "Invalid API key" }, { status: 401 });
        }

        const rateLimitMax = keyData.rate_limit ?? 10;
        const allowed = await rateLimit(`api-v1:${keyData.user_id}`, rateLimitMax);
        if (!allowed) {
          return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
        }

        const parts = path.split("/").filter(Boolean);
        const resource = parts[0];
        const id = parts[1];

        switch (resource) {
          case "reservations": {
            if (id) {
              const { data, error } = await supabaseAdmin
                .from("reservations")
                .select(
                  "reference, customer_name, device, issue, status, slot_date, slot_period, created_at",
                )
                .eq("reference", id)
                .eq("user_id", keyData.user_id)
                .single();
              if (error) return Response.json({ error: "Not found" }, { status: 404 });
              return Response.json({ data });
            }
            const limit = parsePageParam(url.searchParams.get("limit"), 20, 1, 100);
            const offset = parsePageParam(url.searchParams.get("offset"), 0, 0, 100_000);
            const { data, error, count } = await supabaseAdmin
              .from("reservations")
              .select("reference, customer_name, device, status, slot_date, created_at", {
                count: "exact",
              })
              .eq("user_id", keyData.user_id)
              .range(offset, offset + limit - 1)
              .order("created_at", { ascending: false });
            if (error) return Response.json({ error: error.message }, { status: 500 });
            return Response.json({ data, total: count ?? data?.length ?? 0, limit, offset });
          }

          case "devices": {
            const { DEVICES } = await import("@/data/catalog/devices");
            const { brandName } = await import("@/data/catalog");
            const brand = url.searchParams.get("brand");
            const category = url.searchParams.get("category");
            let devices = DEVICES;
            if (brand) devices = devices.filter((d) => d.brand === brand);
            if (category) devices = devices.filter((d) => d.category === category);
            const limit = parsePageParam(url.searchParams.get("limit"), 20, 1, 100);
            const offset = parsePageParam(url.searchParams.get("offset"), 0, 0, 100_000);
            const results = devices.slice(offset, offset + limit).map((d) => ({
              slug: d.slug,
              name: d.name,
              brand: d.brand,
              brandName: brandName(d.brand),
              category: d.category,
              series: d.series,
              faultCount: d.faults.length,
            }));
            return Response.json({ data: results, total: devices.length });
          }

          case "brands": {
            const { DEVICES } = await import("@/data/catalog/devices");
            const { brandName } = await import("@/data/catalog");
            const brands = [...new Set(DEVICES.map((d) => d.brand))].map((b) => ({
              slug: b,
              name: brandName(b),
              deviceCount: DEVICES.filter((d) => d.brand === b).length,
            }));
            return Response.json({ data: brands });
          }

          case "status": {
            if (!id) return Response.json({ error: "Reference required" }, { status: 400 });
            const { data, error } = await supabaseAdmin.rpc("get_reservation_status", {
              _reference: id,
            });
            if (error) return Response.json({ error: error.message }, { status: 500 });
            return Response.json({ data });
          }

          default:
            return Response.json({ error: "Unknown resource" }, { status: 404 });
        }
      },
    },
  },
});
