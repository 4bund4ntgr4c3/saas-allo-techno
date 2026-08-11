import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { verifyOtpLogin } from "@/lib/otp.functions";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { field } from "@/components/admin/primitives/AdminField";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administration — Allô Techno" },
      { name: "robots", content: "noindex" },
    ],
  }),
  errorComponent: ({ error, reset }) => (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="w-full max-w-md border border-border bg-card p-8 text-center">
        <h2 className="at-display mb-2 text-2xl">Erreur d'administration</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {error?.message ?? "Une erreur est survenue."}
        </p>
        <button
          className="rounded-sm bg-primary px-4 py-2 text-sm text-primary-foreground"
          onClick={() => reset()}
        >
          Réessayer
        </button>
      </div>
    </div>
  ),
  component: AdminLayout,
});

function AdminLayout() {
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
        toast.error("Code invalide ou expiré.");
      }
    },
    onError: () => toast.error("Vérification impossible"),
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
        toast.success("Vous êtes maintenant administrateur");
        queryClient.invalidateQueries({ queryKey: ["is-staff", user.id] });
      } else {
        toast.error("Un administrateur existe déjà : demandez-lui de vous ajouter.");
      }
    },
    onError: () => toast.error("Action impossible"),
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
        <h1 className="text-2xl font-semibold">Accès réservé au personnel</h1>
        <p className="text-sm text-muted-foreground">
          Votre compte n'a pas les droits d'administration sur les dossiers de réparation.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button disabled={claimAdmin.isPending} onClick={() => claimAdmin.mutate()}>
            Devenir administrateur
          </Button>
          <Button asChild variant="outline">
            <Link to="/mon-compte">Retour à mon compte</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Cette action n'est possible que tant qu'aucun administrateur n'existe.
        </p>
      </div>
    );
  }

  if (otpRequired) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
        <KeyRound className="size-10 text-primary" />
        <h1 className="text-2xl font-semibold">Double authentification</h1>
        <p className="text-sm text-muted-foreground">
          Votre compte est protégé par un code à 6 chiffres généré par votre application
          d'authentification.
        </p>
        <label htmlFor="otp-code" className="sr-only">
          Code OTP
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
          {verifyOtp.isPending ? "Vérification…" : "Déverrouiller"}
        </Button>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AdminSidebar user={user} />
      <SidebarInset>
        <AdminHeader />
        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
