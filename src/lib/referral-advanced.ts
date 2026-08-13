import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireStaff } from "@/lib/rbac";

export interface ReferralStats {
  total_referrals: number;
  successful_referrals: number;
  total_earned: number;
  pending_rewards: number;
  tier: "bronze" | "silver" | "gold";
  referral_code: string;
}

export interface ReferralEntry {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: "pending" | "completed" | "rewarded";
  reward_amount: number;
  created_at: string;
  completed_at: string | null;
}

const TIER_THRESHOLDS = [
  { tier: "bronze" as const, min: 0, reward: 500 },
  { tier: "silver" as const, min: 5, reward: 1000 },
  { tier: "gold" as const, min: 15, reward: 2000 },
];

export const getReferralStats = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { user_id } = data as { user_id: string };
    return { user_id };
  })
  .handler(async ({ data }) => {
    await requireStaff(supabaseAdmin);
    const { data: referrals } = await supabaseAdmin
      .from("referrals" as never)
      .select("*")
      .eq("referrer_id", data.user_id);

    const rows = (referrals ?? []) as unknown as ReferralEntry[];
    const completed = rows.filter((r) => r.status === "completed" || r.status === "rewarded");
    const totalEarned = rows
      .filter((r) => r.status === "rewarded")
      .reduce((s, r) => s + r.reward_amount, 0);
    const pendingRewards = completed
      .filter((r) => r.status === "completed")
      .reduce((s, r) => s + r.reward_amount, 0);

    let tier: "bronze" | "silver" | "gold" = "bronze";
    for (const t of TIER_THRESHOLDS) {
      if (completed.length >= t.min) tier = t.tier;
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("referral_code")
      .eq("id", data.user_id)
      .maybeSingle();

    return {
      total_referrals: rows.length,
      successful_referrals: completed.length,
      total_earned: totalEarned,
      pending_rewards: pendingRewards,
      tier,
      referral_code: (profile as { referral_code?: string } | null)?.referral_code ?? "",
    };
  });

export const getReferralEntries = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { user_id } = data as { user_id: string };
    return { user_id };
  })
  .handler(async ({ data }) => {
    await requireStaff(supabaseAdmin);
    const { data: entries } = await supabaseAdmin
      .from("referrals" as never)
      .select("*")
      .eq("referrer_id", data.user_id)
      .order("created_at", { ascending: false });
    return (entries ?? []) as unknown as ReferralEntry[];
  });

export const getReferralTiers = createServerFn({ method: "GET" }).handler(async () => {
  return TIER_THRESHOLDS;
});
