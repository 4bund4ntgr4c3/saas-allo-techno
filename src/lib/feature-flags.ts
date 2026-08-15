import { createServerFn } from "@tanstack/react-start";
import { requireStaff } from "@/lib/rbac";
import { rateLimit } from "@/lib/security";

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string | null;
  updated_at: string;
}

export const getFeatureFlags = createServerFn({ method: "GET" }).handler(async () => {
  if (!(await rateLimit("get-feature-flags", 60))) {
    throw new Error("Trop de demandes. Réessayez dans une minute.");
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await requireStaff(supabaseAdmin);
  const { data, error } = await supabaseAdmin
    .from("feature_flags" as never)
    .select("*")
    .order("key");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as FeatureFlag[];
});

export const toggleFeatureFlag = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { key, enabled } = data as { key: string; enabled: boolean };
    if (!key || typeof enabled !== "boolean") throw new Error("key et enabled requis");
    return { key, enabled };
  })
  .handler(async ({ data }) => {
    if (!(await rateLimit("toggle-feature-flag", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireStaff(supabaseAdmin);
    const { error } = await supabaseAdmin
      .from("feature_flags" as never)
      .upsert(
        { key: data.key, enabled: data.enabled, updated_at: new Date().toISOString() } as never,
        {
          onConflict: "key",
        },
      );
    if (error) throw new Error(error.message);
    return { key: data.key, enabled: data.enabled };
  });

export const createFeatureFlag = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { key, description } = data as { key: string; description?: string };
    if (!key) throw new Error("key requis");
    return { key, description: description ?? null };
  })
  .handler(async ({ data }) => {
    if (!(await rateLimit("create-feature-flag", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireStaff(supabaseAdmin);
    const { error } = await supabaseAdmin
      .from("feature_flags" as never)
      .insert({ key: data.key, enabled: false, description: data.description } as never);
    if (error) throw new Error(error.message);
    return { key: data.key, enabled: false };
  });

export const deleteFeatureFlag = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { key } = data as { key: string };
    if (!key) throw new Error("key requis");
    return { key };
  })
  .handler(async ({ data }) => {
    if (!(await rateLimit("delete-feature-flag", 20))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireStaff(supabaseAdmin);
    const { error } = await supabaseAdmin
      .from("feature_flags" as never)
      .delete()
      .eq("key", data.key);
    if (error) throw new Error(error.message);
    return { deleted: true };
  });
