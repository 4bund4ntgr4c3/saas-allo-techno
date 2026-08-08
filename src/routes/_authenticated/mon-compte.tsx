import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CalendarClock, Copy, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ReschedulePanel } from "@/components/site/ReschedulePanel";
import { formatFcfa } from "@/data/catalog";
import { downloadInvoicePdf } from "@/lib/invoice";
import { applyReferralCode, ensureReferralCode } from "@/lib/loyalty.functions";
import { getReservationPaymentStatus, initiateReservationPayment } from "@/lib/payments.functions";
import { useI18n } from "@/lib/i18n/context";
import {
  PERIOD_LABEL,
  STATUS_LABEL,
  formatDateFr,
  type DepositMode,
  type SlotPeriod,
} from "@/lib/reservation-schema";

export const Route = createFileRoute("/_authenticated/mon-compte")({
  head: () => ({
    meta: [
      { title: "Mon compte — réservations Allô Techno" },
      {
        name: "description",
        content:
          "Tableau de bord client Allô Techno : suivez l'état de vos réparations, vos créneaux et annulez un rendez-vous.",
      },
      { property: "og:title", content: "Mon compte — Allô Techno" },
      {
        property: "og:description",
        content: "Suivez vos réservations de réparation en temps réel.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const field =
  "h-11 w-full rounded-sm border border-border bg-card px-4 text-sm focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const STATUS_TONE: Record<string, string> = {
  en_attente: "border-border text-muted-foreground",
  confirmee: "border-primary/50 text-primary",
  pieces: "border-amber-500/50 text-amber-500",
  en_cours: "border-primary/50 text-primary",
  pret: "border-success/50 text-success",
  livre: "border-success/50 text-success",
  terminee: "border-success/50 text-success",
  annulee: "border-destructive/50 text-destructive",
};

const PAYMENT_METHODS = ["MTN MoMo", "Moov Money", "Celtiis"] as const;

type ReservationPayPhase = "idle" | "starting" | "pending" | "paid" | "failed";

/**
 * Bloc « Payer en ligne » pour un devis approuvé : choix du moyen (Mobile
 * Money), ouverture du checkout Flutterwave dans un nouvel onglet, puis
 * sondage du statut du paiement (toutes les 4 s, max ~10 essais).
 */
function ReservationPayBlock({
  reservation,
  userId,
}: {
  reservation: {
    reference: string;
    quote_amount: number | null;
    quote_status: string;
    payment_status?: string | null;
  };
  userId: string;
}) {
  const initPay = useServerFn(initiateReservationPayment);
  const checkPay = useServerFn(getReservationPaymentStatus);
  const queryClient = useQueryClient();
  const [method, setMethod] = useState<(typeof PAYMENT_METHODS)[number]>("MTN MoMo");
  const [phase, setPhase] = useState<ReservationPayPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const busy = phase === "starting" || phase === "pending";
  const amount = reservation.quote_amount ?? 0;

  const pay = async () => {
    if (busy) return;
    setError(null);
    setPhase("starting");
    try {
      const res = await initPay({ data: { reference: reservation.reference, method } });
      if (!res.ok) {
        setError(res.error);
        setPhase("idle");
        return;
      }
      if (res.alreadyPaid || res.url === null) {
        setPhase("paid");
        toast.success("Paiement déjà reçu. Merci !");
        queryClient.invalidateQueries({ queryKey: ["reservations", userId] });
        return;
      }
      window.open(res.url, "_blank", "noopener,noreferrer");
      setPhase("pending");
      for (let attempt = 0; attempt < 10; attempt += 1) {
        await new Promise((r) => setTimeout(r, 4000));
        try {
          const s = await checkPay({ data: { reference: reservation.reference } });
          if (s.status === "paid") {
            setPhase("paid");
            toast.success("Paiement confirmé. Merci !");
            queryClient.invalidateQueries({ queryKey: ["reservations", userId] });
            return;
          }
          if (s.status === "failed") {
            setPhase("failed");
            toast.error("Le paiement a échoué. Vous pouvez réessayer.");
            return;
          }
        } catch {
          // réseau : on réessaie
        }
      }
      setPhase("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Paiement impossible. Réessayez.");
      setPhase("idle");
    }
  };

  return (
    <div className="mt-6 border-t border-border pt-4">
      <p className="at-eyebrow mb-2 block">Paiement en ligne</p>
      <div className="flex flex-wrap items-center gap-3">
        <select
          aria-label="Moyen de paiement"
          className={`${field} h-10 w-auto max-w-52`}
          value={method}
          disabled={busy}
          onChange={(e) => setMethod(e.target.value as (typeof PAYMENT_METHODS)[number])}
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <Button
          variant="primaryBlock"
          size="sm"
          disabled={busy || amount <= 0}
          onClick={() => void pay()}
        >
          {busy ? "En attente…" : `Payer ${formatFcfa(amount)} en ligne`}
        </Button>
      </div>
      {phase === "pending" && (
        <p className="mt-3 flex items-center gap-2 text-sm text-amber-500">
          <Loader2 className="size-4 animate-spin" />
          En attente de confirmation du paiement… (l'onglet Flutterwave est resté ouvert)
        </p>
      )}
      {phase === "paid" && (
        <p className="mt-3 w-fit rounded-sm border border-success/50 px-3 py-1 font-mono text-xs uppercase text-success">
          Payé en ligne
        </p>
      )}
      {phase === "failed" && (
        <p className="mt-3 w-fit rounded-sm border border-destructive/50 px-3 py-1 font-mono text-xs uppercase text-destructive">
          Échec du paiement — réessayez
        </p>
      )}
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { locale } = useI18n();
  const { user } = Route.useRouteContext();
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);

  const profile = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, email, loyalty_points, referral_code, referred_by")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile.data) {
      setNom(profile.data.full_name ?? "");
      setTelephone(profile.data.phone ?? "");
    }
  }, [profile.data]);

  const reservations = useQuery({
    queryKey: ["reservations", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select(
          "id, reference, device, issue, mode, payment, slot_date, slot_period, slot_hour, status, message, created_at, quote_amount, quote_status, payment_status",
        )
        .order("slot_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, full_name: nom, phone: telephone, email: user.email ?? null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profil mis à jour");
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    },
    onError: () => toast.error("Mise à jour impossible"),
  });

  const ensureCodeFn = useServerFn(ensureReferralCode);
  const applyCodeFn = useServerFn(applyReferralCode);

  const [referralInput, setReferralInput] = useState("");

  const generateCode = useMutation({
    mutationFn: () => ensureCodeFn(),
    onSuccess: () => {
      toast.success("Code de parrainage généré");
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Génération impossible";
      toast.error(message);
    },
  });

  const applyCode = useMutation({
    mutationFn: () => applyCodeFn({ data: { code: referralInput } }),
    onSuccess: (res) => {
      toast.success(`Code appliqué : +${res.points} points`);
      setReferralInput("");
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Code de parrainage invalide.";
      toast.error(message);
    },
  });

  const copyReferralLink = async () => {
    const code = profile.data?.referral_code;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/reservation?ref=${code}`);
      toast.success("Lien de parrainage copié");
    } catch {
      toast.error("Copie impossible");
    }
  };

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { data: row, error: fetchError } = await supabase
        .from("reservations")
        .select(
          "reference, customer_name, email, phone, device, issue, mode, payment, slot_date, slot_period, slot_hour, status",
        )
        .eq("id", id)
        .maybeSingle();
      if (fetchError) throw fetchError;
      if (!row) throw new Error("Réservation introuvable");

      const { error } = await supabase
        .from("reservations")
        .update({ status: "annulee" })
        .eq("id", id);
      if (error) throw error;

      // Notification best-effort : ne doit jamais bloquer l'annulation de la réservation.
      try {
        const { notifyReservationStatusChanged } = await import("@/lib/notifications");
        void notifyReservationStatusChanged({
          ...row,
          tracking_code: null,
          status: "annulee",
        });
      } catch (err) {
        console.error("[mon-compte] notification d'annulation échouée", err);
      }
    },
    onSuccess: () => {
      toast.success("Réservation annulée");
      queryClient.invalidateQueries({ queryKey: ["reservations", user.id] });
    },
    onError: () => toast.error("Annulation impossible"),
  });

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const rows = reservations.data ?? [];
  const active = rows.filter((r) => r.status !== "annulee" && r.status !== "terminee");

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-6 px-4 sm:px-6">
          <div>
            <span className="at-eyebrow mb-4 block">Espace client</span>
            <h1 className="at-display text-4xl md:text-6xl">Mon compte</h1>
            <p className="mt-4 text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="technical" size="sm">
              <Link to="/$locale/reservation" params={{ locale }}>
                Nouvelle réservation
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin">Administration</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              Se déconnecter
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <h2 className="at-display mb-2 text-2xl">Mes réservations</h2>
            <p className="mb-8 text-sm text-muted-foreground">
              {active.length} intervention{active.length > 1 ? "s" : ""} en cours · {rows.length} au
              total
            </p>

            {reservations.isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}

            {!reservations.isLoading && rows.length === 0 && (
              <div className="border border-border bg-card p-8">
                <p className="text-sm font-bold">Aucune réservation pour le moment.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Réservez un créneau et retrouvez ici l'avancement de votre réparation.
                </p>
                <Button asChild variant="primaryBlock" size="lg" className="mt-6">
                  <Link to="/$locale/reservation" params={{ locale }}>
                    Réserver une réparation
                  </Link>
                </Button>
              </div>
            )}

            <ul className="space-y-4">
              {rows.map((r) => {
                const payStatus = (r as { payment_status?: string | null }).payment_status;
                const canPay =
                  (r.quote_amount ?? 0) > 0 &&
                  r.quote_status === "approved" &&
                  payStatus !== "paid";
                return (
                  <li key={r.id} className="border border-border bg-card p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-xs uppercase text-muted-foreground">
                          Dossier {r.reference}
                        </p>
                        <h3 className="mt-1 text-lg font-bold">{r.device}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{r.issue}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-sm border px-3 py-1 font-mono text-[10px] uppercase ${STATUS_TONE[r.status] ?? "border-border"}`}
                        >
                          {STATUS_LABEL[r.status] ?? r.status}
                        </span>
                        {payStatus === "paid" && (
                          <span className="rounded-sm border border-success/50 px-3 py-1 font-mono text-[10px] uppercase text-success">
                            Payé en ligne
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          downloadInvoicePdf({
                            reference: r.reference,
                            customer_name: profile.data?.full_name ?? "Client",
                            phone: profile.data?.phone ?? "",
                            email: user.email ?? null,
                            device: r.device,
                            issue: r.issue,
                            mode: r.mode,
                            payment: r.payment,
                            slot_date: r.slot_date,
                            slot_period: r.slot_period as SlotPeriod,
                            slot_hour: r.slot_hour ?? null,
                            status: r.status,
                          })
                        }
                        aria-label={`Reçu PDF du dossier ${r.reference}`}
                      >
                        <FileDown className="size-4" />
                      </Button>
                    </div>

                    <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
                      <div>
                        <dt className="at-eyebrow mb-1">Date</dt>
                        <dd>{formatDateFr(r.slot_date)}</dd>
                      </div>
                      <div>
                        <dt className="at-eyebrow mb-1">Créneau</dt>
                        <dd>
                          {PERIOD_LABEL[r.slot_period as SlotPeriod]}
                          {r.slot_hour ? ` à ${r.slot_hour}` : ""}
                        </dd>
                      </div>
                      <div>
                        <dt className="at-eyebrow mb-1">Mode</dt>
                        <dd>
                          {r.mode === "domicile" ? "Enlèvement à domicile" : "Dépôt en boutique"}
                        </dd>
                      </div>
                    </dl>

                    {(r.status === "en_attente" || r.status === "confirmee") && (
                      <div className="mt-6 flex flex-wrap gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReschedulingId(reschedulingId === r.id ? null : r.id)}
                        >
                          <CalendarClock className="size-3.5" />
                          {reschedulingId === r.id ? "Masquer" : "Reprogrammer"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={cancel.isPending}
                          onClick={() => cancel.mutate(r.id)}
                        >
                          Annuler cette réservation
                        </Button>
                      </div>
                    )}

                    {canPay && (
                      <ReservationPayBlock
                        reservation={{
                          reference: r.reference,
                          quote_amount: r.quote_amount,
                          quote_status: r.quote_status,
                          payment_status: payStatus ?? null,
                        }}
                        userId={user.id}
                      />
                    )}

                    {reschedulingId === r.id && (
                      <div className="mt-6">
                        <ReschedulePanel
                          reference={r.reference}
                          mode={(r.mode as DepositMode) ?? "boutique"}
                          current={{ date: r.slot_date, hour: r.slot_hour }}
                          onDone={() => {
                            setReschedulingId(null);
                            queryClient.invalidateQueries({ queryKey: ["reservations", user.id] });
                          }}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <aside className="space-y-8">
            <div className="border border-border bg-surface p-8">
              <h2 className="at-display mb-6 text-xl">Programme fidélité</h2>
              <div className="space-y-6">
                <div>
                  <p className="at-display text-5xl font-bold text-primary">
                    {profile.data?.loyalty_points ?? 0}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">points</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Gagnez 100 points par réparation terminée. Parrainez un proche : +100 points, et
                  il reçoit +50 points à son inscription.
                </p>
                {profile.data?.referral_code ? (
                  <div>
                    <p className="at-eyebrow mb-2 block">Mon code de parrainage</p>
                    <div className="flex items-center gap-3">
                      <code className="rounded-sm border border-border bg-card px-3 py-2 font-mono text-sm">
                        {profile.data.referral_code}
                      </code>
                      <Button variant="outline" size="sm" onClick={copyReferralLink}>
                        <Copy className="size-3.5" />
                        Copier
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={generateCode.isPending}
                    onClick={() => generateCode.mutate()}
                  >
                    Générer mon code de parrainage
                  </Button>
                )}
                {profile.data?.referred_by ? (
                  <p className="text-sm text-muted-foreground">Vous avez déjà été parrainé.</p>
                ) : (
                  <form
                    className="space-y-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (referralInput.trim()) applyCode.mutate();
                    }}
                  >
                    <div>
                      <label htmlFor="p-ref" className="at-eyebrow mb-2 block">
                        Utiliser un code de parrainage
                      </label>
                      <input
                        id="p-ref"
                        className={field}
                        placeholder="ALLO-XXXX"
                        value={referralInput}
                        onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                      />
                    </div>
                    <Button
                      variant="primaryBlock"
                      className="w-full"
                      type="submit"
                      disabled={applyCode.isPending || !referralInput.trim()}
                    >
                      Appliquer le code
                    </Button>
                  </form>
                )}
              </div>
            </div>
            <div className="border border-border bg-surface p-8">
              <h2 className="at-display mb-6 text-xl">Mes informations</h2>
              <div className="space-y-5">
                <div>
                  <label htmlFor="p-nom" className="at-eyebrow mb-2 block">
                    Nom complet
                  </label>
                  <input
                    id="p-nom"
                    className={field}
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="p-tel" className="at-eyebrow mb-2 block">
                    Téléphone / WhatsApp
                  </label>
                  <input
                    id="p-tel"
                    inputMode="tel"
                    className={field}
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                  />
                </div>
                <Button
                  variant="primaryBlock"
                  className="w-full"
                  disabled={saveProfile.isPending}
                  onClick={() => saveProfile.mutate()}
                >
                  Enregistrer
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
