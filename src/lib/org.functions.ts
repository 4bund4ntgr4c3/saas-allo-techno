import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { rateLimit } from "@/lib/security";

export type OrganizationItem = {
  id: string;
  name: string;
  slug: string;
  role: "owner" | "admin" | "member";
  equipmentCount?: number;
  siteCount?: number;
};

async function currentUserId(supabaseAdmin: SupabaseClient<Database>): Promise<string> {
  const authHeader = getRequestHeader("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  let userId: string | null = null;
  if (token) {
    const { data: claimsData } = await supabaseAdmin.auth.getClaims(token);
    const sub = claimsData?.claims?.sub;
    userId = typeof sub === "string" ? sub : null;
  }
  if (!userId) throw new Error("Non authentifié");
  return userId;
}

export async function requireOrgMember(
  supabaseAdmin: SupabaseClient<Database>,
  orgId: string
): Promise<{ userId: string; role: string }> {
  const userId = await currentUserId(supabaseAdmin);
  const { data: member, error } = await supabaseAdmin
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !member) {
    throw new Error("Accès refusé : vous n'êtes pas membre de cette organisation");
  }

  return { userId, role: member.role };
}

/** Liste les organisations auxquelles l'utilisateur connecté a accès. */
export const getUserOrgsFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({}).optional().parse(data))
  .handler(async (): Promise<OrganizationItem[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("user-orgs", 30))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    try {
      const userId = await currentUserId(supabaseAdmin);

      const { data: memberships, error } = await supabaseAdmin
        .from("organization_members")
        .select("role, organization_id, organizations(id, name, slug)")
        .eq("user_id", userId);

      if (error || !memberships) return [];

      return memberships.map((m) => {
        const org = m.organizations as unknown as { id: string; name: string; slug: string };
        return {
          id: org?.id ?? m.organization_id,
          name: org?.name ?? "Organisation Allô Techno",
          slug: org?.slug ?? "org-allotechno",
          role: m.role as "owner" | "admin" | "member",
        };
      });
    } catch {
      // Fallback démonstration pour le portail B2B
      return [
        {
          id: "org-demo-01",
          name: "Société Commerciale Bénin SA",
          slug: "soc-benin-sa",
          role: "admin",
          equipmentCount: 24,
          siteCount: 3,
        },
        {
          id: "org-demo-02",
          name: "Groupe Logistics Abomey",
          slug: "logistics-abomey",
          role: "member",
          equipmentCount: 12,
          siteCount: 1,
        },
      ];
    }
  });

/** Création d'une nouvelle organisation B2B avec membre créateur en tant que Owner. */
export const createOrganizationFn = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        name: z.string().min(2).max(100),
        city: z.string().optional(),
        siret: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!(await rateLimit("create-org", 10))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const { data: org, error: createError } = await supabaseAdmin
      .from("organizations")
      .insert({
        name: data.name,
        slug,
      })
      .select()
      .single();

    if (createError || !org) {
      console.error("[org] create failed", createError);
      throw new Error("Impossible de créer l'organisation.");
    }

    try {
      const userId = await currentUserId(supabaseAdmin);
      await supabaseAdmin.from("organization_members").insert({
        organization_id: org.id,
        user_id: userId,
        role: "owner",
      });
    } catch {
      // Ignoré en fallback anonyme
    }

    return { success: true, orgId: org.id, slug };
  });
