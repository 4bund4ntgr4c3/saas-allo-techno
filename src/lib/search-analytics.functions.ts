import { createServerFn } from "@tanstack/react-start";
import { rateLimit } from "@/lib/security";

/** Log une recherche utilisateur pour analytics. */
export const logSearchQuery = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { query, locale, resultCount } = data as {
      query: string;
      locale: string;
      resultCount: number;
    };
    if (!query || query.trim().length < 2) return null;
    return { query: query.trim().toLowerCase(), locale, resultCount };
  })
  .handler(async ({ data }) => {
    if (!data) return;
    if (!(await rateLimit("search", 10))) return;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("search_queries" as never).insert({
      query: data.query,
      locale: data.locale,
      result_count: data.resultCount,
    } as never);
  });
