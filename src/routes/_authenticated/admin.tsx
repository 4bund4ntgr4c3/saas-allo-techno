import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { verifyOtpLogin } from "@/lib/otp.functions";
import { useI18n } from "@/lib/i18n/context";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSectionTabs } from "@/components/admin/AdminSectionTabs";
import { field } from "@/components/admin/primitives/AdminField";
import { TourLauncher } from "@/components/tour/TourLauncher";
import { TourOverlay } from "@/components/tour/TourOverlay";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{ title: "Administration — Allô Techno" }, { name: "robots", content: "noindex" }],
  }),
  errorComponent: AdminError,
  component: AdminLayout,
});

function AdminLayout() {
  const { t } = useI18n();
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [otpCode, setOtpCode] = useState("");
  const [otpUnlockedAt, setOtpUnlockedAt] = useState(() =>
    Number(sessionStorage.getItem("at-otp-unlocked") ?? 0),
  );

  const access = useQuery({
    queryKey: ["is-staff", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_staff", { _user_id: user.id });
      if (error) throw error;
      return Boolean(data);
    },
  });

  const otpEnabled = useQuery({
    queryKey: ["otp-enabled", user.id],
    enabled: access.data === true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_otp")
        .select("enabled")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data?.enabled ?? false;
    },
  });

  const verifyOtpFn = useServerFn(verifyOtpLogin);
  const verifyOtp = useMutation({
    mutationFn: async (code: string) => verifyOtpFn({ data: { code } }),
    onSuccess: (ok) => {
      if (ok) {
        sessionStorage.setItem("at-otp-unlocked", String(Date.now()));
        setOtpUnlockedAt(Date.now());
        setOtpCode("");
      } else {
        toast.error(t("admin.otp.invalidCode"));
      }
    },
    onError: () => toast.error(t("admin.otp.verificationFailed")),
  });

  const otpRequired = otpEnabled.data === true && Date.now() - otpUnlockedAt > 24 * 3600 * 1000;

  const claimAdmin = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("claim_first_admin");
      if (error) throw error;
      return Boolean(data);
    },
    onSuccess: (granted) => {
      if (granted) {
        toast.success(t("admin.claim.success"));
        queryClient.invalidateQueries({ queryKey: ["is-staff", user.id] });
      } else {
        toast.error(t("admin.claim.exists"));
      }
    },
    onError: () => toast.error(t("admin.claim.impossible")),
  });

  // Real-time: any change by another technician is reflected immediately
  useEffect(() => {
    if (access.data !== true) return;
    const channel = supabase
      .channel("admin-reservations-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservation_status_history" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["status-history"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [access.data, queryClient]);

  if (access.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!access.data) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
        <ShieldAlert className="size-10 text-destructive" />
        <h1 className="text-2xl font-semibold">{t("admin.access.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.access.description")}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button disabled={claimAdmin.isPending} onClick={() => claimAdmin.mutate()}>
            {t("admin.access.claimAdmin")}
          </Button>
          <Button asChild variant="outline">
            <Link to="/mon-compte">{t("admin.access.backToAccount")}</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t("admin.access.note")}</p>
      </div>
    );
  }

  if (otpRequired) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
        <KeyRound className="size-10 text-primary" />
        <h1 className="text-2xl font-semibold">{t("admin.otp.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.otp.description")}</p>
        <label htmlFor="otp-code" className="sr-only">
          {t("admin.otp.code")}
        </label>
        <input
          id="otp-code"
          className={`${field} w-full max-w-xs text-center font-mono text-lg tracking-widest`}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && otpCode.length === 6 && !verifyOtp.isPending) {
              verifyOtp.mutate(otpCode);
            }
          }}
        />
        <Button
          disabled={verifyOtp.isPending || otpCode.length !== 6}
          onClick={() => verifyOtp.mutate(otpCode)}
        >
          {verifyOtp.isPending ? t("admin.otp.verifying") : t("admin.otp.unlock")}
        </Button>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AdminSidebar user={user} />
      <SidebarInset>
        <AdminHeader />
        <div className="flex-1 p-6" data-tour="admin-content">
          <AdminSectionTabs />
          <Outlet />
        </div>
      </SidebarInset>
      <TourLauncher />
      <TourOverlay />
    </SidebarProvider>
  );
}

function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="w-full max-w-md border border-border bg-card p-8 text-center">
        <h2 className="at-display mb-2 text-2xl">{t("admin.error.title")}</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {error?.message ?? t("admin.error.description")}
        </p>
        <Button variant="technical" onClick={() => reset()}>
          {t("error.retry")}
        </Button>
      </div>
    </div>
  );
}
