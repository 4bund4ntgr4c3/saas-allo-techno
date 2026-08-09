import { Route } from "@/routes/_authenticated/admin";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { QrCode } from "@/components/site/QrCode";
import { confirmOtp, disableOtp, enrollOtp } from "@/lib/otp.functions";
import { getSecurityStats } from "@/lib/security.functions";
import { getMetrics } from "@/lib/monitoring.functions";

const field =
  "h-11 w-full rounded-sm border border-border bg-card px-3 text-sm focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function SecuritySection() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [pendingSecret, setPendingSecret] = useState<string | null>(null);
  const [pendingUri, setPendingUri] = useState<string | null>(null);

  const otp = useQuery({
    queryKey: ["otp", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_otp")
        .select("secret, enabled")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const enrollFn = useServerFn(enrollOtp);
  const confirmFn = useServerFn(confirmOtp);
  const disableFn = useServerFn(disableOtp);

  const enroll = useMutation({
    mutationFn: async () => enrollFn(),
    onSuccess: (res) => {
      setPendingSecret(res.secret);
      setPendingUri(res.uri);
      toast.success("Scanner le QR code dans votre application d'authentification.");
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Opération impossible"),
  });

  const confirm = useMutation({
    mutationFn: async () => confirmFn({ data: { code } }),
    onSuccess: () => {
      toast.success("Double authentification activée");
      setPendingSecret(null);
      setPendingUri(null);
      setCode("");
      queryClient.invalidateQueries({ queryKey: ["otp", user.id] });
      queryClient.invalidateQueries({ queryKey: ["otp-enabled", user.id] });
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Code invalide"),
  });

  const disable = useMutation({
    mutationFn: async () => disableFn({ data: { code } }),
    onSuccess: () => {
      toast.success("Double authentification désactivée");
      setCode("");
      queryClient.invalidateQueries({ queryKey: ["otp", user.id] });
      queryClient.invalidateQueries({ queryKey: ["otp-enabled", user.id] });
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Code invalide"),
  });

  const enrolling = pendingSecret !== null;

  return (
    <div className="max-w-xl">
      <h2 className="text-lg font-semibold">Sécurité du compte</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        La double authentification (TOTP) protège l'accès à l'administration.
      </p>

      <RateLimitPanel />

      <MetricsPanel />

      {enrolling ? (
        <div className="mt-6 space-y-5 border border-border bg-card p-6">
          <p className="text-sm">
            1. Scannez le QR code avec Google Authenticator, Authy ou équivalent.
          </p>
          <QrCode
            value={pendingUri ?? ""}
            size={180}
            label="Clé TOTP"
            caption="QR code d'activation de la double authentification"
          />
          <p className="break-all font-mono text-xs text-muted-foreground">{pendingSecret}</p>
          <p className="text-sm">2. Saisissez le code à 6 chiffres affiché par l'application.</p>
          <div className="flex gap-3">
            <input
              className={`${field} max-w-40 text-center font-mono tracking-widest`}
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            <Button
              disabled={confirm.isPending || code.length !== 6}
              onClick={() => confirm.mutate()}
            >
              {confirm.isPending ? "Vérification…" : "Activer"}
            </Button>
          </div>
        </div>
      ) : otp.isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Chargement…</p>
      ) : otp.data?.enabled ? (
        <div className="mt-6 space-y-4 border border-border bg-card p-6">
          <p className="flex items-center gap-2 text-sm font-semibold text-success">
            <ShieldCheck className="size-4" />
            Double authentification active
          </p>
          <p className="text-sm text-muted-foreground">
            À chaque session d'administration (24 h), un code à 6 chiffres sera demandé.
          </p>
          <div className="flex flex-wrap gap-3">
            <input
              className={`${field} max-w-40 text-center font-mono tracking-widest`}
              inputMode="numeric"
              maxLength={6}
              placeholder="Code actuel"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            <Button
              variant="outline"
              disabled={disable.isPending || code.length !== 6}
              onClick={() => disable.mutate()}
            >
              Désactiver
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-4 border border-border bg-card p-6">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <KeyRound className="size-4" />
            Double authentification désactivée
          </p>
          <p className="text-sm text-muted-foreground">
            Recommandé pour protéger l'accès aux dossiers clients.
          </p>
          <Button disabled={enroll.isPending} onClick={() => enroll.mutate()}>
            {enroll.isPending ? "Préparation…" : "Activer la double authentification"}
          </Button>
        </div>
      )}
    </div>
  );
}

function RateLimitPanel() {
  const getSecurityStatsFn = useServerFn(getSecurityStats);
  const stats = useQuery({
    queryKey: ["rate-limit-stats"],
    queryFn: () => getSecurityStatsFn(),
    refetchInterval: 15_000,
  });

  return (
    <div className="mt-6 rounded-sm border border-border bg-card p-5">
      <h3 className="text-sm font-semibold">Limiteur de débit</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Surveillance des requêtes par IP et action (fenêtre de 60 secondes).
      </p>
      {stats.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Chargement…</p>
      ) : stats.data ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-sm border border-border p-3 text-center">
              <p className="font-mono text-2xl font-bold">{stats.data.totalBuckets}</p>
              <p className="mt-1 text-xs text-muted-foreground">Buckets actifs</p>
            </div>
            <div className="rounded-sm border border-border p-3 text-center">
              <p className="font-mono text-2xl font-bold">{stats.data.activeBuckets}</p>
              <p className="mt-1 text-xs text-muted-foreground">Dans la fenêtre</p>
            </div>
            <div className="rounded-sm border border-border p-3 text-center">
              <p
                className={`font-mono text-2xl font-bold ${stats.data.blockedBuckets > 0 ? "text-destructive" : ""}`}
              >
                {stats.data.blockedBuckets}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Proches du blocage</p>
            </div>
          </div>
          {stats.data.buckets.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2">Clé</th>
                    <th className="px-3 py-2 text-right">Requêtes</th>
                    <th className="px-3 py-2 text-right">Expire dans</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.data.buckets.map((b) => (
                    <tr key={b.key} className="border-b border-border last:border-b-0">
                      <td className="px-3 py-2 font-mono">{b.key}</td>
                      <td className="px-3 py-2 text-right font-mono">{b.count}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{b.resetIn}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

const METRIC_LABEL: Record<string, string> = {
  reservation_created: "Réservation créée",
  reservation_completed: "Réservation terminée",
  payment_processed: "Paiement traité",
  payment_failed: "Paiement échoué",
  review_submitted: "Avis soumis",
  lead_created: "Lead créé",
  quote_sent: "Devis envoyé",
  quote_approved: "Devis approuvé",
  quote_declined: "Devis refusé",
};

function MetricsPanel() {
  const getMetricsFn = useServerFn(getMetrics);
  const metrics = useQuery({
    queryKey: ["metrics-summary"],
    queryFn: () => getMetricsFn(),
    refetchInterval: 30_000,
  });

  return (
    <div className="mt-6 rounded-sm border border-border bg-card p-5">
      <h3 className="text-sm font-semibold">Métriques en temps réel</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Événements trackés depuis le dernier redémarrage de l'isolat.
      </p>
      {metrics.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Chargement…</p>
      ) : metrics.data && metrics.data.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2">Événement</th>
                <th className="px-3 py-2 text-right">Nombre</th>
              </tr>
            </thead>
            <tbody>
              {metrics.data.map((m) => (
                <tr key={m.name} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-2">
                    <span className="inline-block rounded-sm bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {METRIC_LABEL[m.name] ?? m.name}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{m.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">Aucune métrique enregistrée.</p>
      )}
    </div>
  );
}

export { SecuritySection, RateLimitPanel, MetricsPanel };
