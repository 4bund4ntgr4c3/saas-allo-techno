import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  Hammer,
  LayoutDashboard,
  Loader2,
  LogIn,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, ensureDemoEnvironment } from "@/lib/demo.functions";
import type { DemoRole } from "@/lib/demo.functions";

export const Route = createFileRoute("/demo")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Visite guidée — Allô Techno" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DemoPage,
});

const ROLE_ICONS: Record<DemoRole, typeof LayoutDashboard> = {
  admin: LayoutDashboard,
  staff: ShieldCheck,
  technicien: Hammer,
  client: UserRound,
  b2b: Building2,
};

function DemoPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [busyId, setBusyId] = useState<DemoRole | null>(null);

  const seed = useServerFn(ensureDemoEnvironment);
  const seedQuery = useQuery({
    queryKey: ["demo-seed"],
    queryFn: async () => seed(),
    retry: 2,
  });

  useEffect(() => {
    if (seedQuery.error) toast.error(t("demo.seedError"));
  }, [seedQuery.error, t]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/mon-compte", replace: true });
    });
  }, [navigate]);

  const enter = async (accountId: DemoRole) => {
    const account = DEMO_ACCOUNTS.find((a) => a.id === accountId);
    if (!account) return;
    setBusyId(accountId);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: DEMO_PASSWORD,
      });
      if (error) throw error;
      await router.invalidate();
      queryClient.clear();
      navigate({ to: account.landing, replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("auth.error.login"));
      setBusyId(null);
    }
  };

  const tracking = seedQuery.data?.trackingCode
    ? { code: seedQuery.data.trackingCode, reference: seedQuery.data.trackingReference }
    : null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 border border-primary/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
          {t("demo.warning")}
        </span>
      </div>
      <h1 className="at-display text-3xl font-bold tracking-tight">{t("demo.title")}</h1>
      <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{t("demo.subtitle")}</p>
      <p className="mt-1 max-w-3xl text-xs text-muted-foreground">{t("demo.disclaimer")}</p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_ACCOUNTS.map((account) => {
          const Icon = ROLE_ICONS[account.id];
          return (
            <div
              key={account.id}
              className="flex flex-col border border-border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center border border-border bg-muted">
                  <Icon className="size-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">{t("demo.role." + account.id)}</h2>
                  <p className="font-mono text-xs text-muted-foreground">{account.fullName}</p>
                </div>
              </div>
              <p className="mt-4 flex-1 text-sm text-muted-foreground">
                {t("demo.features." + account.id)}
              </p>
              <div className="mt-4 space-y-1 border border-border bg-surface p-3 text-xs">
                <p>
                  <span className="text-muted-foreground">{t("demo.credentials")} :</span>{" "}
                  <span className="font-mono">{account.email}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">{t("demo.password")} :</span>{" "}
                  <span className="font-mono">{DEMO_PASSWORD}</span>
                </p>
              </div>
              {account.id === "client" && tracking && (
                <div className="mt-2 border border-success/30 bg-success/5 p-3 text-xs">
                  <p className="text-muted-foreground">{t("demo.trackingInfo")}</p>
                  <p className="mt-1 font-mono font-bold text-success">
                    {t("demo.trackingCode")} : {tracking.code} · {tracking.reference}
                  </p>
                </div>
              )}
              <Button className="mt-4" disabled={busyId !== null} onClick={() => enter(account.id)}>
                {busyId === account.id ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <LogIn className="mr-2 size-4" />
                )}
                {busyId === account.id ? t("demo.loggingIn") : t("demo.explore")}
              </Button>
            </div>
          );
        })}

        <div className="flex flex-col justify-center border border-dashed border-border bg-card/50 p-5">
          <h2 className="text-base font-semibold">{t("demo.visitTour")}</h2>
          <p className="mt-3 flex-1 text-sm text-muted-foreground">
            {t("demo.tourAdmin")} · {t("demo.tourApp")} · {t("demo.tourAccount")}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">{t("demo.resetNotice")}</p>
        </div>
      </div>

      <div className="mt-10 text-center">
        <Button asChild variant="outline">
          <Link to="/">{t("demo.backToHome")}</Link>
        </Button>
      </div>
    </div>
  );
}
