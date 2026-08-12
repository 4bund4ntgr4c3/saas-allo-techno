import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/context";
import {
  getReferralStats,
  getReferralEntries,
  type ReferralStats,
  type ReferralEntry,
} from "@/lib/referral-advanced";
import { Gift, Users, Award, Check } from "lucide-react";

export function AdminReferrals() {
  const { t } = useI18n();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [entries, setEntries] = useState<ReferralEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, e] = await Promise.all([
        getReferralStats({ data: { user_id: "admin" } }).catch(() => null),
        getReferralEntries({ data: { user_id: "admin" } }).catch(() => [] as ReferralEntry[]),
      ]);
      setStats(s as ReferralStats | null);
      setEntries(e as ReferralEntry[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-24 rounded-lg bg-muted animate-pulse" />
        <div className="h-24 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="at-eyebrow">{t("admin.referrals.eyebrow")}</p>
          <h2 className="mt-1 text-xl font-semibold">{t("admin.referrals")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.referrals.description")}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="size-4 text-primary" />
            <span className="text-[10px] uppercase text-muted-foreground">
              {t("admin.referrals.total")}
            </span>
          </div>
          <p className="text-2xl font-bold">{stats?.total_referrals ?? 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Check className="size-4 text-success" />
            <span className="text-[10px] uppercase text-muted-foreground">
              {t("admin.referrals.completed")}
            </span>
          </div>
          <p className="text-2xl font-bold">{stats?.successful_referrals ?? 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Gift className="size-4 text-amber-500" />
            <span className="text-[10px] uppercase text-muted-foreground">
              {t("admin.referrals.earned")}
            </span>
          </div>
          <p className="text-2xl font-bold">{stats?.total_earned ?? 0} FCFA</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Award className="size-4 text-purple-500" />
            <span className="text-[10px] uppercase text-muted-foreground">
              {t("admin.referrals.level")}
            </span>
          </div>
          <p className="text-2xl font-bold capitalize">{stats?.tier ?? "bronze"}</p>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-bold">{t("admin.referrals.history")}</h4>
          {entries.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between rounded-lg border bg-card p-3"
            >
              <div>
                <p className="text-xs font-medium">
                  {t("admin.referrals.referral")} —{" "}
                  {new Date(e.created_at).toLocaleDateString(t("locale") as string)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {t("admin.referrals.status")} {e.status}
                </p>
              </div>
              <span className="text-sm font-bold text-primary">{e.reward_amount} FCFA</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
