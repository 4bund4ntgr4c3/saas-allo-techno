import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string | null;
  updated_at: string;
}

const FLAG_CACHE = new Map<string, { value: boolean; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

export async function isFeatureEnabled(key: string): Promise<boolean> {
  const cached = FLAG_CACHE.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const { data } = (await supabaseAdmin
    .from("feature_flags" as never)
    .select("enabled")
    .eq("key", key)
    .maybeSingle()) as { data: { enabled: boolean } | null };

  const enabled = Boolean(data?.enabled ?? false);
  FLAG_CACHE.set(key, { value: enabled, expiresAt: Date.now() + CACHE_TTL_MS });
  return enabled;
}

export function clearFlagCache(key?: string) {
  if (key) {
    FLAG_CACHE.delete(key);
  } else {
    FLAG_CACHE.clear();
  }
}

export const getFeatureFlags = createServerFn({ method: "GET" }).handler(async () => {
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
    const { error } = await supabaseAdmin
      .from("feature_flags" as never)
      .upsert(
        { key: data.key, enabled: data.enabled, updated_at: new Date().toISOString() } as never,
        {
          onConflict: "key",
        },
      );
    if (error) throw new Error(error.message);
    clearFlagCache(data.key);
    return { key: data.key, enabled: data.enabled };
  });

export const createFeatureFlag = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { key, description } = data as { key: string; description?: string };
    if (!key) throw new Error("key requis");
    return { key, description: description ?? null };
  })
  .handler(async ({ data }) => {
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
    const { error } = await supabaseAdmin
      .from("feature_flags" as never)
      .delete()
      .eq("key", data.key);
    if (error) throw new Error(error.message);
    clearFlagCache(data.key);
    return { deleted: true };
  });
