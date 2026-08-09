import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/v1/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const url = new URL(request.url);
        const path = params._splat ?? "";

        const authHeader = request.headers.get("authorization");
        const apiKey = authHeader?.startsWith("Bearer ")
          ? authHeader.slice(7)
          : url.searchParams.get("api_key");

        if (!apiKey) {
          return Response.json({ error: "API key required" }, { status: 401 });
        }

        const { data: keyData } = await supabaseAdmin
          .from("api_keys" as never)
          .select("user_id, active, rate_limit")
          .eq("key", apiKey)
          .eq("active", true)
          .maybeSingle();

        if (!keyData) {
          return Response.json({ error: "Invalid API key" }, { status: 401 });
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
                .single();
              if (error) return Response.json({ error: "Not found" }, { status: 404 });
              return Response.json({ data });
            }
            const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 100);
            const offset = parseInt(url.searchParams.get("offset") ?? "0");
            const { data, error } = await supabaseAdmin
              .from("reservations")
              .select("reference, customer_name, device, status, slot_date, created_at", {
                count: "exact",
              })
              .range(offset, offset + limit - 1)
              .order("created_at", { ascending: false });
            if (error) return Response.json({ error: error.message }, { status: 500 });
            return Response.json({ data, total: data?.length ?? 0, limit, offset });
          }

          case "devices": {
            const { DEVICES, brandName } = await import("@/data/catalog");
            const brand = url.searchParams.get("brand");
            const category = url.searchParams.get("category");
            let devices = DEVICES;
            if (brand) devices = devices.filter((d) => d.brand === brand);
            if (category) devices = devices.filter((d) => d.category === category);
            const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 100);
            const results = devices.slice(0, limit).map((d) => ({
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
            const { DEVICES, brandName } = await import("@/data/catalog");
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
