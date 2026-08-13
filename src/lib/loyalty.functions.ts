import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { rateLimit } from "@/lib/security";
import { createLogger } from "@/lib/logger";

const logger = createLogger("loyalty");

const applyCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .max(20)
    .regex(/^ALLO-[A-Z0-9]{4}$/),
});

// Alphabet sans caractères ambigus (0/O/1/I/L), identique à celui du suivi.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

async function currentUserId(supabaseAdmin: SupabaseClient<Database>): Promise<string> {
  const authHeader = getRequestHeader("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) throw new Error("Non authentifié");
  const { data: claimsData } = await supabaseAdmin.auth.getClaims(token);
  const sub = claimsData?.claims?.sub;
  if (typeof sub !== "string") throw new Error("Non authentifié");
  return sub;
}

function generateReferralCode(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  let code = "ALLO-";
  for (const b of bytes) code += ALPHABET[b % ALPHABET.length];
  return code;
}

export type LoyaltyTier = "bronze" | "argent" | "or";

const TIER_THRESHOLDS: { tier: LoyaltyTier; min: number; label: string; advantages: string }[] = [
  {
    tier: "or",
    min: 700,
    label: "Or",
    advantages: "5 % de réduction permanente, atelier prioritaire",
  },
  { tier: "argent", min: 300, label: "Argent", advantages: "3 % de réduction, diagnostic gratuit" },
  {
    tier: "bronze",
    min: 0,
    label: "Bronze",
    advantages: "Bienvenue — gagnez des points à chaque réparation",
  },
];

export function computeTier(points: number): {
  tier: LoyaltyTier;
  label: string;
  advantages: string;
  next: { tier: LoyaltyTier; label: string; min: number } | null;
} {
  for (const t of TIER_THRESHOLDS) {
    if (points >= t.min) {
      const idx = TIER_THRESHOLDS.indexOf(t);
      const nextTier = idx > 0 ? TIER_THRESHOLDS[idx - 1] : null;
      return {
        tier: t.tier,
        label: t.label,
        advantages: t.advantages,
        next: nextTier ? { tier: nextTier.tier, label: nextTier.label, min: nextTier.min } : null,
      };
    }
  }
  const bronze = TIER_THRESHOLDS.find((t) => t.tier === "bronze")!;
  return {
    tier: "bronze",
    label: bronze.label,
    advantages: bronze.advantages,
    next: { tier: "argent", label: "Argent", min: 300 },
  };
}

export type LoyaltySummary = {
  points: number;
  tier: {
    tier: LoyaltyTier;
    label: string;
    advantages: string;
    next: { tier: LoyaltyTier; label: string; min: number } | null;
  };
  referral_code: string | null;
  referred_by: string | null;
  referral_count: number;
  referral_bonus_earned: number;
  ledger: { delta: number; reason: string; reference: string | null; created_at: string }[];
};

/** Récapitulatif fidélité de l'utilisateur connecté : points, code, parrain, historique. */
export const getLoyaltySummary = createServerFn({ method: "POST" }).handler(
  async (): Promise<LoyaltySummary> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await rateLimit("loyalty-summary", 30))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const userId = await currentUserId(supabaseAdmin);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("loyalty_points, referral_code, referred_by")
      .eq("id", userId)
      .maybeSingle();

    const { data: ledger } = await supabaseAdmin
      .from("loyalty_ledger")
      .select("delta, reason, reference, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    let referredBy: string | null = null;
    if (profile?.referred_by) {
      const { data: referrer } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("id", profile.referred_by)
        .maybeSingle();
      referredBy = referrer?.full_name ?? null;
    }

    const { count: referralCount } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("referred_by", userId);

    const referralBonusEarned = (ledger ?? [])
      .filter((l) => l.reason === "referral" && l.delta > 0)
      .reduce((sum, l) => sum + l.delta, 0);

    const points = profile?.loyalty_points ?? 0;

    return {
      points,
      tier: computeTier(points),
      referral_code: profile?.referral_code ?? null,
      referred_by: referredBy,
      referral_count: referralCount ?? 0,
      referral_bonus_earned: referralBonusEarned,
      ledger: (ledger ?? []).map((l) => ({
        delta: l.delta,
        reason: l.reason,
        reference: l.reference,
        created_at: l.created_at,
      })),
    };
  },
);

/** Génère le code de parrainage de l'utilisateur (ou renvoie l'existant). */
export const ensureReferralCode = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  if (!(await rateLimit("loyalty-ensure", 10))) {
    throw new Error("Trop de demandes. Réessayez dans une minute.");
  }

  const userId = await currentUserId(supabaseAdmin);

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("referral_code")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.referral_code) return profile.referral_code;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode();
    const { data: result, error } = await supabaseAdmin.rpc("ensure_referral_code", {
      _user_id: userId,
      _code: code,
    });
    if (error) {
      logger.error("ensure_referral_code failed", error as Error);
      throw new Error("Impossible de générer un code de parrainage.");
    }
    if (result) return result;
  }
  throw new Error("Impossible de générer un code de parrainage. Réessayez.");
});

/** Applique un code de parrainage : crédite les bonus au parrainé et au parrain. */
export const applyReferralCode = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => applyCodeSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (!(await rateLimit("loyalty-apply", 10))) {
      throw new Error("Trop de demandes. Réessayez dans une minute.");
    }

    const userId = await currentUserId(supabaseAdmin);

    const { data: referrer } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("referral_code", data.code)
      .maybeSingle();
    if (!referrer) throw new Error("Code de parrainage invalide.");
    if (referrer.id === userId) {
      throw new Error("Vous ne pouvez pas utiliser votre propre code.");
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("referral_code, referred_by")
      .eq("id", userId)
      .maybeSingle();
    if (profile?.referred_by) throw new Error("Vous avez déjà été parrainé.");

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ referred_by: referrer.id })
      .eq("id", userId);
    if (updateError) {
      logger.error("set referred_by failed", updateError as Error);
      throw new Error("Impossible d'appliquer le code de parrainage.");
    }

    try {
      await supabaseAdmin.rpc("add_loyalty_points", {
        _user_id: userId,
        _delta: 50,
        _reason: "referral",
        _reference: "",
      });
    } catch (err) {
      logger.error("bonus parrainé échoué", err as Error);
    }

    try {
      await supabaseAdmin.rpc("add_loyalty_points", {
        _user_id: referrer.id,
        _delta: 100,
        _reason: "referral",
        _reference: "",
      });
    } catch (err) {
      logger.error("bonus parrain échoué", err as Error);
    }

    return { ok: true, points: 50 };
  });
